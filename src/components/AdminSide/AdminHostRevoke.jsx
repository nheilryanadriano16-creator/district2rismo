import { useState, useEffect } from 'react'
import Modal from 'react-bootstrap/Modal'
import { doc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase'

const reasons = [
    'Violation of verification requirements',
    'Misleading or inaccurate information',
    'Reported policy violation',
    'Other',
]

export function AdminHostRevoke({ show, host, onHide, onConfirm }) {
    const [reason, setReason] = useState('')
    const [notifyHost, setNotifyHost] = useState(false)
    const [loading, setLoading] = useState(false)

    const displayName = host?.firstName && host?.lastName 
        ? `${host.firstName} ${host.lastName}` 
        : host?.name || host?.email || 'Host'

    useEffect(() => {
        if (!show) {
            setReason('')
            setNotifyHost(false)
            setLoading(false)
        }
    }, [show])

    const submitRevocation = async (event) => {
        event.preventDefault()
        if (!host?.id) return

        try {
            setLoading(true)
            const hostRef = doc(db, 'users', host.id)
            await updateDoc(hostRef, {
                status: 'Unverified',
                revocationReason: reason,
                revokedAt: new Date().toISOString()
            })

            await addDoc(collection(db, 'notifications'), {
                userId: host.id,
                userEmail: host.email || null,
                title: 'Verification Revoked',
                message: `Your host verification status has been revoked. Reason: ${reason}`,
                read: false,
                createdAt: serverTimestamp(),
            })

            onConfirm?.({ host, reason, notifyHost })
            onHide()
        } catch (err) {
            console.error('Error revoking host verification:', err)
            alert('Failed to revoke verification: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    if (!host) return null

    return (
        <Modal
            show={show}
            onHide={onHide}
            centered
            dialogClassName="admin-host-revoke-dialogN"
            contentClassName="admin-host-revoke-modalN admin-themed-modalN"
            aria-labelledby="admin-host-revoke-title"
        >
            <button
                type="button"
                className="admin-suspend-closeN"
                aria-label="Close"
                onClick={onHide}
            >
                <i className="bi bi-x-lg" aria-hidden="true" />
            </button>

            <form onSubmit={submitRevocation}>
                <Modal.Body className="admin-host-revoke-bodyN text-white">
                    <h2
                        id="admin-host-revoke-title"
                        className="admin-suspend-titleN text-center fw-bold text-white mb-3"
                    >
                        Revoke Verification
                    </h2>

                    <p className="text-center mb-4 text-white">
                        Are you sure you want to revoke <strong>{displayName}&apos;s</strong>{' '}
                        verification? The host will lose their Verified status until the issue is resolved.
                    </p>

                    <label className="form-label text-white" htmlFor="host-revoke-reason">
                        Reason for Revocation:
                    </label>
                    <select
                        id="host-revoke-reason"
                        className="form-select admin-host-revoke-selectN mb-4"
                        value={reason}
                        onChange={(event) => setReason(event.target.value)}
                        required
                    >
                        <option value="" disabled>Select Reason</option>
                        {reasons.map((item) => (
                            <option key={item} value={item}>
                                {item}
                            </option>
                        ))}
                    </select>

                    <div className="form-check admin-host-revoke-notifyN mb-4">
                        <input
                            id="host-revoke-notify"
                            className="form-check-input"
                            type="checkbox"
                            checked={notifyHost}
                            onChange={(event) => setNotifyHost(event.target.checked)}
                        />
                        <label className="form-check-label text-white" htmlFor="host-revoke-notify">
                            Notify the host about this decision
                        </label>
                    </div>

                    <div className="d-flex justify-content-center align-items-center gap-3 mt-4 w-100">
                        <button
                            type="button"
                            className="btn btn-outline-warning rounded-pill px-4"
                            onClick={onHide}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            className="btn btn-warning text-dark rounded-pill px-4 fw-semibold"
                            disabled={loading}
                        >
                            {loading ? 'Revoking...' : 'Revoke Verification'}
                        </button>
                    </div>
                </Modal.Body>
            </form>
        </Modal>
    )
}