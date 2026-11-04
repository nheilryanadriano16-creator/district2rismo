require('dotenv').config()

const express = require('express')
const cors = require('cors')
const Stripe = require('stripe')
const multer = require('multer')
const path = require('path')
const fs = require('fs')

const app = express()
const PORT = process.env.PORT || 4242
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is missing from server/.env')
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

app.use(cors({ origin: FRONTEND_URL }))
app.use(express.json())

// Ensure public/uploads directory exists on disk
const uploadDir = path.join(__dirname, '../public/uploads')
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
}

// Configure Multer storage to save files into public/uploads with original filenames
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir)
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname)
    },
})

const upload = multer({ storage })

// Static middleware to serve files from public/uploads
app.use('/uploads', express.static(uploadDir))

app.get('/', (req, res) => {
    res.send('District2Rismo payment & upload API is running.')
})

// File upload endpoint for local disk storage
app.post('/api/upload', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded.' })
        }
        return res.json({
            message: 'File uploaded successfully',
            filePath: `/uploads/${req.file.filename}`,
            fileName: req.file.filename,
        })
    } catch (error) {
        console.error('File upload error:', error.message)
        return res.status(500).json({ error: 'Could not upload file.' })
    }
})

app.post('/create-checkout-session', async (req, res) => {
    try {
        const { booking, payOption } = req.body || {}
        const guests = booking?.guests

        const guestCounts = [
            guests?.adult,
            guests?.kids,
            guests?.senior,
        ]

        const validCounts = guestCounts.every(
            (count) => Number.isInteger(count) && count >= 0 && count <= 100
        )

        if (!validCounts || guestCounts.reduce((sum, count) => sum + count, 0) < 1) {
            return res.status(400).json({ error: 'Invalid guest counts.' })
        }

        if (!['full', 'partial'].includes(payOption)) {
            return res.status(400).json({ error: 'Invalid payment option.' })
        }

        if (!['Day Tour', 'Night Tour', 'Flexible'].includes(booking.session)) {
            return res.status(400).json({ error: 'Invalid booking session.' })
        }

        if (!/^\d{4}-\d{2}-\d{2}$/.test(booking.date || '')) {
            return res.status(400).json({ error: 'Invalid booking date.' })
        }

        const totalPesos =
            guests.adult * 200 +
            guests.kids * 180 +
            guests.senior * 160

        const amountPesos =
            payOption === 'partial'
                ? Math.ceil(totalPesos / 2)
                : totalPesos

        const amountInCentavos = amountPesos * 100

        const session = await stripe.checkout.sessions.create({
            ui_mode: 'elements',
            mode: 'payment',
            line_items: [
                {
                    price_data: {
                        currency: 'php',
                        product_data: {
                            name: 'Resort booking',
                            description: `${booking.session} on ${booking.date}`,
                        },
                        unit_amount: amountInCentavos,
                    },
                    quantity: 1,
                },
            ],
            return_url: `${FRONTEND_URL}/pay?session_id={CHECKOUT_SESSION_ID}`,
            metadata: {
                resortName: String(booking.resortName || 'Resort'),
                session: booking.session,
                date: booking.date,
                payOption,
                adults: String(guests.adult),
                kids: String(guests.kids),
                seniors: String(guests.senior),
                cottageName: String(booking.cottageName || ''),
            },
        })

        if (!session.client_secret) {
            throw new Error('Stripe did not return a Checkout Session client secret.')
        }

        return res.json({ clientSecret: session.client_secret })
    } catch (error) {
        console.error('Stripe Checkout error:', error.message)
        return res.status(500).json({ error: 'Unable to start payment.' })
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