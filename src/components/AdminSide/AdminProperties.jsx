import { useState, useEffect } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../../firebase'
import resortImage from '../../images/Bustos Hero.png'
import { resolveUploadUrl } from '../../utils/uploads'

const filters = ['All', 'Pending', 'Approved', 'Hidden']

export function AdminProperties({ onViewDetails }) {
    const [properties, setProperties] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeFilter, setActiveFilter] = useState('All')
    const [search, setSearch] = useState('')

    useEffect(() => {
        let isMounted = true

        async function fetchProperties() {
            try {
                setLoading(true)
                const querySnapshot = await getDocs(collection(db, 'properties'))
                const loadedProperties = querySnapshot.docs
                    .map((docItem) => ({
                        id: docItem.id,
                        ...docItem.data()
                    }))
                    .filter((property) => (property.status || '').toLowerCase() !== 'removed')

                if (isMounted) {
                    setProperties(loadedProperties)
                }
            } catch (err) {
                console.error('Error fetching properties from Firestore:', err)
            } finally {
                if (isMounted) {
                    setLoading(false)
                }
            }
        }

        fetchProperties()

        return () => {
            isMounted = false
        }
    }, [])

    const filteredProperties = properties.filter((property) => {
        const matchesFilter =
            activeFilter === 'All' || (property.status || 'Pending') === activeFilter
        const query = search.trim().toLowerCase()

        const propertyName = (property.name || '').toLowerCase()
        const ownerName = property.ownerName || (property.firstName && property.lastName ? `${property.firstName} ${property.lastName}` : (property.owner || ''))
        const matchesSearch =
            propertyName.includes(query) ||
            ownerName.toLowerCase().includes(query)

        return matchesFilter && matchesSearch
    })

    return (
        <section className="admin-propertiesN container-fluid p-3 p-md-4">
            <h1 className="h2 fw-bold mb-4 text-white">Properties</h1>

            <div className="row align-items-center g-3 mb-4">
                <div className="col-12 col-xl-8">
                    <div
                        className="d-flex flex-wrap gap-2"
                        role="group"
                        aria-label="Filter properties"
                    >
                        {filters.map((filter) => (
                            <button
                                key={filter}
                                type="button"
                                className={`btn admin-host-filterN ${
                                    activeFilter === filter ? 'active' : ''
                                }`}
                                aria-pressed={activeFilter === filter}
                                onClick={() => setActiveFilter(filter)}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="col-12 col-xl-4">
                    <div className="input-group admin-host-searchN">
                        <input
                            type="search"
                            className="form-control bg-dark text-white border-secondary"
                            placeholder="Search Property"
                            aria-label="Search properties"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />
                        <span className="input-group-text bg-dark text-white border-secondary">
                            <i className="bi bi-search" aria-hidden="true" />
                        </span>
                    </div>
                </div>
            </div>

            <p className="small mb-2 text-white">{properties.length} Properties Total</p>

            {loading ? (
                <div className="text-center py-5 text-white">Loading properties...</div>
            ) : (
                <div className="d-flex flex-column gap-2">
                    {filteredProperties.map((property) => {
                        const displayOwner = property.firstName && property.lastName
                            ? `${property.firstName} ${property.lastName}`
                            : property.owner || property.ownerName || 'Unknown Owner'

                        const displayStatus = property.status || 'Pending'
                        const statusLower = displayStatus.toLowerCase()

                        const statusClass = statusLower === 'pending' 
                            ? 'pending' 
                            : statusLower === 'approved' 
                                ? 'verified' 
                                : statusLower === 'active' 
                                    ? 'active' 
                                    : ''

                        const propertyImage = resolveUploadUrl(
                            property.image ||
                            property.imageUrl ||
                            property.images?.[0] ||
                            property.mediaPhotos?.cover?.[0]?.localPath ||
                            property.mediaPhotos?.cover?.[0]?.preview
                        ) || resortImage
                        const propertyCategory = property.category || property.type || null
                        const amenitiesList = Array.isArray(property.amenities) ? property.amenities : []

                        return (
                            <article
                                className="admin-property-rowN row align-items-center g-2 rounded-3 p-3"
                                key={property.id || property.name}
                            >
                                <div className="col-auto">
                                    <img
                                        className="admin-property-imageN rounded-2"
                                        src={propertyImage}
                                        alt=""
                                    />
                                </div>

                                <div className="col">
                                    <h2 className="h6 mb-1 text-white">{property.name || 'Unnamed Property'}</h2>
                                    <p className="small text-warning mb-2">
                                        By {displayOwner}
                                    </p>

                                    {propertyCategory && (
                                        <div className="d-flex flex-wrap gap-1 align-items-center mb-1">
                                            <span className="badge bg-warning text-dark fw-bold small">
                                                {propertyCategory}
                                            </span>
                                        </div>
                                    )}
                                    
                                    {amenitiesList.length > 0 && (
                                        <div className="d-flex flex-wrap gap-1">
                                            {amenitiesList.slice(0, 4).map((amenity, idx) => (
                                                <span key={idx} className="badge bg-secondary text-light small fw-normal">
                                                    {typeof amenity === 'string' ? amenity : amenity.name || amenity.title}
                                                </span>
                                            ))}
                                            {amenitiesList.length > 4 && (
                                                <span className="badge bg-secondary text-light small">
                                                    +{amenitiesList.length - 4} more
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="col-12 col-sm-auto col-md-3 text-sm-center">
                                    <span
                                        className={`badge rounded-pill admin-property-statusN ${statusClass}`}
                                    >
                                        {displayStatus}
                                    </span>
                                </div>

                                <div className="col-12 col-sm-auto text-sm-end">
                                    <button
                                        type="button"
                                        className="btn admin-host-detailsN"
                                        onClick={() => onViewDetails?.({ ...property, owner: displayOwner, status: displayStatus })}
                                    >
                                        View Details
                                    </button>
                                </div>
                            </article>
                        )
                    })}

                    {filteredProperties.length === 0 && (
                        <p className="text-center py-4 mb-0 text-white">
                            No properties match your search.
                        </p>
                    )}
                </div>
            )}
        </section>
    )
}