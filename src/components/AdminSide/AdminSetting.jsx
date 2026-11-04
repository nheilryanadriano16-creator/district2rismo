import { useState, useEffect } from 'react'
import { sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '../../firebase'

export const AdminSetting = () => {
    const [darkMode, setDarkMode] = useState(() => {
        return localStorage.getItem('admin_dark_mode') !== 'false'
    })
    const [statusMessage, setStatusMessage] = useState({ text: '', type: '' })
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark')
            localStorage.setItem('admin_dark_mode', 'true')
        } else {
            document.documentElement.classList.remove('dark')
            localStorage.setItem('admin_dark_mode', 'false')
        }
    }, [darkMode])

    const handleChangePassword = async () => {
        const user = auth.currentUser
        if (!user || !user.email) {
            setStatusMessage({ text: 'No active user email found to send reset instructions.', type: 'danger' })
            return
        }

        try {
            setLoading(true)
            setStatusMessage({ text: '', type: '' })
            await sendPasswordResetEmail(auth, user.email)
            setStatusMessage({ 
                text: `Password reset email sent successfully to ${user.email}. Check your inbox.`, 
                type: 'success' 
            })
        } catch (err) {
            console.error('Error sending password reset email:', err)
            setStatusMessage({ text: 'Failed to send password reset email: ' + err.message, type: 'danger' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <section className="profile-panelN container-fluid p-3 p-md-4 text-white">
            <h1 className="h2 fw-bold settings-titleN mb-4">Settings</h1>

            {statusMessage.text && (
                <div className={`alert alert-${statusMessage.type === 'success' ? 'success' : 'danger'} mb-4`} role="alert">
                    {statusMessage.text}
                </div>
            )}

            <div className="mb-4">
                <h2 className="small settings-section-labelN mb-2">Security</h2>
                <button
                    type="button"
                    className="btn btn-warning rounded-pill text-nowrap settings-password-btnN"
                    onClick={handleChangePassword}
                    disabled={loading}
                >
                    {loading ? 'Sending...' : 'Change Password'}
                </button>
                <p className="small text-white mt-2 mb-0">This will email a password reset link to your registered admin account.</p>
            </div>

            <div>
                
            </div>
        </section>
    )
}