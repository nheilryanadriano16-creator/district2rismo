import { useEffect, useState } from 'react'
import Modal from 'react-bootstrap/Modal'
import { useAuth } from '../../context/AuthContext'
import { fetchHostProperties, fetchHostReviews, reportHostReview, summarizeReviews } from '../../utils/hostData'
import { useNotification } from '../../context/NotificationContext'

const reportReasons = [
    'Inappropriate or offensive content',
    'Spam or advertising',
    'False or misleading information',
    'Other',
]

const Stars = ({ rating, label }) => (
    <span className="d-inline-flex align-items-center gap-1" aria-label={label}>
        {[1, 2, 3, 4, 5].map((star) => (
            <i key={star} className={`bi ${star <= rating ? 'bi-star-fill text-warning' : 'bi-star text-secondary'}`} aria-hidden="true" />
        ))}
    </span>
)

export const HostReviewsN = ({ onReportReview }) => {
    const { currentUser } = useAuth()
    const { showNotification } = useNotification()
    const [reviews, setReviews] = useState([])
    const [reviewToReport, setReviewToReport] = useState(null)
    const [reportReason, setReportReason] = useState('')
    const [reportDetails, setReportDetails] = useState('')
    const [submittingReport, setSubmittingReport] = useState(false)
    const [summary, setSummary] = useState({
        total: 0,
        average: 0,
        distribution: [5, 4, 3, 2, 1].map((stars) => ({ stars, percent: 0 })),
        breakdown: [
            { label: 'Cleanliness', rating: 0 },
            { label: 'Pools & Attractions', rating: 0 },
            { label: 'Facilities & Amenities', rating: 0 },
            { label: 'Staff & Service', rating: 0 },
            { label: 'Value for Money', rating: 0 },
            { label: 'Safety', rating: 0 },
        ],
    })

    const loadReviews = async () => {
        if (!currentUser?.uid) return
        const properties = await fetchHostProperties(currentUser.uid, { email: currentUser.email })
        const loaded = await fetchHostReviews(currentUser.uid, properties)
        setReviews(loaded)
        setSummary(summarizeReviews(loaded))
    }

    useEffect(() => {
        loadReviews().catch((error) => console.error('Error loading host reviews:', error))
    }, [currentUser])

    const closeReportModal = () => {
        if (submittingReport) return
        setReviewToReport(null)
        setReportReason('')
        setReportDetails('')
    }

    const handleReport = async (event) => {
        event.preventDefault()
        if (!reviewToReport || !reportReason || !reportDetails.trim()) return

        try {
            setSubmittingReport(true)
            await reportHostReview(reviewToReport.id, currentUser?.uid, {
                reason: reportReason,
                details: reportDetails.trim(),
            })
            const reportedReview = { ...reviewToReport, status: 'Reported' }
            setReviews((currentReviews) => currentReviews.map((review) => (
                review.id === reportedReview.id ? reportedReview : review
            )))
            onReportReview?.(reportedReview)
            showNotification('Review reported to admin.', 'success')
            setReviewToReport(null)
            setReportReason('')
            setReportDetails('')
        } catch (error) {
            console.error('Error reporting review:', error)
            showNotification('Could not report this review.', 'danger')
        } finally {
            setSubmittingReport(false)
        }
    }

    return (
    <section className="host-reviewsN container-fluid p-3 p-md-4">
        <div className="host-reviews-contentN">
            <h1 className="h2 fw-bold text-warning mb-4">Reviews</h1>

            <div className="d-flex align-items-center gap-4 mb-5">
                <div className="d-flex align-items-center gap-3">
                    <i className="bi bi-star-fill text-warning host-overall-starN" aria-hidden="true" />
                    <div className="text-center">
                        <div className="h2 fw-bold mb-0">{summary.average.toFixed(1)}</div>
                        <small className="text-secondary">{summary.total} reviews</small>
                    </div>
                </div>

                <div className="flex-grow-1">
                    {summary.distribution.map(({ stars, percent }) => (
                        <div key={stars} className="d-flex align-items-center gap-2 host-rating-distribution-rowN">
                            <small>{stars}</small>
                            <div className="progress flex-grow-1 host-rating-progressN" role="progressbar" aria-label={`${stars} star ratings`} aria-valuenow={percent} aria-valuemin="0" aria-valuemax="100">
                                <div className="progress-bar" style={{ width: `${percent}%` }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <h2 className="h6 fw-bold mb-3">Rating Breakdown</h2>

            <div className="mb-4">
                {summary.breakdown.map(({ label, rating }) => (
                    <div key={label} className="d-flex align-items-center gap-2 host-rating-breakdown-rowN">
                        <span className="flex-grow-1">{label}</span>
                        <small>{rating.toFixed(1)}</small>
                        <div className="progress host-breakdown-progressN" role="progressbar" aria-label={`${label}: ${rating} out of 5`} aria-valuenow={rating * 20} aria-valuemin="0" aria-valuemax="100">
                            <div className="progress-bar" style={{ width: `${rating * 20}%` }} />
                        </div>
                    </div>
                ))}
            </div>

            <div className="vstack gap-2 host-review-listN" aria-label="Guest reviews">
                {reviews.map((review) => (
                    <article key={review.id} className="card border-0 rounded-3 host-review-cardN">
                        <div className="card-body p-3">
                            <div className="d-flex align-items-center gap-2 mb-2">
                                <span className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0 host-review-avatarN">
                                    {review.guest.charAt(0)}
                                </span>
                                <h3 className="h6 mb-0 text-nowrap">{review.guest}</h3>
                                <Stars rating={review.rating} label={`${review.rating} out of 5 stars`} />
                                <small className="text-secondary text-nowrap">{review.date}</small>
                                <button
                                    type="button"
                                    className="btn btn-warning btn-sm rounded-pill ms-auto px-3"
                                    onClick={() => setReviewToReport(review)}
                                    disabled={String(review.status || '').toLowerCase() === 'reported'}
                                >
                                    {String(review.status || '').toLowerCase() === 'reported'
                                        ? 'Reported'
                                        : <>Report <i className="bi bi-flag-fill ms-1" aria-hidden="true" /></>}
                                </button>
                            </div>
                            <p className="small mb-0 host-review-commentN">{review.comment}</p>
                        </div>
                    </article>
                ))}
                {reviews.length === 0 && (
                    <p className="small text-secondary mb-0">No reviews yet for your properties.</p>
                )}
            </div>
        </div>
        <Modal
            show={Boolean(reviewToReport)}
            onHide={closeReportModal}
            centered
            dialogClassName="admin-suspend-dialogN"
            contentClassName="admin-suspend-modalN host-review-report-modalN admin-themed-modalN"
            aria-labelledby="host-review-report-title"
        >
            <button type="button" className="admin-suspend-closeN" aria-label="Close" onClick={closeReportModal} disabled={submittingReport}>
                <i className="bi bi-x-lg" aria-hidden="true" />
            </button>
            <form onSubmit={handleReport}>
                <Modal.Body className="admin-suspend-bodyN text-white">
                    <h2 id="host-review-report-title" className="admin-suspend-titleN text-center fw-bold text-white mb-3">
                        Report Review
                    </h2>
                    <p className="text-center text-white mb-4">
                        Tell us why you are reporting {reviewToReport?.guest || 'this guest'}&apos;s review.
                    </p>
                    <label className="form-label text-white" htmlFor="host-review-report-reason">
                        Reason for Report
                    </label>
                    <select
                        id="host-review-report-reason"
                        className="form-select host-review-report-controlN mb-3"
                        value={reportReason}
                        onChange={(event) => setReportReason(event.target.value)}
                        required
                        disabled={submittingReport}
                    >
                        <option value="" disabled>Select a reason</option>
                        {reportReasons.map((reason) => (
                            <option key={reason} value={reason}>{reason}</option>
                        ))}
                    </select>
                    <label className="form-label text-white" htmlFor="host-review-report-details">
                        Additional Details
                    </label>
                    <textarea
                        id="host-review-report-details"
                        className="form-control host-review-report-controlN mb-4"
                        rows={4}
                        value={reportDetails}
                        onChange={(event) => setReportDetails(event.target.value)}
                        placeholder="Provide details to help us review your report."
                        maxLength={1000}
                        required
                        disabled={submittingReport}
                    />
                    <div className="d-flex flex-column flex-sm-row justify-content-center gap-2">
                        <button type="button" className="btn admin-suspend-cancelN" onClick={closeReportModal} disabled={submittingReport}>
                            Cancel
                        </button>
                        <button type="submit" className="btn admin-suspend-confirmN" disabled={submittingReport}>
                            {submittingReport ? 'Submitting...' : 'Submit Report'}
                        </button>
                    </div>
                </Modal.Body>
            </form>
        </Modal>
    </section>
    )
}
