import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const menuItems = [
    { label: 'Dashboard', icon: 'bi-grid-fill' },
    { label: 'Users', icon: 'bi-bell-fill' },
    { label: 'Hosts', icon: 'bi-person-fill' },
    { label: 'Property Management', icon: 'bi-house-fill' },
    { label: 'Reservation Management', icon: 'bi-calendar-event-fill' },
    { label: 'Reviews', icon: 'bi-star-fill' },
    { label: 'Reports and Analytics', icon: 'bi-bar-chart-fill' },
    { label: 'Categories and Settings', icon: 'bi-grid-3x3-gap-fill' },
]

const generalItems = [
    { label: 'Settings', icon: 'bi-gear-fill' },
    { label: 'Help', icon: 'bi-question-circle-fill' },
]

export function AdminSidebar({ activeSection = 'Dashboard', onSelect }) {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (err) {
            console.error('Failed to log out:', err);
        }
    };

    const renderItem = (item) => (
        <button
            key={item.label}
            type="button"
            className={`list-group-item list-group-item-action d-flex align-items-center gap-3 text-nowrap rounded-0 ${
                activeSection === item.label ? 'active' : ''
            }`}
            aria-current={activeSection === item.label ? 'page' : undefined}
            onClick={() => onSelect?.(item.label)}
        >
            <i className={`bi ${item.icon}`} aria-hidden="true" />
            <span>{item.label}</span>
        </button>
    )

    return (
        <aside className="admin-sidebarN p-0">
            <nav className="list-group list-group-flush">
                <p className="text-uppercase small px-4 mt-4 mb-3">Menu</p>
                {menuItems.map(renderItem)}

                <p className="text-uppercase small px-4 mt-4 mb-3">General</p>
                {generalItems.map(renderItem)}

                <button
                    type="button"
                    className="list-group-item list-group-item-action d-flex align-items-center gap-3 text-nowrap rounded-0 text-danger"
                    onClick={handleLogout}
                >
                    <i className="bi bi-box-arrow-left" aria-hidden="true" />
                    <span>Logout</span>
                </button>
            </nav>
        </aside>
    )
}