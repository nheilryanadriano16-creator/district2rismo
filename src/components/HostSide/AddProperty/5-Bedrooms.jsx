import { useState } from 'react'

const amenityOptions = [
    'Air Conditioning',
    'Wi-Fi',
    'Smart TV',
    'Private Bathroom',
]

const createBed = () => ({ type: 'Single Bed', quantity: '1' })

export const Bedrooms = ({ onBack, onNext, onExit, property, onPropertyChange, editNavigation }) => {
    const [bedrooms, setBedrooms] = useState(property?.bedrooms || [])
    const [photo, setPhoto] = useState(null)
    const [name, setName] = useState('')
    const [capacity, setCapacity] = useState('')
    const [price, setPrice] = useState('')
    const [beds, setBeds] = useState([createBed()])
    const [amenities, setAmenities] = useState([])
    const [editingId, setEditingId] = useState(null)
    const [validationError, setValidationError] = useState('')

    const bedroomFormStarted = Boolean(editingId || name.trim() || capacity || price || photo)

    const uploadFileToServer = async (file) => {
        const formData = new FormData()
        formData.append('file', file)
        try {
            const response = await fetch('http://localhost:4242/api/upload', {
                method: 'POST',
                body: formData,
            })
            const data = await response.json()
            return data.filePath || `/uploads/${file.name}`
        } catch (error) {
            console.error('Local upload failed:', error)
            return `/uploads/${file.name}`
        }
    }

    const handlePhotoChange = async (event) => {
        const file = event.target.files?.[0]
        if (!file) return

        const localPath = await uploadFileToServer(file)
        const objectUrl = URL.createObjectURL(file)

        setPhoto({
            name: file.name,
            size: file.size,
            preview: objectUrl,
            localPath,
        })

        event.target.value = ''
    }

    const updateBed = (index, field, value) => {
        setBeds((current) =>
            current.map((bed, bedIndex) =>
                bedIndex === index ? { ...bed, [field]: value } : bed
            )
        )
    }

    const toggleAmenity = (amenity) => {
        setAmenities((current) =>
            current.includes(amenity)
                ? current.filter((item) => item !== amenity)
                : [...current, amenity]
        )
    }

    const resetForm = () => {
        setPhoto(null)
        setName('')
        setCapacity('')
        setPrice('')
        setBeds([createBed()])
        setAmenities([])
        setEditingId(null)
    }

    const saveBedroom = (event) => {
        event.preventDefault()
        const existingBedroom = bedrooms.find((item) => item.id === editingId)

        const bedroom = {
            id: editingId ?? Date.now(),
            name,
            capacity,
            price,
            beds,
            amenities,
            photo: photo?.preview ?? existingBedroom?.photo ?? null,
            localPath: photo?.localPath ?? existingBedroom?.localPath ?? '',
            photoName: photo?.name ?? existingBedroom?.photoName,
            photoSize: photo?.size ?? existingBedroom?.photoSize,
        }

        const updated = editingId
            ? bedrooms.map((item) => item.id === editingId ? bedroom : item)
            : [...bedrooms, bedroom]
        setBedrooms(updated)
        onPropertyChange?.({ bedrooms: updated })

        resetForm()
    }

    const editBedroom = (bedroom) => {
        setEditingId(bedroom.id)
        setName(bedroom.name)
        setCapacity(bedroom.capacity)
        setPrice(bedroom.price || '')
        setBeds(bedroom.beds.map((bed) => ({ ...bed })))
        setAmenities([...bedroom.amenities])
        setPhoto(null)
    }

    const removeBedroom = (id) => {
        const updated = bedrooms.filter((bedroom) => bedroom.id !== id)
        setBedrooms(updated)
        onPropertyChange?.({ bedrooms: updated })
        if (editingId === id) resetForm()
    }

    const describeBedroom = (bedroom) => {
        const bedDescription = (bedroom.beds || [])
            .filter((bed) => Number(bed.quantity) > 0)
            .map((bed) => `${bed.quantity} ${bed.type}${Number(bed.quantity) > 1 ? 's' : ''}`)
            .join(' and ')

        return [bedroom.capacity ? `${bedroom.capacity} persons` : '', bedDescription].filter(Boolean).join(' • ')
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

            <h1 className="h5 fw-bold text-warning mb-3">5. Bedrooms</h1>
            {validationError && <div className="alert alert-danger py-2" role="alert">{validationError}</div>}

            <form onSubmit={saveBedroom}>
                <div className="row g-4">
                    <div className="col-12 col-md-5">
                        <div className="mb-3">
                            <label className="form-control host-bedroom-uploadN d-flex align-items-center justify-content-between cursor-pointer mb-0">
                                <span>Upload Bedroom Photo</span>
                                <i className="bi bi-upload" aria-hidden="true" />
                                <input
                                    className="visually-hidden"
                                    type="file"
                                    accept="image/*"
                                    onChange={handlePhotoChange}
                                />
                            </label>
                        </div>

                        {photo && (
                            <div className="host-photo-fileN d-flex align-items-center gap-2 rounded-2 px-2 py-1 mb-3">
                                <img
                                    className="host-photo-thumbnailN rounded-1"
                                    src={photo.preview}
                                    alt=""
                                    style={{ width: '32px', height: '32px', objectFit: 'cover' }}
                                />
                                <span className="small text-truncate flex-grow-1">
                                    <span className="text-warning">{photo.name}</span>
                                    {' '}({(photo.size / 1024).toFixed(2)}kb)
                                </span>
                                <button
                                    type="button"
                                    className="btn btn-sm host-photo-removeN p-0"
                                    aria-label="Remove uploaded photo"
                                    onClick={() => setPhoto(null)}
                                >
                                    &times;
                                </button>
                            </div>
                        )}

                        <div className="mb-3">
                            <label className="form-label small mb-1" htmlFor="bedroom-name">
                                Bedroom Name
                            </label>
                            <input
                                id="bedroom-name"
                                className="form-control host-add-property-inputN"
                                placeholder="e.g. Master Bedroom"
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                                required
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label small mb-1" htmlFor="bedroom-capacity">
                                Maximum Capacity
                            </label>
                            <input
                                id="bedroom-capacity"
                                className="form-control host-add-property-inputN"
                                type="number"
                                min="1"
                                placeholder="e.g. 15"
                                value={capacity}
                                onChange={(event) => setCapacity(event.target.value)}
                                required
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label small mb-1" htmlFor="bedroom-price">
                                Bedroom Price (₱)
                            </label>
                            <input
                                id="bedroom-price"
                                className="form-control host-add-property-inputN"
                                type="number"
                                min="0"
                                placeholder="e.g. 1500"
                                value={price}
                                onChange={(event) => setPrice(event.target.value)}
                                required
                            />
                        </div>

                        <div className="d-flex gap-2">
                            <div className="flex-grow-1">
                                <label className="form-label small mb-1">Bed Type</label>
                            </div>
                            <div className="host-bedroom-quantity-label">
                                <label className="form-label small mb-1">Quantity</label>
                            </div>
                        </div>

                        {beds.map((bed, index) => (
                            <div className="d-flex gap-2 mb-2" key={index}>
                                <select
                                    className="form-select host-add-property-inputN"
                                    aria-label={`Bed type ${index + 1}`}
                                    value={bed.type}
                                    onChange={(event) => updateBed(index, 'type', event.target.value)}
                                >
                                    <option>Single Bed</option>
                                    <option>Twin Bed</option>
                                    <option>Double Bed</option>
                                    <option>Queen Bed</option>
                                    <option>King Bed</option>
                                    <option>Bunk Bed</option>
                                    <option>Sofa Bed</option>
                                    <option>Floor Mattress</option>
                                    <option>Other</option>
                                </select>
                                <input
                                    className="form-control host-add-property-inputN host-bedroom-quantityN"
                                    type="number"
                                    min="1"
                                    aria-label={`Quantity for bed type ${index + 1}`}
                                    value={bed.quantity}
                                    onChange={(event) => updateBed(index, 'quantity', event.target.value)}
                                />
                                {beds.length > 1 && (
                                    <button
                                        type="button"
                                        className="btn host-tour-remove-timeN"
                                        aria-label={`Remove bed type ${index + 1}`}
                                        onClick={() => setBeds((current) => current.filter((_, i) => i !== index))}
                                    >
                                        &times;
                                    </button>
                                )}
                            </div>
                        ))}

                        <button
                            type="button"
                            className="btn host-bedroom-add-bedN w-100 mb-3"
                            onClick={() => setBeds((current) => [...current, createBed()])}
                        >
                            + Add Another Bed
                        </button>

                        <button type="submit" className="btn btn-warning rounded-pill px-4 py-2 w-100 mb-3">
                            {editingId ? 'Save Bedroom' : 'Add Bedroom'}
                        </button>
                    </div>

                    <div className="col-12 col-md-7">
                        <fieldset className="mb-3">
                            <legend className="small host-amenity-headingN mb-2">Amenities</legend>
                            {amenityOptions.map((amenity) => {
                                const id = `bedroom-amenity-${amenity.toLowerCase().replace(/\W+/g, '-')}`

                                return (
                                    <div className="form-check mb-1" key={amenity}>
                                        <input
                                            id={id}
                                            className="form-check-input host-bedroom-checkN"
                                            type="checkbox"
                                            checked={amenities.includes(amenity)}
                                            onChange={() => toggleAmenity(amenity)}
                                        />
                                        <label className="form-check-label" htmlFor={id}>
                                            {amenity}
                                        </label>
                                    </div>
                                )
                            })}
                        </fieldset>

                        <section className="host-bedroom-listN rounded-3 p-2 p-md-3">
                            <h2 className="small host-amenity-headingN mb-3">Bedrooms</h2>

                            {bedrooms.length === 0 ? (
                                <p className="small text-muted mb-0">No bedrooms added yet.</p>
                            ) : (
                                <div className="d-flex flex-column gap-2">
                                    {bedrooms.map((bedroom) => (
                                        <article
                                            className="host-bedroom-cardN d-flex align-items-center gap-2 rounded-2 p-2"
                                            key={bedroom.id}
                                        >
                                            {Boolean(bedroom.photo) && (
                                                <img
                                                    className="host-bedroom-imageN rounded-1 flex-shrink-0"
                                                    src={bedroom.photo}
                                                    alt=""
                                                    style={{ width: '48px', height: '48px', objectFit: 'cover' }}
                                                />
                                            )}
                                            <div className="min-w-0 flex-grow-1">
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <h3 className="small text-warning mb-0">{bedroom.name}</h3>
                                                    {bedroom.price && (
                                                        <span className="small text-warning fw-bold">₱{Number(bedroom.price).toLocaleString()}</span>
                                                    )}
                                                </div>
                                                <p className="host-bedroom-descriptionN mb-0 text-truncate">
                                                    {describeBedroom(bedroom)}
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                className="btn btn-sm text-white p-1"
                                                aria-label={`Edit ${bedroom.name}`}
                                                onClick={() => editBedroom(bedroom)}
                                            >
                                                <i className="bi bi-pencil-fill" aria-hidden="true" />
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-sm text-white p-1"
                                                aria-label={`Remove ${bedroom.name}`}
                                                onClick={() => removeBedroom(bedroom.id)}
                                            >
                                                <i className="bi bi-x-lg" aria-hidden="true" />
                                            </button>
                                        </article>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>
                </div>
            </form>

            <hr className="host-add-property-dividerN mt-5 mb-3" />

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
                        if (bedroomFormStarted) {
                            setValidationError('Add or save the bedroom you started before continuing, or clear the form if you do not want to add it.')
                            return
                        }
                        setValidationError('')
                        onPropertyChange?.({ bedrooms })
                        onNext?.()
                    }}
                >
                    Next
                </button>
            </div>
        </section>
    )
}

export default Bedrooms