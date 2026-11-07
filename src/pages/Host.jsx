import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { HostNavBar } from '../components/HostSide/HostNavBar.jsx'
import Footer from '../components/Footer.jsx'
import { HostSideBarN } from '../components/HostSide/HostSideBarN.jsx'
import { HostDashboardN } from '../components/HostSide/HostDashboardN.jsx'
import { HostNotificationN } from '../components/HostSide/HostNotificationN.jsx'
import { HostPropertiesN } from '../components/HostSide/HostPropertiesN.jsx'
import { HostBookingsN } from '../components/HostSide/HostBookingsN.jsx'
import { HostBookingDetailsN } from '../components/HostSide/HostBookingDetailsN.jsx' // Import your details component
import { HostReviewsN } from '../components/HostSide/HostReviewsN.jsx'
import { HostEarningSummary } from '../components/HostSide/HostEarningSummary.jsx'
import { HostAddProperty } from './HostAddProperty.jsx'
import { HostViewProperty } from '../components/HostSide/ViewPropertyDetails/HostViewProperty.jsx'
import { HostSettingsN } from '../components/HostSide/HostSettingsN.jsx'
import { HostHelp } from '../components/HostSide/HostHelp.jsx'
import { deleteHostProperty } from '../utils/hostData'

export function HostN({ initialSection = 'Dashboard', preview = false }) {
    const { state: routeState } = useLocation()
    const [selectedSection, setSelectedSection] = useState(routeState?.section || initialSection)
    const [selectedProperty, setSelectedProperty] = useState(routeState?.property || null)
    const [selectedBooking, setSelectedBooking] = useState(null) // Added booking state
    const [bookingsInitialFilter, setBookingsInitialFilter] = useState('All')
    const navigate = useNavigate()
    const { logout } = useAuth()

    useEffect(() => {
        if (routeState?.section) setSelectedSection(routeState.section)
        if (routeState?.property) setSelectedProperty(routeState.property)
    }, [routeState])

    const showBookingDetails = (booking) => {
        setSelectedBooking(booking)
        setSelectedSection('Booking Details') // Switch view to booking details
    }

    const showPendingBookings = () => {
        setBookingsInitialFilter('Pending')
        setSelectedSection('Bookings')
    }

    const handleViewProperty = (property) => {
        setSelectedProperty(property)
        setSelectedSection('View Property')
    }

    const handleReturnToProperties = () => {
        setSelectedProperty(null)
        setSelectedSection('Properties')
    }

    const handleDeleteProperty = async (propertyToDelete) => {
        const target = propertyToDelete || selectedProperty
        if (!target?.id) return
        if (!window.confirm(`Are you sure you want to delete "${target.name}"? This action cannot be undone.`)) {
            return
        }
        try {
            await deleteHostProperty(target.id)
            handleReturnToProperties()
        } catch (error) {
            console.error('Error deleting property:', error)
        }
    }

    const isFullWidth = selectedSection === 'Add Property' || selectedSection === 'View Property' || selectedSection === 'Edit Property'

    return (
        <div className="account-pageN">
            <HostNavBar
                activeSection={selectedSection}
                onSelect={setSelectedSection}
                preview={preview}
            />

            <main className="account-mainN container-fluid px-0">
                <div className="row g-0">
                    {!isFullWidth && (
                        <div className="d-none d-lg-block col-lg-3">
                            <HostSideBarN
                                activeSection={selectedSection === 'Booking Details' ? 'Bookings' : selectedSection}
                                onSelect={setSelectedSection}
                                onLogout={async () => {
                                    await logout()
                                    navigate('/', { replace: true })
                                }}
                            />
                        </div>
                    )}

                    <div className={isFullWidth ? 'col-12' : 'col-12 col-lg-9'}>
                        {selectedSection === 'Dashboard' ? (
                            <HostDashboardN
                                onViewBookings={() => {
                                    setBookingsInitialFilter('All')
                                    setSelectedSection('Bookings')
                                }}
                                onViewProperties={() => setSelectedSection('Properties')}
                                onViewPendingRequests={showPendingBookings}
                            />
                        ) : selectedSection === 'Notifications' ? (
                            <HostNotificationN />
                        ) : selectedSection === 'Properties' ? (
                            <HostPropertiesN
                                onAddProperty={() => setSelectedSection('Add Property')}
                                onViewProperty={handleViewProperty}
                                onDeleteProperty={handleDeleteProperty}
                            />
                        ) : selectedSection === 'Bookings' ? (
                            <HostBookingsN
                                onViewBooking={showBookingDetails}
                                initialFilter={bookingsInitialFilter}
                            />
                        ) : selectedSection === 'Booking Details' ? (
                            <HostBookingDetailsN
                                booking={selectedBooking}
                                onBack={() => setSelectedSection('Bookings')}
                                onConfirm={() => {
                                    // Handle confirmation logic here
                                    alert('Booking confirmed!')
                                    setSelectedSection('Bookings')
                                }}
                                onReject={() => {
                                    // Handle rejection logic here
                                    alert('Booking rejected.')
                                    setSelectedSection('Bookings')
                                }}
                            />
                        ) : selectedSection === 'Reviews' ? (
                            <HostReviewsN />
                        ) : selectedSection === 'Earnings Summary' ? (
                            <HostEarningSummary />
                        ) : selectedSection === 'Add Property' ? (
                            <HostAddProperty
                                onBack={handleReturnToProperties}
                                onExit={handleReturnToProperties}
                            />
                        ) : selectedSection === 'Edit Property' ? (
                            <HostAddProperty
                                mode="edit"
                                property={selectedProperty}
                                onBack={() => setSelectedSection('View Property')}
                                onExit={handleReturnToProperties}
                            />
                        ) : selectedSection === 'View Property' ? (
                            <HostViewProperty
                                property={selectedProperty}
                                onBack={handleReturnToProperties}
                                onViewBookings={() => setSelectedSection('Bookings')}
                                onViewReviews={() => setSelectedSection('Reviews')}
                                onEdit={() => setSelectedSection('Edit Property')}
                                onDelete={() => handleDeleteProperty(selectedProperty)}
                            />
                        ) : selectedSection === 'Settings' ? (
                            <HostSettingsN />
                        ) : selectedSection === 'Help' ? (
                            <HostHelp />
                        ) : null}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}

export default HostN