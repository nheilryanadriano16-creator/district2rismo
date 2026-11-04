import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { fetchHostNotifications } from '../../utils/hostData'

const formatDate = (value) => {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return 'Unknown date'
    return new Intl.DateTimeFormat('en', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    }).format(date)
}

const formatTimeAgo = (value) => {
    const days = Math.floor((Date.now() - new Date(value).getTime()) / 86400000)
    if (Number.isNaN(days) || days < 1) return 'Today'
    return `${days} day${days === 1 ? '' : 's'} ago`
}

export const HostNotificationN = () => {
    const { currentUser } = useAuth()
    const [hostNotifications, setHostNotifications] = useState([])

    useEffect(() => {
        let isMounted = true

        async function loadNotifications() {
            if (!currentUser?.uid) return
            try {
                const loaded = await fetchHostNotifications(currentUser.uid)
                if (isMounted) setHostNotifications(loaded)
            } catch (error) {
                console.error('Error loading host notifications:', error)
            }
        }

        loadNotifications()
        return () => {
            isMounted = false
        }
    }, [currentUser])

    const groups = hostNotifications.reduce((result, notification) => {
        const date = formatDate(notification.createdAt)
        result[date] ??= []
        result[date].push(notification)
        return result
    }, {})

    return (
        <section className="notifications-panelN container-fluid p-3 p-md-4 p-lg-4 text-white">
            <h1 className="h2 fw-bold notifications-titleN mb-3">Notifications</h1>

            {Object.entries(groups).map(([date, notifications]) => (
                <section key={date} className="mb-3" aria-label={date}>
                    <h2 className="small text-secondary mb-1">{date}</h2>

                    <div className="d-flex flex-column gap-2">
                        {notifications.map((notification) => (
                            <article key={notification.id} className="notification-cardN d-flex align-items-start justify-content-between gap-3 p-3 rounded-3">
                                <div className="min-w-0">
                                    <h3 className="small fw-semibold mb-1">{notification.name}</h3>
                                    <p className="small mb-1">{notification.message}</p>
                                    {notification.action && (
                                        <button type="button" className="btn btn-link notification-actionN p-0 small">
                                            {notification.action}
                                        </button>
                                    )}
                                </div>

                                <div className="d-flex flex-column align-items-end flex-shrink-0">
                                    {!notification.read && (
                                        <span className="notification-unread-dotN rounded-circle mb-2" aria-label="Unread" />
                                    )}
                                    <span className="notification-timeN">{formatTimeAgo(notification.createdAt)}</span>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>
            ))}
            {hostNotifications.length === 0 && (
                <p className="small text-secondary mb-0">No notifications yet.</p>
            )}
        </section>
    )
}
