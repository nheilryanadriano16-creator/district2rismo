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

const uploadDir = path.join(__dirname, '../public/uploads')
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir)
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
        const ext = path.extname(file.originalname)
        const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_')
        cb(null, `${baseName}-${uniqueSuffix}${ext}`)
    },
})

const upload = multer({ storage })

app.use('/uploads', express.static(uploadDir))

app.get('/', (req, res) => {
    res.send('District2Rismo payment & upload API is running.')
})

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