const menuItems = [
    { label: 'Dashboard', icon: 'bi-grid-fill' },
    { label: 'Notifications', icon: 'bi-bell-fill' },
    { label: 'Properties', icon: 'bi-houses-fill' },
    { label: 'Bookings', icon: 'bi-calendar-event-fill' },
    { label: 'Reviews', icon: 'bi-star-fill' },
    { label: 'Earnings Summary', icon: 'bi-cash-stack' },
]

const generalItems = [
    { label: 'Settings', icon: 'bi-gear-fill' },
    { label: 'Help', icon: 'bi-question-circle-fill' },
]

export const HostSideBarN = ({ onSelect, onLogout, activeSection = 'Dashboard' }) => {
    const renderItem = (item) => (
        <button
            key={item.label}
            type="button"
            className={`list-group-item list-group-item-action d-flex align-items-center gap-2 text-nowrap rounded-2 ${
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
        <aside className="profile-sidebarN p-2 p-lg-3">
            <nav className="list-group list-group-flush gap-1 flex-column">
                <p className="text-uppercase text-secondary small px-3 mt-3 mb-2">Menu</p>
                {menuItems.map(renderItem)}

                <p className="text-uppercase text-secondary small px-3 mt-4 mb-2">General</p>
                {generalItems.map(renderItem)}

                <button
                    type="button"
                    className="list-group-item list-group-item-action d-flex align-items-center gap-2 text-nowrap rounded-2"
                    onClick={onLogout}
                >
                    <i className="bi bi-box-arrow-right" aria-hidden="true" />
                    <span>Logout</span>
                </button>
            </nav>
        </aside>
    )
}