import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { fetchHostProperties, fetchHostReservations } from '../../utils/hostData'

const filters = ['All', 'Pending', 'Accepted', 'Rejected']

const formatDate = (date) => {
    if (!date) return '—'
    const parsed = /^\d{4}-\d{2}-\d{2}$/.test(String(date))
        ? new Date(`${date}T00:00:00`)
        : new Date(date)
    if (Number.isNaN(parsed.getTime())) return '—'
    return parsed.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    })
}

export const HostBookingsN = ({ onViewBooking }) => {
    const { currentUser } = useAuth()
    const [activeFilter, setActiveFilter] = useState('All')
    const [search, setSearch] = useState('')
    const [bookings, setBookings] = useState([])
    const [properties, setProperties] = useState([])
    const [selectedProperty, setSelectedProperty] = useState('')
    const [selectedBooking, setSelectedBooking] = useState(null)
    const [selectedDate, setSelectedDate] = useState('')

    useEffect(() => {
        let isMounted = true

        async function loadBookings() {
            if (!currentUser?.uid) return
            try {
                const hostProperties = await fetchHostProperties(currentUser.uid, { email: currentUser.email })
                const hostBookings = await fetchHostReservations(currentUser.uid, hostProperties)
                if (!isMounted) return
                setProperties(hostProperties)
                setBookings(hostBookings)
                const first = hostBookings[0] || null
                setSelectedBooking(first)
                setSelectedDate(first?.date || '')
            } catch (error) {
                console.error('Error loading host bookings:', error)
            }
        }

        loadBookings()
        return () => {
            isMounted = false
        }
    }, [currentUser])

    const visibleBookings = bookings.filter((booking) => {
        const matchesFilter = activeFilter === 'All' || booking.filterStatus === activeFilter
        const matchesSearch = booking.guest.toLowerCase().includes(search.toLowerCase())
        const matchesProperty = !selectedProperty || booking.resort === selectedProperty
        return matchesFilter && matchesSearch && matchesProperty
    })

    const handleSelectBooking = (booking) => {
        setSelectedBooking(booking)
        setSelectedDate(booking.date)
        onViewBooking?.(booking)
    }

    const totalGuests = visibleBookings.reduce((sum, booking) => sum + (Number(booking.guests) || 0), 0)

    return (
        <section className="host-bookingsN container-fluid p-3 p-md-4">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
                <h1 className="h2 fw-bold mb-0">Bookings</h1>
                <select
                    className="form-select host-property-selectN"
                    aria-label="Choose property"
                    value={selectedProperty}
                    onChange={(event) => setSelectedProperty(event.target.value)}
                >
                    <option value="">All Properties</option>
                    {properties.map((property) => (
                        <option key={property.id} value={property.name}>{property.name}</option>
                    ))}
                </select>
            </div>

            <div className="row g-3">
                <div className="col-12 col-lg-7">
                    <div className="host-booking-list-panelN rounded-3 p-3">
                        <div className="d-flex gap-2 flex-wrap mb-3" role="group" aria-label="Filter bookings">
                            {filters.map((filter) => (
                                <button key={filter} type="button" className={`btn btn-sm rounded-pill host-booking-filterN ${activeFilter === filter ? 'active' : ''}`} aria-pressed={activeFilter === filter} onClick={() => setActiveFilter(filter)}>
                                    {filter}
                                </button>
                            ))}
                        </div>

                        <hr className="host-booking-dividerN mt-0" />

                        <p className="small mb-2">{totalGuests} Guests</p>

                        <div className="input-group mb-2">
                            <input className="form-control host-booking-searchN" type="search" placeholder="Search Name" aria-label="Search guest names" value={search} onChange={(event) => setSearch(event.target.value)} />
                            <span className="input-group-text host-booking-search-iconN"><i className="bi bi-search" aria-hidden="true" /></span>
                        </div>

                        <div className="d-flex flex-column gap-1">
                            {visibleBookings.map((booking) => (
                                <article key={booking.id} className={`host-booking-rowN d-flex align-items-center gap-2 rounded-3 p-2 ${selectedBooking?.id === booking.id ? 'selected' : ''}`}>
                                    <div className="host-booking-avatarN rounded-circle d-flex align-items-center justify-content-center flex-shrink-0">
                                        {booking.guest.charAt(0)}
                                    </div>

                                    <div className="flex-grow-1 min-w-0">
                                        <h2 className="small mb-0">{booking.guest}</h2>
                                        <p className="host-booking-resortN mb-0">{booking.resort}</p>
                                        <small className="host-booking-dateN">{formatDate(booking.date)}</small>
                                    </div>

                                    <span className={`host-booking-pill rounded-pill text-center ${String(booking.filterStatus || booking.status).toLowerCase()}`}>
                                        {booking.status}
                                    </span>

                                    <button type="button" className="btn btn-link host-booking-detailsN p-0 text-nowrap" onClick={() => handleSelectBooking(booking)}>
                                        View Details
                                    </button>
                                </article>
                            ))}
                            {visibleBookings.length === 0 && <p className="small text-secondary mb-0">No bookings found.</p>}
                        </div>
                    </div>
                </div>

                <div className="col-12 col-lg-5">
                    <div className="host-availabilityN">
                        <label className="form-label small mb-2" htmlFor="host-availability-date">Calendar Availability</label>
                        <input id="host-availability-date" className="form-control host-availability-date-inputN mb-3" type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />

                        <div className="d-flex justify-content-between gap-3 small mb-2">
                            <span>Selected Date</span>
                            <span>{selectedDate ? new Date(`${selectedDate}T00:00:00`).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) : '—'}</span>
                        </div>
                        <div className="d-flex justify-content-between gap-3 small mb-2">
                            <span>Guest’s Name</span>
                            <span className="text-end">{selectedBooking?.guest || '—'}</span>
                        </div>
                        <div className="d-flex justify-content-between gap-3 small mb-4">
                            <span>Number of guests</span>
                            <span>{selectedBooking ? `${selectedBooking.guests} or -` : '—'}</span>
                        </div>

                        <button
                            type="button"
                            className="btn btn-warning rounded-pill w-100 py-3"
                            onClick={() => selectedBooking && onViewBooking?.(selectedBooking)}
                            disabled={!selectedBooking}
                        >
                            View Booking Details
                        </button>
                    </div>
                </div>
            </div>
        </section>
    )
}
