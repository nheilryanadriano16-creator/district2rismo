import { useState } from 'react'
import { AdminNavbar } from './AdminNavbar.jsx'
import { AdminHostRevoke } from './AdminHostRevoke.jsx'
import { AdminHostDeactivate } from './AdminHostDeactivate.jsx'
import { doc, updateDoc, deleteField, collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase'

export function AdminHostDetails({
    host,
    onBack,
    preview = false,
    onRevokeVerification,
    onDeactivateHost,
}) {
    const [showRevoke, setShowRevoke] = useState(false)
    const [showDeactivate, setShowDeactivate] = useState(false)
    const [loadingVerify, setLoadingVerify] = useState(false)
    const [currentStatus, setCurrentStatus] = useState(host?.status || 'Verified')

    const displayName = host?.firstName && host?.lastName 
        ? `${host.firstName} ${host.lastName}` 
        : host?.name || (host?.email ? host.email.split('@')[0] : 'Host')

    const isVerified = currentStatus.toLowerCase() === 'verified'
    const isDeactivated = currentStatus.toLowerCase() === 'deactivated'
    const hostProperties = host?.properties || []

    const handleVerifyHost = async () => {
        if (!host?.id) return

        try {
            setLoadingVerify(true)
            const hostRef = doc(db, 'users', host.id)
            await updateDoc(hostRef, {
                status: 'Verified',
                verifiedAt: new Date().toISOString(),
                revocationReason: deleteField(),
                revokedAt: deleteField()
            })

            await addDoc(collection(db, 'notifications'), {
                userId: host.id,
                userEmail: host.email || null,
                title: 'Host Verification Approved',
                message: 'Your host account status has been set to Verified. You can now list and manage properties.',
                read: false,
                createdAt: serverTimestamp(),
            })

            setCurrentStatus('Verified')
        } catch (err) {
            console.error('Error verifying host:', err)
            alert('Failed to verify host: ' + err.message)
        } finally {
            setLoadingVerify(false)
        }
    }

    return (
        <div className="admin-shellN">
            <AdminNavbar activeSection="Hosts" preview={preview} />
            <main className="container-fluid px-0">
                <div className="admin-content-scrollN flex-grow-1">
                    <section className="admin-host-detailN container-fluid p-3 p-md-4">
                        <nav aria-label="Breadcrumb" className="mb-3">
                            <ol className="breadcrumb small mb-0">
                                <li className="breadcrumb-item">
                                    <button type="button" className="admin-host-backN" onClick={onBack}>Hosts</button>
                                </li>
                                <li className="breadcrumb-item active" aria-current="page">Host Details</li>
                            </ol>
                        </nav>

                        <header className="card border-0 rounded-3 p-3 p-md-4 mb-3 admin-host-detail-headerN">
                            <div className="row align-items-center g-3">
                                <div className="col">
                                    <div className="d-flex align-items-center gap-3">
                                        <span className="admin-host-detail-avatarN rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" aria-hidden="true">
                                            {displayName.charAt(0).toUpperCase()}
                                        </span>
                                        <div>
                                            <h1 className="mb-1 text-white">{displayName}</h1>
                                            <p className="text-warning mb-0">{host?.email || '—'}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-12 col-md-auto">
                                    <span className="badge rounded-pill admin-host-detail-statusN">{currentStatus}</span>
                                </div>
                            </div>
                        </header>

                        <section className="admin-host-detail-panelN rounded-3 p-3 p-md-4 mb-3">
                            <h2 className="h5 fw-bold mb-3 text-white">Host Information</h2>
                            <dl className="row mb-0">
                                <dt className="col-sm-6 fw-normal py-2 text-white">Name</dt>
                                <dd className="col-sm-6 text-sm-end py-2 text-white">{displayName}</dd>
                                <dt className="col-sm-6 fw-normal py-2 text-white">Email</dt>
                                <dd className="col-sm-6 text-sm-end py-2 text-white">{host?.email || '—'}</dd>
                                <dt className="col-sm-6 fw-normal py-2 text-white">Phone</dt>
                                <dd className="col-sm-6 text-sm-end py-2 text-white">{host?.phone || '—'}</dd>
                                <dt className="col-sm-6 fw-normal py-2 text-white">Verification Status</dt>
                                <dd className="col-sm-6 text-sm-end text-warning py-2">{currentStatus}</dd>
                            </dl>
                        </section>

                        <section className="admin-host-detail-panelN admin-host-propertiesN rounded-3 p-3 p-md-4 mb-3">
                            <h2 className="h5 fw-bold mb-3 text-white">Properties</h2>
                            <div className="table-responsive">
                                <table className="table table-borderless align-middle admin-host-properties-tableN mb-0">
                                    <thead>
                                        <tr>
                                            <th scope="col" className="text-white">Property</th>
                                            <th scope="col" className="text-white">Location</th>
                                            <th scope="col" className="text-white">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {hostProperties.length > 0 ? (
                                            hostProperties.map((property, index) => (
                                                <tr key={property.id || index}>
                                                    <td className="text-white">{property.name || '—'}</td>
                                                    <td className="text-white">{property.location || '—'}</td>
                                                    <td className="text-white">{property.status || '—'}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="3" className="text-white text-center py-3">No properties listed for this host.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        <div className="d-flex flex-wrap justify-content-end gap-3">
                            <button 
                                type="button" 
                                className={`btn admin-user-account-buttonN ${isDeactivated ? 'btn-success text-white' : 'admin-host-deactivateN'}`} 
                                onClick={() => setShowDeactivate(true)}
                            >
                                {isDeactivated ? 'Reactivate Account' : 'Deactivate Account'}
                            </button>

                            {isVerified ? (
                                <button type="button" className="btn admin-host-revokeN admin-user-account-buttonN" onClick={() => setShowRevoke(true)}>
                                    Revoke Verification
                                </button>
                            ) : (
                                <button 
                                    type="button" 
                                    className="btn btn-success text-white admin-user-account-buttonN" 
                                    onClick={handleVerifyHost}
                                    disabled={loadingVerify}
                                >
                                    {loadingVerify ? 'Verifying...' : 'Verify Host'}
                                </button>
                            )}
                        </div>
                    </section>
                </div>
            </main>

            <AdminHostRevoke
                show={showRevoke}
                host={host}
                onHide={() => setShowRevoke(false)}
                onConfirm={(data) => {
                    onRevokeVerification?.(data)
                    setCurrentStatus('Unverified')
                }}
            />
            <AdminHostDeactivate
                show={showDeactivate}
                host={host}
                onHide={() => setShowDeactivate(false)}
                onConfirm={(data) => {
                    onDeactivateHost?.(data)
                    setCurrentStatus(data.action === 'reactivate' ? 'Active' : 'Deactivated')
                }}
            />
        </div>
    )
}