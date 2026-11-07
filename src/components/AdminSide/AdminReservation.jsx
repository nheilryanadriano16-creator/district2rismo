import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../../firebase'

const filters = ['All', 'Paid', 'Pending']

function formatDate(date) {
    if (!date) return '—'
    return new Date(`${date}T00:00:00`).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    })
}

export function AdminReservation({ preview = false }) {
    const [bookings, setBookings] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeFilter, setActiveFilter] = useState('All')
    const [selectedProperty, setSelectedProperty] = useState('')
    const [search, setSearch] = useState('')
    const [selectedDate, setSelectedDate] = useState('')
    const navigate = useNavigate()

    useEffect(() => {
        async function fetchReservations() {
            try {
                setLoading(true)
                // Fetching from 'bookings' collection (or change back to 'reservations' if needed)
                const querySnapshot = await getDocs(collection(db, 'bookings'))
                const loadedBookings = querySnapshot.docs.map(docItem => {
                    const data = docItem.data()
                    return {
                        id: docItem.id,
                        guest: data.userEmail || data.guest || 'Guest',
                        property: data.propertyName || data.property || 'Resort Property',
                        startDate: data.date || data.startDate || '',
                        endDate: data.endDate || data.date || '',
                        status: data.status || 'Paid',
                        ...data
                    }
                })
                setBookings(loadedBookings)
            } catch (err) {
                console.error('Error fetching reservations:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchReservations()
    }, [])

    const properties = [...new Set(bookings.map((booking) => booking.property).filter(Boolean))]

    const filteredBookings = bookings.filter((booking) => {
        const status = (booking.status || '').trim().toLowerCase()
        const matchesFilter = activeFilter === 'All' || (
            activeFilter === 'Paid'
                ? ['paid', 'confirmed'].includes(status)
                : status === activeFilter.toLowerCase()
        )
        const matchesProperty =
            !selectedProperty || booking.property === selectedProperty
        const matchesSearch = (booking.id || '')
            .toLowerCase()
            .includes(search.trim().toLowerCase())
        const matchesDate = !selectedDate || booking.startDate === selectedDate

        return matchesFilter && matchesProperty && matchesSearch && matchesDate
    })

    return (
        <section className="admin-reservationsN container-fluid p-3 p-md-4">
            <div className="row align-items-center g-3 mb-4">
                <div className="col">
                    <h1 className="h2 fw-bold mb-0">Reservations</h1>
                </div>

                <div className="col-12 col-md-auto">
                    <select
                        className="form-select admin-reservation-propertyN"
                        aria-label="Select property"
                        value={selectedProperty}
                        onChange={(event) => setSelectedProperty(event.target.value)}
                    >
                        <option value="">All Properties</option>
                        {properties.map((property) => (
                            <option key={property} value={property}>
                                {property}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="row align-items-center g-3 mb-3">
                <div className="col-12 col-xl-7">
                    <div
                        className="d-flex flex-wrap gap-2"
                        role="group"
                        aria-label="Filter reservations"
                    >
                        {filters.map((filter) => (
                            <button
                                key={filter}
                                type="button"
                                className={`btn admin-reservation-filterN ${
                                    activeFilter === filter ? 'active' : ''
                                }`}
                                aria-pressed={activeFilter === filter}
                                onClick={() => setActiveFilter(filter)}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="col-12 col-xl-5">
                    <div className="d-flex gap-2">
                        <label className="btn admin-reservation-dateN position-relative mb-0">
                            <i className="bi bi-calendar3" aria-hidden="true" />
                            <span className="visually-hidden">Filter by date</span>
                            <input
                                className="position-absolute top-0 start-0 w-100 h-100 opacity-0"
                                type="date"
                                aria-label="Filter by date"
                                value={selectedDate}
                                onChange={(event) => setSelectedDate(event.target.value)}
                            />
                        </label>

                        <div className="input-group admin-reservation-searchN">
                            <input
                                type="search"
                                className="form-control"
                                placeholder="Search Booking ID"
                                aria-label="Search booking ID"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                            />
                            <span className="input-group-text">
                                <i className="bi bi-search" aria-hidden="true" />
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="table-responsive">
                {loading ? (
                    <p className="text-center py-4">Loading reservations...</p>
                ) : (
                    <table className="table table-borderless align-middle admin-reservation-tableN">
                        <thead>
                            <tr>
                                <th scope="col">Booking</th>
                                <th scope="col">Guest</th>
                                <th scope="col">Property</th>
                                <th scope="col">Date</th>
                                <th scope="col">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredBookings.map((booking) => (
                                <tr key={booking.id}>
                                    <td>
                                        <button 
                                            type="button" 
                                            className="btn btn-link p-0 text-reset" 
                                            onClick={() => navigate(`${preview ? "/admin-preview" : "/admin"}/reservations/${encodeURIComponent(booking.id)}`, { state: { booking } })}
                                        >
                                            {booking.id}
                                        </button>
                                    </td>
                                    <td>{booking.guest}</td>
                                    <td>{booking.property}</td>
                                    <td>
                                        {formatDate(booking.startDate)}
                                        {booking.endDate && booking.endDate !== booking.startDate && (
                                            <>
                                                <span> –</span><br />
                                                {formatDate(booking.endDate)}
                                            </>
                                        )}
                                    </td>
                                    <td>{booking.status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {!loading && filteredBookings.length === 0 && (
                    <p className="text-center py-4 mb-0">
                        No reservations match your filters.
                    </p>
                )}
            </div>
        </section>
    )
}