import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, getDoc, deleteDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import { AdminReviewDelete } from './AdminReviewDelete.jsx'

function formatDate(date) {
    if (!date) return '\u2014'
    return new Date(`${date}T00:00:00`).toLocaleDateString('en-US', {
        month: 'numeric',
        day: 'numeric',
        year: 'numeric',
    })
}

const reviewCategories = [
    'Cleanliness',
    'Pools & Attraction',
    'Facilities & Amenities',
    'Staff & Service',
    'Value for Money',
    'Safety',
]

function RatingStars({ rating = 0, label }) {
    return (
        <span className="d-inline-flex align-items-center gap-2" role="img" aria-label={`${label}: ${rating} out of 5 stars`}>
            {Array.from({ length: 5 }, (_, index) => (
                <i
                    key={index}
                    className={`bi ${index < rating ? 'bi-star-fill text-warning' : 'bi-star admin-review-detail-empty-starN'}`}
                    aria-hidden="true"
                />
            ))}
        </span>
    )
}

function ReviewRow({ label, children }) {
    return (
        <div className="d-flex justify-content-between align-items-center gap-3 py-2">
            <dt className="mb-0 fw-normal">{label}</dt>
            <dd className="mb-0 text-end">{children}</dd>
        </div>
    )
}

export function AdminReviewDetails({ review: initialReview, onBack, onDelete, preview = false }) {
    const { id: routeId } = useParams()
    const reviewId = initialReview?.id || routeId

    const [review, setReview] = useState(initialReview || null)
    const [loading, setLoading] = useState(!initialReview)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        if (!initialReview && reviewId) {
            async function fetchReview() {
                try {
                    setLoading(true)
                    const docRef = doc(db, 'reviews', reviewId)
                    const docSnap = await getDoc(docRef)
                    if (docSnap.exists()) {
                        setReview({ id: docSnap.id, ...docSnap.data() })
                    }
                } catch (err) {
                    console.error('Error fetching review details:', err)
                } finally {
                    setLoading(false)
                }
            }
            fetchReview()
        }
    }, [reviewId, initialReview])

    const handleDeleteConfirm = async (data) => {
        try {
            if (reviewId) {
                await deleteDoc(doc(db, 'reviews', reviewId))
            }
            if (onDelete) {
                onDelete(data)
            } else {
                navigate(preview ? '/admin-preview/reviews' : '/admin/reviews')
            }
        } catch (err) {
            console.error('Error deleting review:', err)
        }
    }

    if (loading) {
        return (
            <section className="container-fluid p-3 p-md-4 text-white text-center">
                <p>Loading review details...</p>
            </section>
        )
    }

    if (!review) {
        return (
            <section className="container-fluid p-3 p-md-4 text-white">
                <p>Review not found.</p>
                <button type="button" className="btn btn-outline-light btn-sm" onClick={onBack}>
                    Back to Reviews
                </button>
            </section>
        )
    }

    const breakdown = review.breakdown || {}

    return (
        <section className="container-fluid p-3 p-md-4 admin-review-detailN">
            <nav aria-label="Breadcrumb" className="mb-3">
                <ol className="breadcrumb small mb-0 align-items-center">
                    <li className="breadcrumb-item">
                        <button type="button" className="btn btn-link p-0 text-white text-decoration-none shadow-none" onClick={onBack}>Reviews</button>
                    </li>
                    <li className="breadcrumb-item active text-warning" aria-current="page">Review Details</li>
                </ol>
            </nav>

            <header className="card border-0 rounded-3 p-3 p-md-4 mb-3 admin-review-detail-summaryN">
                <div className="row align-items-center g-3">
                    <div className="col">
                        <div className="d-flex align-items-center gap-3">
                            <div className="rounded-circle bg-warning text-dark d-flex align-items-center justify-content-center flex-shrink-0 admin-review-detail-avatarN" aria-hidden="true">
                                {(review.guest || 'G').charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                                <h1 className="h2 mb-0">{review.guest || 'Guest'}</h1>
                                <p className="fs-5 text-warning mb-0">Review on: {review.property || 'Property'}</p>
                            </div>
                        </div>
                    </div>
                    <div className="col-12 col-md-auto text-md-end">
                        <span className="badge rounded-pill bg-warning text-dark px-4 py-2">{review.status}</span>
                    </div>
                </div>
            </header>

            <section className="border rounded-3 p-3 p-md-4 mb-3 admin-review-detail-panelN" aria-labelledby="review-details-heading">
                <h2 id="review-details-heading" className="h5 fw-bold mb-3">Review Details</h2>
                <dl className="mb-0">
                    <ReviewRow label="Client's Stay Date">{formatDate(review.stayStartDate)} - {formatDate(review.stayEndDate)}</ReviewRow>
                    <ReviewRow label="Date Posted">{formatDate(review.date)}</ReviewRow>
                    <ReviewRow label="Client's Overall Experience"><RatingStars rating={review.rating} label="Overall experience" /></ReviewRow>
                </dl>
            </section>

            <section className="border rounded-3 p-3 p-md-4 mb-3 admin-review-detail-panelN" aria-labelledby="review-breakdown-heading">
                <h2 id="review-breakdown-heading" className="h5 fw-bold mb-3">Review Breakdown</h2>
                <dl className="mb-0">
                    {reviewCategories.map((category) => (
                        <ReviewRow key={category} label={category}>
                            <RatingStars rating={breakdown[category] || 0} label={category} />
                        </ReviewRow>
                    ))}
                </dl>
            </section>

            <section className="border rounded-3 p-3 p-md-4 mb-3 admin-review-detail-panelN" aria-labelledby="review-comment-heading">
                <h2 id="review-comment-heading" className="h5 fw-bold mb-3">Comment</h2>
                <div className="form-control admin-review-detail-commentN" role="textbox" aria-readonly="true">{review.comment || '\u2014'}</div>
            </section>

            <div className="d-flex flex-wrap justify-content-end gap-3">
                <button type="button" className="btn btn-warning rounded-pill admin-user-account-buttonN" onClick={() => setShowDeleteModal(true)}>Delete Comment</button>
            </div>
            <AdminReviewDelete show={showDeleteModal} review={review} onHide={() => setShowDeleteModal(false)} onConfirm={handleDeleteConfirm} />
        </section>
    )
}