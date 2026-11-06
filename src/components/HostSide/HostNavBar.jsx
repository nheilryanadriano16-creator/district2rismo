import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Offcanvas from 'react-bootstrap/Offcanvas'
import Logo2Rismo from '../../images/2Rismo Logo.png'
import { HostSideBarN } from './HostSideBarN.jsx'
import { useAuth } from '../../context/AuthContext'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../firebase'

export const HostNavBar = ({ activeSection, onSelect, preview = false, onLogout }) => {
    const [showMenu, setShowMenu] = useState(false)
    const [firestoreFirstName, setFirestoreFirstName] = useState('')
    const dashboardPath =  '/host'
    const profilePath = '/host/profile'
    const navigate = useNavigate()

    const auth = useAuth() || {}
    const { logout, user } = auth

    useEffect(() => {
        const fetchUserData = async () => {
            const uid = user?.uid || auth?.currentUser?.uid
            if (uid) {
                try {
                    const userDocRef = doc(db, 'users', uid)
                    const userSnap = await getDoc(userDocRef)
                    if (userSnap.exists()) {
                        const data = userSnap.data()
                        if (data?.firstName) {
                            setFirestoreFirstName(data.firstName)
                        }
                    }
                } catch (error) {
                    console.error('Error fetching user profile from Firestore:', error)
                }
            }
        }

        fetchUserData()
    }, [user, auth])

    const getInitial = () => {
        const activeUser = user || auth?.currentUser
        const name = firestoreFirstName || activeUser?.displayName

        if (name && typeof name === 'string' && name.trim()) {
            return name.trim().charAt(0).toUpperCase()
        }

        return null
    }

    const firstInitial = getInitial()

    const handleLogout = async () => {
        if (onLogout) {
            await onLogout()
            return
        }
        if (logout) {
            await logout()
        }
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
                    <span className="account-side-indicatorN account-side-indicatorN--host" aria-label="You are using the host side">
                        <i className="bi bi-house-door-fill" aria-hidden="true" />
                        Host side
                    </span>
                    {!preview && (
                        <Link
                            to="/account"
                            className="btn btn-sm btn-outline-warning text-nowrap"
                            aria-label="Open customer account"
                        >
                            <i className="bi bi-person-circle me-sm-1" aria-hidden="true" />
                            <span className="d-none d-sm-inline">Customer account</span>
                        </Link>
                    )}
                    <Link
                        to={profilePath}
                        className="host-profile-placeholderN rounded-circle border border-warning d-flex align-items-center justify-content-center text-warning fw-bold text-decoration-none"
                        aria-label="Open my profile"
                        style={{ width: '40px', height: '40px', fontSize: '16px', lineHeight: '1' }}
                    >
                        {firstInitial ? (
                            <span>{firstInitial}</span>
                        ) : (
                            <i className="bi bi-person-fill" aria-hidden="true" />
                        )}
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