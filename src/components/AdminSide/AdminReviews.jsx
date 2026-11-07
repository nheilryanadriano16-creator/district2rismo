import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../../firebase'

const filters = ['All', 'Active', 'Reported']

function formatReviewDate(value) {
    if (!value) return ''

    const date = typeof value.toDate === 'function' ? value.toDate() : new Date(value)
    if (Number.isNaN(date.getTime())) return ''

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

export function AdminReviews({ onReviewAction, preview = false }) {
    const [reviews, setReviews] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeFilter, setActiveFilter] = useState('All')
    const [selectedProperty, setSelectedProperty] = useState('')
    const [selectedDate, setSelectedDate] = useState('')
    const [search, setSearch] = useState('')
    const navigate = useNavigate()

    useEffect(() => {
        async function fetchReviews() {
            try {
                setLoading(true)
                const [reviewsSnapshot, usersSnapshot, propertiesSnapshot] = await Promise.all([
                    getDocs(collection(db, 'reviews')),
                    getDocs(collection(db, 'users')),
                    getDocs(collection(db, 'properties')),
                ])
                const usersById = new Map(usersSnapshot.docs.map((userDoc) => [userDoc.id, userDoc.data()]))
                const usersByEmail = new Map(
                    usersSnapshot.docs
                        .map((userDoc) => [String(userDoc.data().email || '').toLowerCase(), userDoc.data()])
                        .filter(([email]) => email)
                )
                const propertiesById = new Map(
                    propertiesSnapshot.docs.map((propertyDoc) => [propertyDoc.id, propertyDoc.data()])
                )
                const loadedReviews = reviewsSnapshot.docs.map((reviewDoc) => {
                    const data = reviewDoc.data()
                    const user = usersById.get(data.userId)
                        || usersByEmail.get(String(data.userEmail || data.email || '').toLowerCase())
                    const profileName = [user?.firstName, user?.lastName].filter(Boolean).join(' ')
                    const propertyData = propertiesById.get(data.propertyId)

                    return {
                        ...data,
                        id: reviewDoc.id,
                        guest: data.guest
                            || data.guestName
                            || profileName
                            || user?.name
                            || data.userEmail
                            || data.email
                            || 'Guest',
                        property: (typeof data.property === 'string' ? data.property : data.property?.name)
                            || data.propertyName
                            || data.resort
                            || data.resortName
                            || propertyData?.name
                            || 'Property',
                        status: data.status || 'Active',
                        date: formatReviewDate(data.date || data.createdAt),
                    }
                })
                setReviews(loadedReviews)
            } catch (err) {
                console.error('Error fetching reviews:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchReviews()
    }, [])

    const properties = [...new Set(reviews.map((review) => review.property).filter(Boolean))]

    const filteredReviews = reviews.filter((review) => {
        const query = search.trim().toLowerCase()

        return (
            (activeFilter === 'All' || review.status === activeFilter) &&
            (!selectedProperty || review.property === selectedProperty) &&
            (!selectedDate || review.date === selectedDate) &&
            (!query ||
                review.id.toLowerCase().includes(query) ||
                (review.guest || '').toLowerCase().includes(query) ||
                (review.property || '').toLowerCase().includes(query))
        )
    })

    return (
        <section className="admin-reviewsN container-fluid p-3 p-md-4">
            <div className="row align-items-center g-3 mb-4">
                <div className="col">
                    <h1 className="h2 fw-bold mb-0">Reviews</h1>
                </div>

                <div className="col-12 col-md-auto">
                    <select
                        className="form-select admin-review-propertyN"
                        aria-label="Select property"
                        value={selectedProperty}
                        onChange={(event) => setSelectedProperty(event.target.value)}
                    >
                        <option value="">Select Property</option>
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
                        aria-label="Filter reviews"
                    >
                        {filters.map((filter) => (
                            <button
                                key={filter}
                                type="button"
                                className={`btn admin-review-filterN ${
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
                        <label className="btn admin-review-dateN position-relative mb-0">
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

                        <div className="input-group admin-review-searchN">
                            <input
                                type="search"
                                className="form-control"
                                placeholder="Search Booking"
                                aria-label="Search reviews"
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
                    <p className="text-center py-4">Loading reviews...</p>
                ) : (
                    <table className="table table-borderless align-middle admin-review-tableN">
                        <thead>
                            <tr>
                                <th scope="col">Guest</th>
                                <th scope="col">Property</th>
                                <th scope="col">Rating</th>
                                <th scope="col">Status</th>
                                <th scope="col">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredReviews.map((review) => (
                                <tr key={review.id}>
                                    <td>{review.guest}</td>
                                    <td>{review.property}</td>
                                    <td>
                                        <span aria-label={`Rating ${review.rating} out of 5`}>
                                            {Array.from({ length: 5 }, (_, index) => (
                                                <i
                                                    key={index}
                                                    className={`bi ${
                                                        index < review.rating
                                                            ? 'bi-star-fill'
                                                            : 'bi-star'
                                                    } ${index < review.rating ? 'text-warning' : ''} me-1`}
                                                    aria-hidden="true"
                                                />
                                            ))}
                                        </span>
                                    </td>
                                    <td>{review.status}</td>
                                    <td>
                                        <button
                                            type="button"
                                            className="btn btn-link admin-review-actionN p-0"
                                            onClick={() => onReviewAction ? onReviewAction(review) : navigate(`${preview ? "/admin-preview" : "/admin"}/reviews/${encodeURIComponent(review.id)}`, { state: { review } })}
                                        >
                                            {review.status === 'Reported' ? 'Review' : 'View'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {!loading && filteredReviews.length === 0 && (
                    <p className="text-center py-4 mb-0">
                        No reviews match your filters.
                    </p>
                )}
            </div>
        </section>
    )
}