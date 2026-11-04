import { useLocation, useNavigate } from 'react-router-dom'
import Footer from '../components/Footer.jsx'
import { HostNavBar } from '../components/HostSide/HostNavBar.jsx'
import { HostBookingDetailsN } from '../components/HostSide/HostBookingDetailsN.jsx'
import { useAuth } from '../context/AuthContext'
import { useNotification } from '../context/NotificationContext'
import { updateHostReservationStatus } from '../utils/hostData'

export function ConfirmBooking() {
    const { state } = useLocation()
    const navigate = useNavigate()
    const booking = state?.booking
    const { currentUser } = useAuth()
    const { showNotification } = useNotification()

    const handleStatus = async (status) => {
        if (!booking?.id) {
            showNotification('Booking details are missing.', 'danger')
            return
        }
        try {
            await updateHostReservationStatus(booking, status, currentUser?.uid)
            showNotification(`Booking ${status.toLowerCase()}.`, 'success')
            navigate('/host/bookings')
        } catch (error) {
            console.error('Error updating booking:', error)
            showNotification('Could not update this booking.', 'danger')
        }
    }

    return (
        <div className="account-pageN">
            <HostNavBar
                activeSection="Confirm Booking"
                onSelect={(section) => navigate('/host', { state: { section } })}
            />

            <main className="account-mainN container-fluid px-0">
                <div className="row g-0">
                    <div className="col-12">
                        {booking ? (
                            <HostBookingDetailsN
                                booking={booking}
                                onBack={() => navigate('/host/bookings')}
                                onConfirm={() => handleStatus('Accepted')}
                                onReject={() => handleStatus('Rejected')}
                            />
                        ) : (
                            <div className="container py-5 text-light" role="alert">
                                Booking details are missing. Return to Bookings and select a booking.
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}
