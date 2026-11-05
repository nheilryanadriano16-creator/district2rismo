import React, { useEffect, useState } from 'react'
import FeaturedCards from '../components/FeaturedCards'
import { Link } from 'react-router-dom'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../firebase'

function Featured() {
    const [properties, setProperties] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchPopularProperties = async () => {
            try {
                const propertiesRef = collection(db, 'properties')
                const q = query(
                    propertiesRef,
                    where('status', '==', 'Approved')
                )

                const querySnapshot = await getDocs(q)
                const fetchedProperties = querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }))

                const sortedProperties = fetchedProperties
                    .sort((a, b) => {
                        const resA = Number(a.totalReservations) || 0
                        const resB = Number(b.totalReservations) || 0
                        if (resB !== resA) {
                            return resB - resA
                        }
                        return (Number(b.views) || 0) - (Number(a.views) || 0)
                    })
                    .slice(0, 3)

                setProperties(sortedProperties)
            } catch (error) {
                console.error('Error fetching popular properties:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchPopularProperties()
    }, [])

    return (
        <div className='featured-container d-flex flex-column align-items-center justify-content-center my-5'>
            <div className='title-container'>
                <h1>
                    Discover <span id='yellow-text-bold'>most popular destination </span>
                    across every municipality in the district.
                </h1>
            </div>

            <div className='w-75 my-4 row g-3'>
                {loading ? (
                    <div className='text-center py-4 text-white'>Loading popular destinations...</div>
                ) : properties.length > 0 ? (
                    properties.map((property) => (
                        <div className='col-12 col-md-4' key={property.id}>
                            <FeaturedCards 
                                image={property.image || property.imageUrl || (property.images && property.images[0])}
                                name={property.name}
                                town={property.municipality || property.location || property.address || 'Bulacan'}
                                desc={property.shortDescription || property.description}
                                link={`/destination/${property.id}`}
                            />
                        </div>
                    ))
                ) : (
                    <div className='text-center py-4 text-white'>No featured destinations found.</div>
                )}
            </div>

            <div>
                <Link to='/destination' className='view-more'>
                    View more destination
                </Link>
            </div>
        </div>
    )
}

export default Featured