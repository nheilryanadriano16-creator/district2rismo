import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { collection, getDocs, query, where } from 'firebase/firestore'
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

function BookingCard({ cottages = [], resort, property }) {
    const navigate = useNavigate()
    const { currentUser } = useAuth()
    const [today] = useState(() => toDateKey(new Date()))
    const [bookedDates, setBookedDates] = useState(new Set())
    const [availabilityLoading, setAvailabilityLoading] = useState(true)
    const [availabilityError, setAvailabilityError] = useState('')
    const propertyId = property?.id
    const tours = property?.tourSettings || {}
    const defaultBasePrice = Number(property?.price || property?.rate || 15000)

    useEffect(() => {
        let active = true

        async function loadAvailability() {
            setAvailabilityLoading(true)
            setAvailabilityError('')
            setBookedDates(new Set())

            if (!propertyId) {
                setAvailabilityError('This property is missing its ID, so availability cannot be checked.')
                setAvailabilityLoading(false)
                return
            }

            try {
                const availabilityQuery = query(
                    collection(db, 'availability'),
                    where('propertyId', '==', propertyId)
                )
                const snapshot = await getDocs(availabilityQuery)
                const dates = new Set(snapshot.docs
                    .map((availabilityDoc) => toDateKey(availabilityDoc.data().date))
                    .filter(Boolean))

                if (active) setBookedDates(dates)
            } catch (error) {
                console.error('Unable to load property availability:', error)
                if (active) setAvailabilityError('Could not check availability. Please try again later.')
            } finally {
                if (active) setAvailabilityLoading(false)
            }
        }

        loadAvailability()
        return () => { active = false }
    }, [propertyId])

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
    const [dateError, setDateError] = useState('')
    const [guestsCount, setGuestsCount] = useState(property?.capacity || 10)
    const [selectedCottageIds, setSelectedCottageIds] = useState([])
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const dropdownRef = useRef(null)

    const currentTour = defaultTours.find(t => t.key === selectedTourKey) || defaultTours[0]
    const tourPrice = Number(currentTour.price) || 0

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

    const handleBook = () => {
        if (!date) return
        if (availabilityLoading || availabilityError || bookedDates.has(date)) return

        if (!currentUser) {
            navigate('/login', { state: { returnUrl: window.location.pathname } })
            return
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
                    onChange={(event) => {
                        const selectedDate = event.target.value
                        if (bookedDates.has(selectedDate)) {
                            setDateError('That date is already booked. Please choose another date.')
                            return
                        }
                        setDateError('')
                        setDate(selectedDate)
                    }}
                    style={{ colorScheme: 'dark' }}
                    disabled={availabilityLoading || Boolean(availabilityError)}
                />
                {availabilityLoading && <small className='text-white-50 d-block mt-1' role='status'>Checking available dates…</small>}
                {availabilityError && <small className='text-warning d-block mt-1' role='alert'>{availabilityError}</small>}
                {dateError && <small className='text-warning d-block mt-1' role='alert'>{dateError}</small>}
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
                disabled={!date || availabilityLoading || Boolean(availabilityError) || bookedDates.has(date)}
            >
                Book Now
            </button>
        </div>
    )
}

export default BookingCard
