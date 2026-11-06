import { useEffect, useRef, useState } from 'react'

const photoGroups = [
    { id: 'cover', title: 'Cover Photo', multiple: false },
    { id: 'gallery', title: 'Property Gallery', multiple: true },
    { id: 'kitchen', title: 'Kitchen & Dining', multiple: true },
    { id: 'facilities', title: 'Facilities & Amenities', multiple: true },
    { id: 'bathrooms', title: 'Bathrooms', multiple: true },
]

const formatFileSize = (bytes) => `${(bytes / 1024).toFixed(2)}kb`

const getSavedPhotos = (property) => {
    if (property?.mediaPhotos && Object.keys(property.mediaPhotos).length > 0) {
        return Object.fromEntries(
            Object.entries(property.mediaPhotos).map(([groupId, savedPhotos]) => [
                groupId,
                savedPhotos.map((photo) => ({
                    id: photo.id,
                    file: { name: photo.name, size: photo.size },
                    preview: photo.preview,
                })),
            ])
        )
    }

    return {
        ...(property?.image
            ? { cover: [{ id: 'saved-cover', file: { name: 'Cover photo', size: 0 }, preview: property.image }] }
            : {}),
        ...(property?.galleryImages?.length
            ? {
                gallery: property.galleryImages.map((preview, index) => ({
                    id: `saved-gallery-${index}`,
                    file: { name: `Gallery photo ${index + 1}`, size: 0 },
                    preview,
                })),
            }
            : {}),
    }
}

const readPhoto = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => typeof reader.result === 'string'
        ? resolve(reader.result)
        : reject(new Error('Could not create a preview for the selected property photo.'))
    reader.onerror = () => reject(reader.error || new Error('Could not read the selected property photo.'))
    reader.readAsDataURL(file)
})

export const PhotosMedia = ({ onBack, onNext, onExit, property, onPropertyChange, editNavigation }) => {
    const [photos, setPhotos] = useState(() => getSavedPhotos(property))
    const [validationError, setValidationError] = useState('')
    const objectUrls = useRef(new Set())

    useEffect(() => {
        const urls = objectUrls.current
        return () => {
            urls.forEach((url) => URL.revokeObjectURL(url))
        }
    }, [])

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

    const addPhotos = async (group, fileList) => {
        const filesArray = Array.from(fileList)
        const selectedFiles = []

        for (let i = 0; i < filesArray.length; i++) {
            const file = filesArray[i]
            await uploadFileToServer(file)
            const objectUrl = URL.createObjectURL(file)
            selectedFiles.push({
                id: `${file.name}-${file.lastModified}-${Math.random()}`,
                file,
                preview: objectUrl,
            })
        }

        selectedFiles.forEach((photo) => objectUrls.current.add(photo.preview))

        const updatedPhotos = {
            ...photos,
            [group.id]: group.multiple
                ? [...(photos[group.id] || []), ...selectedFiles]
                : selectedFiles.slice(0, 1),
        }
        if (!group.multiple) {
            (photos[group.id] || []).forEach((photo) => {
                if (photo.preview.startsWith('blob:')) {
                    URL.revokeObjectURL(photo.preview)
                    objectUrls.current.delete(photo.preview)
                }
            })
        }
        setPhotos(updatedPhotos)
        if (group.id === 'cover') setValidationError('')

        Promise.all(updatedPhotos[group.id].map(async (photo) => ({
            id: photo.id,
            name: photo.file.name,
            size: photo.file.size,
            preview: photo.file instanceof File
                ? await readPhoto(photo.file)
                : photo.preview,
        })))
            .then((savedPhotos) => {
                const changes = { mediaPhotos: { [group.id]: savedPhotos } }
                if (group.id === 'cover') changes.image = savedPhotos[0]?.preview || ''
                if (group.id === 'gallery') changes.galleryImages = savedPhotos.map((photo) => photo.preview)
                onPropertyChange?.(changes)
            })
            .catch((error) => console.error('Could not save property photo previews:', error))
    }

    const removePhoto = (groupId, photoId) => {
        const photo = (photos[groupId] || []).find((item) => item.id === photoId)
        if (photo?.preview.startsWith('blob:')) {
            URL.revokeObjectURL(photo.preview)
            objectUrls.current.delete(photo.preview)
        }

        const remainingPhotos = (photos[groupId] || []).filter((item) => item.id !== photoId)
        const updatedPhotos = { ...photos, [groupId]: remainingPhotos }
        setPhotos(updatedPhotos)
        if (groupId === 'cover' && remainingPhotos.length === 0) {
            setValidationError('A cover photo is required. Upload one before continuing.')
        }

        const savedPhotos = remainingPhotos.map(({ id, file, preview }) => ({
            id,
            name: file.name,
            size: file.size,
            preview,
        }))
        const changes = { mediaPhotos: { [groupId]: savedPhotos } }
        if (groupId === 'cover') changes.image = savedPhotos[0]?.preview || ''
        if (groupId === 'gallery') changes.galleryImages = savedPhotos.map((item) => item.preview)
        onPropertyChange?.(changes)
    }

    const renderGroup = (group) => {
        const inputId = `photo-upload-${group.id}`
        const groupPhotos = photos[group.id] || []

        return (
            <section className="mb-3" key={group.id}>
                <label
                    htmlFor={inputId}
                    className="form-control host-photo-uploadN d-flex align-items-center justify-content-between"
                >
                    <span>{group.title}{group.id === 'cover' ? ' *' : ''}</span>
                    <i className="bi bi-upload" aria-hidden="true" />
                </label>

                <input
                    id={inputId}
                    className="visually-hidden"
                    type="file"
                    accept="image/*"
                    multiple={group.multiple}
                    onChange={(event) => {
                        addPhotos(group, event.target.files)
                        event.target.value = ''
                    }}
                />

                {groupPhotos.length > 0 && (
                    <div className="d-flex flex-column gap-1 mt-1">
                        {groupPhotos.map((photo) => (
                            <div
                                className="host-photo-fileN d-flex align-items-center gap-2 rounded-2 px-3 py-2"
                                key={photo.id}
                            >
                                <img
                                    className="host-photo-thumbnailN rounded-1"
                                    src={photo.preview}
                                    alt=""
                                    style={{ width: '32px', height: '32px', objectFit: 'cover' }}
                                />
                                <span className="small text-truncate flex-grow-1">
                                    <span className="text-warning">{photo.file.name}</span>
                                    {' '}({formatFileSize(photo.file.size)})
                                </span>
                                <button
                                    type="button"
                                    className="btn btn-sm host-photo-removeN p-0"
                                    aria-label={`Remove ${photo.file.name}`}
                                    onClick={() => removePhoto(group.id, photo.id)}
                                >
                                    <i className="bi bi-x-lg" aria-hidden="true" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        )
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

            <h1 className="h5 fw-bold text-warning mb-4">3. Photos and Media</h1>
            {validationError && <div className="alert alert-danger py-2" role="alert">{validationError}</div>}

            <div className="row g-4">
                <div className="col-12 col-md-6">
                    {photoGroups.slice(0, 3).map(renderGroup)}
                </div>
                <div className="col-12 col-md-6">
                    {photoGroups.slice(3).map(renderGroup)}
                </div>
            </div>

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
                        if (!photos.cover?.length) {
                            setValidationError('A cover photo is required. Upload one before continuing.')
                            return
                        }
                        onNext?.()
                    }}
                >
                    Next
                </button>
            </div>
        </section>
    )
}