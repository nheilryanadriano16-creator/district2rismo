import { useState, useEffect } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../../firebase'

const filters = ['All', 'Active', 'Suspended', 'Deactivated']

export function AdminUsers({ onViewDetails }) {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeFilter, setActiveFilter] = useState('All')
    const [search, setSearch] = useState('')

    useEffect(() => {
        async function fetchUsers() {
            try {
                setLoading(true)
                const [usersSnap, reservationsSnap] = await Promise.all([
                    getDocs(collection(db, 'users')),
                    getDocs(collection(db, 'reservations'))
                ])

                const loadedUsers = usersSnap.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }))

                const reservations = reservationsSnap.docs.map(doc => doc.data())

                const activeUserEmailsOrNames = new Set()
                reservations.forEach(res => {
                    if (res.email) activeUserEmailsOrNames.add(res.email.toLowerCase().trim())
                    if (res.guest) activeUserEmailsOrNames.add(res.guest.toLowerCase().trim())
                })

                const regularUsers = loadedUsers.filter(user => {
                    const role = (user.role || '').toLowerCase()
                    if (role === 'host' || role === 'admin') return false

                    const email = (user.email || '').toLowerCase().trim()
                    const name = `${user.firstName || ''} ${user.lastName || ''}`.trim().toLowerCase()
                    const uname = (user.name || '').toLowerCase().trim()

                    return (
                        (email && activeUserEmailsOrNames.has(email)) ||
                        (name && activeUserEmailsOrNames.has(name)) ||
                        (uname && activeUserEmailsOrNames.has(uname)) ||
                        activeUserEmailsOrNames.size === 0
                    )
                })

                setUsers(regularUsers.length > 0 ? regularUsers : loadedUsers.filter(u => (u.role || '').toLowerCase() !== 'host' && (u.role || '').toLowerCase() !== 'admin'))
            } catch (err) {
                console.error('Error fetching users:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchUsers()
    }, [])

    const filteredUsers = users.filter((user) => {
        const matchesFilter = activeFilter === 'All' || user.status === activeFilter
        const queryText = search.toLowerCase()

        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim().toLowerCase()
        const userName = (user.name || '').toLowerCase()
        const userEmail = (user.email || '').toLowerCase()

        const matchesSearch =
            fullName.includes(queryText) ||
            userName.includes(queryText) ||
            userEmail.includes(queryText)

        return matchesFilter && matchesSearch
    })

    return (
        <section className="admin-usersN container-fluid p-3 p-md-4">
            <h1 className="h2 fw-bold mb-4">Users</h1>

            <div className="row align-items-center g-3 mb-4">
                <div className="col-12 col-xl-8">
                    <div className="d-flex flex-wrap gap-2" role="group" aria-label="Filter users">
                        {filters.map((filter) => (
                            <button
                                key={filter}
                                type="button"
                                className={`btn admin-user-filterN ${activeFilter === filter ? 'active' : ''}`}
                                aria-pressed={activeFilter === filter}
                                onClick={() => setActiveFilter(filter)}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="col-12 col-xl-4">
                    <div className="input-group admin-users-searchN">
                        <input
                            type="search"
                            className="form-control"
                            placeholder="Search User"
                            aria-label="Search users"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />
                        <span className="input-group-text">
                            <i className="bi bi-search" aria-hidden="true" />
                        </span>
                    </div>
                </div>
            </div>

            <p className="small mb-2">{users.length} Users Total</p>

            {loading ? (
                <div className="text-center py-5 text-white">Loading users...</div>
            ) : (
                <div className="d-flex flex-column gap-2">
                    {filteredUsers.map((user) => {
                        const displayName = user.firstName && user.lastName
                            ? `${user.firstName} ${user.lastName}`
                            : user.name || (user.email ? user.email.split('@')[0] : 'Unnamed User');

                        return (
                            <article
                                key={user.id || user.email}
                                className="admin-user-rowN row align-items-center g-2 rounded-3 p-2"
                            >
                                <div className="col-auto">
                                    <span className="admin-user-avatarN rounded-circle d-flex align-items-center justify-content-center">
                                        {displayName.charAt(0).toUpperCase()}
                                    </span>
                                </div>

                                <div className="col">
                                    <h2 className="h6 mb-0">{displayName}</h2>
                                    <p className="small text-warning mb-0">{user.email}</p>
                                </div>

                                <div className="col-12 col-sm-auto col-md-3 text-sm-center">
                                    <span
                                        className={`badge rounded-pill admin-property-statusN ${['active', 'verified'].includes((user?.status || 'Active').toLowerCase()) ? 'active' : ''
                                            }`}
                                    >
                                        {user?.status || 'Active'}
                                    </span>
                                </div>

                                <div className="col-12 col-sm-auto text-sm-end">
                                    <button
                                        type="button"
                                        className="btn admin-user-detailsN"
                                        onClick={() => onViewDetails({ ...user, name: displayName })}
                                    >
                                        View Details
                                    </button>
                                </div>
                            </article>
                        );
                    })}

                    {filteredUsers.length === 0 && (
                        <p className="text-center py-4 mb-0 text-white">No users match your search.</p>
                    )}
                </div>
            )}
        </section>
    )
}