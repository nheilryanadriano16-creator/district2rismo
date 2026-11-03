import { useState, useEffect } from 'react'
import Modal from 'react-bootstrap/Modal'
import { doc, updateDoc, deleteField } from 'firebase/firestore'
import { db } from '../../firebase'

export function AdminHostDeactivate({ show, host, onHide, onConfirm }) {
    const [reason, setReason] = useState('')
    const [loading, setLoading] = useState(false)
    
    const isDeactivated = host?.status?.toLowerCase() === 'deactivated'

    const displayName = host?.firstName && host?.lastName 
        ? `${host.firstName} ${host.lastName}` 
        : host?.name || host?.email || 'Host'

    useEffect(() => {
        if (!show) {
            setReason('')
            setLoading(false)
        }
    }, [show])

    const handleSubmit = async (event) => {
        event.preventDefault()
        if (!host?.id) return

        try {
            setLoading(true)
            const hostRef = doc(db, 'users', host.id)
            if (isDeactivated) {
                await updateDoc(hostRef, {
                    status: 'Active',
                    deactivationReason: deleteField(),
                    deactivatedAt: deleteField()
                })
            } else {
                await updateDoc(hostRef, {
                    status: 'Deactivated',
                    deactivationReason: reason,
                    deactivatedAt: new Date().toISOString()
                })
            }

            onConfirm?.({ host, reason, action: isDeactivated ? 'reactivate' : 'deactivate' })
            onHide()
        } catch (err) {
            console.error('Error updating host status:', err)
            alert('Failed to update host status: ' + err.message)
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
            dialogClassName="admin-host-deactivate-dialogN"
            contentClassName="admin-host-deactivate-modalN"
            aria-labelledby="admin-host-deactivate-title"
        >
            <button
                type="button"
                className="admin-host-deactivate-closeN"
                aria-label="Close"
                onClick={onHide}
            >
                <i className="bi bi-x-lg" aria-hidden="true" />
            </button>

            <form onSubmit={handleSubmit}>
                <Modal.Body className="admin-host-deactivate-bodyN text-white">
                    <h2
                        id="admin-host-deactivate-title"
                        className="admin-host-deactivate-titleN text-center fw-bold text-white mb-3"
                    >
                        {isDeactivated ? 'Reactivate Host Account' : 'Deactivate Host Account'}
                    </h2>

                    <p className="admin-host-deactivate-messageN text-center text-white mb-4">
                        {isDeactivated ? (
                            <>Are you sure you want to reactivate <strong>{displayName}&rsquo;s</strong> account? They will regain access to log in and manage properties.</>
                        ) : (
                            <>Are you sure you want to deactivate <strong>{displayName}&rsquo;s</strong> account? The host will no longer be able to log in or list a property.</>
                        )}
                    </p>

                    {!isDeactivated && (
                        <div className="mb-4 text-start">
                            <label
                                htmlFor="admin-host-deactivate-reason"
                                className="form-label text-white"
                            >
                                Reason:
                            </label>
                            <input
                                id="admin-host-deactivate-reason"
                                type="text"
                                className="form-control admin-host-deactivate-inputN bg-dark text-white border-secondary"
                                placeholder="Type Reason"
                                value={reason}
                                onChange={(event) => setReason(event.target.value)}
                                required
                            />
                        </div>
                    )}

                    <div className="d-flex flex-row justify-content-center align-items-center gap-3 mt-4">
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
                            className={`btn ${isDeactivated ? 'btn-success text-white' : 'btn-warning text-dark'} rounded-pill px-4 fw-semibold`}
                            disabled={loading}
                        >
                            {loading ? 'Processing...' : (isDeactivated ? 'Reactivate Account' : 'Deactivate Account')}
                        </button>
                    </div>
                </Modal.Body>
            </form>
        </Modal>
    )
}