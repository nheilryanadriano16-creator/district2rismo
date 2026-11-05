import React, { useEffect, useState } from 'react'
import Header from '../components/Header.jsx'
import BaliwagHero from '../images/Baliwag Hero.png'
import Footer from '../components/Footer.jsx'
import { Link } from 'react-router-dom'
import { useLocation } from 'react-router-dom'
import StripePaymentN from '../components/StripePaymentN.jsx'
import PaymenSuccessfulStripe from '../components/PaymenSuccessfulStripe.jsx'
import { db } from '../firebase' // Adjust path to your firebase config if needed
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { useAuth } from '../context/AuthContext'

const PENDING_PAYMENT_STORAGE_KEY = 'district2rismo.pendingPayment'

function readPendingPayment() {
    try {
        return JSON.parse(sessionStorage.getItem(PENDING_PAYMENT_STORAGE_KEY) || 'null')
    } catch {
        return null
    }
}

function ConfirmPayment() {
    const location = useLocation()
    const { state } = location
    const { currentUser } = useAuth()
    const sessionId = new URLSearchParams(location.search).get('session_id')
    const [pendingPayment, setPendingPayment] = useState(() =>
        state?.booking ? { booking: state.booking } : readPendingPayment()
    )
    const booking = state?.booking || pendingPayment?.booking
    const [step, setStep] = useState(() => sessionId ? 3 : (pendingPayment?.step || 1))
    const [payOption, setPayOption] = useState(() => pendingPayment?.payOption || 'full')
    const [method, setMethod] = useState(() => pendingPayment?.method || 'gcash')
    const [showPaymentSuccess, setShowPaymentSuccess] = useState(false)
    const [paymentResult, setPaymentResult] = useState({
        loading: Boolean(sessionId),
        error: '',
        status: '',
        paymentStatus: '',
    })

    useEffect(() => {
        if (!sessionId) return

        const controller = new AbortController()

        async function verifyPayment() {
            setPaymentResult({
                loading: true,
                error: '',
                status: '',
                paymentStatus: '',
            })

            try {
                const apiUrl =
                    import.meta.env.VITE_PAYMENT_API_URL || 'http://localhost:4242'
                const response = await fetch(
                    `${apiUrl}/verify-checkout-session?session_id=${encodeURIComponent(sessionId)}`,
                    { signal: controller.signal }
                )
                const data = await response.json()

                if (!response.ok) {
                    throw new Error(data.error || 'Could not verify payment.')
                }

                setPaymentResult({
                    loading: false,
                    error: '',
                    status: data.status,
                    paymentStatus: data.payment_status,
                })
                setShowPaymentSuccess(data.payment_status === 'paid')
                
                // Save to Firebase upon successful Stripe verification
                if (data.payment_status === 'paid' && booking) {
                    saveBookingToFirebase(booking)
                }
            } catch (error) {
                if (error.name !== 'AbortError') {
                    setPaymentResult({
                        loading: false,
                        error: error.message || 'Could not verify payment.',
                        status: '',
                        paymentStatus: '',
                    })
                }
            }
        }

        verifyPayment()
        return () => controller.abort()
    }, [sessionId])

    useEffect(() => {
        if (!booking) return
        const savedPayment = { booking, step, payOption, method }
        sessionStorage.setItem(PENDING_PAYMENT_STORAGE_KEY, JSON.stringify(savedPayment))
        setPendingPayment(savedPayment)
    }, [booking, step, payOption, method])

    const saveBookingToFirebase = async (bookingData) => {
        try {
            await addDoc(collection(db, 'bookings'), {
                userId: currentUser?.uid || 'guest',
                userEmail: currentUser?.email || 'guest',
                propertyId: bookingData?.property?.id || null,
                propertyName: bookingData?.property?.name || bookingData?.resort?.name || 'Resort Property',
                date: bookingData?.date,
                session: bookingData?.session,
                guestsCount: bookingData?.guestsCount || 1,
                cottages: bookingData?.cottages || [],
                tourPrice: bookingData?.tourPrice || 0,
                cottagesPrice: bookingData?.cottagesPrice || 0,
                total: bookingData?.total || 0,
                payOption,
                method,
                status: 'Confirmed',
                createdAt: serverTimestamp(),
            })
        } catch (err) {
            console.error('Error saving booking to Firebase:', err)
        }
    }

    const handleConfirmSimulatedBooking = async () => {
        await saveBookingToFirebase(booking)
        setShowPaymentSuccess(true)
    }

    if (!booking) {
        return <p className="text-white p-5">Booking details are missing. Please start your booking again.</p>
    }

    const tourPrice = Number(booking.tourPrice) || Number(booking.property?.price) || 15000
    const cottagesPrice = Number(booking.cottagesPrice) || (booking.cottages || []).reduce((sum, c) => sum + (Number(c.price) || 0), 0)
    const total = Number(booking.total) || (tourPrice + cottagesPrice)
    const halfTotal = total / 2

    const rawGuestCount = Number(booking.guestsCount) || 1
    // Simplified single guest count object for Stripe and Firebase compatibility
    const normalizedGuests = {
        total: rawGuestCount
    }

    const stripeBooking = {
        ...booking,
        guests: normalizedGuests,
        total: payOption === 'partial' ? halfTotal : total,
    }

    const money = (amount) =>
        `₱${(Number(amount) || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`

    const goTo = (n) => {
        if (n < step) setStep(n)
    }

    const methods = [
        { key: 'gcash', label: 'GCash' },
        { key: 'maya', label: 'Maya' },
        { key: 'card', label: 'Credit / Debit Card' },
    ]

    return (
        <div>
            <Header />

            <div className='pay-page container-fluid px-3 px-md-5'>

                <div className='d-flex align-items-center gap-3 mb-4'>

                    <Link className='payment-back-button' to={booking?.property?.id ? `/resorts/${booking.property.id}` : '/resorts'} aria-label='Go back'>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M19 12H5m0 0 7 7m-7-7 7-7" />
                        </svg>
                    </Link>

                    <h1 className='pay-title m-0'>Confirm and Pay</h1>
                </div>

                <div className='row g-4 d-flex flex-wrap-reverse'>

                    <div className='col-12 col-lg-7'>

                        {/* STEP 1 */}
                        {step === 1 ? (
                            <div className='pay-card mb-3'>
                                <h2 className='step-title'>Choose when to pay</h2>

                                <label className='pay-option d-flex justify-content-between align-items-center'>
                                    <span>Pay {money(total)} now</span>
                                    <input
                                        type='radio'
                                        name='payOption'
                                        checked={payOption === 'full'}
                                        onChange={() => setPayOption('full')}
                                    />
                                </label>

                                <hr className='pay-divider' />

                                <label className='pay-option d-flex justify-content-between align-items-center'>
                                    <div>
                                        <span>Pay part now, part later</span>
                                        <small className='d-block pay-note'>
                                            {money(halfTotal)} now, {money(halfTotal)} charged later. No extra fees.
                                        </small>
                                    </div>
                                    <input
                                        type='radio'
                                        name='payOption'
                                        checked={payOption === 'partial'}
                                        onChange={() => setPayOption('partial')}
                                    />
                                </label>

                                <hr className='pay-divider' />

                                <div className='d-flex justify-content-end'>
                                    <button
                                        type='button'
                                        className='button next-btn'
                                        onClick={() => setStep(2)}
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div
                                className='pay-card pay-card-collapsed clickable mb-3'
                                onClick={() => goTo(1)}
                            >
                                <h2 className='step-title m-0'>Choose when to pay</h2>
                            </div>
                        )}

                        {/* STEP 2 */}
                        {step === 2 ? (
                            <div className='pay-card mb-3'>
                                <h2 className='step-title'>2. Add a payment method</h2>

                                {methods.map((m, i) => (
                                    <div key={m.key}>
                                        <label className='pay-option d-flex justify-content-between align-items-center'>
                                            <span>{m.label}</span>
                                            <input
                                                type='radio'
                                                name='method'
                                                checked={method === m.key}
                                                onChange={() => setMethod(m.key)}
                                            />
                                        </label>
                                        {i < methods.length - 1 && <hr className='pay-divider' />}
                                    </div>
                                ))}

                                <hr className='pay-divider' />

                                <div className='d-flex justify-content-end'>
                                    <button className='button next-btn' onClick={() => setStep(3)}>Next</button>
                                </div>
                            </div>
                        ) : (
                            <div
                                className={`pay-card pay-card-collapsed mb-3${step > 2 ? ' clickable' : ''}`}
                                onClick={() => goTo(2)}
                            >
                                <h2 className='step-title m-0'>2. Add a payment method</h2>
                            </div>
                        )}

                        {/* STEP 3 */}
                        {step === 3 ? (
                            <div className='pay-card'>
                                <h2 className='step-title'>3. Review your reservation</h2>

                                <div className='guest-row d-flex justify-content-between'>
                                    <span>Payment</span>
                                    <span>{payOption === 'full' ? 'Pay in full' : 'Part now, part later'}</span>
                                </div>
                                <div className='guest-row d-flex justify-content-between'>
                                    <span>Method</span>
                                    <span>{methods.find(m => m.key === method).label}</span>
                                </div>

                                <hr className='pay-divider' />

                                {method === 'card' ? (
                                    sessionId ? (
                                        paymentResult.loading ? (
                                            <p role="status">Verifying your payment with Stripe...</p>
                                        ) : paymentResult.paymentStatus === 'paid' ? (
                                            <p>Your payment has been confirmed. See the confirmation popup.</p>
                                        ) : (
                                            <p className="payment-error" role="alert">
                                                {paymentResult.error || 'Payment was not confirmed. Please try again.'}
                                            </p>
                                        )
                                    ) : (
                                        <StripePaymentN booking={stripeBooking} payOption={payOption} />
                                    )
                                ) : (
                                    <div>
                                        <p className="pay-note mb-3">
                                            {methods.find((item) => item.key === method).label} payments
                                            are not connected yet. Click below to confirm your booking.
                                        </p>
                                        <button
                                            type="button"
                                            className="button next-btn w-100"
                                            onClick={handleConfirmSimulatedBooking}
                                        >
                                            Confirm Booking ({payOption === 'partial' ? money(halfTotal) : money(total)})
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className='pay-card pay-card-collapsed'>
                                <h2 className='step-title m-0'>3. Review your reservation</h2>
                            </div>
                        )}
                    </div>

                    <div className='col-12 col-lg-5'>
                        <div className='pay-card summary-card'>

                            <div className='d-flex gap-3 mb-4'>
                                <img className='summary-img' src={booking?.property?.image || booking?.resort?.image || BaliwagHero} alt='Resort' />
                                <div>
                                    <h3 className="summary-name">{booking?.property?.name || booking?.resort?.name || 'Resort'}</h3>
                                    <span className="summary-town">{booking?.property?.location || booking?.resort?.location || 'Bulacan'}</span>
                                    <small className='d-block pay-note'>★ 4.7 (246 Reviews)</small>
                                </div>
                            </div>

                            <h4 className='field-label'>Guests Count</h4>
                            <div className='guest-row d-flex justify-content-between align-items-center mb-2'>
                                <span className='guest-label'>Total Guests</span>
                                <span className='fw-bold'>{rawGuestCount} Guests</span>
                            </div>

                            <h4 className='field-label mt-3'>Tour Session</h4>
                            <div className='guest-row d-flex justify-content-between align-items-center mb-2'>
                                <span className='guest-label'>Selected Tour</span>
                                <span className='fw-bold'>{booking.session || 'Day Tour'}</span>
                            </div>

                            <h4 className='field-label mt-3'>Date</h4>
                            <div className='guest-row d-flex justify-content-between align-items-center mb-2'>
                                <span className='guest-label'>Check-in Date</span>
                                <span className='fw-bold'>{booking.date || 'Today'}</span>
                            </div>

                            {booking?.cottages && booking.cottages.length > 0 && (
                                <>
                                    <h4 className='field-label mt-3'>Bedrooms / Cottages</h4>
                                    {booking.cottages.map((c, idx) => (
                                        <div key={idx} className='guest-row d-flex justify-content-between align-items-center small text-muted'>
                                            <span>• {c.name}</span>
                                            <span>{money(c.price)}</span>
                                        </div>
                                    ))}
                                </>
                            )}

                            <hr className='pay-divider my-4' />

                            <div className='d-flex justify-content-between align-items-center mb-3'>
                                <span className='total-label'>TOTAL</span>
                                <span className="total-price">{money(total)}</span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            <PaymenSuccessfulStripe
                show={showPaymentSuccess}
                onHide={() => setShowPaymentSuccess(false)}
                onReturnHome={() => sessionStorage.removeItem(PENDING_PAYMENT_STORAGE_KEY)}
            />
            <Footer />
        </div>
    )
}

export default ConfirmPayment