import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getDashboardPath } from '../../utils/roles'

export const SignUpN = ({ email: initialEmail = '', onBack, onClose, onAuthenticated }) => {
    const [showPassword, setShowPassword] = useState(false)
    const [email, setEmail] = useState(initialEmail)
    const [role, setRole] = useState('customer')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const { signup } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (event) => {
        event.preventDefault()
        setError('')

        const data = Object.fromEntries(new FormData(event.currentTarget))

        try {
            setLoading(true)
            const { role: createdRole } = await signup(email, data.password, {
                firstName: data.firstName,
                lastName: data.lastName,
                dateOfBirth: data.dateOfBirth,
                role: role,
            })
            if (onAuthenticated) {
                onAuthenticated(createdRole)
            } else {
                onClose?.()
                navigate(getDashboardPath(createdRole), { replace: true })
            }
        } catch (err) {
            console.error('Sign Up Error:', err)
            setError(err.message.replace('Firebase: ', ''))
        } finally {
            setLoading(false)
        }
    }

    return (
        <section className="signup-cardN position-relative container px-4 pt-2 pb-4 px-md-5 pt-md-3 pb-md-5 rounded-5 shadow text-white">
            
            <div className="d-flex align-items-center justify-content-between mb-4">
                <button type="button" className="btn d-inline-flex align-items-center justify-content-center p-0 signup-backN" aria-label="Go back" onClick={onBack}>
                    <i className="bi bi-arrow-left" aria-hidden="true" />
                </button>
                <button type="button" className="btn-close btn-close-white" aria-label="Close" onClick={onClose} />
            </div>

            <h1 className="h3 fw-bold text-center mb-2">Create your account</h1>
            <p className="text-center signup-mutedN mb-4">This information is required to book or host.</p>

            {error && <div className="alert alert-danger py-2 small">{error}</div>}

            <form className="vstack gap-3" onSubmit={handleSubmit}>
                <div>
                    <label className="form-label fw-bold" htmlFor="signup-email">Email address</label>
                    <input id="signup-email" className="form-control form-control-lg signup-inputN fs-6" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>

                <div>
                    <label className="form-label fw-bold" htmlFor="signup-role">I want to join as a</label>
                    <select id="signup-role" className="form-select form-select-lg signup-inputN fs-6" value={role} onChange={(e) => setRole(e.target.value)}>
                        <option value="customer">Customer / Guest</option>
                        <option value="host">Host</option>
                    </select>
                </div>

                <fieldset>
                    <legend className="h6 fw-bold mb-2">Legal name</legend>
                    <div className="signup-name-fieldsN">
                        <input className="form-control signup-inputN fs-6 rounded-top-3 rounded-bottom-0" type="text" name="firstName" placeholder="First name" autoComplete="given-name" required />
                        <input className="form-control signup-inputN fs-6 rounded-bottom-3 rounded-top-0" type="text" name="lastName" placeholder="Last name" autoComplete="family-name" required />
                    </div>
                    <small className="signup-mutedN">Use the name shown on your government ID.</small>
                </fieldset>

                <div>
                    <label className="form-label fw-bold" htmlFor="signup-birth-date">Date of birth</label>
                    <input id="signup-birth-date" className="form-control form-control-lg signup-inputN fs-6" type="date" name="dateOfBirth" autoComplete="bday" required />
                </div>

                <div>
                    <label className="form-label fw-bold" htmlFor="signup-password">Password</label>
                    <div className="position-relative">
                        <input id="signup-password" className="form-control form-control-lg signup-inputN fs-6 pe-5" type={showPassword ? 'text' : 'password'} name="password" autoComplete="new-password" minLength={8} placeholder="At least 8 characters" required />
                        <button className="btn position-absolute top-50 end-0 translate-middle-y me-2 p-2 border-0 bg-transparent text-warning" type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword}>
                            <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} aria-hidden="true" />
                        </button>
                    </div>
                </div>

                <div className="signup-promoN rounded-3 p-3">
                    <p className="small mb-2">We may send you updates, deals, and account news. You can change your preferences anytime.</p>
                    <div className="form-check">
                        <input className="form-check-input" id="signup-no-promotions" type="checkbox" name="noPromotions" value="true" />
                        <label className="form-check-label small" htmlFor="signup-no-promotions">I donâ€™t want to receive promotional emails.</label>
                    </div>
                </div>

                <p className="small signup-mutedN mb-0">By selecting <strong>Agree and continue</strong>, you agree to our <a className="signup-linkN" href="#">Terms of Service</a> and acknowledge our <a className="signup-linkN" href="#">Privacy Policy</a>.</p>

                <button className="btn btn-warning btn-lg w-100 fw-bold mt-2" type="submit" disabled={loading}>{loading ? 'Creating account...' : 'Agree and continue'}</button>
            </form>
        </section>
    )
}




