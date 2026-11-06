import { useState, useEffect } from 'react'
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
        } catch (err) {
            console.error('Error updating property status:', err)
        } finally {
            setSubmitting(false)
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
                onReject={() => handleAction(isApproved ? 'Revoked' : 'Rejected')}
                onApprove={() => handleAction(isApproved ? 'Pending' : 'Approved')}
                approveText={isApproved ? 'Set Pending' : 'Approve'}
                rejectText={isApproved ? 'Revoke Approval' : 'Reject'}
            />
        </section>
    )
}