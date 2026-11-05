import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { saveHostProfile } from '../../utils/hostData'
import { useNotification } from '../../context/NotificationContext'

const emptyProfile = {
    firstName: '',
    dateOfBirth: '',
    lastName: '',
    phoneNumber: '',
}

export function HostMyProfile() {
    const { currentUser, userData, updateUserData } = useAuth()
    const { showNotification } = useNotification()
    const [profile, setProfile] = useState(emptyProfile)
    const [draft, setDraft] = useState(emptyProfile)
    const [isEditing, setIsEditing] = useState(false)

    useEffect(() => {
        const nextProfile = {
            firstName: userData?.firstName || '',
            lastName: userData?.lastName || '',
            dateOfBirth: userData?.dateOfBirth || '',
            phoneNumber: userData?.phoneNumber || '',
        }
        setProfile(nextProfile)
        setDraft(nextProfile)
    }, [userData])

    const handleChange = (event) => {
        const { name, value } = event.target
        setDraft((current) => ({ ...current, [name]: value }))
    }

    const handleSave = async () => {
        try {
            await saveHostProfile(currentUser?.uid, draft)
            setProfile(draft)
            updateUserData?.(draft)
            setIsEditing(false)
            showNotification('Profile updated.', 'success')
        } catch (error) {
            console.error('Error saving host profile:', error)
            showNotification(error.message || 'Could not save profile.', 'danger')
        }
    }

    const fields = [
        { label: 'First Name', name: 'firstName', type: 'text', autoComplete: 'given-name' },
        { label: 'Date of Birth', name: 'dateOfBirth', type: 'date', autoComplete: 'bday' },
        { label: 'Last Name', name: 'lastName', type: 'text', autoComplete: 'family-name' },
        { label: 'Phone Number', name: 'phoneNumber', type: 'tel', autoComplete: 'tel' },
    ]

    return (
        <section className="profile-panelN container-fluid p-3 p-md-4 p-lg-5 text-white">
            <h1 className="h2 fw-bold profile-titleN mb-4">My Profile</h1>

            <div className="row g-3 g-lg-4">
                {fields.map((field) => (
                    <div className="col-12 col-md-6" key={field.name}>
                        <label
                            className="form-label profile-labelN mb-1"
                            htmlFor={`host-profile-${field.name}`}
                        >
                            {field.label}
                        </label>
                        <input
                            id={`host-profile-${field.name}`}
                            className="form-control profile-inputN"
                            type={field.type}
                            name={field.name}
                            value={draft[field.name]}
                            onChange={handleChange}
                            readOnly={!isEditing}
                            autoComplete={field.autoComplete}
                        />
                    </div>
                ))}

                <div className="col-12 col-md-6 offset-md-6 d-flex justify-content-end gap-2">
                    {isEditing ? (
                        <>
                            <button
                                className="btn btn-outline-light rounded-pill px-4 fw-semibold"
                                type="button"
                                onClick={() => {
                                    setDraft(profile)
                                    setIsEditing(false)
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-warning rounded-pill px-5 fw-semibold"
                                type="button"
                                onClick={handleSave}
                            >
                                Save
                            </button>
                        </>
                    ) : (
                        <button
                            className="btn btn-warning rounded-pill px-5 fw-semibold"
                            type="button"
                            onClick={() => {
                                setDraft(profile)
                                setIsEditing(true)
                            }}
                        >
                            Edit
                        </button>
                    )}
                </div>
            </div>
        </section>
    )
}