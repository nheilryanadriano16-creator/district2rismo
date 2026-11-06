require('dotenv').config()

const express = require('express')
const cors = require('cors')
const Stripe = require('stripe')
const multer = require('multer')
const { applicationDefault, getApps, initializeApp } = require('firebase-admin/app')
const { getAuth } = require('firebase-admin/auth')
const { FieldValue, getFirestore } = require('firebase-admin/firestore')
const path = require('path')
const fs = require('fs')

if (!getApps().length) {
    try {
        initializeApp({
            credential: applicationDefault()
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

app.use(cors({
    origin: (origin, callback) => {
        callback(null, !origin || allowedFrontendOrigins.has(origin))
    },
}))
app.use(express.json())

const uploadDir = path.resolve(process.env.UPLOAD_DIR || path.join(__dirname, '../public/uploads'))
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
}

const imageExtensions = new Map([
    ['image/jpeg', '.jpg'],
    ['image/png', '.png'],
    ['image/webp', '.webp'],
    ['image/gif', '.gif'],
    ['image/avif', '.avif'],
])

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir)
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
        const ext = imageExtensions.get(file.mimetype)
        const baseName = path.basename(file.originalname, path.extname(file.originalname))
            .replace(/[^a-zA-Z0-9]/g, '_')
        cb(null, `${baseName}-${uniqueSuffix}${ext}`)
    },
})

const upload = multer({
    storage,
    limits: { fileSize: 15 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (!imageExtensions.has(file.mimetype)) {
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
    } catch {
        return res.status(401).json({ error: 'Your sign-in expired. Sign in again and retry the upload.' })
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

app.use('/uploads', express.static(uploadDir))

app.get('/', (req, res) => {
    res.send('District2Rismo payment & upload API is running.')
})

app.post('/api/upload', requireFirebaseAuth, handleUpload, (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' })
    }
    return res.json({
        message: 'File uploaded successfully',
        filePath: `/uploads/${req.file.filename}`,
        fileName: req.file.filename,
    })
})

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