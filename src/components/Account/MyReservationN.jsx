import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../../firebase'
import resortImage from '../../images/Baliwag Featured.png'

const filters = ['All', 'Completed', 'Confirmed', 'Pending', 'Cancelled']

export const MyReservationN = () => {
    const { currentUser } = useAuth()
    const [reservations, setReservations] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [activeFilter, setActiveFilter] = useState('All')

    useEffect(() => {
        async function fetchUserReservations() {
            if (!currentUser?.uid) return
            try {
                setLoading(true)
                const q = query(
                    collection(db, 'bookings'),
                    where('userId', '==', currentUser.uid)
                )
                const snapshot = await getDocs(q)
                const loaded = snapshot.docs.map(docItem => {
                    const data = docItem.data()
                    const cottagesList = Array.isArray(data.cottages)
                        ? data.cottages.map(c => c.name).join(', ')
                        : (data.cottages || 'Standard Room')

                    return {
                        id: docItem.id,
                        resortName: data.propertyName || 'Resort Property',
                        location: data.location || 'Bustos, Bulacan',
                        image: data.image || resortImage,
                        session: data.session || 'Day Tour',
                        date: data.date || '',
                        cottage: cottagesList,
                        guests: `${data.guestsCount || 1} Guests`,
                        totalPrice: data.total || 0,
                        status: data.status || 'Pending'
                    }
                })
                setReservations(loaded)
            } catch (err) {
                console.error('Error fetching user reservations:', err)
                setError('Failed to load reservations.')
            } finally {
                setLoading(false)
            }
        }

        fetchUserReservations()
    }, [currentUser])

    const visibleReservations = activeFilter === 'All'
        ? reservations
        : reservations.filter((res) => res.status.toLowerCase() === activeFilter.toLowerCase())

    return (
        <section className="reservations-panelN container-fluid p-3 p-md-4 p-lg-5 pt-0 text-white">
            <div className="reservations-sticky-headerN">
                <h1 className="h2 fw-bold reservations-titleN mb-3">My Reservations</h1>

                <div className="d-flex flex-wrap gap-2 mb-4" role="group" aria-label="Filter reservations">
                    {filters.map((filter) => (
                        <button
                            key={filter}
                            type="button"
                            className={`btn btn-sm rounded-pill px-4 ${activeFilter === filter ? 'btn-warning' : 'btn-outline-warning'}`}
                            aria-pressed={activeFilter === filter}
                            onClick={() => setActiveFilter(filter)}
                        >
                            {filter}
                        </button>
                    ))}
                </div>
            </div>

            {loading && <p className="text-secondary" role="status">Loading reservations…</p>}
            {!loading && error && <div className="alert alert-danger" role="alert">{error}</div>}
            {!loading && !error && visibleReservations.length === 0 && <p className="text-secondary">No reservations in this category.</p>}

            {!loading && !error && (
                <div className="d-flex flex-column gap-3">
                    {visibleReservations.map((reservation) => (
                        <article key={reservation.id} className="reservation-cardN card border-0 overflow-hidden">
                            <div className="row g-0 h-100">
                                <div className="col-12 col-md-6 col-xl-5">
                                    <div className="reservation-summaryN d-flex flex-column flex-sm-row align-items-start gap-3 p-3 h-100">
                                        <img className="reservation-imageN rounded-3 flex-shrink-0" src={reservation.image} alt={reservation.resortName} />
                                        <div className="min-w-0">
                                            <h2 className="h5 mb-1">{reservation.resortName}</h2>
                                            <p className="reservations-locationN fw-semibold mb-1">{reservation.location}</p>
                                            <p className="small mb-0">Total: ₱{Number(reservation.totalPrice).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
                                            <span className="badge rounded-pill mt-3 reservation-statusN">{reservation.status}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-12 col-md-6 col-xl-7">
                                    <div className="reservation-detailsN p-3 h-100">
                                        <p className="small mb-2">Details:</p>
                                        <div className="d-flex justify-content-between gap-3"><span>Session</span><span className="text-end">{reservation.session}</span></div>
                                        <div className="d-flex justify-content-between gap-3"><span>Date</span><span className="text-end">{reservation.date ? new Date(`${reservation.date}T00:00:00`).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }) : '—'}</span></div>
                                        <div className="d-flex justify-content-between gap-3"><span>Cottage</span><span className="text-end">{reservation.cottage}</span></div>
                                        <div className="d-flex justify-content-between gap-3"><span>Guest</span><span className="text-end">{reservation.guests}</span></div>
                                    </div>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </section>
    )
}