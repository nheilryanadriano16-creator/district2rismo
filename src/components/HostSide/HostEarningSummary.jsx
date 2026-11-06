import resortImage from '../../images/Bustos Hero.png'
import { resolveUploadUrl } from '../../utils/uploads'
import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../../firebase'

const money = (amount) =>
    `₱${Number(amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`

export const HostEarningSummary = () => {
    const { currentUser } = useAuth()
    const [period, setPeriod] = useState('This Month')
    const [summary, setSummary] = useState({
        total: 0,
        fees: 0,
        net: 0,
        completedCount: 0,
        transactions: [],
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let isMounted = true

        async function loadEarnings() {
            if (!currentUser?.uid) return
            try {
                setLoading(true)
                const now = new Date()
                const currentMonth = now.getMonth()
                const currentYear = now.getFullYear()

                // Query all bookings in Firestore
                const bookingsSnap = await getDocs(collection(db, 'bookings'))
                
                let totalAmount = 0
                let completed = 0
                const txList = []

                bookingsSnap.docs.forEach((docItem) => {
                    const data = docItem.data()
                    
                    // Filter by host property or email if stored, or list all bookings linked to host
                    const status = String(data.status || '').toLowerCase()
                    
                    // Consider Accepted, Confirmed, and Completed bookings as earnings
                    if (['accepted', 'confirmed', 'completed'].includes(status)) {
                        const bookingDate = data.date ? new Date(data.date) : new Date()
                        const bookingMonth = bookingDate.getMonth()
                        const bookingYear = bookingDate.getFullYear()

                        const isThisMonth = bookingMonth === currentMonth && bookingYear === currentYear
                        const isThisYear = bookingYear === currentYear

                        if ((period === 'This Month' && isThisMonth) || (period === 'This Year' && isThisYear)) {
                            const amount = Number(data.total || data.totalAmount || 0)
                            totalAmount += amount
                            completed += 1

                            txList.push({
                                id: docItem.id,
                                resort: data.propertyName || data.resort || 'Resort Property',
                                booking: data.session || 'Day Tour',
                                date: data.date || 'Recently',
                                amount: money(amount),
                                rawAmount: amount,
                                image: resolveUploadUrl(data.imageUrl || data.image) || resortImage,
                            })
                        }
                    }
                })

                const platformFees = totalAmount * 0.10 // 10% platform fee
                const netAmount = totalAmount - platformFees

                if (isMounted) {
                    setSummary({
                        total: totalAmount,
                        fees: platformFees,
                        net: netAmount,
                        completedCount: completed,
                        transactions: txList,
                    })
                }
            } catch (error) {
                console.error('Error loading host earnings:', error)
            } finally {
                if (isMounted) setLoading(false)
            }
        }

        loadEarnings()
        return () => {
            isMounted = false
        }
    }, [currentUser, period])

    return (
        <section className="host-earningN container-fluid p-3 p-md-4">
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
                <h1 className="h2 fw-bold text-warning mb-0">Earning Summary</h1>
                <select
                    className="form-select host-earning-periodN rounded-pill"
                    aria-label="Choose earnings period"
                    value={period}
                    onChange={(event) => setPeriod(event.target.value)}
                >
                    <option value="This Month">This Month</option>
                    <option value="This Year">This Year</option>
                </select>
            </div>

            <h2 className="small host-earning-headingN mb-2">Overview</h2>

            <article className="card host-earning-cardN border-0 rounded-4 p-3 p-md-4 mb-3">
                <h2 className="h5 fw-semibold mb-2">Total Earnings</h2>
                <p className="display-5 fw-bold text-warning mb-0">{money(summary.total)}</p>
            </article>

            <div className="row g-3 mb-4">
                <div className="col-12 col-md-6">
                    <article className="card host-earning-cardN border-0 rounded-4 h-100 p-3">
                        <h2 className="h5 fw-semibold mb-1">Net Earnings</h2>
                        <p className="h2 fw-bold mb-0">{money(summary.net)}</p>
                        <small>After {money(summary.fees)} platform fees (10%)</small>
                    </article>
                </div>

                <div className="col-12 col-md-6">
                    <article className="card host-earning-cardN border-0 rounded-4 h-100 p-3">
                        <h2 className="h5 fw-semibold mb-1">Completed / Confirmed Bookings</h2>
                        <p className="display-6 fw-bold mb-0">{summary.completedCount}</p>
                    </article>
                </div>
            </div>

            <h2 className="small host-earning-headingN mb-2">Recent Transactions</h2>

            {loading ? (
                <p className="small text-secondary mb-0">Loading earnings...</p>
            ) : (
                <div className="d-flex flex-column gap-2">
                    {summary.transactions.map((transaction) => (
                        <article
                            key={transaction.id}
                            className="host-transactionN d-flex align-items-center gap-2 gap-md-3 rounded-3 p-2"
                        >
                            <img
                                className="host-transaction-imageN rounded-2 flex-shrink-0"
                                src={transaction.image}
                                alt={transaction.resort}
                            />

                            <div className="flex-grow-1">
                                <h3 className="h6 fw-semibold mb-0">{transaction.resort}</h3>
                                <p className="small text-warning mb-0">
                                    {transaction.booking} · {transaction.date}
                                </p>
                            </div>

                            <span className="small text-warning text-nowrap">
                                +{transaction.amount}
                            </span>
                        </article>
                    ))}
                    {summary.transactions.length === 0 && (
                        <p className="small text-secondary mb-0">No completed bookings in this period.</p>
                    )}
                </div>
            )}
        </section>
    )
}