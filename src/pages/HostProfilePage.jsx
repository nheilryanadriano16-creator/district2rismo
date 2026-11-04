import { useNavigate } from 'react-router-dom'
import Footer from '../components/Footer.jsx'
import { HostNavBar } from '../components/HostSide/HostNavBar.jsx'
import { HostMyProfile } from '../components/HostSide/HostMyProfile.jsx'

export function HostMyProfilePage({ preview = false }) {
    const navigate = useNavigate()

    return (
        <div className="account-pageN">
            <HostNavBar
                activeSection="My Profile"
                preview={preview}
                onSelect={(section) => navigate(preview ? '/host-preview' : '/host', { state: { section } })}
            />
            <main className="account-mainN container-fluid px-0">
                <HostMyProfile />
            </main>
            <Footer />
        </div>
    )
}