import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Modal from 'react-bootstrap/Modal'
import { useAuth } from '../../context/AuthContext'

export const HostAccountPrompt = ({ show, onHide }) => {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const { enableHostAccount } = useAuth()
    const navigate = useNavigate()

    const handleApply = async () => {
        setError('')
        setLoading(true)
        try {
            await enableHostAccount()
            onHide()
            navigate('/host', { replace: true })
        } catch (applyError) {
            console.error('Unable to create host account:', applyError)
            setError(applyError.message || 'Unable to create host access. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal show={show} onHide={onHide} centered contentClassName="nav-profile-modalN">
            <Modal.Header closeButton closeVariant="white">
                <Modal.Title className="nav-profile-titleN">List your property</Modal.Title>
            </Modal.Header>
            <Modal.Body className="nav-profile-bodyN">
                <p>
                    Create host access with your current account and email. Your customer account will stay
                    available, and your host profile will be sent for verification before you can list a property.
                </p>
                {error && <div className="alert alert-danger py-2" role="alert">{error}</div>}
                <div className="d-flex justify-content-end gap-2">
                    <button type="button" className="btn btn-outline-light" onClick={onHide} disabled={loading}>
                        Not now
                    </button>
                    <button type="button" className="btn btn-warning fw-bold" onClick={handleApply} disabled={loading}>
                        {loading ? 'Setting up...' : 'Yes, continue'}
                    </button>
                </div>
            </Modal.Body>
        </Modal>
    )
}
