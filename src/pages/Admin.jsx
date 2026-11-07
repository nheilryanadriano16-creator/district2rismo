import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { AdminDashboard } from '../components/AdminSide/AdminDashboard.jsx'
import { AdminSidebar } from '../components/AdminSide/AdminSidebar.jsx'
import { AdminNavbar } from '../components/AdminSide/AdminNavbar.jsx'
import { AdminUsers } from '../components/AdminSide/AdminUsers.jsx'
import { AdminHost } from '../components/AdminSide/AdminHost.jsx'
import { AdminUserViewDetail } from './AdminUserViewDetail.jsx'
import { AdminProperties } from '../components/AdminSide/AdminProperties.jsx'
import { AdminReservation } from '../components/AdminSide/AdminReservation.jsx'
import { AdminReviews } from '../components/AdminSide/AdminReviews.jsx'
import { AdminReports } from '../components/AdminSide/AdminReports.jsx'
import { AdminCategories } from '../components/AdminSide/AdminCategories.jsx'
import { AdminSetting } from '../components/AdminSide/AdminSetting.jsx'
import { AdminHelp } from '../components/AdminSide/AdminHelp.jsx'
import { AdminHostDetails } from '../components/AdminSide/AdminHostDetails.jsx'

export function Admin({ preview = false }) {
    const navigate = useNavigate()
    const { currentUser, userRole, loading } = useAuth()
    const { state: routeState, key: locationKey } = useLocation()
    const [activeSection, setActiveSection] = useState(routeState?.section || 'Dashboard')
    const [selectedUser, setSelectedUser] = useState(null)
    const [selectedHost, setSelectedHost] = useState(null)
    
    useEffect(() => {
        if (!preview && !loading) {
            if (!currentUser || userRole !== 'admin') {
                navigate('/login', { replace: true })
            }
        }
    }, [currentUser, userRole, loading, preview, navigate])

    useEffect(() => {
        if (routeState?.section) {
            setActiveSection(routeState.section)
            setSelectedUser(null)
            setSelectedHost(null)
        }
    }, [locationKey, routeState?.section])

    const handleSectionChange = (section) => {
        setActiveSection(section)
        setSelectedUser(null)
        setSelectedHost(null)
    }

    if (loading && !preview) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100 bg-dark text-white">
                <div className="spinner-border text-warning" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        )
    }

    if (activeSection === 'Users' && selectedUser) {
        return (
            <AdminUserViewDetail
                user={selectedUser}
                onBack={() => setSelectedUser(null)}
                activeSection={activeSection}
                onSelect={handleSectionChange}
            />
        )
    }

    if (activeSection === 'Hosts' && selectedHost) {
        return (
            <AdminHostDetails
                host={selectedHost}
                onBack={() => setSelectedHost(null)}
                preview={preview}
            />
        )
    }

    return (
        <div className="admin-shellN">
            <AdminNavbar
                activeSection={activeSection}
                onSelect={handleSectionChange}
                preview={preview}
            />

            <main className="container-fluid px-0">
                <div className="row g-0 admin-workspaceN">
                    <div className="col-12 col-lg-3 d-none d-lg-block">
                        <AdminSidebar
                            activeSection={activeSection}
                            onSelect={handleSectionChange}
                        />
                    </div>

                    <div className="col-12 col-lg-9 admin-content-scrollN">
                        {activeSection === 'Dashboard' ? (
                            <AdminDashboard />
                        ) : activeSection === 'Users' ? (
                            selectedUser ? (
                                <AdminUserViewDetail
                                    user={selectedUser}
                                    onBack={() => setSelectedUser(null)}
                                />
                            ) : (
                                <AdminUsers onViewDetails={setSelectedUser} />
                            )
                        ) : activeSection === 'Hosts' ? (
                            <AdminHost onViewDetails={setSelectedHost} />
                        ) : activeSection === 'Property Management' ? (
                            <AdminProperties
                                onViewDetails={(property) =>
                                    navigate(`${preview ? "/admin-preview" : "/admin"}/properties/${encodeURIComponent(property.name)}`, {
                                        state: { property },
                                    })
                                }
                            />
                        ) : activeSection === 'Reservation Management' ? (
                            <AdminReservation preview={preview} />
                        ) : activeSection === 'Reviews' ? (
                            <AdminReviews preview={preview} />
                        ) : activeSection === 'Reports and Analytics' ? (
                            <AdminReports />
                        ) : activeSection === 'Categories and Settings' ? (
                            <AdminCategories />
                        ) : activeSection === 'Settings' ? (
                            <AdminSetting />
                        ) : activeSection === 'Help' ? (
                            <AdminHelp />
                        ) : (
                            <section className="container-fluid p-3 p-md-4 text-light">
                                <h2>{activeSection}</h2>
                            </section>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}