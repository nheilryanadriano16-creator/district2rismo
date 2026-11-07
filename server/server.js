require('dotenv').config()

const express = require('express')
const cors = require('cors')
const Stripe = require('stripe')
const multer = require('multer')
const { applicationDefault, getApps, initializeApp } = require('firebase-admin/app')
const { getAuth } = require('firebase-admin/auth')
const { FieldValue, getFirestore } = require('firebase-admin/firestore')
const { v2: cloudinary } = require('cloudinary')
const path = require('path')
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'rismo-9c0ce'

if (!getApps().length) {
    try {
        initializeApp({
            credential: applicationDefault(),
            projectId: FIREBASE_PROJECT_ID,
        })
    } catch (error) {
        console.error('Firebase Admin initialization failed:', error.message)
    }
}

const app = express()
const PORT = process.env.PORT || 4242
const frontendUrl = new URL(process.env.FRONTEND_URL || 'http://localhost:5173')
const FRONTEND_URL = frontendUrl.origin
const allowedFrontendOrigins = new Set([frontendUrl.origin])

if (frontendUrl.hostname === 'localhost' || frontendUrl.hostname === '127.0.0.1') {
    frontendUrl.hostname = frontendUrl.hostname === 'localhost' ? '127.0.0.1' : 'localhost'
    allowedFrontendOrigins.add(frontendUrl.origin)
}

if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is missing from server/.env')
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
})

app.use(cors({
    origin: (origin, callback) => {
        callback(null, !origin || allowedFrontendOrigins.has(origin))
    },
}))
app.use(express.json())

const imageMimeTypes = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/avif',
])

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 15 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (!imageMimeTypes.has(file.mimetype)) {
            cb(new Error('Only JPEG, PNG, WebP, GIF, and AVIF images are allowed.'))
            return
        }
        cb(null, true)
    },
})

const requireFirebaseAuth = async (req, res, next) => {
    const authorization = req.get('authorization') || ''
    const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : ''
    if (!token) {
        return res.status(401).json({ error: 'Sign in before uploading a photo.' })
    }
    if (!getApps().length) {
        return res.status(503).json({ error: 'Upload authentication is not configured on the API.' })
    }

    try {
        req.firebaseUser = await getAuth().verifyIdToken(token)
        return next()
    } catch (error) {
        console.error('Firebase upload token verification failed:', error.code || error.message)
        if (error.code === 'auth/id-token-expired') {
            return res.status(401).json({ error: 'Your sign-in expired. Sign in again and retry the upload.' })
        }
        if (error.code === 'auth/argument-error') {
            return res.status(401).json({
                error: `The website and upload server are using different Firebase projects. Set FIREBASE_PROJECT_ID to ${FIREBASE_PROJECT_ID} on Render.`,
            })
        }
        return res.status(401).json({ error: 'The upload server could not verify your sign-in. Check its Firebase project configuration.' })
    }
}

const handleUpload = (req, res, next) => {
    upload.single('file')(req, res, (error) => {
        if (!error) return next()
        if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({ error: 'Photo must be smaller than 15 MB.' })
        }
        return res.status(400).json({ error: error.message || 'Invalid photo upload.' })
    })
}

app.get('/', (req, res) => {
    res.send('District2Rismo payment & upload API is running.')
})

app.post('/api/upload', requireFirebaseAuth, handleUpload, async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' })
    }

    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        return res.status(503).json({ error: 'Cloudinary is not configured on the upload server.' })
    }

    try {
        const result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream({
                folder: `district2rismo/properties/${req.firebaseUser.uid}`,
                resource_type: 'image',
                allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'],
            }, (error, uploaded) => {
                if (error) {
                    reject(error)
                    return
                }
                resolve(uploaded)
            })
            uploadStream.end(req.file.buffer)
        })

        return res.json({
            message: 'File uploaded successfully',
            filePath: result.secure_url,
            fileName: result.public_id,
        })
    } catch (error) {
        console.error('Cloudinary photo upload failed:', error.message)
        return res.status(502).json({ error: 'Cloudinary could not save the photo. Please try again.' })
    }
})

app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')))

app.put('/api/properties/:id', async (req, res) => {
    try {
        const { id } = req.params
        const updatedData = req.body

        if (!id) {
            return res.status(400).json({ error: 'Property ID is required.' })
        }

        if (getApps().length) {
            const db = getFirestore()
            const propertyRef = db.collection('properties').doc(id)
            
            await propertyRef.set({
                ...updatedData,
                updatedAt: FieldValue.serverTimestamp()
            }, { merge: true })

            return res.json({ message: 'Property updated successfully on server.', id })
        }

        return res.json({ message: 'Property update request received.', id, updatedData })
    } catch (error) {
        console.error('Property update server error:', error.message)
        return res.status(500).json({ error: 'Could not update property.' })
    }
})

app.get('/booked-dates', async (req, res) => {
    const propertyId = typeof req.query.propertyId === 'string' ? req.query.propertyId.trim() : ''
    const propertyName = typeof req.query.propertyName === 'string' ? req.query.propertyName.trim() : ''
    if (!propertyId && !propertyName) {
        return res.status(400).json({ error: 'A property ID or name is required.' })
    }
    if (!getApps().length) {
        return res.status(503).json({ error: 'Date availability is not configured on the API.' })
    }

    try {
        const db = getFirestore()
        const bookings = db.collection('bookings')
        const queries = []
        if (propertyId) {
            for (const field of ['propertyId', 'propertyUid', 'placeId', 'listingId', 'resortId', 'property.id']) {
                queries.push(bookings.where(field, '==', propertyId).get())
            }
        }
        if (propertyName) {
            for (const field of ['propertyName', 'resortName', 'resort', 'property.name']) {
                queries.push(bookings.where(field, '==', propertyName).get())
            }
        }

        const snapshots = await Promise.all(queries)
        const inactiveStatuses = new Set(['rejected', 'cancelled', 'canceled', 'failed', 'expired'])
        const bookedDates = new Set()
        const seenBookingIds = new Set()

        snapshots.forEach((snapshot) => {
            snapshot.docs.forEach((bookingDoc) => {
                if (seenBookingIds.has(bookingDoc.id)) return
                seenBookingIds.add(bookingDoc.id)
                const booking = bookingDoc.data()
                const status = String(booking.status || 'Pending').toLowerCase()
                if (inactiveStatuses.has(status)) return
                const rawDate = booking.date || booking.startDate
                const date = typeof rawDate === 'string' && /^\d{4}-\d{2}-\d{2}/.test(rawDate)
                    ? rawDate.slice(0, 10)
                    : typeof rawDate?.toDate === 'function'
                        ? rawDate.toDate().toISOString().slice(0, 10)
                        : rawDate instanceof Date
                            ? rawDate.toISOString().slice(0, 10)
                            : ''
                if (date) bookedDates.add(date)
            })
        })

        return res.json({ bookedDates: [...bookedDates] })
    } catch (error) {
        console.error('Could not load booked dates:', error.message)
        return res.status(500).json({ error: 'Could not load date availability.' })
    }
})

app.post('/create-checkout-session', async (req, res) => {
    try {
        const { booking, payOption } = req.body || {}

        if (!booking) {
            return res.status(400).json({ error: 'Missing booking details.' })
        }

        if (!['full', 'partial'].includes(payOption)) {
            return res.status(400).json({ error: 'Invalid payment option.' })
        }

        if (!booking.date || !/^\d{4}-\d{2}-\d{2}$/.test(booking.date)) {
            return res.status(400).json({ error: 'Invalid booking date.' })
        }

        const guestsCount = Number(booking.guestsCount) || Number(booking.guests?.total) || 1
        if (isNaN(guestsCount) || guestsCount < 1 || guestsCount > 100) {
            return res.status(400).json({ error: 'Invalid guest counts.' })
        }

        const tourPrice = Number(booking.tourPrice) || 15000
        const cottagesPrice = Number(booking.cottagesPrice) || (booking.cottages || []).reduce((sum, c) => sum + (Number(c.price) || 0), 0)
        const totalPesos = Number(booking.total) || (tourPrice + cottagesPrice)

        if (isNaN(totalPesos) || totalPesos <= 0) {
            return res.status(400).json({ error: 'Invalid total amount.' })
        }

        const amountPesos =
            payOption === 'partial'
                ? Math.ceil(totalPesos / 2)
                : totalPesos

        const amountInCentavos = Math.round(amountPesos * 100)
        const cottagesSummary = (booking.cottages || []).map(c => c.name).join(', ')

        const session = await stripe.checkout.sessions.create({
            ui_mode: 'elements',
            mode: 'payment',
            line_items: [
                {
                    price_data: {
                        currency: 'php',
                        product_data: {
                            name: String(booking?.resort?.name || booking?.property?.name || 'Resort Booking'),
                            description: `${booking.session || 'Tour'} on ${booking.date}${cottagesSummary ? ` | Bedrooms: ${cottagesSummary}` : ''}`,
                        },
                        unit_amount: amountInCentavos,
                    },
                    quantity: 1,
                },
            ],
            return_url: `${FRONTEND_URL}/pay?session_id={CHECKOUT_SESSION_ID}`,
            metadata: {
                resortName: String(booking?.resort?.name || booking?.property?.name || 'Resort'),
                session: String(booking.session || 'Tour'),
                date: String(booking.date),
                payOption: String(payOption),
                guestsCount: String(guestsCount),
                cottages: String(cottagesSummary),
            },
        })

        if (!session.client_secret) {
            throw new Error('Stripe did not return a Checkout Session client secret.')
        }

        return res.json({ clientSecret: session.client_secret })
    } catch (error) {
        console.error('Stripe Checkout error:', error.message)
        return res.status(500).json({ error: error.message || 'Unable to start payment.' })
    }
})

app.get('/verify-checkout-session', async (req, res) => {
    const { session_id: sessionId } = req.query

    if (typeof sessionId !== 'string' || !sessionId.startsWith('cs_')) {
        return res.status(400).json({ error: 'Invalid Checkout Session ID.' })
    }

    try {
        const session = await stripe.checkout.sessions.retrieve(sessionId)

        return res.json({
            status: session.status,
            payment_status: session.payment_status,
        })
    } catch (error) {
        console.error('Stripe Checkout verification error:', error.message)
        return res.status(500).json({ error: 'Could not verify payment.' })
    }
})

app.listen(PORT, () => {
    console.log(`API server running at http://localhost:${PORT}`)
})