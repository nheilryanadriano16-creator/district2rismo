import { useState, useEffect } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../../../firebase'

export const AmenitiesFacilities = ({ onBack, onNext, onExit, property, onPropertyChange, editNavigation }) => {
    const [amenityGroups, setAmenityGroups] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedAmenities, setSelectedAmenities] = useState(property?.amenities || [])

    useEffect(() => {
        async function fetchAmenityGroups() {
            try {
                setLoading(true)
                const querySnapshot = await getDocs(collection(db, 'amenityGroups'))
                const fetchedGroups = querySnapshot.docs.map(docItem => {
                    const data = docItem.data()
                    return {
                        id: docItem.id,
                        title: data.name || docItem.id.replace(/___/g, ' & ').replace(/_/g, ' '),
                        items: data.amenities || []
                    }
                })

                // Chunk fetched groups into 3 balanced columns for the grid layout
                const numColumns = 3
                const columns = Array.from({ length: numColumns }, () => [])
                fetchedGroups.forEach((group, index) => {
                    columns[index % numColumns].push(group)
                })

                setAmenityGroups(columns)
            } catch (err) {
                console.error('Error fetching amenity groups from Firestore:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchAmenityGroups()
    }, [])

    const toggleAmenity = (amenity) => {
        const nextAmenities = selectedAmenities.includes(amenity)
            ? selectedAmenities.filter((item) => item !== amenity)
            : [...selectedAmenities, amenity]
        setSelectedAmenities(nextAmenities)
        onPropertyChange?.({ amenities: nextAmenities })
    }

    return (
        <section className="host-add-propertyN container-fluid p-3 p-md-4 p-lg-5">
            {editNavigation}
            <nav aria-label="Breadcrumb" className="mb-4">
                <ol className="breadcrumb mb-0">
                    <li className="breadcrumb-item">
                        <button
                            type="button"
                            className="btn btn-link p-0 host-add-property-crumbN"
                            onClick={onExit}
                        >
                            Properties
                        </button>
                    </li>
                    <li className="breadcrumb-item active text-warning" aria-current="page">
                        Add Property
                    </li>
                </ol>
            </nav>

            <h1 className="h5 fw-bold text-warning mb-3">
                2. Amenities &amp; Facilities
            </h1>

            {loading ? (
                <div className="text-center py-5 text-white">Loading amenities...</div>
            ) : (
                <div className="row g-4">
                    {amenityGroups.map((column, columnIndex) => (
                        <div className="col-12 col-md-4" key={columnIndex}>
                            {column.map((group) => (
                                <fieldset className="mb-3" key={group.id || group.title}>
                                    <legend className="small host-amenity-headingN mb-2">
                                        {group.title}
                                    </legend>

                                    {group.items.map((amenity) => {
                                        const id = `amenity-${amenity
                                            .toLowerCase()
                                            .replace(/[^a-z0-9]+/g, '-')}`

                                        return (
                                            <div className="form-check mb-1" key={amenity}>
                                                <input
                                                    className="form-check-input host-amenity-checkN"
                                                    type="checkbox"
                                                    id={id}
                                                    name="amenities"
                                                    value={amenity}
                                                    checked={selectedAmenities.includes(amenity)}
                                                    onChange={() => toggleAmenity(amenity)}
                                                />
                                                <label
                                                    className="form-check-label small"
                                                    htmlFor={id}
                                                >
                                                    {amenity}
                                                </label>
                                            </div>
                                        )
                                    })}
                                </fieldset>
                            ))}
                        </div>
                    ))}
                </div>
            )}

            <hr className="host-add-property-dividerN mt-4 mb-3" />

            <div className="d-flex justify-content-end gap-2">
                <button
                    type="button"
                    className="btn host-add-property-backN rounded-pill px-5 py-2"
                    onClick={onBack}
                >
                    Back
                </button>
                <button
                    type="button"
                    className="btn btn-warning rounded-pill px-5 py-2 host-add-property-nextN"
                    onClick={() => {
                        onPropertyChange?.({ amenities: selectedAmenities })
                        onNext?.()
                    }}
                >
                    Next
                </button>
            </div>
        </section>
    )
}