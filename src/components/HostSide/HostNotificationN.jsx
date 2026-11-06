import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase'

const parseDateValue = (value) => {
    if (!value) return new Date()
    if (typeof value?.toDate === 'function') return value.toDate()
    if (value?.seconds) return new Date(value.seconds * 1000)
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed
}

const formatDate = (value) => {
    const date = parseDateValue(value)
    return new Intl.DateTimeFormat('en', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    }).format(date)
}

const formatTimeAgo = (value) => {
    const date = parseDateValue(value)
    const days = Math.floor((Date.now() - date.getTime()) / 86400000)
    if (Number.isNaN(days) || days < 1) return 'Today'
    return `${days} day${days === 1 ? '' : 's'} ago`
}

export const HostNotificationN = () => {
    const { currentUser } = useAuth()
    const [notifications, setNotifications] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let isMounted = true

        async function loadUserNotifications() {
            if (!currentUser?.uid) return
            try {
                setLoading(true)

                const q = query(
                    collection(db, 'notifications'),
                    where('userId', '==', currentUser.uid)
                )

                const querySnapshot = await getDocs(q)
                const loaded = querySnapshot.docs.map((docItem) => ({
                    id: docItem.id,
                    ...docItem.data(),
                }))

                loaded.sort((a, b) => parseDateValue(b.createdAt) - parseDateValue(a.createdAt))

                if (isMounted) {
                    setNotifications(loaded)
                }
            } catch (error) {
                console.error('Error loading user notifications:', error)
            } finally {
                if (isMounted) setLoading(false)
            }
        }

        loadUserNotifications()
        return () => {
            isMounted = false
        }
    }, [currentUser])

    const handleMarkAsRead = async (notificationId) => {
        try {
            const notifRef = doc(db, 'notifications', notificationId)
            await updateDoc(notifRef, { read: true })
            setNotifications((prev) =>
                prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
            )
        } catch (error) {
            console.error('Error marking notification as read:', error)
        }
    }

    const groups = notifications.reduce((result, notification) => {
        const date = formatDate(notification.createdAt)
        result[date] ??= []
        result[date].push(notification)
        return result
    }, {})

    return (
        <section className="notifications-panelN container-fluid p-3 p-md-4 p-lg-4 text-white">
            <h1 className="h2 fw-bold notifications-titleN mb-3">Notifications</h1>

            {loading ? (
                <p className="small text-secondary mb-0">Loading notifications...</p>
            ) : (
                <>
                    {Object.entries(groups).map(([date, items]) => (
                        <section key={date} className="mb-3" aria-label={date}>
                            <h2 className="small text-secondary mb-1">{date}</h2>

                            <div className="d-flex flex-column gap-2">
                                {items.map((notification) => (
                                    <article
                                        key={notification.id}
                                        className={`notification-cardN d-flex align-items-start justify-content-between gap-3 p-3 rounded-3 ${
                                            !notification.read ? 'border-start border-3 border-warning' : ''
                                        }`}
                                        onClick={() => !notification.read && handleMarkAsRead(notification.id)}
                                        style={{ cursor: notification.read ? 'default' : 'pointer' }}
                                    >
                                        <div className="min-w-0">
                                            <h3 className="small fw-semibold mb-1">
                                                {notification.title || notification.name || 'Notification'}
                                            </h3>
                                            <p className="small mb-1">{notification.message}</p>
                                            {notification.action && (
                                                <button
                                                    type="button"
                                                    className="btn btn-link notification-actionN p-0 small"
                                                >
                                                    {notification.action}
                                                </button>
                                            )}
                                        </div>

                                        <div className="d-flex flex-column align-items-end flex-shrink-0">
                                            {!notification.read && (
                                                <span
                                                    className="notification-unread-dotN rounded-circle mb-2 bg-warning"
                                                    aria-label="Unread"
                                                    style={{ width: '8px', height: '8px', display: 'inline-block' }}
                                                />
                                            )}
                                            <span className="notification-timeN small text-secondary">
                                                {formatTimeAgo(notification.createdAt)}
                                            </span>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </section>
                    ))}

                    {notifications.length === 0 && (
                        <p className="small text-secondary mb-0">No notifications yet.</p>
                    )}
                </>
            )}
        </section>
    )
}