import { useState } from 'react'
import Modal from 'react-bootstrap/Modal'
import { formatHostDate } from '../../utils/hostData'
import { db } from '../../firebase'
import { collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore'
import { useNotification } from '../../context/NotificationContext'
import { updateBookingStatusAndAvailability } from '../../utils/bookingAvailability'

export const HostBookingDetailsN = ({
    booking,
    onBack,
    onConfirm,
    onReject,
}) => {
    const { setNotification } = useNotification()
    const [pendingAction, setPendingAction] = useState(null)
    const [submitting, setSubmitting] = useState(false)

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

    const isConfirmed = ['confirmed', 'accepted'].includes(String(status).toLowerCase())
    const isRejectedOrCancelled = ['rejected', 'cancelled'].includes(String(status).toLowerCase())

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

    const handleConfirmBooking = async () => {
        if (!booking?.id) {
            setNotification({ type: 'error', message: 'Booking details are missing.' })
            return false
        }

        try {
            await updateBookingStatusAndAvailability(booking.id, 'Confirmed')

            await addDoc(collection(db, 'notifications'), {
                userId: booking?.userId || null,
                userEmail: booking?.userEmail || null,
                title: 'Booking Confirmed!',
                message: `Your booking at ${resort} for ${startDate} (${sessionType}) has been confirmed by the host.`,
                bookingId: booking.id,
                read: false,
                createdAt: serverTimestamp(),
            })

            const propertyId = booking.propertyId || booking.property?.id
            const conflictingQuery = query(
                collection(db, 'bookings'),
                where(propertyId ? 'propertyId' : 'propertyName', '==', propertyId || resort),
                where('date', '==', booking.date || booking.startDate),
                where('session', '==', sessionType),
                where('status', '==', 'Pending')
            )

            const conflictingSnapshot = await getDocs(conflictingQuery)
            for (const conflictDoc of conflictingSnapshot.docs) {
                if (conflictDoc.id !== booking.id) {
                    const conflictData = conflictDoc.data()
                    await updateBookingStatusAndAvailability(conflictDoc.id, 'Rejected')

                    await addDoc(collection(db, 'notifications'), {
                        userId: conflictData.userId || null,
                        userEmail: conflictData.userEmail || null,
                        title: 'Booking Unavailable',
                        message: `Your booking request at ${resort} for ${startDate} (${sessionType}) was automatically declined because the slot was assigned to another reservation.`,
                        bookingId: conflictDoc.id,
                        read: false,
                        createdAt: serverTimestamp(),
                    })
                }
            }

            setNotification({
                type: 'success',
                message: 'Booking confirmed and user notified! Conflicting pending slots were automatically updated.',
            })
            onConfirm?.()
            return true
        } catch (error) {
            console.error('Error confirming booking:', error)
            setNotification({
                type: 'error',
                message: error.message || 'Failed to confirm booking and send notification.',
            })
            return false
        }
    }

    const handleRejectBooking = async () => {
        if (!booking?.id) {
            setNotification({ type: 'error', message: 'Booking details are missing.' })
            return false
        }

        try {
            await updateBookingStatusAndAvailability(booking.id, 'Rejected')

            await addDoc(collection(db, 'notifications'), {
                userId: booking?.userId || null,
                userEmail: booking?.userEmail || null,
                title: 'Booking Declined',
                message: `Your booking request at ${resort} for ${startDate} (${sessionType}) was rejected by the host.`,
                bookingId: booking.id,
                read: false,
                createdAt: serverTimestamp(),
            })

            setNotification({
                type: 'success',
                message: 'Booking rejected and notification sent to the guest.',
            })
            onReject?.()
            return true
        } catch (error) {
            console.error('Error rejecting booking:', error)
            setNotification({
                type: 'error',
                message: 'Failed to reject booking and send notification.',
            })
            return false
        }
    }

    const handleCancelBooking = async () => {
        if (!booking?.id) {
            setNotification({ type: 'error', message: 'Booking details are missing.' })
            return false
        }

        try {
            await updateBookingStatusAndAvailability(booking.id, 'Cancelled')

            await addDoc(collection(db, 'notifications'), {
                userId: booking?.userId || null,
                userEmail: booking?.userEmail || null,
                title: 'Booking Cancelled',
                message: `Your confirmed booking at ${resort} for ${startDate} (${sessionType}) has been cancelled by the host.`,
                bookingId: booking.id,
                read: false,
                createdAt: serverTimestamp(),
            })

            setNotification({
                type: 'success',
                message: 'Booking cancelled and notification sent to the guest.',
            })
            onReject?.()
            return true
        } catch (error) {
            console.error('Error cancelling booking:', error)
            setNotification({
                type: 'error',
                message: 'Failed to cancel booking.',
            })
            return false
        }
    }

    const confirmPendingAction = async () => {
        if (!pendingAction || submitting) return

        setSubmitting(true)
        try {
            const succeeded = pendingAction === 'confirm'
                ? await handleConfirmBooking()
                : pendingAction === 'reject'
                    ? await handleRejectBooking()
                    : await handleCancelBooking()

            if (succeeded) setPendingAction(null)
        } finally {
            setSubmitting(false)
        }
    }

    const actionDetails = {
        confirm: {
            title: 'Confirm Booking',
            message: `Confirm this booking at ${resort} for ${startDate}? Other pending requests for the same time slot will be declined.`,
            button: 'Confirm Booking',
        },
        reject: {
            title: 'Reject Booking',
            message: `Are you sure you want to reject this booking request at ${resort} for ${startDate}?`,
            button: 'Reject Booking',
        },
        cancel: {
            title: 'Cancel Booking',
            message: `Are you sure you want to cancel the confirmed booking at ${resort} for ${startDate}?`,
            button: 'Cancel Booking',
        },
    }

    const currentAction = pendingAction ? actionDetails[pendingAction] : null

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
                {isConfirmed ? (
                    <div className="col-12 col-sm-6 col-md-4">
                        <button
                            type="button"
                            className="btn btn-outline-danger rounded-pill w-100"
                            onClick={() => setPendingAction('cancel')}
                            disabled={submitting}
                        >
                            Cancel Booking
                        </button>
                    </div>
                ) : !isRejectedOrCancelled ? (
                    <>
                        <div className="col-6 col-sm-5 col-md-4">
                            <button
                                type="button"
                                className="btn host-booking-rejectN rounded-pill w-100"
                                onClick={() => setPendingAction('reject')}
                                disabled={submitting}
                            >
                                Reject Booking
                            </button>
                        </div>
                        <div className="col-6 col-sm-5 col-md-4">
                            <button
                                type="button"
                                className="btn btn-warning rounded-pill w-100"
                                onClick={() => setPendingAction('confirm')}
                                disabled={submitting}
                            >
                                Confirm Booking
                            </button>
                        </div>
                    </>
                ) : null}
            </div>

            <Modal
                show={Boolean(currentAction)}
                onHide={() => {
                    if (!submitting) setPendingAction(null)
                }}
                centered
                dialogClassName="admin-suspend-dialogN"
                contentClassName="admin-suspend-modalN admin-themed-modalN"
                aria-labelledby="host-booking-action-title"
            >
                <button
                    type="button"
                    aria-label="Close"
                    onClick={() => setPendingAction(null)}
                    disabled={submitting}
                >
                    <i className="bi bi-x-lg" aria-hidden="true" />
                </button>
                <Modal.Body className="admin-suspend-bodyN">
                    <h2 id="host-booking-action-title">{currentAction?.title}</h2>
                    <p className="mb-4">{currentAction?.message}</p>
                    <div className="d-flex justify-content-center align-items-center gap-3 mt-4 w-100">
                        <button
                            type="button"
                            className="btn btn-outline-warning px-4"
                            onClick={() => setPendingAction(null)}
                            disabled={submitting}
                        >
                            Keep Booking
                        </button>
                        <button
                            type="button"
                            className="btn btn-warning px-4"
                            onClick={confirmPendingAction}
                            disabled={submitting}
                        >
                            {submitting ? 'Updating...' : currentAction?.button}
                        </button>
                    </div>
                </Modal.Body>
            </Modal>
        </section>
    )
}