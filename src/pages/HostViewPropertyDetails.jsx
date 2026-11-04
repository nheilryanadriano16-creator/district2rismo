import { useLocation, useNavigate } from 'react-router-dom'
import Footer from '../components/Footer.jsx'
import { HostNavBar } from '../components/HostSide/HostNavBar.jsx'
import { HostViewProperty } from '../components/HostSide/ViewPropertyDetails/HostViewProperty.jsx'
import { deleteHostProperty } from '../utils/hostData'
import { useNotification } from '../context/NotificationContext'

export function HostViewPropertyPage() {
    const { state } = useLocation()
    const navigate = useNavigate()
    const property = state?.property
    const { showNotification } = useNotification()

    const handleDelete = async () => {
        if (!property?.id) return
        if (!window.confirm(`Delete ${property.name}? This cannot be undone.`)) return
        try {
            await deleteHostProperty(property.id)
            showNotification('Property deleted.', 'success')
            navigate('/host/properties')
        } catch (error) {
            console.error('Error deleting property:', error)
            showNotification('Could not delete this property.', 'danger')
        }
    }

    return (
        <div className="account-pageN">
            <HostNavBar
                activeSection="View Property"
                onSelect={(section) => navigate('/host', { state: { section } })}
            />

            <main className="account-mainN container-fluid px-0">
                {property ? (
                    <HostViewProperty
                        property={property}
                        onBack={() => navigate('/host/properties')}
                        onEdit={() => navigate('/host/edit-property', { state: { property } })}
                        onViewBookings={() => navigate('/host', { state: { section: 'Bookings' } })}
                        onViewReviews={() => navigate('/host', { state: { section: 'Reviews' } })}
                        onDelete={handleDelete}
                    />
                ) : (
                    <div className="container py-5 text-light" role="alert">
                        Property details are missing. Return to Properties and select a property.
                    </div>
                )}
            </main>

            <Footer />
        </div>
    )
}
