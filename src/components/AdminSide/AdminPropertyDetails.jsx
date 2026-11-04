import { useState } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import resortImage from '../../images/Bustos Hero.png'
import { HostAddProperty } from '../../pages/HostAddProperty.jsx'

export function AdminPropertyDetails({
    property,
    onBack,
    onReject,
    onApprove,
}) {
    const [submitting, setSubmitting] = useState(false)

    if (!property) {
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

    const displayOwner = property.firstName && property.lastName
        ? `${property.firstName} ${property.lastName}`
        : property.owner || property.ownerName || 'Unknown Owner'

    const displayStatus = property.status || 'Pending'
    const propertyImage = property.image || property.imageUrl || (property.images && property.images[0]) || resortImage

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
            if (property.id) {
                const docRef = doc(db, 'properties', property.id)
                await updateDoc(docRef, { status: newStatus })
            }
            if (newStatus === 'Approved' && onApprove) {
                onApprove({ ...property, status: newStatus })
            } else if (newStatus === 'Pending' && onReject) {
                onReject({ ...property, status: newStatus })
            } else if (onBack) {
                onBack()
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
                        <h1 className="h2 mb-0 text-white">{property.name || 'Unnamed Property'}</h1>
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
                mode="review"
                property={{
                    ...property,
                    owner: displayOwner,
                    status: displayStatus,
                    image: propertyImage
                }}
                onBack={onBack}
                onReject={isApproved ? undefined : () => handleAction('Rejected')}
                onApprove={() => handleAction(isApproved ? 'Pending' : 'Approved')}
                approveText={isApproved ? 'Revoke' : 'Approve'}
                rejectText="Reject"
            />
        </section>
    )
}