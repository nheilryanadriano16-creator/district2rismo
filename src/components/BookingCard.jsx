import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase'

const peso = (n) =>
    (Number(n) || 0).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })

const toDateKey = (value) => {
    if (!value) return ''
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

const getBookedDates = async (property) => {
    const snapshot = await getDocs(collection(db, 'bookings'))
    const propertyName = String(property?.name || '').trim().toLowerCase()
    const inactiveStatuses = new Set(['rejected', 'cancelled', 'canceled', 'failed', 'expired'])
    const bookedDates = new Set()

    snapshot.forEach((bookingDoc) => {
        const booking = bookingDoc.data()
        const bookingPropertyIds = [
            booking.propertyId,
            booking.propertyUid,
            booking.placeId,
            booking.listingId,
            booking.resortId,
            booking.property?.id,
        ].filter(Boolean)
        const bookingPropertyNames = [
            booking.propertyName,
            booking.resortName,
            typeof booking.resort === 'string' ? booking.resort : '',
            booking.property?.name,
        ].map((name) => String(name || '').trim().toLowerCase()).filter(Boolean)
        const matchesProperty = (property?.id && bookingPropertyIds.includes(property.id))
            || (propertyName && bookingPropertyNames.includes(propertyName))
        const status = String(booking.status || 'Pending').toLowerCase()
        if (!matchesProperty || inactiveStatuses.has(status)) return

        const date = toDateKey(booking.date || booking.startDate)
        if (date) bookedDates.add(date)
    })

    return bookedDates
}

function BookingCard({ cottages = [], resort, property }) {
    const navigate = useNavigate()
    const { currentUser } = useAuth()
    const [today] = useState(() => toDateKey(new Date()))
    const propertyId = property?.id
    const propertyName = property?.name

    const tours = property?.tourSettings || {}
    const defaultBasePrice = Number(property?.price || property?.rate || 15000)

    const availableTours = []
    if (tours.day?.enabled) {
        availableTours.push({
            key: 'day',
            label: 'Day Tour',
            price: Number(tours.day.rate || tours.day.price || defaultBasePrice),
            time: `${tours.day.checkIn || '08:00 AM'} – ${tours.day.checkOut || '05:00 PM'}`
        })
    }
    if (tours.night?.enabled) {
        availableTours.push({
            key: 'night',
            label: 'Night Tour',
            price: Number(tours.night.rate || tours.night.price || defaultBasePrice),
            time: `${tours.night.checkIn || '05:00 PM'} – ${tours.night.checkOut || '08:00 AM'}`
        })
    }
    if (tours.flexible?.enabled) {
        availableTours.push({
            key: 'flexible',
            label: 'Flexible',
            price: Number(tours.flexible.rate || tours.flexible.price || defaultBasePrice),
            time: 'Flexible schedule'
        })
    }

    const defaultTours = availableTours.length > 0 ? availableTours : [
        { key: 'day', label: 'Day Tour', price: defaultBasePrice, time: '08:00 AM – 05:00 PM' }
    ]

    const [selectedTourKey, setSelectedTourKey] = useState(defaultTours[0].key)
    const [date, setDate] = useState(today)
    const [guestsCount, setGuestsCount] = useState(property?.capacity || 10)
    const [selectedCottageIds, setSelectedCottageIds] = useState([])
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const [bookedDates, setBookedDates] = useState(() => new Set())
    const [availabilityLoading, setAvailabilityLoading] = useState(true)
    const [availabilityError, setAvailabilityError] = useState('')
    const [availabilityLoadFailed, setAvailabilityLoadFailed] = useState(false)
    const [availabilityRefreshToken, setAvailabilityRefreshToken] = useState(0)
    const [checkingDate, setCheckingDate] = useState(false)
    const dropdownRef = useRef(null)

    const currentTour = defaultTours.find(t => t.key === selectedTourKey) || defaultTours[0]
    const tourPrice = Number(currentTour.price) || 0

    useEffect(() => {
        let isMounted = true

        const loadAvailability = async () => {
            setAvailabilityLoading(true)
            setAvailabilityError('')
            setAvailabilityLoadFailed(false)
            try {
                if (!propertyId && !propertyName) {
                    throw new Error('Property details are unavailable.')
                }

                const loadedBookedDates = await getBookedDates({ id: propertyId, name: propertyName })
                if (!isMounted) return

                setBookedDates(loadedBookedDates)
                const startDate = new Date(`${today}T00:00:00`)
                let firstAvailableDate = ''
                for (let offset = 0; offset < 366; offset += 1) {
                    const candidate = new Date(startDate)
                    candidate.setDate(startDate.getDate() + offset)
                    const candidateKey = toDateKey(candidate)
                    if (!loadedBookedDates.has(candidateKey)) {
                        firstAvailableDate = candidateKey
                        break
                    }
                }

                setDate((currentDate) => currentDate && !loadedBookedDates.has(currentDate)
                    ? currentDate
                    : firstAvailableDate)
            } catch (error) {
                console.error('Error loading booked dates:', error)
                if (isMounted) {
                    setAvailabilityError(error.message || 'Could not load date availability. Please try again.')
                    setAvailabilityLoadFailed(true)
                }
            } finally {
                if (isMounted) setAvailabilityLoading(false)
            }
        }

        loadAvailability()
        return () => {
            isMounted = false
        }
    }, [propertyId, propertyName, today, availabilityRefreshToken])

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const selectedCottages = cottages.filter(
        (c) => selectedCottageIds.includes(String(c.id)) || selectedCottageIds.includes(c.name)
    )

    const cottagesPrice = selectedCottages.reduce(
        (sum, c) => sum + (Number(c.price || c.rate) || 0),
        0
    )

    const total = tourPrice + cottagesPrice

    const handleToggleCottage = (cottageKey) => {
        setSelectedCottageIds(current =>
            current.includes(cottageKey)
                ? current.filter(id => id !== cottageKey)
                : [...current, cottageKey]
        )
    }

    const handleGuestsChange = (e) => {
        const val = e.target.value
        if (val === '') {
            setGuestsCount('')
        } else {
            const parsed = parseInt(val, 10)
            setGuestsCount(isNaN(parsed) ? '' : Math.max(1, parsed))
        }
    }

    const handleGuestsBlur = () => {
        if (!guestsCount || Number(guestsCount) < 1) {
            setGuestsCount(1)
        }
    }

    const handleBook = async () => {
        if (!date || bookedDates.has(date) || availabilityLoading || availabilityError) return

        if (!currentUser) {
            navigate('/login', { state: { returnUrl: window.location.pathname } })
            return
        }

        setCheckingDate(true)
        try {
            const latestBookedDates = await getBookedDates(property)
            setBookedDates(latestBookedDates)
            if (latestBookedDates.has(date)) {
                setDate('')
                setAvailabilityError('That date has just been booked. Please choose another date.')
                return
            }
        } catch (error) {
            console.error('Error checking booking availability:', error)
            setAvailabilityError(error.message || 'Could not verify date availability. Please try again.')
            return
        } finally {
            setCheckingDate(false)
        }

        const finalGuestsCount = Number(guestsCount) || 1

        navigate('/pay', {
            state: {
                booking: {
                    date,
                    session: currentTour.label,
                    guestsCount: finalGuestsCount,
                    cottages: selectedCottages.map(c => ({ name: c.name, price: Number(c.price || c.rate) || 0 })),
                    tourPrice,
                    cottagesPrice,
                    total,
                    resort,
                    property,
                },
            },
        })
    }

    const getDropdownLabel = () => {
        if (selectedCottages.length === 0) return 'Select Bedroom / Cottage'
        if (selectedCottages.length === 1) return selectedCottages[0].name
        return `${selectedCottages.length} Bedrooms Selected`
    }

    return (
        <div className='booking-card p-3 rounded-4'>
            <div className='mb-3'>
                <span className='fs-4 fw-bold text-white'>{peso(tourPrice).replace('.00', '')}</span>
                <span className='text-white small'> / {currentTour.label.toLowerCase()}</span>
            </div>

            <div className='mb-3'>
                <label className='form-label small mb-1 text-white'>Select Tour Type &amp; Schedule</label>
                <div className='d-flex flex-column gap-2'>
                    {defaultTours.map(tour => {
                        const isSelected = selectedTourKey === tour.key
                        return (
                            <div 
                                key={tour.key}
                                className='p-2 rounded-3 d-flex justify-content-between align-items-center'
                                onClick={() => setSelectedTourKey(tour.key)}
                                style={{ 
                                    cursor: 'pointer',
                                    backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                                    border: isSelected ? '2px solid #ffc107' : '1px solid rgba(255, 255, 255, 0.2)'
                                }}
                            >
                                <div>
                                    <div className={`fw-bold small ${isSelected ? 'text-white' : 'text-white-50'}`}>{tour.label}</div>
                                    <div className='text-white-50' style={{ fontSize: '0.8rem' }}>{tour.time}</div>
                                </div>
                                <div className='fw-bold text-warning small'>{peso(tour.price).replace('.00', '')}</div>
                            </div>
                        )
                    })}
                </div>
            </div>

            <div className='mb-3'>
                <label className='form-label small mb-1 text-white'>Date</label>
                <input
                    type='date'
                    className='booking-input form-control text-white bg-transparent border-secondary'
                    value={date}
                    min={today}
                    disabled={availabilityLoading || availabilityLoadFailed}
                    onChange={(event) => {
                        const selectedDate = event.target.value
                        if (bookedDates.has(selectedDate)) {
                            setDate('')
                            setAvailabilityError('That date is already booked for this resort. Please choose another date.')
                            return
                        }

                        setDate(selectedDate)
                        setAvailabilityError('')
                    }}
                    style={{ colorScheme: 'dark' }}
                />
                {availabilityLoading && <small className='text-white-50'>Checking booked dates...</small>}
                {availabilityError && (
                    <small className='d-block text-warning mt-1' aria-live='polite'>
                        {availabilityError}
                        {availabilityLoadFailed && (
                            <>
                                {' '}
                                <button
                                    type='button'
                                    className='btn btn-link text-warning p-0 align-baseline'
                                    onClick={() => setAvailabilityRefreshToken((token) => token + 1)}
                                >
                                    Retry
                                </button>
                            </>
                        )}
                    </small>
                )}
            </div>

            <div className='mb-3'>
                <label className='form-label small mb-1 text-white'>Guests</label>
                <input
                    type='number'
                    className='booking-input form-control text-white bg-transparent border-secondary'
                    min={1}
                    max={property?.capacity || 100}
                    value={guestsCount}
                    onChange={handleGuestsChange}
                    onBlur={handleGuestsBlur}
                />
            </div>

            {cottages.length > 0 && (
                <div className='mb-3 position-relative' ref={dropdownRef}>
                    <label className='form-label small mb-1 text-white'>Select Bedroom / Cottage</label>
                    <button
                        type='button'
                        className='booking-input form-select text-white bg-transparent border-secondary text-start d-flex justify-content-between align-items-center'
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                    >
                        <span className='text-truncate me-2'>{getDropdownLabel()}</span>
                    </button>

                    {dropdownOpen && (
                        <div 
                            className='position-absolute start-0 end-0 mt-1 p-2 rounded-3 shadow-lg bg-dark border border-secondary z-3'
                            style={{ maxHeight: '200px', overflowY: 'auto' }}
                        >
                            {cottages.map((c) => {
                                const val = String(c.id ?? c.name)
                                const p = Number(c.price || c.rate) || 0
                                const isChecked = selectedCottageIds.includes(val)
                                return (
                                    <div 
                                        key={val} 
                                        className='d-flex justify-content-between align-items-center p-2 rounded cursor-pointer mb-1'
                                        onClick={() => handleToggleCottage(val)}
                                        style={{ 
                                            backgroundColor: isChecked ? 'rgba(255, 193, 7, 0.15)' : 'transparent',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <div className='d-flex align-items-center gap-2'>
                                            <i className={`bi ${isChecked ? 'bi-check-square-fill text-warning' : 'bi-square text-secondary'}`} />
                                            <span className='text-white small'>{c.name}</span>
                                        </div>
                                        <span className='small text-warning fw-bold'>
                                            {p > 0 ? `+${peso(p).replace('.00', '')}` : 'Free'}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}

            <hr className='summary-divider my-3 border-secondary' />

            {selectedCottages.length > 0 && (
                <div className='mb-2'>
                    {selectedCottages.map(c => {
                        const price = Number(c.price || c.rate) || 0
                        return (
                            <div key={c.id || c.name} className='d-flex justify-content-between align-items-center text-white-50 small mb-1'>
                                <span>{c.name}</span>
                                <span>+{peso(price).replace('.00', '')}</span>
                            </div>
                        )
                    })}
                </div>
            )}

            <div className='total-row d-flex justify-content-between align-items-center mb-3'>
                <span className='fw-bold text-white'>TOTAL</span>
                <span className='total-amount fs-5 fw-bold text-warning'>{peso(total).replace('.00', '')}</span>
            </div>

            <button
                type='button'
                className='book-btn btn btn-warning w-100 rounded-pill py-2 fw-bold text-dark'
                onClick={handleBook}
                disabled={!date || bookedDates.has(date) || availabilityLoading || availabilityLoadFailed || checkingDate}
            >
                {checkingDate ? 'Checking availability...' : availabilityLoading ? 'Loading dates...' : 'Book Now'}
            </button>
        </div>
    )
}

export default BookingCard