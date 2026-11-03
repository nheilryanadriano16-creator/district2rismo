import { useState, useEffect } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../../firebase'
import resortImage from '../../images/Bustos Hero.png'

export function AdminDashboard() {
    const [usersCount, setUsersCount] = useState(10000)
    const [hostsCount, setHostsCount] = useState(5000)
    const [propertiesCount, setPropertiesCount] = useState(26)
    const [popularResorts, setPopularResorts] = useState([
    ])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchDashboardData() {
            try {
                setLoading(true)
                
                const usersSnap = await getDocs(collection(db, 'users'))
                if (!usersSnap.empty) {
                    const usersList = usersSnap.docs.map(doc => doc.data())
                    const totalUsers = usersList.length
                    const hosts = usersList.filter(u => u.role === 'host').length
                    setUsersCount(totalUsers)
                    setHostsCount(hosts)
                }

                const propertiesSnap = await getDocs(collection(db, 'properties'))
                if (!propertiesSnap.empty) {
                    const props = propertiesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
                    setPropertiesCount(props.length)
                    
                    const topProps = props.slice(0, 3).map(p => ({
                        name: p.name || p.title || 'Resort',
                        location: p.location || 'Bustos, Bulacan'
                    }))
                    if (topProps.length > 0) {
                        setPopularResorts(topProps)
                    }
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
        { label: <>2Rismo<br />Users</>, value: usersCount.toLocaleString() },
        { label: <>2Rismo<br />Hosts</>, value: hostsCount.toLocaleString() },
        { label: <>Listed<br />Property</>, value: propertiesCount.toLocaleString() },
    ]

    return (
        <main className="admin-dashboardN container-fluid p-3 p-md-4">
            <div className="row">
                <div className="col-12 ">
                    <h1 className="h2 fw-bold mb-4">Dashboard</h1>

                    <div className="row g-3 mb-4">
                        {stats.map((stat, index) => (
                            <div className="col-12 col-sm-6 col-lg-4" key={stat.value + index}>
                                <article className={`admin-statN h-100 rounded-3 p-3 ${index === 0 ? 'active' : ''}`}>
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
                                <article className="admin-resortN rounded-3 p-2" key={`${resort.name}-${index}`}>
                                    <div className="row align-items-center g-2">
                                        <div className="col-auto d-flex align-items-center justify-content-center" style={{ width: '45px' }}>
                                            <span className="admin-resort-rank fw-semibold text-center">{index + 1}</span>
                                        </div>
                                        <div className="col-auto">
                                            <img
                                                className="admin-resort-imageN rounded-2"
                                                src={resortImage}
                                                alt=""
                                            />
                                        </div>
                                        <div className="col">
                                            <h3 className="h6 mb-0">{resort.name}</h3>
                                            <p className="text-warning mb-0">{resort.location}</p>
                                        </div>
                                        <div className="col-auto">
                                            <span className="small text-warning text-decoration-underline">
                                                View Details
                                            </span>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </main>
    )
}