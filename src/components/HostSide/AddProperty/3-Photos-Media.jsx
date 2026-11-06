import { useEffect, useRef, useState } from 'react'
import { resolveUploadUrl, uploadFile } from '../../../utils/uploads'

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
                    preview: resolveUploadUrl(photo.preview || photo.localPath),
                    localPath: resolveUploadUrl(photo.localPath || photo.preview),
                    uploadStatus: 'uploaded',
                })),
            ])
        )
    }

    return {
        ...(property?.image
            ? {
                cover: [{
                    id: 'saved-cover',
                    file: { name: 'Cover photo', size: 0 },
                    preview: resolveUploadUrl(property.image),
                    localPath: resolveUploadUrl(property.image),
                    uploadStatus: 'uploaded',
                }],
            }
            : {}),
        ...(property?.galleryImages?.length
            ? {
                gallery: property.galleryImages.map((preview, index) => ({
                    id: `saved-gallery-${index}`,
                    file: { name: `Gallery photo ${index + 1}`, size: 0 },
                    preview: resolveUploadUrl(preview),
                    localPath: resolveUploadUrl(preview),
                    uploadStatus: 'uploaded',
                })),
            }
            : {}),
    }
}

export const PhotosMedia = ({ onBack, onNext, onExit, property, onPropertyChange, editNavigation }) => {
    const [photos, setPhotos] = useState(() => getSavedPhotos(property))
    const [validationError, setValidationError] = useState('')
    const [isUploading, setIsUploading] = useState(false)
    const objectUrls = useRef(new Set())

    useEffect(() => {
        const urls = objectUrls.current
        return () => {
            urls.forEach((url) => URL.revokeObjectURL(url))
        }
    }, [])

    const addPhotos = async (group, fileList) => {
        const filesArray = Array.from(fileList)
        if (filesArray.length === 0 || isUploading) return

        const selectedFiles = filesArray.map((file) => {
            const preview = URL.createObjectURL(file)
            objectUrls.current.add(preview)
            return {
                id: `${file.name}-${file.lastModified}-${Math.random()}`,
                file,
                preview,
                localPath: '',
                uploadStatus: 'uploading',
                uploadPhase: 'preparing',
                uploadProgress: 0,
            }
        })
        const previousGroupPhotos = photos[group.id] || []
        const updatedPhotos = {
            ...photos,
            [group.id]: [...previousGroupPhotos, ...selectedFiles],
        }

        setPhotos(updatedPhotos)
        setValidationError('')
        setIsUploading(true)

        const uploadResults = await Promise.allSettled(
            selectedFiles.map((photo) => uploadFile(photo.file, 'property-media', ({ phase, progress }) => {
                setPhotos((current) => ({
                    ...current,
                    [group.id]: (current[group.id] || []).map((item) => (
                        item.id === photo.id
                            ? { ...item, uploadPhase: phase, uploadProgress: progress }
                            : item
                    )),
                }))
            }))
        )
        const photosWithUploadResults = updatedPhotos[group.id].map((photo) => {
            const selectedIndex = selectedFiles.findIndex((selected) => selected.id === photo.id)
            if (selectedIndex < 0) return photo

            const result = uploadResults[selectedIndex]
            return result.status === 'fulfilled'
                ? { ...photo, localPath: result.value, uploadStatus: 'uploaded', uploadProgress: 100 }
                : { ...photo, uploadStatus: 'failed' }
        })
        const hasSuccessfulUpload = selectedFiles.some((photo, index) => (
            uploadResults[index].status === 'fulfilled'
        ))
        const uploadedPhotos = group.multiple
            ? photosWithUploadResults
            : hasSuccessfulUpload
                ? photosWithUploadResults.filter((photo) => (
                    selectedFiles.some((selected) => selected.id === photo.id)
                    && photo.uploadStatus === 'uploaded'
                ))
                : photosWithUploadResults

        if (!group.multiple && hasSuccessfulUpload) {
            previousGroupPhotos.forEach((photo) => {
                if (photo.preview.startsWith('blob:')) {
                    URL.revokeObjectURL(photo.preview)
                    objectUrls.current.delete(photo.preview)
                }
            })
        }

        const completedPhotos = { ...updatedPhotos, [group.id]: uploadedPhotos }
        setPhotos(completedPhotos)
        setIsUploading(false)

        const failedIndex = uploadResults.findIndex((result) => result.status === 'rejected')
        if (failedIndex >= 0) {
            const error = uploadResults[failedIndex].reason
            setValidationError(error?.message || 'Could not upload property photos.')
        }

        const savedPhotos = uploadedPhotos
            .filter((photo) => photo.uploadStatus === 'uploaded')
            .map((photo) => ({
                id: photo.id,
                name: photo.file.name,
                size: photo.file.size,
                preview: photo.localPath,
                localPath: photo.localPath,
            }))
        const changes = { mediaPhotos: { [group.id]: savedPhotos } }
        if (group.id === 'cover') changes.image = savedPhotos[0]?.preview || ''
        if (group.id === 'gallery') changes.galleryImages = savedPhotos.map((photo) => photo.preview)
        onPropertyChange?.(changes)
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

        const savedPhotos = remainingPhotos
            .filter((item) => item.uploadStatus === 'uploaded')
            .map(({ id, file, preview, localPath }) => ({
                id,
                name: file.name,
                size: file.size,
                preview: localPath || preview,
                localPath: localPath || preview,
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
                    disabled={isUploading}
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
                                    {photo.uploadStatus === 'uploading' && photo.uploadPhase === 'preparing' && ' - Preparing image...'}
                                    {photo.uploadStatus === 'uploading' && photo.uploadPhase === 'saving' && ' - Saving...'}
                                    {photo.uploadStatus === 'uploading' && photo.uploadPhase === 'uploading' && ` - Uploading ${photo.uploadProgress}%`}
                                    {photo.uploadStatus === 'failed' && ' - Upload failed; remove and try again.'}
                                </span>
                                <button
                                    type="button"
                                    className="btn btn-sm host-photo-removeN p-0"
                                    aria-label={`Remove ${photo.file.name}`}
                                    disabled={isUploading}
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
                        if (isUploading || Object.values(photos).flat().some((photo) => photo.uploadStatus === 'uploading')) {
                            setValidationError('Wait for the selected photos to finish uploading before continuing.')
                            return
                        }
                        if (Object.values(photos).flat().some((photo) => photo.uploadStatus === 'failed')) {
                            setValidationError('Remove or re-upload failed photos before continuing.')
                            return
                        }
                        if (!photos.cover?.some((photo) => photo.uploadStatus === 'uploaded')) {
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