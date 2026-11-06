import resortImage from '../../images/Bustos Hero.png'
import { resolveUploadUrl } from '../../utils/uploads'
import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { fetchHostBookings, fetchHostProperties, parseAmount } from '../../utils/hostData'

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
    const [error, setError] = useState('')

    useEffect(() => {
        let isMounted = true

        async function loadEarnings() {
            if (!currentUser?.uid) {
                setSummary({ total: 0, fees: 0, net: 0, completedCount: 0, transactions: [] })
                setLoading(false)
                return
            }
            try {
                setLoading(true)
                setError('')
                setSummary({ total: 0, fees: 0, net: 0, completedCount: 0, transactions: [] })
                const now = new Date()
                const currentMonth = now.getMonth()
                const currentYear = now.getFullYear()
                const properties = await fetchHostProperties(currentUser.uid, { email: currentUser.email })
                const bookings = await fetchHostBookings(currentUser.uid, properties)
                let totalAmount = 0
                let completed = 0
                const txList = []

                bookings.forEach((data) => {
                    const status = String(data.status || '').toLowerCase()
                    if (['accepted', 'confirmed', 'completed'].includes(status)) {
                        const rawDate = data.date || data.startDate
                        const bookingDate = typeof rawDate?.toDate === 'function'
                            ? rawDate.toDate()
                            : rawDate instanceof Date
                                ? rawDate
                                : new Date(rawDate)
                        if (Number.isNaN(bookingDate.getTime())) return

                        const bookingMonth = bookingDate.getMonth()
                        const bookingYear = bookingDate.getFullYear()

                        const isThisMonth = bookingMonth === currentMonth && bookingYear === currentYear
                        const isThisYear = bookingYear === currentYear

                        if ((period === 'This Month' && isThisMonth) || (period === 'This Year' && isThisYear)) {
                            const amount = parseAmount(data.total || data.totalAmount || data.amountPaid || 0)
                            totalAmount += amount
                            completed += 1

                            txList.push({
                                id: data.id,
                                resort: data.propertyName || data.resort || 'Resort Property',
                                booking: data.session || 'Day Tour',
                                date: bookingDate.toLocaleDateString('en-PH'),
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
                if (isMounted) setError('Could not load earnings for this account. Please try again.')
            } finally {
                if (isMounted) setLoading(false)
            }
        }

        loadEarnings()
        return () => {
            isMounted = false
        }
    }, [currentUser?.uid, currentUser?.email, period])

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
            ) : error ? (
                <p className="small text-danger mb-0" role="alert">{error}</p>
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