import { useState, useMemo, useRef } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
})

function LocationMarker({ position, setPosition, onPropertyChange }) {
    const markerRef = useRef(null)

    useMapEvents({
        click(e) {
            const newCoords = { lat: e.latlng.lat, lng: e.latlng.lng }
            setPosition(newCoords)
            onPropertyChange?.({ coordinates: newCoords })
        },
    })

    const eventHandlers = useMemo(
        () => ({
            dragend() {
                const marker = markerRef.current
                if (marker != null) {
                    const latLng = marker.getLatLng()
                    const newCoords = { lat: latLng.lat, lng: latLng.lng }
                    setPosition(newCoords)
                    onPropertyChange?.({ coordinates: newCoords })
                }
            },
        }),
        [setPosition, onPropertyChange]
    )

    return (
        <Marker
            draggable={true}
            eventHandlers={eventHandlers}
            position={[position.lat, position.lng]}
            ref={markerRef}
        />
    )
}

export const BasicPropInfo = ({ onBack, onNext, property, onPropertyChange, editNavigation }) => {
    const [name, setName] = useState(property?.name || 'Maldives Resort')
    const [municipality, setMunicipality] = useState(
        property?.municipality || property?.location?.split(',')[0] || 'Bustos'
    )
    const [address, setAddress] = useState(property?.address || 'San Pedro, Bustos')
    const [shortDescription, setShortDescription] = useState(
        property?.shortDescription || 'Lorem ipsum dolor sit amet consectetur adipiscing elit at magna voluptate distinctio qui in omnis dolor in id placeat enim in praesentium pariatur laboris sint veniam sit ut qui duis sunt aliquip repellendus'
    )
    const [fullDescription, setFullDescription] = useState(
        property?.description || 'Lorem ipsum dolor sit amet consectetur adipiscing elit at magna voluptate distinctio qui in omnis dolor in id placeat enim in praesentium pariatur laboris sint veniam sit ut qui duis sunt aliquip repellendus'
    )

    const [coordinates, setCoordinates] = useState(property?.coordinates || { lat: 14.9547, lng: 120.9575 })

    const countWords = (text) => text.trim() ? text.trim().split(/\s+/).length : 0
    const update = (field, value) => onPropertyChange?.({ [field]: value })

    return (
        <section className="host-add-propertyN container-fluid p-3 p-md-4 p-lg-5">
            {editNavigation}
            <nav aria-label="Breadcrumb" className="mb-4">
                <ol className="breadcrumb mb-0">
                    <li className="breadcrumb-item">
                        <button type="button" className="btn btn-link p-0 host-add-property-crumbN" onClick={onBack}>Properties</button>
                    </li>
                    <li className="breadcrumb-item active text-warning" aria-current="page">Add Property</li>
                </ol>
            </nav>

            <h1 className="h5 fw-bold text-warning mb-3">1. Basic Property Information</h1>

            <form onSubmit={(event) => {
                event.preventDefault()
                onPropertyChange?.({
                    name,
                    municipality,
                    address,
                    shortDescription,
                    description: fullDescription,
                    location: `${municipality}, Bulacan`,
                    coordinates,
                })
                onNext?.()
            }}>
                <div className="row g-4">
                    <div className="col-12 col-md-6">
                        <div className="mb-3">
                            <label className="form-label small mb-1" htmlFor="property-name">Property Name</label>
                            <input id="property-name" className="form-control host-add-property-inputN" value={name} onChange={(event) => { setName(event.target.value); update('name', event.target.value) }} />
                        </div>

                        <div className="mb-3">
                            <label className="form-label small mb-1" htmlFor="property-short-description">Short Description</label>
                            <textarea id="property-short-description" className="form-control host-add-property-inputN" rows="5" maxLength={1200} value={shortDescription} onChange={(event) => { setShortDescription(event.target.value); update('shortDescription', event.target.value) }} />
                            <div className="small text-end host-add-property-countN">{countWords(shortDescription)}/150 words</div>
                        </div>

                        <div>
                            <label className="form-label small mb-1" htmlFor="property-full-description">Full Property Description</label>
                            <textarea id="property-full-description" className="form-control host-add-property-inputN" rows="5" value={fullDescription} onChange={(event) => { setFullDescription(event.target.value); update('description', event.target.value) }} />
                            <div className="small text-end host-add-property-countN">{countWords(fullDescription)} words</div>
                        </div>
                    </div>

                    <div className="col-12 col-md-6">
                        <div className="mb-3">
                            <label className="form-label small mb-1" htmlFor="property-municipality">Municipality/City</label>
                            <select id="property-municipality" className="form-select host-add-property-inputN" value={municipality} onChange={(event) => { setMunicipality(event.target.value); update('municipality', event.target.value); update('location', `${event.target.value}, Bulacan`) }}>
                                <option value="Bustos">Bustos</option>
                                <option value="Baliwag">Baliwag</option>
                                <option value="Plaridel">Plaridel</option>
                            </select>
                        </div>

                        <div className="mb-3">
                            <label className="form-label small mb-1" htmlFor="property-address">Complete Address</label>
                            <input id="property-address" className="form-control host-add-property-inputN" value={address} onChange={(event) => { setAddress(event.target.value); update('address', event.target.value) }} />
                        </div>

                        <label className="form-label small mb-2">Location Map Pin (Click or drag marker)</label>
                        <div className="rounded-4 overflow-hidden" style={{ height: '300px' }}>
                            <MapContainer center={[coordinates.lat, coordinates.lng]} zoom={14} style={{ width: '100%', height: '100%' }}>
                                <TileLayer
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                <LocationMarker position={coordinates} setPosition={setCoordinates} onPropertyChange={onPropertyChange} />
                            </MapContainer>
                        </div>
                        <div className="small text-muted mt-1">
                            Lat: {coordinates.lat.toFixed(4)}, Lng: {coordinates.lng.toFixed(4)}
                        </div>
                    </div>
                </div>

                <hr className="host-add-property-dividerN mt-5 mb-3" />

                <div className="d-flex justify-content-end">
                    <button type="submit" className="btn btn-warning rounded-pill px-5 py-2 host-add-property-nextN">Next</button>
                </div>
            </form>
        </section>
    )
}