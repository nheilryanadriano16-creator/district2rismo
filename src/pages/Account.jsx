import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import NavBarDetails from '../components/NavBarDetails.jsx'
import Footer from '../components/Footer.jsx'
import { SideBarN } from '../components/Account/SideBarN.jsx'
import { EditProfileN } from '../components/Account/EditProfileN.jsx'
import { NotificationsN, temporaryNotifications } from '../components/Account/NotificationsN.jsx'
import { MyReservationN } from '../components/Account/MyReservationN.jsx'
import { DestinationToReviewN } from '../components/Account/DestinationToReviewN.jsx'
import { SettingsN } from '../components/Account/SettingsN.jsx'
import { HelpN } from '../components/Account/HelpN.jsx'

const mobileTitles = {
    Profile: 'My Profile',
    Notifications: 'Notifications',
    'My Reservation': 'My Reservations',
    'Destinations to Review': 'Destinations to Review',
    Settings: 'Settings',
    Help: 'Help & Information',
}

function Account() {
    const location = useLocation()
    const requestedSection = location.state?.section

    const [selectedSection, setSelectedSection] = useState(requestedSection || 'Profile')
    const [mobileSectionOpen, setMobileSectionOpen] = useState(
        requestedSection === 'Notifications'
    )

    useEffect(() => {
        if (location.state?.section) {
            setSelectedSection(location.state.section)
            setMobileSectionOpen(true)
        }
    }, [location.state])
    const unreadNotificationCount = temporaryNotifications.length

    const handleSectionSelect = (section) => {
        setSelectedSection(section)
        setMobileSectionOpen(true)
    }

    return (
        <div className="account-pageN">
            <NavBarDetails />
            <main className="account-mainN container-fluid px-0">
                <div className="row g-0">
                    <div className={`col-12 col-lg-3 ${mobileSectionOpen ? 'd-none d-lg-block' : ''}`}>
                        <SideBarN
                            activeSection={selectedSection}
                            onSelect={handleSectionSelect}
                            notificationCount={unreadNotificationCount}
                        />
                    </div>
                    <div className={`col-12 col-lg-9 ${mobileSectionOpen ? '' : 'd-none d-lg-block'}`}>
                        {mobileSectionOpen && (
                            <header className="d-flex d-lg-none flex-column align-items-start gap-2 px-3 pt-3 pb-2 account-mobile-headerN">
                                <button
                                    type="button"
                                    className="btn btn-link text-white text-decoration-none p-0"
                                    aria-label="Back to account navigation"
                                    onClick={() => setMobileSectionOpen(false)}
                                >
                                    <i className="bi bi-arrow-left fs-2" aria-hidden="true" />
                                </button>
                                <h1 className="h3 fw-bold text-warning mb-0">{mobileTitles[selectedSection]}</h1>
                            </header>
                        )}
                        <div className="account-mobile-contentN">
                            {selectedSection === 'Notifications'
                                ? <NotificationsN notifications={temporaryNotifications} />
                                : selectedSection === 'My Reservation'
                                    ? <MyReservationN />
                                    : selectedSection === 'Destinations to Review'
                                        ? <DestinationToReviewN />
                                        : selectedSection === 'Profile'
                                            ? <EditProfileN />
                                            : selectedSection === 'Settings'
                                                ? <SettingsN />
                                                : selectedSection === 'Help'
                                                    ? <HelpN />
                                                    : null}
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    )
}

export default Account
