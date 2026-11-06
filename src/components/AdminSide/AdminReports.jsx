import { useState, useEffect } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../../firebase'

export function AdminReports() {
    const [reservations, setReservations] = useState([])
    const [loading, setLoading] = useState(true)
    const [property, setProperty] = useState('')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')

    useEffect(() => {
        async function fetchReservations() {
            try {
                setLoading(true)
                const querySnapshot = await getDocs(collection(db, 'bookings'))
                const loadedReservations = querySnapshot.docs.map(docItem => {
                    const data = docItem.data()
                    return {
                        id: docItem.id,
                        property: data.propertyName || data.resort || data.property || 'Resort Property',
                        date: data.date || data.startDate || '',
                        status: data.status || 'Pending',
                        totalAmount: Number(data.total || data.totalAmount || data.amountPaid || 0),
                        ...data,
                    }
                })
                setReservations(loadedReservations)
            } catch (err) {
                console.error('Error fetching bookings for reports:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchReservations()
    }, [])

    const properties = [...new Set(reservations.map((item) => item.property).filter(Boolean))]

    const filteredReservations = reservations.filter((item) => {
        const matchesProperty = !property || item.property === property
        const matchesStartDate = !startDate || (item.date && item.date >= startDate)
        const matchesEndDate = !endDate || (item.date && item.date <= endDate)
        return matchesProperty && matchesStartDate && matchesEndDate
    })

    const totalBookingsCount = filteredReservations.length

    // Revenue counts confirmed/accepted bookings
    const totalRevenue = filteredReservations.reduce((sum, item) => {
        const isConfirmed = ['confirmed', 'accepted'].includes(String(item.status).toLowerCase())
        return sum + (isConfirmed ? (Number(item.totalAmount) || 0) : 0)
    }, 0)

    const statusCounts = {
        Confirmed: 0,
        Pending: 0,
        Rejected: 0,
        Cancelled: 0
    }

    filteredReservations.forEach((item) => {
        let rawStatus = String(item.status || 'Pending').toLowerCase()
        let formattedStatus = 'Pending'
        
        if (['accepted', 'confirmed'].includes(rawStatus)) formattedStatus = 'Confirmed'
        else if (rawStatus === 'rejected') formattedStatus = 'Rejected'
        else if (rawStatus === 'cancelled') formattedStatus = 'Cancelled'
        else formattedStatus = 'Pending'

        if (statusCounts[formattedStatus] !== undefined) {
            statusCounts[formattedStatus]++
        }
    })

    const bookingStatusesList = [
        { status: 'Confirmed', count: statusCounts.Confirmed },
        { status: 'Pending', count: statusCounts.Pending },
        { status: 'Rejected', count: statusCounts.Rejected },
        { status: 'Cancelled', count: statusCounts.Cancelled }
    ]

    const exportReport = () => {
        const rows = [
            ['Report', 'Reports and Analytics'],
            ['Property', property || 'All Property'],
            ['Start Date', startDate || 'All Time'],
            ['End Date', endDate || 'All Time'],
            [],
            ['Booking Status', 'Count'],
            ...bookingStatusesList.map(({ status, count }) => [status, count]),
            [],
            ['Booking Revenue', `₱${totalRevenue.toLocaleString()}`],
            ['Total Bookings', totalBookingsCount],
        ]

        const csv = rows
            .map((row) =>
                row
                    .map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`)
                    .join(',')
            )
            .join('\n')

        const url = URL.createObjectURL(
            new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        )
        const link = document.createElement('a')
        link.href = url
        link.download = 'reports-and-analytics.csv'
        link.click()
        URL.revokeObjectURL(url)
    }

    return (
        <section className="admin-reportsN container-fluid p-3 p-md-4">
            <div className="row align-items-center g-3 mb-4">
                <div className="col">
                    <h1 className="h2 fw-bold mb-0">Reports and Analytics</h1>
                </div>

                <div className="col-12 col-md-auto">
                    <select
                        className="form-select admin-report-propertyN"
                        aria-label="Select property"
                        value={property}
                        onChange={(event) => setProperty(event.target.value)}
                    >
                        <option value="">All Property</option>
                        {properties.map((prop) => (
                            <option key={prop} value={prop}>
                                {prop}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="mb-3">
                <label className="form-label small mb-1" htmlFor="report-start-date">
                    Date
                </label>
                <div className="d-flex flex-wrap gap-2">
                    <input
                        id="report-start-date"
                        className="form-control admin-report-dateN"
                        type="date"
                        value={startDate}
                        onChange={(event) => setStartDate(event.target.value)}
                    />
                    <input
                        className="form-control admin-report-dateN"
                        type="date"
                        aria-label="End date"
                        value={endDate}
                        onChange={(event) => setEndDate(event.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <p className="text-center py-4">Loading reports and analytics...</p>
            ) : (
                <>
                    <div className="row g-3 mb-3">
                        <div className="col-12 col-lg-9">
                            <article className="card admin-report-statN h-100">
                                <div className="card-body">
                                    <h2 className="h5 card-title">Booking Revenue</h2>
                                    <p className="display-5 fw-bold mb-0">₱{totalRevenue.toLocaleString()}</p>
                                </div>
                            </article>
                        </div>
                        <div className="col-12 col-lg-3">
                            <article className="card admin-report-statN h-100">
                                <div className="card-body">
                                    <h2 className="h5 card-title">Total Bookings</h2>
                                    <p className="display-5 fw-bold mb-0">{totalBookingsCount.toLocaleString()}</p>
                                </div>
                            </article>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-12 col-lg-9">
                            <article className="card admin-report-statusN">
                                <div className="card-body">
                                    <h2 className="h5 card-title mb-3">Booking Status</h2>
                                    <ul className="list-group list-group-flush">
                                        {bookingStatusesList.map(({ status, count }) => (
                                            <li
                                                key={status}
                                                className="list-group-item d-flex justify-content-between gap-3 px-0"
                                            >
                                                <span>{status}</span>
                                                <span className="text-end">{count}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </article>

                            <button
                                type="button"
                                className="btn admin-report-exportN mt-3"
                                onClick={exportReport}
                            >
                                Export
                            </button>
                        </div>
                    </div>
                </>
            )}
        </section>
    )
}