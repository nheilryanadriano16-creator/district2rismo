import { useState, useEffect } from 'react'
import Modal from 'react-bootstrap/Modal'
import { doc, updateDoc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase'
import resortImage from '../../images/Bustos Hero.png'
import { HostAddProperty } from '../../pages/HostAddProperty.jsx'
import { resolveUploadUrl } from '../../utils/uploads'

export function AdminPropertyDetails({
    property,
    onBack,
    onReject,
    onApprove,
}) {
    const [submitting, setSubmitting] = useState(false)
    const [currentProperty, setCurrentProperty] = useState(property)
    const [pendingAction, setPendingAction] = useState(null)

    useEffect(() => {
        setCurrentProperty(property)
    }, [property])

    if (!currentProperty) {
        return (
            <section className="admin-property-detailsN container-fluid p-3 p-md-4 text-white">
                <p>No property selected.</p>
                <button
                    type="button"
                    className="btn btn-outline-light btn-sm"
                    onClick={onBack}
                >
                    Back to Properties
                </button>
            </section>
        )
    }

    const displayOwner = currentProperty.firstName && currentProperty.lastName
        ? `${currentProperty.firstName} ${currentProperty.lastName}`
        : currentProperty.owner || currentProperty.ownerName || 'Unknown Owner'

    const displayStatus = currentProperty.status || 'Pending'
    
    const propertyImage = resolveUploadUrl(currentProperty?.image ||
        currentProperty?.imageUrl || 
        currentProperty?.images?.[0] || 
        currentProperty?.mediaPhotos?.cover?.[0]?.preview || 
        currentProperty?.mediaPhotos?.cover?.[0]?.localPath || 
        currentProperty?.mediaPhotos?.cover?.[0]?.url ||
        currentProperty?.media?.cover?.[0]?.preview || 
        currentProperty?.media?.cover?.[0]?.localPath || 
        currentProperty?.media?.cover?.[0]?.url
    ) || resortImage

    const statusLower = displayStatus.toLowerCase()
    const isApproved = statusLower === 'approved' || statusLower === 'active'
    const isRejected = statusLower === 'rejected'
    const isHidden = statusLower === 'hidden'
    const isRemoved = statusLower === 'removed'
    const isRejectedOrHidden = isRejected || isHidden
    const actionLabels = {
        Removed: 'Remove',
        Hidden: 'Hide',
        Rejected: isHidden ? 'Unhide' : 'Reject',
        Approved: 'Approve',
        Revoked: 'Revoke Approval',
        Pending: 'Set Pending',
    }
    const actionDescriptions = {
        Removed: `Are you sure you want to remove ${currentProperty.name || 'this property'} from the admin property list? Its record will be retained.`,
        Hidden: `Are you sure you want to hide ${currentProperty.name || 'this property'} from public listings?`,
        Rejected: isHidden
            ? `Are you sure you want to unhide ${currentProperty.name || 'this property'}? It will return to the rejected properties list.`
            : `Are you sure you want to reject ${currentProperty.name || 'this property'}?`,
        Approved: `Are you sure you want to approve ${currentProperty.name || 'this property'}? It will become publicly visible.`,
        Revoked: `Are you sure you want to revoke approval for ${currentProperty.name || 'this property'}?`,
        Pending: `Are you sure you want to set ${currentProperty.name || 'this property'} back to pending?`,
    }
    const statusClass = statusLower === 'pending' 
        ? 'pending' 
        : isApproved 
            ? 'verified' 
            : ''

    const handleAction = async (newStatus) => {
        try {
            setSubmitting(true)
            if (currentProperty.id) {
                const docRef = doc(db, 'properties', currentProperty.id)

                if (newStatus === 'Approved') {
                    const docSnap = await getDoc(docRef)
                    const currentData = docSnap.data() || {}

                    await updateDoc(docRef, {
                        status: newStatus,
                        totalReservations: currentData.totalReservations ?? 0
                    })
                } else {
                    await updateDoc(docRef, { status: newStatus })
                }

                const hostId = currentProperty.hostId || currentProperty.userId || null
                const hostEmail = currentProperty.hostEmail || currentProperty.userEmail || currentProperty.email || null
                const propertyName = currentProperty.name || 'Your Property'

                let notifTitle = 'Property Update'
                let notifMessage = `Your property listing for "${propertyName}" status has been set to ${newStatus}.`

                if (newStatus === 'Approved') {
                    notifTitle = 'Property Approved!'
                    notifMessage = `Your property listing for "${propertyName}" has been approved and is now live!`
                } else if (newStatus === 'Rejected') {
                    notifTitle = 'Property Rejected'
                    notifMessage = `Your property listing for "${propertyName}" was rejected by the administrator.`
                } else if (newStatus === 'Removed') {
                    notifTitle = 'Property Removed'
                    notifMessage = `Your property listing for "${propertyName}" was removed from the admin property list.`
                } else if (newStatus === 'Hidden') {
                    notifTitle = 'Property Removed and Hidden'
                    notifMessage = `Your property listing for "${propertyName}" was removed from public view by the administrator.`
                } else if (newStatus === 'Revoked') {
                    notifTitle = 'Property Approval Revoked'
                    notifMessage = `Approval for your property "${propertyName}" has been revoked.`
                }

                await addDoc(collection(db, 'notifications'), {
                    userId: hostId,
                    userEmail: hostEmail,
                    title: notifTitle,
                    message: notifMessage,
                    propertyId: currentProperty.id,
                    read: false,
                    createdAt: serverTimestamp(),
                })
            }

            const updated = { ...currentProperty, status: newStatus }
            setCurrentProperty(updated)

            if (newStatus === 'Approved' && onApprove) {
                onApprove(updated)
            } else if (onReject) {
                onReject(updated)
            }
            return true
        } catch (err) {
            console.error('Error updating property status:', err)
            alert(`Failed to update property status: ${err.message}`)
            return false
        } finally {
            setSubmitting(false)
        }
    }

    const confirmPropertyAction = async () => {
        if (pendingAction && await handleAction(pendingAction)) {
            setPendingAction(null)
        }
    }

    return (
        <section className="admin-property-detailsN container-fluid p-3 p-md-4">
            <div className="d-flex align-items-center gap-2 fs-5 mb-3">
                <button
                    type="button"
                    className="admin-property-backN btn btn-link p-0 text-decoration-none text-white fs-5 fw-normal"
                    onClick={onBack}
                    disabled={submitting}
                >
                    Properties
                </button>
                <span className="text-white opacity-75 fs-6">&gt;</span>
                <span className="fs-5 fw-normal text-warning" style={{ color: '#FFB200' }}>
                    Property Details
                </span>
            </div>

            <header className="card admin-property-detail-headerN border-0 p-3 p-md-4 mb-3 bg-dark text-white">
                <div className="row align-items-center g-3">
                    <div className="col-auto">
                        <img
                            className="admin-property-detail-imageN rounded-2"
                            src={propertyImage}
                            alt=""
                            style={{ width: '100px', height: '80px', objectFit: 'cover' }}
                        />
                    </div>
                    <div className="col">
                        <h1 className="h2 mb-0 text-white">{currentProperty.name || 'Unnamed Property'}</h1>
                        <p className="text-warning mb-0">
                            Listed By: {displayOwner}
                        </p>
                    </div>
                    <div className="col-12 col-md-auto">
                        <span className={`badge rounded-pill admin-property-detail-statusN ${statusClass}`}>
                            {displayStatus}
                        </span>
                    </div>
                </div>
            </header>

            <HostAddProperty
                key={`${currentProperty.id}-${displayStatus}`}
                mode="review"
                property={{
                    ...currentProperty,
                    owner: displayOwner,
                    status: displayStatus,
                    image: propertyImage
                }}
                onBack={onBack}
                onReject={isRemoved ? undefined : () => setPendingAction(isRejectedOrHidden ? 'Removed' : isApproved ? 'Revoked' : 'Rejected')}
                onApprove={isRemoved ? undefined : () => (
                    isRejected
                        ? setPendingAction('Hidden')
                        : isHidden
                            ? setPendingAction('Rejected')
                            : setPendingAction(isApproved ? 'Pending' : 'Approved')
                )}
                approveText={isRejected ? 'Hide' : isHidden ? 'Unhide' : isApproved ? 'Set Pending' : 'Approve'}
                rejectText={isRejectedOrHidden ? 'Remove' : isApproved ? 'Revoke Approval' : 'Reject'}
            />

            <Modal
                show={Boolean(pendingAction)}
                onHide={() => {
                    if (!submitting) setPendingAction(null)
                }}
                centered
                dialogClassName="admin-suspend-dialogN"
                contentClassName="admin-suspend-modalN"
                aria-labelledby="admin-property-action-title"
            >
                <button
                    type="button"
                    className="admin-suspend-closeN"
                    aria-label="Close"
                    onClick={() => setPendingAction(null)}
                    disabled={submitting}
                >
                    <i className="bi bi-x-lg" aria-hidden="true" />
                </button>
                <Modal.Body className="admin-suspend-bodyN text-white">
                    <h2 id="admin-property-action-title" className="admin-suspend-titleN text-center fw-bold text-white mb-3">
                        {pendingAction === 'Rejected' && isHidden ? 'Unhide Property' : `${actionLabels[pendingAction]} Property`}
                    </h2>
                    <p className="text-center text-white mb-4">
                        {actionDescriptions[pendingAction]}
                    </p>
                    <div className="d-flex justify-content-center align-items-center gap-3 mt-4 w-100">
                        <button
                            type="button"
                            className="btn btn-outline-warning rounded-pill px-4"
                            onClick={() => setPendingAction(null)}
                            disabled={submitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            className="btn btn-warning text-dark rounded-pill px-4 fw-semibold"
                            onClick={confirmPropertyAction}
                            disabled={submitting}
                        >
                            {submitting ? 'Updating...' : actionLabels[pendingAction]}
                        </button>
                    </div>
                </Modal.Body>
            </Modal>
        </section>
    )
}