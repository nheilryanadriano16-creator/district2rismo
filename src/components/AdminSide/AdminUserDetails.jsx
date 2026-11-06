import { useState } from 'react'
import resortImage from '../../images/Bustos Hero.png'
import { AdminUserDeactivate } from './AdminUserDeactivate.jsx'
import { AdminUserSuspend } from './AdminUserSuspend.jsx'
import { doc, updateDoc, deleteField, collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase'

const bookingFilters = ['All', 'Completed', 'Confirmed', 'Canceled']

const reviewCategories = [
    'Cleanliness',
    'Pools & Attractions',
    'Facilities & Amenities',
    'Staff & Service',
    'Value for Money',
    'Safety',
]

export function AdminUserDetail({ user, onBack, onDeactivateUser }) {
    const [bookingFilter, setBookingFilter] = useState('All')
    const [showDeactivate, setShowDeactivate] = useState(false)
    const [showSuspend, setShowSuspend] = useState(false)
    const [loadingAction, setLoadingAction] = useState(false)
    const [currentStatus, setCurrentStatus] = useState(user?.status || 'Active')

    const displayName = user?.firstName && user?.lastName 
        ? `${user.firstName} ${user.lastName}` 
        : user?.name || (user?.email ? user.email.split('@')[0] : 'User')

    const isDeactivated = currentStatus.toLowerCase() === 'deactivated'
    const isSuspended = currentStatus.toLowerCase() === 'suspended'
    const userBookings = user?.bookings || []
    const userReviews = user?.reviews || []

    const visibleBookings = userBookings.filter(
        (booking) => bookingFilter === 'All' || booking.status === bookingFilter
    )

    const handleReactivateUser = async () => {
        if (!user?.id) return

        try {
            setLoadingAction(true)
            const userRef = doc(db, 'users', user.id)
            await updateDoc(userRef, {
                status: 'Active',
                deactivationReason: deleteField(),
                deactivatedAt: deleteField(),
                suspensionCategory: deleteField(),
                suspensionReason: deleteField(),
                suspensionDuration: deleteField(),
                suspendedAt: deleteField()
            })

            await addDoc(collection(db, 'notifications'), {
                userId: user.id,
                userEmail: user.email || null,
                title: 'Account Status Updated',
                message: 'Your account is now active. You have full access to District 2rismo.',
                read: false,
                createdAt: serverTimestamp(),
            })

            setCurrentStatus('Active')
        } catch (err) {
            console.error('Error reactivating user:', err)
            alert('Failed to reactivate user: ' + err.message)
        } finally {
            setLoadingAction(false)
        }
    }

    return (
        <section className="admin-user-detailN container-fluid p-3 p-md-4">
            <nav aria-label="breadcrumb" className="mb-3">
                <ol className="breadcrumb small mb-0">
                    <li className="breadcrumb-item">
                        <button
                            type="button"
                            className="admin-user-breadcrumb-backN"
                            onClick={onBack}
                        >
                            Users
                        </button>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                        User Details
                    </li>
                </ol>
            </nav>

            <header className="admin-user-detail-headerN card border-0 p-3 p-md-4 mb-3">
                <div className="row align-items-center g-3">
                    <div className="col-auto">
                        <span className="admin-user-detail-avatarN rounded-circle d-flex align-items-center justify-content-center">
                            {displayName.charAt(0).toUpperCase()}
                        </span>
                    </div>
                    <div className="col">
                        <h1 className="h3 mb-0 text-white">{displayName}</h1>
                        <p className="small text-warning mb-0">
                            Joined: {user?.createdAt ? new Date(user.createdAt.seconds ? user.createdAt.seconds * 1000 : user.createdAt).toLocaleDateString() : '—'}
                        </p>
                    </div>
                    <div className="col-12 col-md-auto">
                        <span className={`badge rounded-pill admin-host-detail-statusN ${currentStatus.toLowerCase() === 'active' ? 'active' : ''}`}>
                            {currentStatus}
                        </span>
                    </div>
                </div>
            </header>

            <section className="admin-user-detail-panelN card p-3 p-md-4 mb-3">
                <h2 className="h6 fw-semibold mb-3 text-white">Basic and Contact Information</h2>
                <dl className="mb-0 text-white">
                    <div className="d-flex justify-content-between gap-3 py-2">
                        <dt className="fw-normal">Full Name</dt>
                        <dd className="mb-0 text-end">{displayName}</dd>
                    </div>
                    <div className="d-flex justify-content-between gap-3 py-2">
                        <dt className="fw-normal">Email Address</dt>
                        <dd className="mb-0 text-end">{user?.email || '—'}</dd>
                    </div>
                    <div className="d-flex justify-content-between gap-3 py-2">
                        <dt className="fw-normal">Date of Birth</dt>
                        <dd className="mb-0 text-end">{user?.dateOfBirth || '—'}</dd>
                    </div>
                </dl>
            </section>

            <section className="admin-user-detail-panelN card p-3 p-md-4 mb-3">
                <h2 className="h6 fw-semibold mb-3 text-white">Booking History</h2>

                <div className="d-flex flex-wrap gap-2 mb-3" role="group" aria-label="Filter bookings">
                    {bookingFilters.map((filter) => (
                        <button
                            key={filter}
                            type="button"
                            className={`btn btn-sm admin-user-booking-filterN ${bookingFilter === filter ? 'active' : ''}`}
                            aria-pressed={bookingFilter === filter}
                            onClick={() => setBookingFilter(filter)}
                        >
                            {filter}
                        </button>
                    ))}
                </div>

                <div className="d-flex flex-column gap-2">
                    {visibleBookings.map((booking, index) => (
                        <article className="admin-user-bookingN card overflow-hidden" key={booking.id || `${booking.status}-${index}`}>
                            <div className="row g-0 align-items-stretch">
                                <div className="col-12 col-md-6 d-flex align-items-center gap-2 p-2">
                                    <img
                                        className="admin-user-booking-imageN rounded-2 flex-shrink-0"
                                        src={booking.imageUrl || resortImage}
                                        alt={booking.propertyName || "Resort preview"}
                                    />
                                    <div className="admin-user-booking-copyN">
                                        <h3 className="fw-semibold mb-0">{booking.propertyName || 'Resort'}</h3>
                                        <p className="text-warning mb-1">{booking.location || 'Bustos, Bulacan'}</p>
                                        <p className="mb-1">Total Price: {booking.price || '₱0.00'}</p>
                                        <p className="mb-1">{booking.reviewStatus || ''}</p>
                                        <span className="badge rounded-pill admin-user-statusN">
                                            {booking.status}
                                        </span>
                                    </div>
                                </div>
                                <div className="col-12 col-md-6 admin-user-booking-detailsN p-3">
                                    <p className="mb-2">Details:</p>
                                    <div className="d-flex justify-content-between gap-3">
                                        <span>Session</span>
                                        <span className="text-end">{booking.session || '—'}</span>
                                    </div>
                                    <div className="d-flex justify-content-between gap-3">
                                        <span>Date</span>
                                        <span className="text-end">{booking.date || '—'}</span>
                                    </div>
                                    <div className="d-flex justify-content-between gap-3">
                                        <span>Accommodation</span>
                                        <span className="text-end">{booking.accommodation || '—'}</span>
                                    </div>
                                    <div className="d-flex justify-content-between gap-3">
                                        <span>Guests</span>
                                        <span className="text-end">{booking.guests || '—'}</span>
                                    </div>
                                </div>
                            </div>
                        </article>
                    ))}

                    {visibleBookings.length === 0 && (
                        <p className="text-white text-center py-3 mb-0">No booking history found.</p>
                    )}
                </div>
            </section>

            <section className="admin-user-detail-panelN card p-3 p-md-4 mb-3">
                <h2 className="h5 mb-3 text-white">Reviews</h2>

                {userReviews.length > 0 ? (
                    userReviews.map((review, rIndex) => (
                        <article className="admin-user-reviewN card border-0 align-self-start mb-3 text-white" key={review.id || rIndex}>
                            <div className="admin-user-review-topN d-flex gap-2 p-2">
                                <img
                                    className="admin-user-review-imageN rounded-2 flex-shrink-0"
                                    src={review.imageUrl || resortImage}
                                    alt="Resort preview"
                                />
                                <div className="admin-user-review-summaryN">
                                    <h3 className="fw-semibold mb-0">{review.propertyName || 'Galilee Wonderland Resort'}</h3>
                                    <p className="text-warning mb-1">{review.location || 'Bustos, Bulacan'}</p>
                                    <p className="mb-1">Client stay date: {review.stayDate || '—'}</p>
                                    <hr className="admin-user-review-summary-dividerN" />
                                    <p className="mb-0">Client&apos;s overall experience</p>
                                    <p className="text-warning mb-0">{'★'.repeat(review.rating || 5)}{'☆'.repeat(5 - (review.rating || 5))}</p>
                                </div>
                            </div>

                            <div className="admin-user-review-contentN p-2">
                                <p className="mb-2">Client&apos;s experience</p>

                                {reviewCategories.map((category) => (
                                    <div className="d-flex justify-content-between gap-2" key={category}>
                                        <span>{category}</span>
                                        <span className="admin-user-review-starsN text-nowrap">★★★★★</span>
                                    </div>
                                ))}

                                <hr className="admin-user-review-dividerN" />
                                <p className="mb-1">Client&apos;s comment</p>
                                <p className="admin-user-review-commentN rounded p-2 mb-2">
                                    {review.comment || 'No comment provided.'}
                                </p>
                                <div className="admin-user-review-dateN text-center rounded-pill p-2">
                                    Review Submitted on<br />
                                    <span className="text-warning">{review.submittedDate || '—'}</span>
                                </div>
                            </div>
                        </article>
                    ))
                ) : (
                    <p className="text-white mb-0">No reviews submitted by this user yet.</p>
                )}
            </section>

            <div className="d-flex flex-wrap justify-content-end gap-3">
                {isDeactivated ? (
                    <button
                        type="button"
                        className="btn btn-success rounded-pill admin-user-account-buttonN"
                        onClick={handleReactivateUser}
                        disabled={loadingAction}
                    >
                        {loadingAction ? 'Processing...' : 'Reactivate Account'}
                    </button>
                ) : (
                    <button
                        type="button"
                        className="btn admin-user-actionN admin-user-account-buttonN"
                        onClick={() => setShowDeactivate(true)}
                    >
                        Deactivate Account
                    </button>
                )}
                {isSuspended ? (
                    <button
                        type="button"
                        className="btn btn-info rounded-pill admin-user-account-buttonN"
                        onClick={handleReactivateUser}
                        disabled={loadingAction}
                    >
                        {loadingAction ? 'Processing...' : 'Lift Suspension'}
                    </button>
                ) : (
                    <button
                        type="button"
                        className="btn btn-warning rounded-pill admin-user-account-buttonN"
                        onClick={() => setShowSuspend(true)}
                    >
                        Suspend Account
                    </button>
                )}
            </div>

            <AdminUserDeactivate
                show={showDeactivate}
                user={user}
                onHide={() => setShowDeactivate(false)}
                onConfirm={(info) => {
                    onDeactivateUser?.(info)
                    setCurrentStatus('Deactivated')
                }}
            />
            <AdminUserSuspend
                show={showSuspend}
                user={user}
                onHide={() => setShowSuspend(false)}
                onConfirm={(info) => {
                    setCurrentStatus(info.action === 'unsuspend' ? 'Active' : 'Suspended')
                }}
            />
        </section>
    )
}