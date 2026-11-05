import React, { useEffect, useState } from 'react'
import NavBar from '../components/NavBar.jsx'
import PlaceList from '../components/PlaceList.jsx'
import Sample from '../images/Baliwag Featured.png'
import Footer from '../components/Footer.jsx'
import Modal from 'react-bootstrap/Modal'
import { FilterN } from '../components/FilterN.jsx'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../firebase'

const ALLOWED_TOWNS = ['Baliwag', 'Bustos', 'Plaridel']

const getLowestRate = (data) => {
    const rates = []

    if (data.tourSettings) {
        Object.values(data.tourSettings).forEach((tour) => {
            if (tour?.enabled && tour?.rate) {
                const parsedRate = parseFloat(tour.rate)
                if (!isNaN(parsedRate)) {
                    rates.push(parsedRate)
                }
            }
        })
    }

    if (rates.length === 0 && data.price) {
        const parsedPrice = parseFloat(data.price)
        if (!isNaN(parsedPrice)) {
            rates.push(parsedPrice)
        }
    }

    if (rates.length > 0) {
        const minRate = Math.min(...rates)
        return `Starts at ₱${minRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }

    return 'Starts at ₱5,000.00'
}

function Destinations() {
    const [showFilter, setShowFilter] = useState(false)
    const [resorts, setResorts] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        const fetchProperties = async () => {
            try {
                setLoading(true)
                const propertiesRef = collection(db, 'properties')
                const q = query(
                    propertiesRef,
                    where('status', '==', 'Approved')
                )

                const querySnapshot = await getDocs(q)
                const fetched = querySnapshot.docs.map((doc) => {
                    const data = doc.data()

                    const rawTown = data.municipality || data.address || ''
                    const matchedTown = ALLOWED_TOWNS.find((t) =>
                        rawTown.toLowerCase().includes(t.toLowerCase())
                    )

                    const propertyImage =
                        data.image ||
                        data.imageUrl ||
                        (data.images && data.images[0]) ||
                        data.mediaPhotos?.cover?.[0]?.localPath ||
                        Sample

                    return {
                        id: doc.id,
                        name: data.name || 'Unnamed Property',
                        town: matchedTown || 'Baliwag',
                        price: getLowestRate(data),
                        image: propertyImage,
                        description: data.shortDescription || data.description || '',
                    }
                })

                setResorts(fetched)
            } catch (error) {
                console.error('Error fetching approved properties:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchProperties()
    }, [])

    const filteredResorts = resorts.filter(
        (r) =>
            (r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                r.town.toLowerCase().includes(searchTerm.toLowerCase())) &&
            ALLOWED_TOWNS.includes(r.town)
    )

    return (
        <div>
            <div className="destinations-page">
                <NavBar />

                <div className="dest-parent-container mx-3 d-flex justify-content-between gap-3">
                    <button
                        className="filter d-flex align-items-center gap-1"
                        aria-label="Filter"
                        onClick={() => setShowFilter(true)}
                    >
                        <span className="filter-text">Filter</span>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            fill="currentColor"
                            className="bi bi-sliders"
                            viewBox="0 0 16 16"
                        >
                            <path
                                fillRule="evenodd"
                                d="M11.5 2a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3M9.05 3a2.5 2.5 0 0 1 4.9 0H16v1h-2.05a2.5 2.5 0 0 1-4.9 0H0V3zM4.5 7a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3M2.05 8a2.5 2.5 0 0 1 4.9 0H16v1H6.95a2.5 2.5 0 0 1-4.9 0H0V8zm9.45 4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3m-2.45 1a2.5 2.5 0 0 1 4.9 0H16v1h-2.05a2.5 2.5 0 0 1-4.9 0H0v-1z"
                            />
                        </svg>
                    </button>

                    <div className="search-wrapper d-flex align-items-center">
                        <input
                            className="search-bar"
                            type="text"
                            placeholder="Search Destination"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            fill="currentColor"
                            className="bi bi-search"
                            viewBox="0 0 16 16"
                        >
                            <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0" />
                        </svg>
                    </div>

                    <Modal
                        show={showFilter}
                        onHide={() => setShowFilter(false)}
                        centered
                        contentClassName="bg-transparent border-0"
                    >
                        <Modal.Body className="p-0">
                            <FilterN onClose={() => setShowFilter(false)} />
                        </Modal.Body>
                    </Modal>
                </div>

                <div className="mx-3">
                    {loading ? (
                        <div className="text-center py-5 text-white">Loading destinations...</div>
                    ) : (
                        ALLOWED_TOWNS.map((town) => {
                            const townPlaces = filteredResorts.filter((r) => r.town === town)
                            if (townPlaces.length === 0) return null

                            return (
                                <PlaceList
                                    key={town}
                                    town={`${town}, Bulacan`}
                                    places={townPlaces}
                                />
                            )
                        })
                    )}
                </div>
            </div>
            <Footer />
        </div>
    )
}

export default Destinations