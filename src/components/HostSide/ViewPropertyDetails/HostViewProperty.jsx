import { Fragment, useState } from 'react'
import resortImage from '../../../images/Bustos Hero.png'
import { resolveUploadUrl } from '../../../utils/uploads'

export const HostViewProperty = ({
    property,
    onBack,
    onViewBookings,
    onViewReviews,
    onEdit,
    onDelete,
}) => {
    const [showMore, setShowMore] = useState(false)
    const name = property?.name || 'Untitled Property'
    const location = property?.location || property?.address || 'Location Not Specified'
    
    const propertyImage = resolveUploadUrl(property?.image ||
        property?.imageUrl || 
        property?.images?.[0] || 
        property?.mediaPhotos?.cover?.[0]?.preview || 
        property?.mediaPhotos?.cover?.[0]?.localPath || 
        property?.mediaPhotos?.cover?.[0]?.url ||
        property?.media?.cover?.[0]?.preview || 
        property?.media?.cover?.[0]?.localPath || 
        property?.media?.cover?.[0]?.url
    ) || resortImage

    const rawGallery = property?.galleryImages || 
        property?.images || 
        property?.mediaPhotos?.gallery || 
        property?.media?.gallery || []

    const galleryImages = rawGallery.map(item =>
        resolveUploadUrl(typeof item === 'string' ? item : (item?.preview || item?.localPath || item?.url || ''))
    ).filter(Boolean)
    
    const features = property?.amenities?.length
        ? Array.from({ length: Math.ceil(property.amenities.length / 2) }, (_, index) => [
            property.amenities[index * 2],
            property.amenities[index * 2 + 1] || '',
        ])
        : []

    const rawBedrooms = property?.bedrooms || property?.cottages || []
    const bedrooms = rawBedrooms.map(bed => ({
        ...bed,
        photo: resolveUploadUrl(bed.photo || bed.image || bed.localPath || bed.preview || bed.url ||
               (Array.isArray(bed.photos) ? (bed.photos[0]?.preview || bed.photos[0]?.localPath || bed.photos[0]?.url) : null))
    }))

    const tours = property?.tourSettings

    const bedroomDescription = (bedroom) => bedroom.description || [
        bedroom.capacity ? `${bedroom.capacity} guests` : '',
        bedroom.beds?.map((bed) => `${bed.quantity} ${bed.type}`).join(' and '),
    ].filter(Boolean).join(' • ')

    const hasActiveTours = tours?.day?.enabled || tours?.night?.enabled || tours?.flexible?.enabled

    return (
        <section className="host-view-property-pageN mx-5">
            <nav aria-label="Breadcrumb" className="small mb-3">
                <button
                    type="button"
                    className="btn btn-link p-0 host-view-property-crumbN"
                    onClick={onBack}
                >
                    Properties
                </button>
                <span className="mx-1">›</span>
                <span className="text-warning">View Property</span>
            </nav>

            <div className="row g-3">
                <div className="col-12 col-md-7">
                    <img
                        className="host-view-property-main-imageN rounded-2 w-100"
                        src={propertyImage}
                        alt={name}
                    />
                </div>

                <div className="col-12 col-md-5">
                    <div className="row g-2">
                        {galleryImages.slice(0, 4).map((image, index) => (
                            <div className="col-6" key={index}>
                                <img
                                    className="host-view-property-gallery-imageN rounded-2 w-100"
                                    src={image}
                                    alt={`${name} gallery ${index + 1}`}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="details-parent-container row">
                <div className="details col-12 col-lg-7">
                    <div className="place-name my-4 d-flex flex-column gap-4">
                        <div>
                            <h1 className="lh-1">{name}</h1>
                            <h3>{location}</h3>
                        </div>
                        <span className="badge rounded-pill host-view-property-badgeN align-self-start">
                            Private Resort
                        </span>
                    </div>

                    <hr className="host-view-property-dividerN my-4" />

                    <div className="information">
                        <h2 className="rate-title mb-2">Booking &amp; Schedule</h2>
                        <table className="rate-table">
                            <tbody>
                                {tours?.day?.enabled && (
                                    <tr>
                                        <td>Day Tour</td>
                                        <td>{`${tours.day.checkIn} - ${tours.day.checkOut}`}</td>
                                    </tr>
                                )}
                                {tours?.night?.enabled && (
                                    <tr>
                                        <td>Night Tour</td>
                                        <td>{`${tours.night.checkIn} - ${tours.night.checkOut}`}</td>
                                    </tr>
                                )}
                                {tours?.flexible?.enabled && (
                                    <tr>
                                        <td>Flexible</td>
                                        <td>{`Starts ${tours.flexible.checkIns?.join(' or ') || '08:00 AM'} - Ends ${tours.flexible.checkOuts?.join(' or ') || '05:00 PM'}`}</td>
                                    </tr>
                                )}
                                {!hasActiveTours && (
                                    <tr>
                                        <td colSpan="2" className="text-muted">No active tour schedules configured.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        {(property?.guestCapacity || property?.parkingSpace) && (
                            <>
                                <h2 className="rate-title mb-2 mt-4">Guest Accommodation</h2>
                                <table className="rate-table">
                                    <tbody>
                                        {property?.guestCapacity && (
                                            <tr>
                                                <td>The Property can accommodate {property.guestCapacity} Guests</td>
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
                                <p className="rate-desc mt-3">
                                    {showMore
                                        ? property.description
                                        : `${property.description.slice(0, 180)}${property.description.length > 180 ? '...' : ''}`}
                                </p>
                                {property.description.length > 180 && (
                                    <button
                                        type="button"
                                        className="btn btn-warning rounded-pill px-4"
                                        onClick={() => setShowMore((value) => !value)}
                                    >
                                        {showMore ? 'Show less' : 'Show more'}
                                    </button>
                                )}
                            </>
                        )}
                    </div>

                    {features.length > 0 && (
                        <>
                            <hr className="host-view-property-dividerN my-4" />
                            <h2 className="detail-title">What this place offers</h2>
                            <div className="row small g-2">
                                {features.map(([left, right], idx) => (
                                    <Fragment key={idx}>
                                        <div className="col-6">{left}</div>
                                        <div className="col-6">{right}</div>
                                    </Fragment>
                                ))}
                            </div>
                        </>
                    )}

                    {bedrooms.length > 0 && (
                        <div className="cottages my-4">
                            <h2 className="detail-title">Bedrooms</h2>
                            <div className="row g-3">
                                {bedrooms.map((bedroom, index) => (
                                    <div className="col-6 col-lg-5" key={bedroom.name || index}>
                                        <img
                                            className="host-view-bedroom-imageN rounded-2 w-100"
                                            src={bedroom.photo || resortImage}
                                            alt={bedroom.name}
                                        />
                                        <h3 className="small mt-1 mb-0">{bedroom.name}</h3>
                                        <p className="host-view-property-descriptionN mb-0">{bedroomDescription(bedroom)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <aside className="col-12 col-lg-5 my-4 position-sticky align-self-start">
                    <div className="host-view-property-actionsN rounded-4 p-3">
                        <button
                            type="button"
                            className="btn btn-warning rounded-pill w-100 mb-2"
                            onClick={onViewBookings}
                        >
                            View Bookings
                        </button>
                        <button
                            type="button"
                            className="btn btn-warning rounded-pill w-100 mb-3"
                            onClick={onViewReviews}
                        >
                            View Reviews
                        </button>

                        <hr />

                        <button
                            type="button"
                            className="btn btn-warning rounded-pill w-100 mb-2"
                            onClick={onEdit}
                        >
                            Edit Property
                        </button>
                        <button
                            type="button"
                            className="btn host-view-property-deleteN rounded-pill w-100"
                            onClick={onDelete}
                        >
                            Delete Property
                        </button>
                    </div>
                </aside>
            </div>
        </section>
    )
}

export default HostViewProperty