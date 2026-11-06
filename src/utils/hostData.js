import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { sendPasswordResetEmail } from 'firebase/auth'
import { auth, db } from '../firebase'
import { resolveUploadUrl } from './uploads'

const PLATFORM_FEE_RATE = 0.03

const DEFAULT_TOUR_SETTINGS = {
  day: { enabled: true, checkIn: '08:00 AM', checkOut: '05:00 PM', rate: '5000' },
  night: { enabled: false, checkIn: '05:00 PM', checkOut: '08:00 AM', rate: '7000' },
  flexible: {
    enabled: false,
    checkIns: ['08:00 AM'],
    checkOuts: ['05:00 PM'],
    rate: '5000',
  },
}

function toDate(value) {
  if (!value) return null
  if (typeof value?.toDate === 'function') return value.toDate()
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  if (typeof value === 'object' && (value.seconds || value._seconds)) {
    return new Date((value.seconds || value._seconds) * 1000)
  }
  const raw = String(value).trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const parsed = new Date(`${raw}T00:00:00`)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }
  const parsed = new Date(raw)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function toISODate(value) {
  const date = toDate(value)
  if (!date) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function normalizeName(value) {
  return String(value || '').trim().toLowerCase()
}

function isPlainObject(value) {
  if (!value || typeof value !== 'object') return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

function sanitizeForFirestore(value) {
  if (value === undefined) return undefined
  if (value === null) return null
  if (typeof File !== 'undefined' && value instanceof File) return undefined
  if (typeof Blob !== 'undefined' && value instanceof Blob) return undefined
  if (typeof value === 'function') return undefined
  if (typeof value === 'string') {
    if (value.startsWith('blob:') || value.startsWith('data:')) return ''
    return value
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => sanitizeForFirestore(item))
      .filter((item) => item !== undefined)
  }
  if (typeof value === 'object') {
    if (value instanceof Date || typeof value.toDate === 'function' || !isPlainObject(value)) {
      return value
    }
    const next = {}
    Object.entries(value).forEach(([key, nested]) => {
      const sanitized = sanitizeForFirestore(nested)
      if (sanitized !== undefined) next[key] = sanitized
    })
    return next
  }
  return value
}

export function formatHostDate(value, options = { month: 'short', day: 'numeric', year: 'numeric' }) {
  const date = toDate(value)
  if (!date) return '—'
  return date.toLocaleDateString('en-US', options)
}

export function parseAmount(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  const amount = Number(String(value || '0').replace(/[^\d.]/g, ''))
  return Number.isFinite(amount) ? amount : 0
}

export function guestCount(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (value && typeof value === 'object') {
    return ['adult', 'adults', 'kids', 'children', 'senior', 'seniors']
      .reduce((sum, key) => sum + (Number(value[key]) || 0), 0)
  }
  const match = String(value || '').match(/\d+/g)
  return match ? match.reduce((sum, part) => sum + Number(part), 0) : 0
}

function ownerNameFrom(userData = {}) {
  if (userData.firstName || userData.lastName) {
    return [userData.firstName, userData.lastName].filter(Boolean).join(' ').trim()
  }
  return userData.name || userData.email || 'Host'
}

function belongsToHost(record, uid, identity = {}) {
  if (!record) return false
  const ids = [record.ownerId, record.ownerUid, record.hostId, record.createdBy]
  if (uid && ids.includes(uid)) return true
  const emails = [identity.email, identity.ownerEmail].filter(Boolean)
  if (emails.length && emails.some((email) => [record.ownerEmail, record.hostEmail].includes(email))) {
    return true
  }
  return false
}

function matchesHostProperty(record, properties) {
  const names = new Set(properties.map((property) => normalizeName(property.name)).filter(Boolean))
  const ids = new Set(properties.map((property) => property.id).filter(Boolean))
  const recordIds = [
    record.propertyId,
    record.propertyUid,
    record.placeId,
    record.listingId,
    record.resortId,
  ].filter(Boolean)
  const recordNames = [
    record.property,
    record.propertyName,
    record.resort,
    record.resortName,
    record.placeName,
  ].map(normalizeName).filter(Boolean)

  return recordIds.some((id) => ids.has(id)) || recordNames.some((name) => names.has(name))
}

function compareByDateDesc(a, b) {
  return (toDate(b) || new Date(0)).getTime() - (toDate(a) || new Date(0)).getTime()
}

async function readCollection(name) {
  try {
    const snapshot = await getDocs(collection(db, name))
    return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
  } catch (error) {
    console.error(`Could not read ${name}:`, error)
    throw new Error(`Could not load ${name}.`)
  }
}

function persistPhoto(photo, index) {
  const name = photo?.name || photo?.file?.name || `photo-${index}`
  const localPath = resolveUploadUrl(photo?.localPath || photo?.preview || '')
  return {
    id: photo?.id || `${index}`,
    name,
    size: photo?.size || photo?.file?.size || 0,
    preview: localPath,
    localPath,
  }
}

function persistVerification(files = {}) {
  const entries = Object.entries(files).map(([id, file]) => {
    if (!file) return [id, null]
    const name = file.name || id
    const localPath = resolveUploadUrl(file.localPath || '')
    return [id, {
      name,
      type: file.type || '',
      size: file.size || 0,
      localPath,
      url: localPath,
    }]
  })
  return Object.fromEntries(entries.filter(([, value]) => value))
}

function persistMedia(mediaPhotos = {}) {
  const groups = Object.entries(mediaPhotos).map(([groupId, photos]) => [
    groupId,
    (photos || []).map((photo, index) => persistPhoto(photo, index)),
  ])
  return Object.fromEntries(groups)
}

function persistBedrooms(bedrooms = []) {
  return bedrooms.map((bedroom) => {
    const rest = { ...bedroom }
    delete rest.file
    delete rest.photo
    return { ...rest, localPath: resolveUploadUrl(bedroom.localPath || ''), photo: '' }
  })
}

export async function fetchHostProperties(uid, identity = {}) {
  const properties = await readCollection('properties')
  if (!uid) return []
  return properties
    .filter((property) => belongsToHost(property, uid, identity))
    .sort((a, b) => compareByDateDesc(a.updatedAt || a.createdAt, b.updatedAt || b.createdAt))
}

export async function saveHostProperty(uid, userData, property, mode = 'add') {
  if (!uid) throw new Error('You must be signed in to save a property.')

  const propertyRef = property?.id && mode === 'edit'
    ? doc(db, 'properties', property.id)
    : doc(collection(db, 'properties'))
  const propertyId = propertyRef.id

  const mediaPhotos = persistMedia(property?.mediaPhotos || {})
  const bedrooms = persistBedrooms(property?.bedrooms || [])
  const verificationFiles = persistVerification(property?.verificationFiles || {})
  
  const cover = mediaPhotos.cover?.[0]?.localPath || ''
  const galleryImages = (mediaPhotos.gallery || []).map((photo) => photo.localPath)
  const location = property?.location || (property?.municipality ? `${property.municipality}, Bulacan` : '')
  const coordinates = property?.coordinates
  const hasValidCoordinates =
    Number.isFinite(Number(coordinates?.lat)) &&
    Number.isFinite(Number(coordinates?.lng))
  const ownerName = ownerNameFrom(userData)

  const payload = sanitizeForFirestore({
    name: property?.name || 'Untitled Property',
    municipality: property?.municipality || '',
    address: property?.address || '',
    location,
    ...(hasValidCoordinates
      ? {
          coordinates: {
            lat: Number(coordinates.lat),
            lng: Number(coordinates.lng),
          },
        }
      : {}),
    shortDescription: property?.shortDescription || '',
    description: property?.description || '',
    amenities: property?.amenities || [],
    mediaPhotos,
    image: cover,
    imageUrl: cover,
    galleryImages,
    tourSettings: property?.tourSettings || DEFAULT_TOUR_SETTINGS,
    bedrooms,
    policies: property?.policies || {},
    selectedRules: property?.selectedRules || [],
    rulesDescription: property?.rulesDescription || '',
    verificationFiles,
    propertyId,
    ownerId: uid,
    hostId: uid,
    ownerUid: uid,
    ownerEmail: userData?.email || auth.currentUser?.email || '',
    firstName: userData?.firstName || '',
    lastName: userData?.lastName || '',
    ownerName,
    owner: ownerName,
    status: mode === 'edit' ? (property?.status || 'Pending') : 'Pending',
    updatedAt: serverTimestamp(),
  })

  if (mode === 'edit') {
    await setDoc(propertyRef, payload, { merge: true })
  } else {
    await setDoc(propertyRef, { ...payload, createdAt: serverTimestamp() })
    try {
      await addHostNotification(uid, {
        name: payload.name,
        message: `${payload.name} was submitted for admin review.`,
      })
    } catch (error) {
      console.error('Property saved, but the host notification could not be created:', error)
    }
  }

  return {
    ...property,
    ...payload,
    id: propertyId,
    verificationFiles,
    updatedAt: new Date().toISOString(),
    createdAt: property?.createdAt || new Date().toISOString(),
  }
}

export async function deleteHostProperty(propertyId) {
  if (!propertyId) throw new Error('A property id is required to delete a listing.')
  await deleteDoc(doc(db, 'properties', propertyId))
}

export function mapReservation(record) {
  const startDate = toISODate(record.startDate || record.date || record.checkIn)
  const endDate = toISODate(record.endDate || record.checkOut || startDate)
  const guest = record.guest || record.guestName || record.name || 'Guest'
  const resort = record.property || record.propertyName || record.resort || record.resortName || 'Property'
  const guests = guestCount(record.guests || record.guestCount || record.numberOfGuests)
  const totalAmount = parseAmount(record.totalAmount || record.total || record.amount || record.totalPrice)
  const amountPaid = parseAmount(record.amountPaid || record.paidAmount || record.totalPaid || totalAmount)
  const rawStatus = record.status || 'Pending'
  const statusLower = String(rawStatus).toLowerCase()
  const filterStatus =
    ['accepted', 'confirmed', 'paid', 'completed'].includes(statusLower)
      ? 'Accepted'
      : ['rejected', 'cancelled', 'canceled'].includes(statusLower)
        ? 'Rejected'
        : 'Pending'
  const start = toDate(startDate)
  const end = toDate(endDate)
  const durationDays = start && end
    ? Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) || 1)
    : 1

  return {
    ...record,
    id: record.id,
    guest,
    resort,
    date: startDate,
    startDate,
    endDate: endDate || startDate,
    guests,
    status: rawStatus,
    filterStatus,
    duration: record.duration || String(durationDays),
    phone: record.phone || record.phoneNumber || '',
    email: record.email || record.guestEmail || '',
    totalAmount,
    amountPaid,
    remainingBalance: Math.max(totalAmount - amountPaid, 0),
    paymentDate: toISODate(record.paymentDate) || startDate,
    paymentMethod: record.paymentMethod || record.payOption || 'Online payment',
    image: record.image || record.propertyImage || record.resortImage || '',
  }
}

export async function fetchHostReservations(uid, properties = []) {
  const reservations = await readCollection('reservations')
  const identity = { email: properties[0]?.ownerEmail }
  return reservations
    .filter((reservation) => belongsToHost(reservation, uid, identity) || matchesHostProperty(reservation, properties))
    .map(mapReservation)
    .sort((a, b) => compareByDateDesc(a.startDate || a.date, b.startDate || b.date))
}

export async function fetchHostBookings(uid, properties = []) {
  if (!uid) return []

  const bookings = await readCollection('bookings')
  const propertyIds = new Set(properties.map((property) => property.id).filter(Boolean))
  const propertyNames = new Set(properties.map((property) => normalizeName(property.name)).filter(Boolean))

  return bookings.filter((booking) => {
    if ([booking.hostId, booking.ownerId, booking.ownerUid].includes(uid)) return true

    const bookingPropertyId =
      booking.propertyId ||
      booking.propertyUid ||
      booking.placeId ||
      booking.listingId ||
      booking.resortId ||
      booking.property?.id

    if (bookingPropertyId) return propertyIds.has(bookingPropertyId)

    const bookingPropertyName = normalizeName(
      booking.propertyName || booking.property?.name || booking.resortName || booking.resort
    )
    return propertyNames.has(bookingPropertyName)
  })
}

export async function updateHostReservationStatus(reservation, status, uid) {
  if (!reservation?.id) throw new Error('A booking is required to update its status.')
  if (!status) throw new Error('A booking status is required.')
  await updateDoc(doc(db, 'reservations', reservation.id), {
    status,
    updatedAt: serverTimestamp(),
    hostId: uid || reservation.hostId || '',
  })
  try {
    await addHostNotification(uid, {
      name: reservation.guest,
      message: `Booking for ${reservation.resort} was marked ${status}.`,
      action: 'View Booking Details',
    })
  } catch (error) {
    console.error('Booking updated, but the host notification could not be created:', error)
  }
}

export function mapReview(record) {
  const created = toDate(record.createdAt) || toDate(record.date)
  return {
    ...record,
    id: record.id,
    guest: record.guest || record.guestName || record.name || 'Guest',
    comment: record.comment || record.review || record.message || '',
    rating: Number(record.rating) || 0,
    date: created
      ? created.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      : record.date || '',
    cleanliness: Number(record.cleanliness || record.ratings?.cleanliness) || Number(record.rating) || 0,
    pools: Number(record.pools || record['Pools & Attractions'] || record.ratings?.pools) || Number(record.rating) || 0,
    facilities: Number(record.facilities || record['Facilities & Amenities'] || record.ratings?.facilities) || Number(record.rating) || 0,
    staff: Number(record.staff || record['Staff & Service'] || record.ratings?.staff) || Number(record.rating) || 0,
    value: Number(record.value || record['Value for Money'] || record.ratings?.value) || Number(record.rating) || 0,
    safety: Number(record.safety || record.ratings?.safety) || Number(record.rating) || 0,
    property: record.property || record.propertyName || record.resort || record.resortName || '',
  }
}

export async function fetchHostReviews(uid, properties = []) {
  const reviews = await readCollection('reviews')
  const identity = { email: properties[0]?.ownerEmail }
  return reviews
    .filter((review) => belongsToHost(review, uid, identity) || matchesHostProperty(review, properties))
    .map(mapReview)
}

export async function reportHostReview(reviewId, uid) {
  if (!reviewId) throw new Error('A review is required to report it.')
  await updateDoc(doc(db, 'reviews', reviewId), {
    status: 'Reported',
    reportedBy: uid || '',
    reportedAt: serverTimestamp(),
  })
}

export function summarizeReviews(reviews) {
  const total = reviews.length
  const average = total
    ? reviews.reduce((sum, review) => sum + (Number(review.rating) || 0), 0) / total
    : 0
  const distribution = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    percent: total
      ? Math.round((reviews.filter((review) => Number(review.rating) === stars).length / total) * 100)
      : 0,
  }))
  const averageFor = (key) => (
    total ? reviews.reduce((sum, review) => sum + (Number(review[key]) || 0), 0) / total : 0
  )
  const breakdown = [
    { label: 'Cleanliness', rating: averageFor('cleanliness') },
    { label: 'Pools & Attractions', rating: averageFor('pools') },
    { label: 'Facilities & Amenities', rating: averageFor('facilities') },
    { label: 'Staff & Service', rating: averageFor('staff') },
    { label: 'Value for Money', rating: averageFor('value') },
    { label: 'Safety', rating: averageFor('safety') },
  ]
  return { total, average, distribution, breakdown }
}

export async function fetchHostNotifications(uid) {
  const notifications = await readCollection('notifications')
  return notifications
    .filter((notification) => belongsToHost(notification, uid) || (notification.role === 'host' && !notification.userId && !notification.hostId))
    .map((notification) => ({
      ...notification,
      createdAt: toDate(notification.createdAt)?.toISOString() || new Date().toISOString(),
    }))
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
}

export async function addHostNotification(uid, notification) {
  if (!uid) return
  await addDoc(collection(db, 'notifications'), {
    userId: uid,
    hostId: uid,
    role: 'host',
    name: notification.name || 'District2rismo',
    message: notification.message || '',
    action: notification.action || '',
    createdAt: serverTimestamp(),
    read: false,
  })
}

export function summarizeEarnings(reservations, period = 'This Month') {
  const now = new Date()
  const inPeriod = reservations.filter((reservation) => {
    const date = toDate(reservation.startDate || reservation.date || reservation.paymentDate)
    if (!date) return false
    if (period === 'This Year') return date.getFullYear() === now.getFullYear()
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()
  })
  const completed = inPeriod.filter((reservation) => {
    const status = String(reservation.status || '').toLowerCase()
    return ['accepted', 'confirmed', 'paid', 'completed'].includes(status)
  })
  const total = completed.reduce((sum, reservation) => sum + parseAmount(reservation.amountPaid || reservation.totalAmount), 0)
  const fees = total * PLATFORM_FEE_RATE
  return {
    total,
    fees,
    net: total - fees,
    completedCount: completed.length,
    transactions: completed.slice(0, 8).map((reservation) => ({
      id: reservation.id,
      resort: reservation.resort,
      booking: `#${String(reservation.id).slice(-5)}`,
      date: formatHostDate(reservation.startDate || reservation.date),
      amount: parseAmount(reservation.amountPaid || reservation.totalAmount).toLocaleString('en-PH', {
        minimumFractionDigits: 2,
      }),
      image: reservation.image || reservation.propertyImage || '',
    })),
  }
}

export async function saveHostProfile(uid, profile) {
  if (!uid) throw new Error('You must be signed in to update your profile.')
  await setDoc(doc(db, 'users', uid), {
    firstName: profile.firstName || '',
    lastName: profile.lastName || '',
    dateOfBirth: profile.dateOfBirth || '',
    phoneNumber: profile.phoneNumber || '',
    updatedAt: serverTimestamp(),
  }, { merge: true })
}

export async function sendHostPasswordReset(email) {
  if (!email) throw new Error('No active user email found to send reset instructions.')
  await sendPasswordResetEmail(auth, email)
}