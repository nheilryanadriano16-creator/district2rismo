export const items = [
    { label: 'Profile', icon: 'bi-person-fill' },
    { label: 'Notifications', icon: 'bi-bell-fill', badge: '2' },
    { label: 'My Reservation', icon: 'bi-calendar-check-fill' },
    { label: 'Destinations to Review', icon: 'bi-star-fill' },
    { label: 'Settings', icon: 'bi-gear-fill' },
    { label: 'Help', icon: 'bi-question-circle-fill' },
]

export const SideBarN = ({ activeSection = 'Profile', onSelect, onLogout, notificationCount = 0 }) => {
    return (
        <aside className="profile-sidebarN p-2 p-lg-3">
            <nav className="list-group list-group-flush gap-1 flex-column">
                {items.map((item) => <button key={item.label} type="button" className={`list-group-item list-group-item-action d-flex align-items-center gap-2 text-nowrap rounded-2 ${activeSection === item.label ? 'active' : ''}`} aria-current={activeSection === item.label ? 'page' : undefined} onClick={() => onSelect?.(item.label)}>
                    <i className={`bi ${item.icon}`} aria-hidden="true" />
                    <span className="flex-grow-1">{item.label}</span>{item.label === 'Notifications' && notificationCount > 0 &&
                        <span className="badge rounded-pill text-bg-warning">{notificationCount}</span>}
                </button>)}
                <button type="button" className="list-group-item list-group-item-action d-flex align-items-center gap-2 text-nowrap rounded-2" onClick={onLogout}>
                    <i className="bi bi-box-arrow-right" aria-hidden="true" />
                    <span>Logout</span>
                </button>
            </nav>
        </aside>
    )
}