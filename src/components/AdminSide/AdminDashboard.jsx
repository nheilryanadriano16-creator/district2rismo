import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../../firebase'
import resortImage from '../../images/Bustos Hero.png'
import { resolveUploadUrl } from '../../utils/uploads'

export function AdminDashboard() {
    const navigate = useNavigate()
    const [usersCount, setUsersCount] = useState(0)
    const [hostsCount, setHostsCount] = useState(0)
    const [propertiesCount, setPropertiesCount] = useState(0)
    const [popularResorts, setPopularResorts] = useState([
    ])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchDashboardData() {
            try {
                setLoading(true)
                
                const [usersSnap, propertiesSnap, bookingsSnap] = await Promise.all([
                    getDocs(collection(db, 'users')),
                    getDocs(collection(db, 'properties')),
                    getDocs(collection(db, 'bookings')),
                ])
                const usersList = usersSnap.docs.map(doc => doc.data())
                const hosts = usersList.filter(
                    (user) => String(user.role || '').trim().toLowerCase() === 'host'
                ).length
                const customers = usersList.filter((user) => {
                    const role = String(user.role || 'customer').trim().toLowerCase()
                    return role !== 'host' && role !== 'admin'
                }).length
                setUsersCount(customers)
                setHostsCount(hosts)

                const listedProperties = propertiesSnap.docs.filter((propertyDoc) =>
                    ['approved', 'active'].includes(
                        String(propertyDoc.data().status || '').trim().toLowerCase()
                    )
                )
                setPropertiesCount(listedProperties.length)

                if (!propertiesSnap.empty) {
                    const props = propertiesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))

                    const bookingCounts = new Map()
                    bookingsSnap.docs.forEach((bookingDoc) => {
                        const booking = bookingDoc.data()
                        if (!['confirmed', 'accepted', 'paid'].includes(String(booking.status || '').toLowerCase())) return

                        const propertyId = booking.propertyId
                            || booking.propertyUid
                            || booking.placeId
                            || booking.listingId
                            || booking.resortId
                            || booking.property?.id
                        const propertyName = booking.propertyName
                            || booking.resortName
                            || (typeof booking.property === 'string' ? booking.property : booking.property?.name)
                            || (typeof booking.resort === 'string' ? booking.resort : '')
                        const key = propertyId ? `id:${propertyId}` : `name:${propertyName.trim().toLowerCase()}`
                        if (key !== 'name:') bookingCounts.set(key, (bookingCounts.get(key) || 0) + 1)
                    })

                    const topProps = props
                        .filter((property) => ['approved', 'active'].includes(String(property.status || '').toLowerCase()))
                        .map((property) => {
                            const bookingCount = bookingCounts.get(`id:${property.id}`)
                                || bookingCounts.get(`name:${String(property.name || property.title || '').trim().toLowerCase()}`)
                                || 0
                            const image = resolveUploadUrl(
                                property.image
                                || property.imageUrl
                                || property.images?.[0]
                                || property.mediaPhotos?.cover?.[0]?.url
                                || property.mediaPhotos?.cover?.[0]?.preview
                                || property.media?.cover?.[0]?.url
                            ) || resortImage

                            return {
                                id: property.id,
                                property,
                                name: property.name || property.title || 'Resort',
                                location: property.location || property.municipality || 'Bustos, Bulacan',
                                bookingCount: Math.max(bookingCount, Number(property.totalReservations) || 0),
                                image,
                            }
                        })
                        .sort((a, b) => b.bookingCount - a.bookingCount || a.name.localeCompare(b.name))
                        .slice(0, 3)

                    setPopularResorts(topProps)
                } else {
                    setPropertiesCount(0)
                    setPopularResorts([])
                }
            } catch (err) {
                console.error('Error fetching dashboard metrics:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchDashboardData()
    }, [])

    const stats = [
        { label: <>2Rismo<br />Users</>, value: usersCount.toLocaleString(), section: 'Users' },
        { label: <>2Rismo<br />Hosts</>, value: hostsCount.toLocaleString(), section: 'Hosts' },
        { label: <>Listed<br />Property</>, value: propertiesCount.toLocaleString(), section: 'Property Management' },
    ]

    return (
        <main className="admin-dashboardN container-fluid p-3 p-md-4">
            <div className="row">
                <div className="col-12 ">
                    <h1 className="h2 fw-bold mb-4">Dashboard</h1>

                    <div className="row g-3 mb-4">
                        {stats.map((stat, index) => (
                            <div className="col-12 col-sm-6 col-lg-4" key={stat.value + index}>
                                <article
                                    className={`admin-statN h-100 rounded-3 p-3 ${index === 0 ? 'active' : ''}`}
                                    role="button"
                                    tabIndex={0}
                                    aria-label={`Open ${stat.section}`}
                                    onClick={() => navigate('/admin', { state: { section: stat.section } })}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter' || event.key === ' ') {
                                            event.preventDefault()
                                            navigate('/admin', { state: { section: stat.section } })
                                        }
                                    }}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className="d-flex justify-content-between align-items-start">
                                        <h2 className="h6 fw-semibold mb-2">{stat.label}</h2>
                                        <span className="admin-stat-iconN rounded-circle d-flex align-items-center justify-content-center">
                                            <i className="bi bi-arrow-up-right" aria-hidden="true" />
                                        </span>
                                    </div>
                                    <p className="admin-stat-valueN fw-semibold mb-0">{stat.value}</p>
                                </article>
                            </div>
                        ))}
                    </div>

                    <section className="admin-popularN rounded-3 p-3" aria-labelledby="popular-resorts-heading">
                        <h2 id="popular-resorts-heading" className="h6 fw-semibold mb-2">
                            Most Popular Private Resorts
                        </h2>

                        <div className="d-flex flex-column gap-3">
                            {popularResorts.map((resort, index) => (
                                <article className="admin-resortN rounded-3 p-2" key={resort.id || `${resort.name}-${index}`}>
                                    <div className="row align-items-center g-2">
                                        <div className="col-auto d-flex align-items-center justify-content-center" style={{ width: '45px' }}>
                                            <span className="admin-resort-rank fw-semibold text-center">{index + 1}</span>
                                        </div>
                                        <div className="col-auto">
                                            <img
                                                className="admin-resort-imageN rounded-2"
                                                src={resort.image}
                                                alt=""
                                            />
                                        </div>
                                        <div className="col">
                                            <h3 className="h6 mb-0">{resort.name}</h3>
                                            <p className="text-warning mb-0">{resort.location}</p>
                                        </div>
                                        <div className="col-auto">
                                            <span className="small text-warning me-3">
                                                {resort.bookingCount} confirmed {resort.bookingCount === 1 ? 'booking' : 'bookings'}
                                            </span>
                                            <button
                                                type="button"
                                                className="btn btn-link btn-sm text-warning p-0"
                                                onClick={() => navigate(`/admin/properties/${encodeURIComponent(resort.id)}`, {
                                                    state: { property: resort.property },
                                                })}
                                            >
                                                View Details
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            ))}
                            {!loading && popularResorts.length === 0 && (
                                <p className="text-secondary mb-0">No approved resorts yet.</p>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </main>
    )
}