import { useState, useEffect } from 'react'
import Modal from 'react-bootstrap/Modal'
import { doc, updateDoc, deleteField, collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase'

const suspensionReasons = [
    'Violation of Terms of Service',
    'Suspicious Account Activity',
    'Reported by Another User',
    'Other',
]

const suspensionDurations = ['7 Days', '30 Days', 'Indefinitely']

export function AdminUserSuspend({ show, user, onHide, onConfirm }) {
    const [selectedReason, setSelectedReason] = useState('')
    const [reason, setReason] = useState('')
    const [duration, setDuration] = useState('')
    const [loading, setLoading] = useState(false)

    const isSuspended = user?.status?.toLowerCase() === 'suspended'

    const displayName = user?.firstName && user?.lastName 
        ? `${user.firstName} ${user.lastName}` 
        : user?.name || user?.email || 'User'

    useEffect(() => {
        if (!show) {
            setSelectedReason('')
            setReason('')
            setDuration('')
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

            if (isSuspended) {
                await updateDoc(userRef, {
                    status: 'Active',
                    suspensionCategory: deleteField(),
                    suspensionReason: deleteField(),
                    suspensionDuration: deleteField(),
                    suspendedAt: deleteField()
                })

                await addDoc(collection(db, 'notifications'), {
                    userId: user.id,
                    userEmail: user.email || null,
                    title: 'Suspension Lifted',
                    message: 'The suspension on your account has been lifted. You can now access your account.',
                    read: false,
                    createdAt: serverTimestamp(),
                })
            } else {
                await updateDoc(userRef, {
                    status: 'Suspended',
                    suspensionCategory: selectedReason,
                    suspensionReason: reason,
                    suspensionDuration: duration,
                    suspendedAt: new Date().toISOString()
                })

                await addDoc(collection(db, 'notifications'), {
                    userId: user.id,
                    userEmail: user.email || null,
                    title: 'Account Suspended',
                    message: `Your account has been suspended for ${duration}. Category: ${selectedReason}. Reason: ${reason}`,
                    read: false,
                    createdAt: serverTimestamp(),
                })
            }

            onConfirm?.({ user, action: isSuspended ? 'unsuspend' : 'suspend' })
            onHide()
        } catch (err) {
            console.error('Error updating user suspension status:', err)
            alert('Failed to update suspension status: ' + err.message)
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
            dialogClassName="admin-suspend-dialogN"
            contentClassName="admin-suspend-modalN admin-themed-modalN"
            aria-labelledby="admin-suspend-title"
        >
            <button
                type="button"
                className="admin-suspend-closeN"
                aria-label="Close"
                onClick={onHide}
            >
                <i className="bi bi-x-lg" aria-hidden="true" />
            </button>

            <form onSubmit={handleSubmit}>
                <Modal.Body className="admin-suspend-bodyN text-white">
                    <h2 id="admin-suspend-title" className="admin-suspend-titleN text-center fw-bold text-white mb-3">
                        {isSuspended ? 'Lift Suspension' : 'Suspend Account'}
                    </h2>

                    <p className="text-center text-white mb-4">
                        {isSuspended ? (
                            <>Are you sure you want to lift the suspension for <strong>{displayName}</strong>? They will regain immediate access to their account.</>
                        ) : (
                            <>Why are you suspending <strong>{displayName}&rsquo;s</strong> account?</>
                        )}
                    </p>

                    {!isSuspended && (
                        <>
                            <label className="form-label text-white" htmlFor="admin-suspend-reason-select">
                                Select Reason Category:
                            </label>
                            <select
                                id="admin-suspend-reason-select"
                                className="form-select admin-suspend-selectN mb-4"
                                value={selectedReason}
                                onChange={(event) => setSelectedReason(event.target.value)}
                                required
                            >
                                <option value="" disabled>Select Reason</option>
                                {suspensionReasons.map((option) => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>

                            <label htmlFor="admin-suspend-reason" className="form-label text-white">
                                Specific Reason Details:
                            </label>
                            <input
                                id="admin-suspend-reason"
                                type="text"
                                className="form-control admin-suspend-inputN mb-4"
                                placeholder="Type Reason"
                                value={reason}
                                onChange={(event) => setReason(event.target.value)}
                                required
                            />

                            <fieldset className="mb-4">
                                <legend className="form-label text-white mb-2 fs-6">Duration:</legend>
                                {suspensionDurations.map((option) => (
                                    <div className="form-check admin-suspend-radioN" key={option}>
                                        <input
                                            className="form-check-input"
                                            type="radio"
                                            name="admin-suspend-duration"
                                            id={`admin-suspend-duration-${option.replace(/\s+/g, '-').toLowerCase()}`}
                                            value={option}
                                            checked={duration === option}
                                            onChange={(event) => setDuration(event.target.value)}
                                            required
                                        />
                                        <label
                                            className="form-check-label text-white"
                                            htmlFor={`admin-suspend-duration-${option.replace(/\s+/g, '-').toLowerCase()}`}
                                        >
                                            {option}
                                        </label>
                                    </div>
                                ))}
                            </fieldset>
                        </>
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
                            className={`btn ${isSuspended ? 'btn-success text-white' : 'btn-warning text-dark'} rounded-pill px-4 fw-semibold`}
                            disabled={loading}
                        >
                            {loading ? 'Processing...' : (isSuspended ? 'Lift Suspension' : 'Suspend Account')}
                        </button>
                    </div>
                </Modal.Body>
            </form>
        </Modal>
    )
}