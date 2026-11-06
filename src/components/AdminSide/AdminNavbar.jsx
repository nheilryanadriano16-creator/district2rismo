import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Offcanvas from 'react-bootstrap/Offcanvas'
import Logo2Rismo from '../../images/2Rismo Logo.png'
import { useAuth } from '../../context/AuthContext.jsx'
import { AdminSidebar } from './AdminSidebar.jsx'

export function AdminNavbar({ activeSection, onSelect, preview = false }) {
    const [showMenu, setShowMenu] = useState(false)
    const [isScrolled, setIsScrolled] = useState(false)
    const { logout, currentUser, userData } = useAuth()
    const navigate = useNavigate()
    const dashboardPath = preview ? '/admin-preview' : '/admin'
    const profilePath = preview ? '/admin-profile-preview' : '/admin/profile'
    const profileInitial = [
        userData?.firstName,
        currentUser?.displayName,
        currentUser?.email,
    ].find((value) => typeof value === 'string' && value.trim())
        ?.trim()
        .charAt(0)
        .toUpperCase() || '?'

    useEffect(() => {
        const updateScrollState = () => setIsScrolled(window.scrollY > 0)
        window.addEventListener('scroll', updateScrollState, { passive: true })
        updateScrollState()

        return () => window.removeEventListener('scroll', updateScrollState)
    }, [])

    const handleLogout = async () => {
        await logout()
        navigate('/login')
    }

    const handleSelect = (section) => {
        onSelect?.(section)
        setShowMenu(false)
    }

    return (
        <>
            <header className={`admin-navbarN container-fluid d-flex align-items-center justify-content-between${isScrolled ? ' is-scrolled' : ''}`}>
                <Link
                    to={dashboardPath}
                    className="d-inline-flex me-auto"
                    aria-label="Admin dashboard"
                    onClick={() => onSelect?.('Dashboard')}
                >
                    <img className="img-fluid logo" src={Logo2Rismo} alt="District 2rismo" />
                </Link>

                <div className="d-flex align-items-center gap-2">
                    <button
                        type="button"
                        className="btn p-0 host-profile-placeholderN rounded-circle border border-warning bg-warning text-dark fw-bold d-flex align-items-center justify-content-center"
                        aria-label="Open my profile"
                        onClick={() => navigate(profilePath)}
                        style={{ width: '40px', height: '40px', fontSize: '16px', lineHeight: '1' }}
                    >
                        {profileInitial}
                    </button>

                    <button
                        type="button"
                        className="btn text-white d-lg-none"
                        aria-label="Open admin navigation"
                        onClick={() => setShowMenu(true)}
                    >
                        <i className="bi bi-list fs-1" aria-hidden="true" />
                    </button>
                </div>
            </header>

            <Offcanvas
                show={showMenu}
                onHide={() => setShowMenu(false)}
                placement="start"
                className="admin-mobile-menuN"
                aria-label="Admin navigation"
            >
                <Offcanvas.Header closeButton closeVariant="white" />
                <Offcanvas.Body className="p-0">
                    <AdminSidebar
                        activeSection={activeSection}
                        onSelect={handleSelect}
                        onLogout={handleLogout}
                    />
                </Offcanvas.Body>
            </Offcanvas>
        </>
    )
}