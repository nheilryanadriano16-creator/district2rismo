import { useState, useEffect } from 'react'
import Modal from 'react-bootstrap/Modal'
import { doc, updateDoc, deleteField } from 'firebase/firestore'
import { db } from '../../firebase'

export function AdminUserDeactivate({ show, user, onHide, onConfirm }) {
    const [reason, setReason] = useState('')
    const [loading, setLoading] = useState(false)

    const isDeactivated = user?.status?.toLowerCase() === 'deactivated'

    const displayName = user?.firstName && user?.lastName 
        ? `${user.firstName} ${user.lastName}` 
        : user?.name || user?.email || 'User'

    useEffect(() => {
        if (!show) {
            setReason('')
            setLoading(false)
        }
    }, [show])

    const handleSubmit = async (event) => {
        event.preventDefault()
        if (!user?.id) {
            console.error('User ID is missing, cannot update Firestore.')
            alert('Error: User ID is missing.')
            return
        }

        try {
            setLoading(true)
            const userRef = doc(db, 'users', user.id)

            if (isDeactivated) {
                await updateDoc(userRef, {
                    status: 'Active',
                    deactivationReason: deleteField(),
                    deactivatedAt: deleteField()
                })
            } else {
                await updateDoc(userRef, {
                    status: 'Deactivated',
                    deactivationReason: reason,
                    deactivatedAt: new Date().toISOString()
                })
            }

            onConfirm?.({ user, reason, action: isDeactivated ? 'reactivate' : 'deactivate' })
            onHide()
        } catch (err) {
            console.error('Error updating user deactivation status:', err)
            alert('Failed to update user status: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    if (!user) return null

    return (
        <Modal
            show={show}
            onHide={onHide}
            centered
            dialogClassName="admin-deactivate-dialogN"
            contentClassName="admin-deactivate-modalN"
            aria-labelledby="admin-deactivate-title"
        >
            <button
                type="button"
                className="admin-deactivate-closeN"
                aria-label="Close"
                onClick={onHide}
            >
                <i className="bi bi-x-lg" aria-hidden="true" />
            </button>

            <form onSubmit={handleSubmit}>
                <Modal.Body className="admin-deactivate-bodyN text-white">
                    <h2 id="admin-deactivate-title" className="admin-deactivate-titleN text-center fw-bold text-white mb-3">
                        {isDeactivated ? 'Reactivate Account' : 'Deactivate Account'}
                    </h2>

                    <p className="admin-deactivate-messageN text-center text-white mb-4">
                        {isDeactivated ? (
                            <>Are you sure you want to reactivate <strong>{displayName}&rsquo;s</strong> account? The user will regain access to log in and make reservations.</>
                        ) : (
                            <>Are you sure you want to deactivate <strong>{displayName}&rsquo;s</strong> account? The user will no longer be able to log in or make new reservations.</>
                        )}
                    </p>

                    {!isDeactivated && (
                        <div className="mb-4 text-start">
                            <label htmlFor="admin-deactivate-reason" className="form-label text-white">
                                Reason:
                            </label>
                            <input
                                id="admin-deactivate-reason"
                                type="text"
                                className="form-control admin-deactivate-inputN bg-dark text-white border-secondary"
                                placeholder="Type Reason"
                                value={reason}
                                onChange={(event) => setReason(event.target.value)}
                                required
                            />
                        </div>
                    )}

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