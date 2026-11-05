import { formatHostDate } from '../../utils/hostData'

export const HostBookingDetailsN = ({
    booking,
    onBack,
    onConfirm,
    onReject,
}) => {
    const guest = booking?.userEmail || booking?.guest || 'Guest'
    const resort = booking?.propertyName || booking?.resort || 'Property'
    const reservationId = String(booking?.id || '').slice(-5).padStart(5, '0')
    const status = booking?.status || 'Pending'
    const startDate = formatHostDate(booking?.startDate || booking?.date)
    const sessionType = booking?.session || 'Day Tour'
    const guestsTotal = booking?.guestsCount || booking?.guests || '1'
    
    const total = Number(booking?.total || booking?.totalAmount || 0)
    const isPartial = booking?.payOption === 'partial'
    const paid = Number(isPartial ? total / 2 : total)
    const remaining = Number(isPartial ? total / 2 : 0)
    
    const money = (amount) => `₱${Number(amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 0 })}`

    const cottagesList = Array.isArray(booking?.cottages) 
        ? booking.cottages.map(c => c.name).join(', ') 
        : (booking?.cottages || 'None')

    const reservationRows = [
        ['Reservation ID', `#${reservationId}`],
        ['Property Name', resort],
        ['Tour Session', sessionType],
        ['Booking Date', startDate],
        ['Bedrooms / Cottages', cottagesList],
        ['Number of Guests', `${guestsTotal} Guests`],
    ]

    const paymentRows = [
        ['Payment Option', booking?.payOption === 'partial' ? 'Part now, part later' : 'Full payment'],
        ['Total Amount', money(total)],
        ['Amount Paid', money(paid)],
        ['Remaining Balance', money(remaining)],
        ['Payment Date', formatHostDate(booking?.createdAt || booking?.date)],
        ['Payment Method', String(booking?.method || 'card').toUpperCase()],
    ]

    const renderRows = (rows) => rows.map(([label, value]) => (
        <div
            className="d-flex justify-content-between align-items-start gap-3 py-2"
            key={label}
        >
            <dt className="fw-normal mb-0">{label}</dt>
            <dd className="text-end mb-0">{value}</dd>
        </div>
    ))

    return (
        <section className="host-booking-detailN container-fluid p-3 p-md-4">
            <nav aria-label="Breadcrumb" className="small mb-3">
                <button
                    type="button"
                    className="btn btn-link p-0 host-booking-detail-backN"
                    onClick={onBack}
                >
                    Bookings
                </button>
                <span className="mx-1">›</span>
                <span className="text-warning">Details</span>
            </nav>

            <article className="card host-booking-guest-cardN border-0 rounded-3 p-3 mb-3">
                <div className="row align-items-center g-3">
                    <div className="col-12 col-md">
                        <div className="d-flex align-items-center gap-3">
                            <span className="host-booking-detail-avatarN rounded-circle d-flex align-items-center justify-content-center flex-shrink-0">
                                {guest.charAt(0).toUpperCase()}
                            </span>
                            <div className="min-w-0">
                                <h1 className="h4 mb-0">{guest}</h1>
                                <p className="text-warning mb-0">{resort}</p>
                            </div>
                        </div>
                    </div>

                    <div className="col-12 col-md-auto">
                        <dl className="row small mb-0">
                            <dt className="col-4 fw-normal">Phone</dt>
                            <dd className="col-8 text-md-end mb-1">{booking?.phone || '—'}</dd>
                            <dt className="col-4 fw-normal">Email</dt>
                            <dd className="col-8 text-md-end mb-0 text-break">
                                {booking?.userEmail || booking?.email || '—'}
                            </dd>
                        </dl>
                    </div>
                </div>
            </article>

            <section className="card host-booking-detail-panelN rounded-3 p-3 mb-2">
                <h2 className="h6 mb-2">Reservation Details</h2>
                <dl className="mb-0">
                    {renderRows(reservationRows)}
                    <div className="d-flex justify-content-between gap-3 py-2">
                        <dt className="fw-semibold text-warning mb-0">Status</dt>
                        <dd className="text-warning text-end fw-semibold mb-0">
                            {status}
                        </dd>
                    </div>
                </dl>
            </section>

            <section className="card host-booking-detail-panelN rounded-3 p-3 mb-2">
                <h2 className="h6 mb-2">Payment Information</h2>
                <dl className="mb-0">{renderRows(paymentRows)}</dl>
            </section>

            <div className="row justify-content-end g-2 mt-1">
                <div className="col-6 col-sm-5 col-md-4">
                    <button
                        type="button"
                        className="btn host-booking-rejectN rounded-pill w-100"
                        onClick={onReject}
                    >
                        Reject Booking
                    </button>
                </div>
                <div className="col-6 col-sm-5 col-md-4">
                    <button
                        type="button"
                        className="btn btn-warning rounded-pill w-100"
                        onClick={onConfirm}
                    >
                        Confirm Booking
                    </button>
                </div>
            </div>
        </section>
    )
}