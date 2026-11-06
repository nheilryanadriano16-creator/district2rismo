import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Logo2Rismo from '../images/2Rismo Logo.png'
import { LoginN } from './auth/LoginN.jsx'
import Modal from 'react-bootstrap/Modal'
import { BurgerOptionN } from './BurgerOptionN.jsx'
import { useAuth } from '../context/AuthContext'

function NavBar() {
    const [showLogin, setShowLogin] = useState(false)
    const [showUserModal, setShowUserModal] = useState(false)
    const [darkMode, setDarkMode] = useState(true)
    const [isScrolled, setIsScrolled] = useState(false)
    const [isLogoVisible, setIsLogoVisible] = useState(true)

    const { currentUser, userData, userRole, logout } = useAuth()
    const location = useLocation()

    const profileInitial = [
        userData?.firstName,
        currentUser?.displayName,
        currentUser?.email,
    ].find((value) => typeof value === 'string' && value.trim())
        ?.trim()
        .charAt(0)
        .toUpperCase() || '?'

    const navigate = useNavigate()

    useEffect(() => {
        const updateScrollState = () => setIsScrolled(window.scrollY > 0)

        window.addEventListener('scroll', updateScrollState, { passive: true })
        updateScrollState()

        return () => window.removeEventListener('scroll', updateScrollState)
    }, [])

    const tabs = [
        { key: 'private', label: 'Private Resort' },
        { key: 'hotel', label: 'Hotels' },
    ]
    const [category, setCategory] = useState('private')
    const [menuOpen, setMenuOpen] = useState(false)

    const currentLabel = tabs.find(t => t.key === category).label

    const handleUserClick = () => {
        if (currentUser) {
            setShowUserModal(true)
        } else {
            setShowLogin(true)
        }
    }

    return (
        <div>
            <header className={`site-header container-fluid py-4 d-flex justify-content-between${isScrolled ? ' is-scrolled' : ''}`}>

                <Link to='/' className='logo-link d-inline-flex' aria-label='Go to home page'>
                    <img className='img-fluid logo' src={Logo2Rismo} alt='District 2rismo home' />
                </Link>

                <div className='d-flex align-items-center navi-container'>
                    <button type="button" aria-label="Log in or sign up" onClick={handleUserClick} className="bg-transparent border-0 text-white">
                        {currentUser ? (
                            <span
                                aria-hidden="true"
                                className="rounded-circle bg-warning text-dark fw-bold d-inline-flex align-items-center justify-content-center"
                                style={{ width: 35, height: 35 }}
                            >
                                {profileInitial}
                            </span>
                        ) : (
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="35"
                                height="35"
                                fill="currentColor"
                                className="bi bi-person-fill"
                                viewBox="0 0 18 18"
                            >
                                <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6" />
                            </svg>
                        )}
                    </button>
                    {location.pathname !== '/account' && (
                        <BurgerOptionN
                            darkMode={darkMode}
                            onToggleDarkMode={setDarkMode}
                            onNotifications={() => {
                                if (currentUser && userRole === 'host') {
                                    navigate('/host', { state: { section: 'Notifications' } })
                                } else if (currentUser && userRole === 'customer') {
                                    navigate('/account', { state: { section: 'Notifications' } })
                                } else {
                                    setShowLogin(true)
                                }
                            }}
                            onHelpCenter={() => {
                                if (currentUser && userRole === 'host') {
                                    navigate('/host', { state: { section: 'Help' } })
                                } else if (currentUser && userRole === 'customer') {
                                    navigate('/account', { state: { section: 'Help' } })
                                } else {
                                    setShowLogin(true)
                                }
                            }}
                            onListProperty={() => currentUser && userRole === 'host' ? navigate('/host') : setShowLogin(true)}
                            onLogin={() => setShowLogin(true)}
                        />
                    )}
                </div>
            </header>

            <Modal show={showLogin} onHide={() => setShowLogin(false)} centered contentClassName="bg-transparent border-0">
                <Modal.Body className="p-0">
                    <LoginN onClose={() => setShowLogin(false)} />
                </Modal.Body>
            </Modal>

            <Modal show={showUserModal} onHide={() => setShowUserModal(false)} centered dialogClassName="nav-profile-dialogN" contentClassName="nav-profile-modalN">
                <Modal.Header closeButton closeVariant="white" className="nav-profile-headerN">
                    <Modal.Title className="nav-profile-titleN">User Account</Modal.Title>
                </Modal.Header>
                <Modal.Body className="nav-profile-bodyN">
                    {currentUser ? (
                        <div className="vstack gap-3">
                            <div>
                                <span className="nav-profile-labelN small">Name</span>
                                <h5 className="fw-bold mb-0">{userData?.firstName} {userData?.lastName}</h5>
                            </div>
                            <div>
                                <span className="nav-profile-labelN small">Email</span>
                                <p className="mb-0">{currentUser.email}</p>
                            </div>
                            <div>
                                <span className="nav-profile-labelN small">Role</span>
                                <p className="mb-0 text-capitalize">{userRole}</p>
                            </div>
                            <div className="d-flex flex-column gap-2 mt-3">
                                {userRole === 'host' && (
                                    <Link to="/host" className="btn nav-profile-primaryN w-100 fw-bold" onClick={() => setShowUserModal(false)}>Host Dashboard</Link>
                                )}
                                {userRole === 'admin' && (
                                    <Link to="/admin" className="btn nav-profile-primaryN w-100 fw-bold" onClick={() => setShowUserModal(false)}>Admin Dashboard</Link>
                                )}
                                <div className="d-flex justify-content-center">
                                    <button className="btn nav-profile-logoutN w-50" onClick={() => { logout(); setShowUserModal(false); }}>Log Out</button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className="text-center text-secondary mb-0">No user currently logged in.</p>
                    )}
                </Modal.Body>
            </Modal>
        </div>
    )
}

export default NavBar