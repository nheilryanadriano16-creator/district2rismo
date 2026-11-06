import { useState, useEffect } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../../firebase'

const filters = ['All', 'Verified', 'Unverified']

export function AdminHost({ onViewDetails }) {
    const [hosts, setHosts] = useState([])
    const [loading, setLoading] = useState(true)
    const [errorMsg, setErrorMsg] = useState(null)
    const [activeFilter, setActiveFilter] = useState('All')
    const [search, setSearch] = useState('')

    useEffect(() => {
        const fetchHosts = async () => {
            try {
                setLoading(true)
                const querySnapshot = await getDocs(collection(db, 'users'))

                const hostList = querySnapshot.docs
                    .map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }))
                    .filter(user => user.role === 'host')

                setHosts(hostList)
            } catch (err) {
                console.error('Error fetching hosts from Firestore:', err)
                setErrorMsg(err.message)
            } finally {
                setLoading(false)
            }
        }
        fetchHosts()
    }, [])

    const filteredHosts = hosts.filter((host) => {
        const displayName = host?.firstName && host?.lastName
            ? `${host.firstName} ${host.lastName}`
            : host?.name || host?.email || '';
        const hostStatus = host?.status || 'Verified';

        const matchesFilter = activeFilter === 'All' || hostStatus === activeFilter
        const query = search.trim().toLowerCase()
        const matchesSearch =
            displayName.toLowerCase().includes(query) ||
            (host?.email && host.email.toLowerCase().includes(query))

        return matchesFilter && matchesSearch
    })

    return (
        <section className="admin-hostsN container-fluid p-3 p-md-4">
            <h1 className="h2 fw-bold mb-4">Hosts</h1>

            <div className="row align-items-center g-3 mb-4">
                <div className="col-12 col-xl-8">
                    <div className="d-flex flex-wrap gap-2" role="group" aria-label="Filter hosts">
                        {filters.map((filter) => (
                            <button
                                key={filter}
                                type="button"
                                className={`btn admin-host-filterN ${activeFilter === filter ? 'active' : ''}`}
                                aria-pressed={activeFilter === filter}
                                onClick={() => setActiveFilter(filter)}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="col-12 col-xl-4">
                    <div className="input-group admin-host-searchN">
                        <input
                            type="search"
                            className="form-control"
                            placeholder="Search Host"
                            aria-label="Search hosts"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />
                        <span className="input-group-text">
                            <i className="bi bi-search" aria-hidden="true" />
                        </span>
                    </div>
                </div>
            </div>

            <p className="small mb-2 text-white">{filteredHosts.length} Hosts</p>

            {loading ? (
                <p className="text-white text-center py-4">Loading hosts from database...</p>
            ) : errorMsg ? (
                <p className="text-danger text-center py-4">Error loading hosts: {errorMsg}</p>
            ) : (
                <div className="d-flex flex-column gap-2">
                    {filteredHosts.map((host) => {
                        const displayName = host?.firstName && host?.lastName
                            ? `${host.firstName} ${host.lastName}`
                            : host?.name || (host?.email ? host.email.split('@')[0] : 'Host');
                        const hostStatus = host?.status || 'Verified';

                        return (
                            <article
                                className="admin-host-rowN row align-items-center g-2 rounded-3 p-2"
                                key={host.id}
                            >
                                <div className="col-auto">
                                    <span className="admin-host-avatarN rounded-circle d-flex align-items-center justify-content-center">
                                        {displayName.charAt(0).toUpperCase()}
                                    </span>
                                </div>

                                <div className="col">
                                    <h2 className="h6 mb-0 text-white">{displayName}</h2>
                                    <p className="small text-warning mb-0">{host?.email || '—'}</p>
                                </div>

                                <div className="col-12 col-sm-auto col-md-3 text-sm-center">
                                    <span
                                        className={`badge rounded-pill admin-property-statusN ${hostStatus === 'Verified' ? 'verified' : ''
                                            }`}
                                    >
                                        {hostStatus}
                                    </span>
                                </div>

                                <div className="col-12 col-sm-auto text-sm-end">
                                    <button
                                        type="button"
                                        className="btn admin-host-detailsN"
                                        onClick={() => onViewDetails?.(host)}
                                    >
                                        View Details
                                    </button>
                                </div>
                            </article>
                        )
                    })}

                    {filteredHosts.length === 0 && (
                        <p className="text-white text-center py-4 mb-0">No hosts found with role 'host'.</p>
                    )}
                </div>
            )}
        </section>
    )
}