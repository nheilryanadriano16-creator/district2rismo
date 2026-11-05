import Dropdown from 'react-bootstrap/Dropdown'
import { useAuth } from '../context/AuthContext'

export const BurgerOptionN = ({ darkMode = false, onToggleDarkMode, onNotifications, onHelpCenter, onListProperty, onLogin }) => {
    const { currentUser, logout } = useAuth()

    const handleLogout = async () => {
        try {
            await logout()
        } catch (error) {
            console.error('Error logging out:', error)
        }
    }

    return (
        <Dropdown align="end" autoClose="true">
            <Dropdown.Toggle variant="link" className="burger-toggleN text-white text-decoration-none p-0 border-0" aria-label="Open menu">
                <i className="bi bi-list fs-1" aria-hidden="true" />
            </Dropdown.Toggle>

            <Dropdown.Menu className="burger-menuN p-2 rounded-4 shadow">
                <Dropdown.Item as="button" onClick={onNotifications}>
                    <i className="bi bi-bell me-2" aria-hidden="true" />
                    Notifications
                </Dropdown.Item>
                <Dropdown.Item as="button" onClick={onHelpCenter}>
                    <i className="bi bi-question-circle me-2" aria-hidden="true" />
                    Help Center
                </Dropdown.Item>

                <Dropdown.Divider className="border-warning opacity-50" />

                <Dropdown.Item as="button" onClick={onListProperty}>
                    <i className="bi bi-house-add me-2" aria-hidden="true" />
                    List your property
                </Dropdown.Item>

                <Dropdown.Divider className="border-warning opacity-50" />

                {currentUser ? (
                    <Dropdown.Item as="button" onClick={handleLogout} className="text-danger fw-semibold">
                        <i className="bi bi-box-arrow-right me-2" aria-hidden="true" />
                        Log out
                    </Dropdown.Item>
                ) : (
                    <Dropdown.Item as="button" onClick={onLogin}>
                        <i className="bi bi-person me-2" aria-hidden="true" />
                        Log in or sign up
                    </Dropdown.Item>
                )}
            </Dropdown.Menu>
        </Dropdown>
    )
}