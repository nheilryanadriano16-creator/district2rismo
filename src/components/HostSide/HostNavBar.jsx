import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Offcanvas from 'react-bootstrap/Offcanvas'
import Logo2Rismo from '../../images/2Rismo Logo.png'
import { HostSideBarN } from './HostSideBarN.jsx'
import { useAuth } from '../../context/AuthContext'

export const HostNavBar = ({ activeSection, onSelect, preview = false, onLogout }) => {
    const [showMenu, setShowMenu] = useState(false)
    const dashboardPath = preview ? '/host-preview' : '/host'
    const profilePath = preview ? '/host-profile-preview' : '/host/profile'
    const navigate = useNavigate()
    const { logout } = useAuth()

    const handleLogout = async () => {
        if (onLogout) {
            await onLogout()
            return
        }
        await logout()
        navigate('/', { replace: true })
    }

    const handleSelect = (section) => {
        onSelect?.(section)
        setShowMenu(false)

    }

    const [isScrolled, setIsScrolled] = useState(false)

    useEffect(() => {
        const updateScrollState = () => setIsScrolled(window.scrollY > 0)

        window.addEventListener('scroll', updateScrollState, { passive: true })
        updateScrollState()

        return () => window.removeEventListener('scroll', updateScrollState)
    }, [])

    return (
        <>
            <header className={`site-header container-fluid d-flex align-items-center justify-content-between${isScrolled ? ' is-scrolled' : ''}`}>
                <Link
                    to={dashboardPath}
                    className="d-inline-flex"
                    aria-label="Go to host dashboard"
                    onClick={() => onSelect?.('Dashboard')}
                >
                    <img className="img-fluid logo" src={Logo2Rismo} alt="District 2rismo home" />
                </Link>

                <div className="d-flex align-items-center gap-2">
                    <Link
                        to={profilePath}
                        className="host-profile-placeholderN rounded-circle border border-warning d-flex align-items-center justify-content-center"
                        aria-label="Open my profile"
                    >
                        <i className="bi bi-person-fill" aria-hidden="true" />
                    </Link>

                    <button
                        type="button"
                        className={`btn text-white ${['Add Property', 'Confirm Booking', 'View Property', 'Edit Property'].includes(activeSection) ? '' : 'd-lg-none'}`}
                        aria-label="Open host navigation"
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
                className="host-mobile-menuN"
                aria-labelledby="host-mobile-menu-title"
            >
                <Offcanvas.Header closeButton closeVariant="white">
                </Offcanvas.Header>
                <Offcanvas.Body className="p-0">
                    <HostSideBarN
                        activeSection={
                            activeSection === 'Add Property' || activeSection === 'View Property' || activeSection === 'Edit Property'
                                ? 'Properties'
                                : activeSection === 'Confirm Booking'
                                    ? 'Bookings'
                                    : activeSection
                        }
                        onSelect={handleSelect}
                        onLogout={handleLogout}
                    />
                </Offcanvas.Body>
            </Offcanvas>
        </>
    )
}