import { useState } from 'react'
import Modal from 'react-bootstrap/Modal'
import { doc, deleteDoc, updateDoc, Timestamp } from 'firebase/firestore'
import { db } from '../../firebase'

const deletionReasons = [
    'Spam or advertising',
    'Inappropriate or offensive content',
    'False or misleading information',
    'Other',
]

export function AdminReviewDelete({ show, review, onHide, onConfirm }) {
    const [reason, setReason] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const closeModal = () => {
        setReason('')
        setSubmitting(false)
        onHide()
    }

    const handleSubmit = async (event) => {
        event.preventDefault()
        if (!review?.id) return

        try {
            setSubmitting(true)
            
            // Delete the review document from Firestore
            await deleteDoc(doc(db, 'reviews', review.id))

            // Pass confirmation back up if parent callback exists
            onConfirm?.({ review, reason })
            closeModal()
        } catch (err) {
            console.error('Error deleting review from Firestore:', err)
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Modal
            show={show}
            onHide={closeModal}
            centered
            dialogClassName="admin-suspend-dialogN"
            contentClassName="admin-suspend-modalN"
            aria-labelledby="admin-review-delete-title"
        >
            <button type="button" className="admin-suspend-closeN" aria-label="Close" onClick={closeModal} disabled={submitting}>
                <i className="bi bi-x-lg" aria-hidden="true" />
            </button>
            <form onSubmit={handleSubmit}>
                <Modal.Body className="admin-review-delete-bodyN">
                    <h2 id="admin-review-delete-title" className="admin-suspend-titleN text-center fw-bold">Delete Comment</h2>
                    <p className="text-center mb-4">
                        Are you sure you want to delete this comment? This action will permanently remove the comment from the property page and cannot be undone.
                    </p>
                    <label htmlFor="admin-review-delete-reason" className="form-label">Reason for Deletion:</label>
                    <select
                        id="admin-review-delete-reason"
                        className="form-select admin-review-delete-selectN mb-4"
                        value={reason}
                        onChange={(event) => setReason(event.target.value)}
                        required
                        disabled={submitting}
                    >
                        <option value="" disabled>Select Reason</option>
                        {deletionReasons.map((item) => <option key={item} value={item}>{item}</option>)}
                    </select>
                    <div className="d-flex flex-column flex-sm-row justify-content-center gap-2">
                        <button type="button" className="btn admin-suspend-cancelN" onClick={closeModal} disabled={submitting}>Cancel</button>
                        <button type="submit" className="btn admin-suspend-confirmN" disabled={submitting}>
                            {submitting ? 'Deleting...' : 'Delete Comment'}
                        </button>
                    </div>
                </Modal.Body>
            </form>
        </Modal>
    )
}