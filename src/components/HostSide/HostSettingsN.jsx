import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { sendHostPasswordReset } from '../../utils/hostData'
import { useNotification } from '../../context/NotificationContext'

export const HostSettingsN = ({ onChangePassword }) => {
    const { currentUser } = useAuth()
    const { showNotification } = useNotification()
    const [darkMode, setDarkMode] = useState(() => localStorage.getItem('host_dark_mode') !== 'false')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark')
            localStorage.setItem('host_dark_mode', 'true')
        } else {
            document.documentElement.classList.remove('dark')
            localStorage.setItem('host_dark_mode', 'false')
        }
    }, [darkMode])

    const handleChangePassword = async () => {
        if (onChangePassword) {
            onChangePassword()
            return
        }

        try {
            setLoading(true)
            await sendHostPasswordReset(currentUser?.email)
            showNotification(`Password reset email sent to ${currentUser.email}.`, 'success')
        } catch (error) {
            console.error('Error sending host password reset:', error)
            showNotification(error.message || 'Failed to send password reset email.', 'danger')
        } finally {
            setLoading(false)
        }
    }

    return (
        <section className="profile-panelN container-fluid p-3 p-md-4 text-white">
            <h1 className="h2 fw-bold settings-titleN mb-4">Settings</h1>

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
            </div>

            
        </section>
    )
}
