import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore'
import { db } from '../firebase'
import NavBar from '../components/NavBarDetails.jsx'
import PhotoGallery from '../components/PhotoGallery.jsx'
import CottageCard from '../components/StayCard.jsx'
import Footer from '../components/Footer.jsx'
import BookingCard from '../components/BookingCard.jsx'
import resortImage from '../images/Bustos Hero.png'
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
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

function Star({ size = 16, filled = true }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 16 16"
            fill="currentColor" className={filled ? 'star-on' : 'star-off'}>
            <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z" />
        </svg>
    )
}

function PlaceDetails() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [bookingOpen, setBookingOpen] = useState(false)
    const [property, setProperty] = useState(null)
    const [loading, setLoading] = useState(true)
    const [showMore, setShowMore] = useState(false)
    const bookingTriggerRef = useRef(null)
    const bookingCloseRef = useRef(null)

    useEffect(() => {
        const fetchPropertyDetails = async () => {
            if (!id) return
            try {
                setLoading(true)
                const docRef = doc(db, 'properties', id)
                const docSnap = await getDoc(docRef)
                if (docSnap.exists()) {
                    setProperty({ id: docSnap.id, ...docSnap.data() })
                    await updateDoc(docRef, {
                        views: increment(1)
                    })
                }
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }

        fetchPropertyDetails()
    }, [id])

    useEffect(() => {
        if (!bookingOpen) return

        const closeOnEscape = event => {
            if (event.key === 'Escape') setBookingOpen(false)
        }
        const trigger = bookingTriggerRef.current
        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        bookingCloseRef.current?.focus()
        window.addEventListener('keydown', closeOnEscape)

        return () => {
            document.body.style.overflow = previousOverflow
            window.removeEventListener('keydown', closeOnEscape)
            trigger?.focus()
        }
    }, [bookingOpen])

    if (loading) {
        return (
            <>
                <NavBar />
                <div className='destinations-page place-details-page mx-3 text-white text-center py-5'>
                    <h2 className='mt-5'>Loading property details...</h2>
                </div>
                <Footer />
            </>
        )
    }

    if (!property) {
        return (
            <>
                <NavBar />
                <div className='destinations-page place-details-page mx-3 text-white text-center py-5'>
                    <h2 className='mt-5'>Property not found.</h2>
                </div>
                <Footer />
            </>
        )
    }

    const name = property?.name || 'Untitled Property'
    const location = property?.location || property?.address || (property?.municipality ? `${property.municipality}, Bulacan` : 'Location Not Specified')
    const galleryImages = property?.galleryImages?.length ? property.galleryImages : []
    const images = galleryImages.length > 0 ? galleryImages : [property?.image || resortImage]

    const features = property?.amenities?.length
        ? Array.from({ length: Math.ceil(property.amenities.length / 2) }, (_, index) => [
            property.amenities[index * 2],
            property.amenities[index * 2 + 1] || '',
        ])
        : []

    const bedrooms = property?.bedrooms || property?.cottages || []
    const tours = property?.tourSettings
    const hasActiveTours = tours?.day?.enabled || tours?.night?.enabled || tours?.flexible?.enabled

    const bedroomDescription = (bedroom) => bedroom.description || [
        bedroom.capacity ? `${bedroom.capacity} guests` : '',
        bedroom.beds?.map((bed) => `${bed.quantity} ${bed.type}`).join(' and '),
    ].filter(Boolean).join(' • ')

    const resort = {
        name: name,
        location: location,
        image: property?.image || resortImage,
        rating: property?.rating || 0,
        reviewCount: property?.reviewCount || 0,
        price: property?.price || property?.rate || tours?.day?.price || 15000,
    }

    const coordinates = property?.coordinates || { lat: 14.9547, lng: 120.9575 }

    return (
        <>
            <div className={`destinations-page place-details-page mx-3${bookingOpen ? ' booking-open' : ''}`}>
                <NavBar />

                <nav aria-label="Breadcrumb" className="small mb-3 mt-3 mx-3">
                    <button
                        type="button"
                        className="btn btn-link p-0 text-warning text-decoration-none"
                        onClick={() => navigate('/destination')}
                    >
                        Destinations
                    </button>
                    <span className="mx-1 text-white">›</span>
                    <span className="text-warning">Property Details</span>
                </nav>

                <PhotoGallery images={images} />

                <div className='details-parent-container row'>
                    <div className='details col-12 col-lg-7'>

                        <div className='place-name my-4 d-flex flex-column gap-4'>
                            <div>
                                <h1 className='lh-1'>{name}</h1>
                                <h3>{location}</h3>
                            </div>
                        </div>

                        <hr className='my-4' />

                        <div className='information'>
                            <h3 className='rate-title mb-2'>Booking Schedule</h3>

                            <table className='rate-table'>
                                <tbody>
                                    {tours?.day?.enabled && (
                                        <tr>
                                            <td>Day Tour</td>
                                            <td>{`${tours.day.checkIn} – ${tours.day.checkOut}`}</td>
                                        </tr>
                                    )}
                                    {tours?.night?.enabled && (
                                        <tr>
                                            <td>Night Tour</td>
                                            <td>{`${tours.night.checkIn} – ${tours.night.checkOut}`}</td>
                                        </tr>
                                    )}
                                    {tours?.flexible?.enabled && (
                                        <tr>
                                            <td>Flexible</td>
                                            <td>Flexible schedule available</td>
                                        </tr>
                                    )}
                                    {!hasActiveTours && (
                                        <tr>
                                            <td colSpan="2" className="text-muted">No active tour schedules configured.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>

                            {(property?.capacity || property?.parkingSpace) && (
                                <>
                                    <h3 className='rate-title mb-2 mt-4'>Guest Accommodation</h3>
                                    <table className='rate-table'>
                                        <tbody>
                                            {property?.capacity && (
                                                <tr>
                                                    <td>The Property can accommodate up to {property.capacity} Guests</td>
                                                    <td></td>
                                                </tr>
                                            )}
                                            {property?.parkingSpace && (
                                                <tr>
                                                    <td>Space for up to {property.parkingSpace} cars</td>
                                                    <td></td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </>
                            )}

                            {property?.description && (
                                <>
                                    <p className='rate-desc mt-3'>
                                        {showMore
                                            ? property.description
                                            : `${property.description.slice(0, 180)}${property.description.length > 180 ? '...' : ''}`}
                                    </p>
                                    {property.description.length > 180 && (
                                        <button
                                            type='button'
                                            className='btn btn-warning rounded-pill px-4'
                                            onClick={() => setShowMore((value) => !value)}
                                        >
                                            {showMore ? 'Show less' : 'Show more'}
                                        </button>
                                    )}
                                </>
                            )}
                        </div>

                        <hr className='my-4' />

                        {features.length > 0 && (
                            <div className='offers'>
                                <h2 className='detail-title d-flex gap-2 align-items-center'>
                                    What this place offers
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-chevron-right" viewBox="0 0 16 16">
                                        <path fillRule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708" />
                                    </svg>
                                </h2>

                                <ul className='offers-list'>
                                    {property.amenities.map((amenity, idx) => (
                                        <li key={idx}>{amenity}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {bedrooms.length > 0 && (
                            <div className='cottages my-4'>
                                <h2 className='detail-title'>Bedrooms</h2>

                                <div className='cottage-grid'>
                                    {bedrooms.map((bedroom, index) => (
                                        <CottageCard 
                                            key={bedroom.id || index} 
                                            image={bedroom.photo || bedroom.image || resortImage}
                                            name={bedroom.name}
                                            capacity={bedroom.capacity}
                                            price={bedroomDescription(bedroom)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>

                    <div className='booking col-lg-5 my-4 position-sticky align-self-start'>
                        <BookingCard cottages={bedrooms} resort={resort} property={property} />
                    </div>
                </div>

                <button
                    type='button'
                    className='mobile-booking-trigger'
                    ref={bookingTriggerRef}
                    aria-expanded={bookingOpen}
                    aria-controls='mobile-booking-panel'
                    onClick={() => setBookingOpen(true)}
                >
                    Book your stay
                </button>

                {bookingOpen && (
                    <button
                        type='button'
                        className='booking-backdrop'
                        aria-label='Close booking'
                        onClick={() => setBookingOpen(false)}
                    />
                )}

                <div
                    id='mobile-booking-panel'
                    className='mobile-booking-panel'
                    role='dialog'
                    aria-modal='true'
                    aria-labelledby='mobile-booking-title'
                >
                    <div className='mobile-booking-header'>
                        <h2 id='mobile-booking-title'>Book your stay</h2>
                        <button
                            type='button'
                            className='mobile-booking-close'
                            ref={bookingCloseRef}
                            aria-label='Close booking'
                            onClick={() => setBookingOpen(false)}
                        >
                            &times;
                        </button>
                    </div>
                    <BookingCard cottages={bedrooms} resort={resort} property={property} />
                </div>

                <div className='location-container my-4'>
                    <h2 className='detail-title'>Location</h2>
                    <span className='location-sub'>{location}</span>

                    <div className='map-integration my-3 rounded-4 overflow-hidden' style={{ height: '350px' }}>
                        <MapContainer center={[coordinates.lat, coordinates.lng]} zoom={15} style={{ width: '100%', height: '100%' }}>
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            <Marker position={[coordinates.lat, coordinates.lng]} />
                        </MapContainer>
                    </div>

                    <p className='location-address'>
                        {property?.address || location}
                    </p>
                </div>
            </div>

            <Footer />
        </>
    )
}

export default PlaceDetails