import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../firebase'

function formatDate(date) {
    if (!date) return '\u2014'
    return new Date(`${date}T00:00:00`).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    })
}

function DetailRow({ label, value, highlight = false }) {
    return (
        <div className={`d-flex justify-content-between align-items-start gap-3 py-2${highlight ? ' text-warning fw-semibold' : ''}`}>
            <dt className="mb-0 fw-normal">{label}</dt>
            <dd className="mb-0 text-end">{value || '\u2014'}</dd>
        </div>
    )
}

export function AdminReservationDetails({ booking: initialBooking, onBack }) {
    const { id: routeId } = useParams()
    const bookingId = initialBooking?.id || routeId

    const [booking, setBooking] = useState(initialBooking || null)
    const [loading, setLoading] = useState(!initialBooking)

    useEffect(() => {
        if (!initialBooking && bookingId) {
            async function fetchBooking() {
                try {
                    setLoading(true)
                    const docRef = doc(db, 'reservations', bookingId)
                    const docSnap = await getDoc(docRef)
                    if (docSnap.exists()) {
                        setBooking({ id: docSnap.id, ...docSnap.data() })
                    }
                } catch (err) {
                    console.error('Error fetching reservation details:', err)
                } finally {
                    setLoading(false)
                }
            }
            fetchBooking()
        }
    }, [bookingId, initialBooking])

    if (loading) {
        return (
            <section className="container-fluid p-3 p-md-4 text-white text-center">
                <p>Loading reservation details...</p>
            </section>
        )
    }

    if (!booking) {
        return (
            <section className="container-fluid p-3 p-md-4 text-white">
                <p>Reservation not found.</p>
                <button type="button" className="btn btn-outline-light btn-sm" onClick={onBack}>
                    Back to Reservations
                </button>
            </section>
        )
    }

    const reservationNumber = booking.reservationNumber || booking.id?.replace(/^.*?(\d+)$/, '$1') || '00001'
    const duration = booking.duration ?? (
        booking.startDate && booking.endDate
            ? Math.round((new Date(`${booking.endDate}T00:00:00`) - new Date(`${booking.startDate}T00:00:00`)) / 86400000) + 1
            : '\u2014'
    )

    return (
        <section className="container-fluid p-3 p-md-4 admin-reservation-detailN">
            <nav aria-label="Breadcrumb" className="mb-3">
                <ol className="breadcrumb small mb-0 align-items-center">
                    <li className="breadcrumb-item">
                        <button 
                            type="button" 
                            className="btn btn-link p-0 text-white text-decoration-none shadow-none" 
                            onClick={onBack}
                        >
                            Reservations
                        </button>
                    </li>
                    <li 
                        className="breadcrumb-item active text-warning" 
                        aria-current="page"
                    >
                        Reservation Details
                    </li>
                </ol>
            </nav>

            <header className="card border-0 rounded-3 p-3 p-md-4 mb-3 admin-reservation-detail-summaryN">
                <div className="row align-items-center g-3">
                    <div className="col-12 col-lg">
                        <div className="d-flex align-items-center gap-3">
                            <div className="rounded-circle bg-warning text-dark d-flex align-items-center justify-content-center flex-shrink-0 admin-reservation-detail-avatarN" aria-hidden="true">
                                {(booking.guest || 'G').charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                                <h1 className="h2 mb-0">{booking.guest || 'Guest'}</h1>
                                <p className="fs-5 text-warning mb-0">{booking.property || 'Property'}</p>
                            </div>
                        </div>
                    </div>
                    <div className="col-12 col-lg-auto admin-reservation-detail-contactN">
                        <div className="row gx-3 gy-1">
                            <span className="col-4">Phone</span>
                            <a className="col-8 text-end text-reset" href={`tel:${booking.phone || ''}`}>{booking.phone || '\u2014'}</a>
                            <span className="col-4">Email</span>
                            <a className="col-8 text-end text-reset text-break" href={`mailto:${booking.email || ''}`}>{booking.email || '\u2014'}</a>
                        </div>
                    </div>
                </div>
            </header>

            <section className="border rounded-3 p-3 p-md-4 mb-2 admin-reservation-detail-panelN" aria-labelledby="reservation-details-heading">
                <h2 id="reservation-details-heading" className="h5 fw-bold mb-3">Reservation Details</h2>
                <dl className="mb-0">
                    <DetailRow label="Reservation ID" value={`#${reservationNumber.padStart(5, '0')}`} />
                    <DetailRow label="Property Name" value={booking.property} />
                    <DetailRow label="Booking Date" value={`${formatDate(booking.startDate)} - ${formatDate(booking.endDate)}`} />
                    <DetailRow label="Duration" value={duration} />
                    <DetailRow label="Number of Guests" value={booking.guestCount ?? 3} />
                    <DetailRow label="Status" value={booking.status} highlight />
                </dl>
            </section>

            <section className="border rounded-3 p-3 p-md-4 admin-reservation-detail-panelN" aria-labelledby="payment-information-heading">
                <h2 id="payment-information-heading" className="h5 fw-bold mb-3">Payment Information</h2>
                <dl className="mb-0">
                    <DetailRow label="Total Amount" value={booking.totalAmount ?? '\u20B112,500'} />
                    <DetailRow label="Amount Paid" value={booking.amountPaid ?? '\u20B112,500'} />
                    <DetailRow label="Remaining Balance" value={booking.remainingBalance ?? '\u20B10'} />
                    <DetailRow label="Payment Date" value={formatDate(booking.paymentDate || booking.startDate)} />
                    <DetailRow label="Payment Method" value={booking.paymentMethod || `Reservation #GWR-${reservationNumber.padStart(5, '0')}`} />
                </dl>
            </section>
        </section>
    )
}