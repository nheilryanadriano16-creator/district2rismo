import logo from '../../images/2Rismo Logo.png'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { SignUpN } from './SignUpN.jsx'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../../firebase'
import { getDashboardPath } from '../../utils/roles'
import { PrivacyPolicyModal } from './PrivacyPolicyModal.jsx'

export const LoginN = ({ onClose }) => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showPasswordInput, setShowPasswordInput] = useState(false)
    const [showSignUp, setShowSignUp] = useState(false)
    const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const { login } = useAuth()
    const navigate = useNavigate()

    const finishAuth = (role) => {
        onClose?.()
        navigate(getDashboardPath(role), { replace: true })
    }

    const handleContinue = async (event) => {
        event.preventDefault()
        setError('')

        if (!email) return

        if (showPasswordInput) {
            try {
                setLoading(true)
                const { role } = await login(email, password)
                finishAuth(role)
            } catch (err) {
                console.error('Login Error:', err)
                let message = 'An error occurred during login. Please try again.'
                
                if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential' || err.code === 'auth/invalid-login-credentials') {
                    message = 'Incorrect password. Please try again.'
                } else if (err.code === 'auth/too-many-requests') {
                    message = 'Access temporarily disabled due to many failed login attempts. Try again later.'
                } else if (err.code === 'auth/account-deactivated') {
                    message = 'This account has been deactivated. Contact support if you need help.'
                }
                setError(message)
            } finally {
                setLoading(false)
            }
            return
        }

        try {
            setLoading(true)
            const cleanEmail = email.trim().toLowerCase()
            const usersRef = collection(db, 'users')
            const q = query(usersRef, where('email', '==', cleanEmail))
            const querySnapshot = await getDocs(q)

            if (!querySnapshot.empty) {
                setShowPasswordInput(true)
            } else {
                setShowSignUp(true)
            }
        } catch (err) {
            console.error('Email check error:', err)
            setError('Failed to verify email. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    if (showSignUp) {
        return <SignUpN email={email} onBack={() => setShowSignUp(false)} onClose={onClose} onAuthenticated={finishAuth} />
    }

    const card = (
        <div className="login-cardN rounded-5 shadow p-4 p-md-5">
            <button type="button" className="btn-close btn-close-white position-absolute top-0 end-0 m-3" aria-label="Close" onClick={() => onClose ? onClose() : navigate('/')} />
            <img src={logo} alt="Logo" className="login-logoN mb-3" />
            <h1 className="h2N color fw-bold text-center mb-4 text-white">Log in or sign up</h1>
            
            {error && <div className="alert alert-danger py-2 small">{error}</div>}

            <form onSubmit={handleContinue}>
                <input 
                    className="form-controlN form-control-lg mb-2" 
                    type="email" 
                    placeholder="Enter email" 
                    value={email} 
                    onChange={(event) => setEmail(event.target.value)} 
                    disabled={showPasswordInput}
                    required 
                />

                {showPasswordInput && (
                    <div className="position-relative mb-2">
                        <input
                            className="form-controlN form-control-lg pe-5"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Enter password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            autoFocus
                            required
                        />
                        <button
                            type="button"
                            className="btn position-absolute top-50 end-0 translate-middle-y me-2 p-2 border-0 bg-transparent text-white"
                            onClick={() => setShowPassword((visible) => !visible)}
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                            aria-pressed={showPassword}
                        >
                            <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} aria-hidden="true" />
                        </button>
                    </div>
                )}

                <p className="smallN text-secondary mb-0">
                    {showPasswordInput ? 'Enter your password to log in.' : 'Enter your email to continue.'}
                </p>
                
                <div className="d-flex justify-content-between align-items-center mt-2">
                    <button className="btn btn-link smallN text-white fw-semibold p-0 text-decoration-none" type="button" onClick={() => setShowPrivacyPolicy(true)}>
                        Privacy Policy
                    </button>
                    {showPasswordInput && (
                        <button type="button" className="btn btn-link text-warning p-0 small text-decoration-none" onClick={() => { setShowPasswordInput(false); setPassword(''); setError(''); }}>
                            Back
                        </button>
                    )}
                    <PrivacyPolicyModal show={showPrivacyPolicy} onHide={() => setShowPrivacyPolicy(false)} />
                </div>

                <div className="d-flex flex-column gap-2 mt-4">
                    <button className="continue-buttonN btn-lg w-100 fw-semibold text-black" type="submit" disabled={loading}>
                        {loading ? 'Processing...' : (showPasswordInput ? 'Log In' : 'Continue')}
                    </button>
                </div>
            </form>
        </div>
    )

    if (!onClose) {
        return (
            <div className="min-vh-100 d-flex align-items-center justify-content-center bg-dark p-3">
                {card}
            </div>
        )
    }

    return card
}
