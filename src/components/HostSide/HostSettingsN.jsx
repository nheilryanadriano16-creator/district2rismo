import { useState } from 'react'

export const HostSettingsN = ({ onChangePassword }) => {
    const [darkMode, setDarkMode] = useState(true)

    return (
        <section className="profile-panelN container-fluid p-3 p-md-4 text-white">
            <h1 className="h2 fw-bold settings-titleN mb-4">Settings</h1>

            <div className="mb-4">
                <h2 className="small settings-section-labelN mb-2">Security</h2>
                <button
                    type="button"
                    className="btn btn-warning rounded-pill text-nowrap settings-password-btnN"
                    onClick={onChangePassword}
                >
                    Change Password
                </button>
            </div>

            
        </section>
    )
}