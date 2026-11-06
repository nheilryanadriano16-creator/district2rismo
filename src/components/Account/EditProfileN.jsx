import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase'

export const EditProfileN = () => {
    const { currentUser, userData } = useAuth()
    const [profile, setProfile] = useState({
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        phoneNumber: '',
    })
    const [draft, setDraft] = useState(profile)
    const [isEditing, setIsEditing] = useState(false)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        async function loadProfile() {
            if (!currentUser?.uid) return
            try {
                const userDoc = await getDoc(doc(db, 'users', currentUser.uid))
                if (userDoc.exists()) {
                    const data = userDoc.data()
                    const initial = {
                        firstName: data.firstName || '',
                        lastName: data.lastName || '',
                        dateOfBirth: data.dateOfBirth || '',
                        phoneNumber: data.phoneNumber || data.phone || '',
                    }
                    setProfile(initial)
                    setDraft(initial)
                } else if (userData) {
                    const initial = {
                        firstName: userData.firstName || '',
                        lastName: userData.lastName || '',
                        dateOfBirth: userData.dateOfBirth || '',
                        phoneNumber: userData.phoneNumber || userData.phone || '',
                    }
                    setProfile(initial)
                    setDraft(initial)
                }
            } catch (err) {
                console.error('Error fetching user profile:', err)
            }
        }
        loadProfile()
    }, [currentUser, userData])

    const handleChange = (event) => {
        const { name, value } = event.target
        setDraft((current) => ({ ...current, [name]: value }))
    }

    const handleEdit = () => {
        setDraft(profile)
        setIsEditing(true)
    }

    const handleCancel = () => {
        setDraft(profile)
        setIsEditing(false)
    }

    const handleSubmit = async (event) => {
        event.preventDefault()
        if (!currentUser?.uid) return

        try {
            setSaving(true)
            const userRef = doc(db, 'users', currentUser.uid)
            await updateDoc(userRef, {
                firstName: draft.firstName,
                lastName: draft.lastName,
                dateOfBirth: draft.dateOfBirth,
                phoneNumber: draft.phoneNumber,
                phone: draft.phoneNumber,
            })
            setProfile(draft)
            setIsEditing(false)
            alert('Profile updated successfully!')
        } catch (err) {
            console.error('Error updating profile:', err)
            alert('Failed to update profile: ' + err.message)
        } finally {
            setSaving(false)
        }
    }

    return (
        <section className="profile-panelN container-fluid p-3 p-md-4 p-lg-5 text-white">
            <h1 className="h2 fw-bold profile-titleN mb-4">My Profile</h1>
            <form onSubmit={handleSubmit}>
                <div className="row g-3 g-lg-4">
                    <div className="col-12 col-md-6">
                        <label className="form-label profile-labelN" htmlFor="profile-first-name">First Name</label>
                        <input id="profile-first-name" className="form-control profile-inputN" name="firstName" value={draft.firstName} onChange={handleChange} readOnly={!isEditing} autoComplete="given-name" />
                    </div>
                    <div className="col-12 col-md-6">
                        <label className="form-label profile-labelN" htmlFor="profile-date-of-birth">Date of Birth</label>
                        <input id="profile-date-of-birth" className="form-control profile-inputN" type="date" name="dateOfBirth" value={draft.dateOfBirth} onChange={handleChange} readOnly={!isEditing} autoComplete="bday" />
                    </div>
                    <div className="col-12 col-md-6">
                        <label className="form-label profile-labelN" htmlFor="profile-last-name">Last Name</label>
                        <input id="profile-last-name" className="form-control profile-inputN" name="lastName" value={draft.lastName} onChange={handleChange} readOnly={!isEditing} autoComplete="family-name" />
                    </div>
                    <div className="col-12 col-md-6">
                        <label className="form-label profile-labelN" htmlFor="profile-phone-number">Phone Number</label>
                        <input id="profile-phone-number" className="form-control profile-inputN" type="tel" name="phoneNumber" value={draft.phoneNumber} onChange={handleChange} readOnly={!isEditing} autoComplete="tel" />
                    </div>
                </div>
                <div className="d-flex justify-content-end gap-2 mt-4">
                    {isEditing ? (
                        <>
                            <button className="btn btn-outline-light rounded-pill px-4" type="button" onClick={handleCancel} disabled={saving}>Cancel</button>
                            <button className="btn btn-warning rounded-pill px-4 fw-semibold" type="submit" disabled={saving}>
                                {saving ? 'Saving...' : 'Save'}
                            </button>
                        </>
                    ) : (
                        <button className="btn btn-warning rounded-pill px-5 fw-semibold" type="button" onClick={handleEdit}>Edit</button>
                    )}
                </div>
            </form>
        </section>
    )
}