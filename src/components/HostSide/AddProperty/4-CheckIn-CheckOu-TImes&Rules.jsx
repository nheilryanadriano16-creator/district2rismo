import { useState } from 'react'

const initialTourSettings = {
    day: { enabled: true, checkIn: '08:00 AM', checkOut: '05:00 PM', rate: '5000' },
    night: { enabled: false, checkIn: '05:00 PM', checkOut: '08:00 AM', rate: '7000' },
    flexible: {
        enabled: false,
        checkIns: ['08:00 AM'],
        checkOuts: ['05:00 PM'],
        rate: '5000',
    },
}

export const CheckInCheckOutTimesRules = ({ onBack, onNext, onExit, property, onPropertyChange, editNavigation }) => {
    const parseTourSettings = (savedTours) => {
        if (!savedTours) return initialTourSettings
        return {
            day: {
                enabled: savedTours.day?.enabled ?? false,
                checkIn: savedTours.day?.checkIn || '08:00 AM',
                checkOut: savedTours.day?.checkOut || '05:00 PM',
                rate: savedTours.day?.rate || '5000',
            },
            night: {
                enabled: savedTours.night?.enabled ?? false,
                checkIn: savedTours.night?.checkIn || '05:00 PM',
                checkOut: savedTours.night?.checkOut || '08:00 AM',
                rate: savedTours.night?.rate || '7000',
            },
            flexible: {
                enabled: savedTours.flexible?.enabled ?? false,
                checkIns: savedTours.flexible?.checkIns || ['08:00 AM'],
                checkOuts: savedTours.flexible?.checkOuts || ['05:00 PM'],
                rate: savedTours.flexible?.rate || '5000',
            },
        }
    }

    const [tours, setTours] = useState(parseTourSettings(property?.tourSettings))

    const buildPayload = (currentTours) => {
        const payload = {}
        if (currentTours.day?.enabled) {
            payload.day = {
                enabled: true,
                checkIn: currentTours.day.checkIn,
                checkOut: currentTours.day.checkOut,
                rate: currentTours.day.rate,
            }
        }
        if (currentTours.night?.enabled) {
            payload.night = {
                enabled: true,
                checkIn: currentTours.night.checkIn,
                checkOut: currentTours.night.checkOut,
                rate: currentTours.night.rate,
            }
        }
        if (currentTours.flexible?.enabled) {
            payload.flexible = {
                enabled: true,
                checkIns: currentTours.flexible.checkIns,
                checkOuts: currentTours.flexible.checkOuts,
                rate: currentTours.flexible.rate,
            }
        }
        return payload
    }

    const updateTour = (tour, field, value) => {
        const updated = {
            ...tours,
            [tour]: { ...tours[tour], [field]: value },
        }
        setTours(updated)
        onPropertyChange?.({ tourSettings: buildPayload(updated) })
    }

    const toggleTourEnabled = (tourKey) => {
        const updated = {
            ...tours,
            [tourKey]: { ...tours[tourKey], enabled: !tours[tourKey].enabled },
        }
        setTours(updated)
        onPropertyChange?.({ tourSettings: buildPayload(updated) })
    }

    const updateFlexibleTimes = (field, update) => {
        const updated = {
            ...tours,
            flexible: {
                ...tours.flexible,
                [field]: update(tours.flexible[field]),
            },
        }
        setTours(updated)
        onPropertyChange?.({ tourSettings: buildPayload(updated) })
    }

    const removeFlexibleTime = (field, indexToRemove) => {
        updateFlexibleTimes(field, (times) =>
            times.filter((_, index) => index !== indexToRemove)
        )
    }

    const editFlexibleTime = (field, indexToEdit, value) => {
        updateFlexibleTimes(field, (times) =>
            times.map((time, index) => index === indexToEdit ? value : time)
        )
    }

    const renderTour = (key, title) => {
        const tour = tours[key] || {}
        const isFlexible = key === 'flexible'

        return (
            <div className="col-12 col-md-4" key={key}>
                <div className="form-check mb-3">
                    <input
                        className="form-check-input host-tour-radioN"
                        type="checkbox"
                        id={`tour-${key}`}
                        checked={tour.enabled || false}
                        onChange={() => toggleTourEnabled(key)}
                    />
                    <label className="form-check-label text-warning fw-semibold" htmlFor={`tour-${key}`}>
                        {title}
                    </label>
                </div>

                {!isFlexible ? (
                    <>
                        <label className="form-label small mb-1" htmlFor={`${key}-checkin`}>
                            Check-in
                        </label>
                        <input
                            id={`${key}-checkin`}
                            className="form-control host-add-property-inputN mb-2"
                            type="text"
                            value={tour.checkIn || ''}
                            readOnly
                        />

                        <label className="form-label small mb-1" htmlFor={`${key}-checkout`}>
                            Check-out
                        </label>
                        <input
                            id={`${key}-checkout`}
                            className="form-control host-add-property-inputN mb-2"
                            type="text"
                            value={tour.checkOut || ''}
                            readOnly
                        />
                    </>
                ) : (
                    <>
                        <label className="form-label small mb-1">Check-in</label>

                        {(tour.checkIns || []).map((time, index) => (
                            <div className="input-group mb-2" key={`checkin-${index}`}>
                                <input
                                    className="form-control host-add-property-inputN"
                                    type="time"
                                    aria-label={`Flexible check-in time ${index + 1}`}
                                    value={time}
                                    onChange={(event) =>
                                        editFlexibleTime('checkIns', index, event.target.value)
                                    }
                                />
                                {index > 0 && (
                                    <button
                                        type="button"
                                        className="btn host-tour-remove-timeN"
                                        aria-label={`Remove check-in time ${index + 1}`}
                                        onClick={() => removeFlexibleTime('checkIns', index)}
                                    >
                                        &times;
                                    </button>
                                )}
                            </div>
                        ))}

                        <label className="form-label small mb-1">Check-out</label>

                        {(tour.checkOuts || []).map((time, index) => (
                            <input
                                key={`checkout-${index}`}
                                className="form-control host-add-property-inputN mb-2"
                                type="time"
                                aria-label={`Flexible check-out time ${index + 1}`}
                                value={time}
                                onChange={(event) =>
                                    editFlexibleTime('checkOuts', index, event.target.value)
                                }
                            />
                        ))}
                    </>
                )}

                <label className="form-label small mb-1" htmlFor={`${key}-rate`}>
                    Rates
                </label>
                <div className="input-group">
                    <span className="input-group-text host-tour-currencyN">₱</span>
                    <input
                        id={`${key}-rate`}
                        className="form-control host-add-property-inputN"
                        type="number"
                        min="0"
                        value={tour.rate || ''}
                        onChange={(event) => updateTour(key, 'rate', event.target.value)}
                    />
                </div>
            </div>
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

            <h1 className="h5 fw-bold text-warning mb-4">
                4. Check-in &amp; Check-out Times and Rates
            </h1>

            <div className="row g-3">
                {renderTour('day', 'Day Tour')}
                {renderTour('night', 'Night Tour')}
                {renderTour('flexible', 'Flexible')}
            </div>

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
                        onPropertyChange?.({ tourSettings: buildPayload(tours) })
                        onNext?.()
                    }}
                >
                    Next
                </button>
            </div>
        </section>
    )
}