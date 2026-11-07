import { doc, runTransaction } from 'firebase/firestore'
import { db } from '../firebase'

export const getAvailabilityDocumentId = (propertyId, date) =>
    `${propertyId}_${date}`

const toDateKey = (value) => {
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
        return value.slice(0, 10)
    }

    const date = typeof value?.toDate === 'function'
        ? value.toDate()
        : value instanceof Date
            ? value
            : new Date(value)
    if (Number.isNaN(date.getTime())) return ''

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

export async function updateBookingStatusAndAvailability(bookingId, status) {
    const bookingRef = doc(db, 'bookings', bookingId)

    await runTransaction(db, async (transaction) => {
        const bookingSnapshot = await transaction.get(bookingRef)
        if (!bookingSnapshot.exists()) {
            throw new Error('This booking no longer exists.')
        }

        const booking = bookingSnapshot.data()
        const propertyId = booking.propertyId
        const date = toDateKey(booking.date || booking.startDate)
        if (status === 'Confirmed' && (!propertyId || !date)) {
            throw new Error('This booking is missing its property or date.')
        }

        const availabilityRef = propertyId && date
            ? doc(db, 'availability', getAvailabilityDocumentId(propertyId, date))
            : null
        const availabilitySnapshot = availabilityRef
            ? await transaction.get(availabilityRef)
            : null

        if (
            status === 'Confirmed'
            && availabilitySnapshot?.exists()
            && availabilitySnapshot.data().bookingId !== bookingId
        ) {
            throw new Error('This property date is already confirmed for another booking.')
        }

        transaction.update(bookingRef, { status })

        if (status === 'Confirmed' && !availabilitySnapshot?.exists()) {
            transaction.set(availabilityRef, { propertyId, date, bookingId })
        } else if (
            ['Cancelled', 'Rejected'].includes(status)
            && availabilitySnapshot?.exists()
            && availabilitySnapshot.data().bookingId === bookingId
        ) {
            transaction.delete(availabilityRef)
        }
    })
}
