import { useState, useEffect } from 'react'
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
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000)
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`

    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`

    const days = Math.floor(hours / 24)
    return `${days} day${days === 1 ? '' : 's'} ago`
}

export const NotificationsN = () => {
    const { currentUser } = useAuth()
    const [notifications, setNotifications] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        async function fetchNotifications() {
            if (!currentUser?.uid) return
            try {
                setLoading(true)
                const q = query(
                    collection(db, 'notifications'),
                    where('userId', '==', currentUser.uid)
                )
                const snapshot = await getDocs(q)
                const loaded = snapshot.docs.map(docItem => ({
                    id: docItem.id,
                    ...docItem.data()
                }))
                loaded.sort((a, b) => parseDateValue(b.createdAt) - parseDateValue(a.createdAt))
                setNotifications(loaded)
            } catch (err) {
                console.error('Error fetching notifications:', err)
                setError('Failed to load notifications.')
            } finally {
                setLoading(false)
            }
        }

        fetchNotifications()
    }, [currentUser])

    const handleMarkAsRead = async (notification) => {
        if (notification.read) return
        try {
            const notifRef = doc(db, 'notifications', notification.id)
            await updateDoc(notifRef, { read: true })
            setNotifications(prev =>
                prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
            )
        } catch (err) {
            console.error('Error marking notification as read:', err)
        }
    }

    const groups = notifications.reduce((result, notification) => {
        const label = formatDate(notification.createdAt)
        result[label] ??= []
        result[label].push(notification)
        return result
    }, {})

    return (
        <section className="notifications-panelN container-fluid p-3 p-md-4 p-lg-5 text-white">
            <h1 className="h2 fw-bold notifications-titleN mb-4">Notifications</h1>

            {loading && <p className="text-secondary" role="status">Loading notifications…</p>}
            {!loading && error && <div className="alert alert-danger" role="alert">{error}</div>}
            {!loading && !error && notifications.length === 0 && <p className="text-secondary">You don’t have any notifications yet.</p>}

            {!loading && !error && Object.entries(groups).map(([date, dateNotifications]) => (
                <section key={date} className="mb-3" aria-label={date}>
                    <h2 className="small text-secondary mb-2">{date}</h2>
                    <div className="d-flex flex-column gap-3">
                        {dateNotifications.map((notification) => (
                            <button
                                key={notification.id}
                                type="button"
                                className={`notification-cardN btn text-start w-100 d-flex align-items-start justify-content-between gap-3 p-3 rounded-3 ${notification.read ? '' : 'unread'}`}
                                onClick={() => handleMarkAsRead(notification)}
                            >
                                <span className="min-w-0">
                                    <span className="d-block fw-semibold">{notification.title || notification.name || 'Notification'}</span>
                                    <span className="d-block small">{notification.message}</span>
                                    {notification.action && <span className="d-block small notification-actionN mt-2">{notification.action}</span>}
                                </span>
                                <span className="d-flex flex-column align-items-end flex-shrink-0">
                                    {!notification.read && <span className="notification-unread-dotN rounded-circle mb-2" aria-label="Unread" />}
                                    <span className="notification-timeN">{formatTimeAgo(notification.createdAt)}</span>
                                </span>
                            </button>
                        ))}
                    </div>
                </section>
            ))}
        </section>
    )
}