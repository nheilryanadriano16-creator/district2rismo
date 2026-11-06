import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { fetchHostProperties, fetchHostBookings, formatHostDate } from '../../utils/hostData'

export const HostDashboardN = ({ onViewBookings }) => {
    const { currentUser } = useAuth()
    const [stats, setStats] = useState([
        { label: <>Total Bookings<br />(This Month)</>, value: '0', highlight: true },
        { label: 'My Properties', value: '0' },
        { label: <>Pending<br />Request</>, value: '0' },
    ])
    const [recentBookings, setRecentBookings] = useState([])

    useEffect(() => {
        let isMounted = true

        async function loadDashboard() {
            if (!currentUser?.uid) return
            try {
                const properties = await fetchHostProperties(currentUser.uid, { email: currentUser.email })
                const reservations = await fetchHostBookings(currentUser.uid, properties)
                const now = new Date()
                const monthBookings = reservations.filter((booking) => {
                    const raw = booking.startDate || booking.date
                    const date = raw
                        ? new Date(/^\d{4}-\d{2}-\d{2}$/.test(String(raw)) ? `${raw}T00:00:00` : raw)
                        : null
                    return date && !Number.isNaN(date.getTime()) && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
                })
                const pending = reservations.filter((booking) =>
                    !['confirmed', 'accepted', 'rejected', 'cancelled', 'canceled'].includes(
                        String(booking.status || 'Pending').toLowerCase()
                    )
                )
                if (!isMounted) return
                setStats([
                    { label: <>Total Bookings<br />(This Month)</>, value: String(monthBookings.length), highlight: true },
                    { label: 'My Properties', value: String(properties.length) },
                    { label: <>Pending<br />Request</>, value: String(pending.length) },
                ])
                setRecentBookings(reservations.slice(0, 5).map((booking) => ({
                    id: booking.id,
                    guest: booking.userEmail || booking.guest || 'Guest',
                    resort: booking.propertyName || booking.property?.name || booking.resort || 'Resort Property',
                    date: formatHostDate(booking.date),
                    status: booking.status || 'Pending',
                })))
            } catch (error) {
                console.error('Error loading host dashboard:', error)
            }
        }

        loadDashboard()
        return () => {
            isMounted = false
        }
    }, [currentUser])

    return (
    <section className="host-dashboardN container-fluid p-3 p-md-4 text-white">
        <h1 className="h2 fw-bold text-warning mb-3">Dashboard</h1>

        <div className="row g-2 host-statsN mb-4">
            {stats.map((stat, index) => (
                <div key={index} className="col-4">
                    <article className={`host-stat-cardN h-100 rounded-3 p-2 p-md-3 ${stat.highlight ? 'highlight' : ''}`}>
                        <div className="d-flex justify-content-between gap-2">
                            <span className="small lh-sm">{stat.label}</span>
                            <i className="bi bi-arrow-up-right-circle fs-5" aria-hidden="true" />
                        </div>
                        <p className="display-6 fw-bold mb-0">{stat.value}</p>
                    </article>
                </div>
            ))}
        </div>

        <h2 className="h5 host-recent-titleN mb-2">Recent Bookings</h2>

        <div className="d-flex flex-column gap-1">
            {recentBookings.map((booking) => (
                <article key={booking.id} className="host-bookingN rounded-3 d-flex align-items-center gap-2 gap-md-3 p-2 p-md-3">
                    <div className="host-booking-avatarN rounded-circle d-flex align-items-center justify-content-center flex-shrink-0">
                        {booking.guest.charAt(0)}
                    </div>
                    <div className="flex-grow-1">
                        <h3 className="h5 mb-0">{booking.guest}</h3>
                        <p className="small text-warning mb-0">{booking.resort}</p>
                        <small className="host-booking-dateN">{booking.date}</small>
                    </div>
                    <span className={`host-booking-statusN rounded-pill text-center ${booking.status === 'Pending' ? 'pending' : ''}`}>
                        {booking.status}
                    </span>
                </article>
            ))}
            {recentBookings.length === 0 && (
                <p className="small text-secondary mb-0">No bookings yet.</p>
            )}
        </div>

        <button type="button" className="btn btn-link host-view-bookingsN px-0 mt-1" onClick={onViewBookings}>View All Bookings</button>
    </section>
    )
}
