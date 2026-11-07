import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { saveHostProfile } from '../../utils/hostData'
import { useNotification } from '../../context/NotificationContext'
import {
    getMaxDateForAge,
    isAdultDateOfBirth,
    isValidPhoneNumber,
    validateProfileDetails,
} from '../../utils/profileValidation'

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
    const [validationError, setValidationError] = useState('')
    const [maxDateOfBirth] = useState(() => getMaxDateForAge())
    const invalidDateOfBirth = Boolean(validationError && !isAdultDateOfBirth(draft.dateOfBirth))
    const invalidPhoneNumber = Boolean(validationError && !isValidPhoneNumber(draft.phoneNumber))

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
        const nextValue = name === 'phoneNumber' ? value.replace(/\D/g, '').slice(0, 15) : value
        setDraft((current) => ({ ...current, [name]: nextValue }))
        setValidationError('')
    }

    const handleSave = async () => {
        const error = validateProfileDetails(draft)
        if (error) {
            setValidationError(error)
            showNotification(error, 'danger')
            return
        }

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
                            max={field.name === 'dateOfBirth' ? maxDateOfBirth : undefined}
                            required={isEditing && ['dateOfBirth', 'phoneNumber'].includes(field.name)}
                            pattern={field.name === 'phoneNumber' ? String.raw`\d{7,15}` : undefined}
                            maxLength={field.name === 'phoneNumber' ? 15 : undefined}
                            title={field.name === 'phoneNumber' ? 'Enter a phone number using 7 to 15 digits only.' : undefined}
                            inputMode={field.name === 'phoneNumber' ? 'numeric' : undefined}
                            aria-invalid={field.name === 'dateOfBirth'
                                ? invalidDateOfBirth
                                : field.name === 'phoneNumber'
                                    ? invalidPhoneNumber
                                    : undefined}
                        />
                    </div>
                ))}

                {validationError && (
                    <div className="col-12">
                        <p className="text-danger mb-0" role="alert">{validationError}</p>
                    </div>
                )}

                <div className="col-12 col-md-6 offset-md-6 d-flex justify-content-end gap-2">
                    {isEditing ? (
                        <>
                            <button
                                className="btn btn-outline-light rounded-pill px-4 fw-semibold"
                                type="button"
                                onClick={() => {
                                    setDraft(profile)
                                    setIsEditing(false)
                                    setValidationError('')
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
                                setValidationError('')
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