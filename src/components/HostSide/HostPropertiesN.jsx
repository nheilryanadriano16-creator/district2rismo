import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import resortImage from '../../images/Bustos Hero.png'
import { useAuth } from '../../context/AuthContext'
import { deleteHostProperty, fetchHostProperties } from '../../utils/hostData'

export const HostPropertiesN = ({ onAddProperty, onViewProperty, onDeleteProperty }) => {
    const navigate = useNavigate()
    const { currentUser } = useAuth()
    const [properties, setProperties] = useState([])
    const [loading, setLoading] = useState(true)

    const loadProperties = async () => {
        if (!currentUser?.uid) {
            setProperties([])
            setLoading(false)
            return
        }
        try {
            setLoading(true)
            const loaded = await fetchHostProperties(currentUser.uid, { email: currentUser.email })
            setProperties(loaded)
        } catch (error) {
            console.error('Error loading host properties:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadProperties()
    }, [currentUser])

    const handleDelete = async () => {
        if (properties.length === 0) return
        if (properties.length > 1) {
            window.alert('Open a property and use Delete there to remove a specific listing.')
            return
        }
        const target = properties[0]
        if (onDeleteProperty) {
            onDeleteProperty(target)
            return
        }
        if (!window.confirm(`Delete ${target.name}? This cannot be undone.`)) return
        try {
            await deleteHostProperty(target.id)
            await loadProperties()
        } catch (error) {
            console.error('Error deleting property:', error)
        }
    }

    return (

        <section className="host-propertiesN container-fluid p-3 p-md-4">
            <div className="d-flex align-items-center justify-content-between gap-3 mb-3">
                <h1 className="h2 fw-bold mb-0">Properties</h1>

                <div className="d-flex align-items-center gap-2">
                    <button type="button" className="btn btn-warning btn-sm rounded-pill px-3" onClick={onAddProperty}>
                        Add Property
                    </button>
                    <button type="button" className="btn host-delete-propertyN p-1" aria-label="Delete property" onClick={handleDelete}>
                        <i className="bi bi-trash-fill" aria-hidden="true" />
                    </button>
                </div>
            </div>

            <div className="d-flex flex-column gap-2">
                {loading && <p className="small text-secondary mb-0">Loading properties...</p>}
                {!loading && properties.map((property) => (
                    <article key={property.id} className="host-property-rowN d-flex align-items-center gap-2 rounded-3 p-2">
                        <img className="host-property-imageN rounded-2" src={property.image || property.imageUrl || resortImage} alt={property.name} />

                        <div className="flex-grow-1 min-w-0">
                            <h2 className="h6 mb-0">{property.name}</h2>
                            <p className="small text-warning mb-0">{property.location || property.address || 'Bulacan'}</p>
                        </div>

                        <button type="button" className="btn btn-link host-view-propertyN text-nowrap" onClick={() => {
                            onViewProperty?.(property)
                            navigate('/host/view-property', { state: { property } })
                        }}>
                            View Details
                        </button>
                    </article>
                ))}
                {!loading && properties.length === 0 && (
                    <p className="small text-secondary mb-0">No properties yet. Add your first listing.</p>
                )}
            </div>
        </section>
    )
}
