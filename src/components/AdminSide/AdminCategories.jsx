import { useRef, useState, useEffect } from 'react'
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase'

const defaultAmenityGroups = [
    { name: 'General Amenities', amenities: [] },
    { name: 'Accommodation & Comfort', amenities: [] },
    { name: 'Cooking & Entertainment', amenities: [] },
    { name: 'Group & Event Facilities', amenities: [] },
    { name: 'Outdoor Amenities', amenities: [] },
    { name: 'Convenience and Safety', amenities: [] },
]

export function AdminCategories() {
    const [propertyCategories, setPropertyCategories] = useState([])
    const [amenityGroups, setAmenityGroups] = useState(defaultAmenityGroups)
    const [activeGroup, setActiveGroup] = useState(defaultAmenityGroups[0].name)
    const [showCategoryForm, setShowCategoryForm] = useState(false)
    const [showAmenityInput, setShowAmenityInput] = useState(false)
    const [categoryName, setCategoryName] = useState('')
    const [amenityName, setAmenityName] = useState('')
    const [loading, setLoading] = useState(false)
    const amenityInputRef = useRef(null)

    useEffect(() => {
        async function fetchCategoriesAndAmenities() {
            try {
                // Fetch categories from the new collection
                const catSnap = await getDocs(collection(db, 'propertyCategories'))
                if (!catSnap.empty) {
                    const loadedCats = catSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
                    setPropertyCategories(loadedCats)
                }

                // Fetch amenity groups
                const amenSnap = await getDocs(collection(db, 'amenityGroups'))
                if (!amenSnap.empty) {
                    const loadedGroups = amenSnap.docs.map(doc => doc.data())
                    setAmenityGroups(prev => 
                        prev.map(group => {
                            const found = loadedGroups.find(g => g.name === group.name)
                            return found ? { ...group, amenities: found.amenities || [] } : group
                        })
                    )
                }
            } catch (err) {
                console.error('Error fetching categories and amenities:', err)
            }
        }
        fetchCategoriesAndAmenities()
    }, [])

    const selectedGroup = amenityGroups.find((group) => group.name === activeGroup)

    const addPropertyCategory = async (event) => {
        event.preventDefault()
        const name = categoryName.trim()

        if (!name) return

        try {
            setLoading(true)
            const newCat = { type: name, total: 0, status: 'Active' }
            const docRef = await addDoc(collection(db, 'propertyCategories'), {
                ...newCat,
                createdAt: serverTimestamp()
            })

            setPropertyCategories((current) => [...current, { id: docRef.id, ...newCat }])
            setCategoryName('')
            setShowCategoryForm(false)
        } catch (err) {
            console.error('Error adding category:', err)
            alert('Failed to save category.')
        } finally {
            setLoading(false)
        }
    }

    const addAmenity = async (event) => {
        event.preventDefault()
        const name = amenityName.trim()

        if (!name || !selectedGroup) return

        if (selectedGroup.amenities.includes(name)) {
            alert('This amenity already exists in this group.')
            return
        }

        const updatedAmenities = [...selectedGroup.amenities, name]

        try {
            setLoading(true)

            setAmenityGroups((current) =>
                current.map((group) =>
                    group.name === activeGroup
                        ? { ...group, amenities: updatedAmenities }
                        : group
                )
            )
            setAmenityName('')
            setShowAmenityInput(false)

            const safeDocId = activeGroup.replace(/[^a-zA-Z0-9]/g, '_')
            const groupRef = doc(db, 'amenityGroups', safeDocId)
            
            await setDoc(groupRef, {
                name: activeGroup,
                amenities: updatedAmenities,
                updatedAt: serverTimestamp()
            }, { merge: true })

        } catch (err) {
            console.error('Error saving amenity:', err)
            alert('Failed to add amenity.')
        } finally {
            setLoading(false)
        }
    }

    const deleteAmenity = async (amenityToDelete) => {
        if (!selectedGroup) return

        const updatedAmenities = selectedGroup.amenities.filter(item => item !== amenityToDelete)

        try {
            setLoading(true)

            setAmenityGroups((current) =>
                current.map((group) =>
                    group.name === activeGroup
                        ? { ...group, amenities: updatedAmenities }
                        : group
                )
            )

            const safeDocId = activeGroup.replace(/[^a-zA-Z0-9]/g, '_')
            const groupRef = doc(db, 'amenityGroups', safeDocId)
            
            await setDoc(groupRef, {
                name: activeGroup,
                amenities: updatedAmenities,
                updatedAt: serverTimestamp()
            }, { merge: true })

        } catch (err) {
            console.error('Error deleting amenity:', err)
            alert('Failed to delete amenity.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <section className="admin-categoriesN container-fluid p-3 p-md-4">
            <h1 className="h2 fw-bold mb-4">Categories and Settings</h1>

            <section aria-labelledby="property-categories-title" className="mb-5">
                <div className="d-flex justify-content-between align-items-center gap-3 mb-3">
                    <h2 id="property-categories-title" className="h5 mb-0">
                        Property Categories
                    </h2>

                    <button
                        type="button"
                        className="btn admin-category-primaryN"
                        onClick={() => setShowCategoryForm((show) => !show)}
                    >
                        Add Category
                    </button>
                </div>

                {showCategoryForm && (
                    <form
                        className="row g-2 mb-3"
                        onSubmit={addPropertyCategory}
                    >
                        <div className="col">
                            <label className="visually-hidden" htmlFor="new-property-category">
                                Category name
                            </label>
                            <input
                                id="new-property-category"
                                className="form-control admin-category-inputN"
                                value={categoryName}
                                onChange={(event) => setCategoryName(event.target.value)}
                                placeholder="Enter category name"
                                required
                            />
                        </div>
                        <div className="col-auto">
                            <button className="btn admin-category-primaryN" type="submit" disabled={loading}>
                                {loading ? 'Saving...' : 'Add'}
                            </button>
                        </div>
                    </form>
                )}

                <div className="table-responsive">
                    <table className="table table-borderless align-middle admin-category-tableN mb-0">
                        <thead>
                            <tr>
                                <th scope="col">Property Type</th>
                                <th scope="col">Total Properties Listed</th>
                                <th scope="col">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {propertyCategories.length === 0 ? (
                                <tr>
                                    <td colSpan="3" className="text-center text-white py-3">
                                        No property categories added yet.
                                    </td>
                                </tr>
                            ) : (
                                propertyCategories.map((category) => (
                                    <tr key={category.id || category.type}>
                                        <td>{category.type}</td>
                                        <td>{category.total}</td>
                                        <td>{category.status}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="admin-amenitiesN p-3 p-md-4" aria-labelledby="amenities-title">
                <div className="d-flex justify-content-between align-items-center gap-3 mb-3">
                    <h2 id="amenities-title" className="h5 fw-semibold mb-0">
                        Amenities Listed
                    </h2>

                    <button
                        type="button"
                        className="btn admin-category-primaryN"
                        onClick={() => {
                            setShowAmenityInput((prev) => !prev)
                            setTimeout(() => amenityInputRef.current?.focus(), 0)
                        }}
                    >
                        Add Amenities
                    </button>
                </div>

                <div className="row g-4">
                    <div className="col-12 col-md-4 col-xl-4">
                        <div
                            className="d-flex flex-column gap-2"
                            role="group"
                            aria-label="Amenity categories"
                        >
                            {amenityGroups.map((group) => (
                                <button
                                    key={group.name}
                                    type="button"
                                    className={`btn admin-amenity-tabN ${
                                        activeGroup === group.name ? 'active' : ''
                                    }`}
                                    aria-pressed={activeGroup === group.name}
                                    onClick={() => setActiveGroup(group.name)}
                                >
                                    {group.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="col-12 col-md-8 col-xl-8">
                        <div className="admin-amenity-listN rounded-3 p-3 p-md-4">
                            <div className="row row-cols-1 row-cols-lg-2 g-3">
                                {selectedGroup?.amenities.length === 0 && !showAmenityInput ? (
                                    <div className="col-12 text-white py-2">
                                        No amenities listed under this group yet.
                                    </div>
                                ) : (
                                    selectedGroup?.amenities.map((amenity) => (
                                        <div className="col d-flex justify-content-between align-items-center" key={amenity}>
                                            <span>{amenity}</span>
                                            <button
                                                type="button"
                                                className="btn btn-sm text-danger p-0 ms-2"
                                                onClick={() => deleteAmenity(amenity)}
                                                disabled={loading}
                                                title="Delete amenity"
                                            >
                                                <i className="bi bi-trash" />
                                            </button>
                                        </div>
                                    ))
                                )}

                                {showAmenityInput && (
                                    <div className="col">
                                        <form onSubmit={addAmenity}>
                                            <label
                                                className="visually-hidden"
                                                htmlFor="new-amenity"
                                            >
                                                Add an amenity
                                            </label>
                                            <input
                                                ref={amenityInputRef}
                                                id="new-amenity"
                                                className="form-control admin-category-inputN"
                                                value={amenityName}
                                                onChange={(event) =>
                                                    setAmenityName(event.target.value)
                                                }
                                                placeholder="Add another on the list..."
                                                disabled={loading}
                                            />
                                        </form>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </section>
    )
}