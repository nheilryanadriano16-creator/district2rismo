const helpTopics = [
    {
        title: '1. Exploring Destinations',
        text: 'Browse our featured destinations and discover popular resorts, private resorts, public resorts, and hotels across different municipalities. Each listing provides information to help you choose a destination that suits your preferences.',
    },
    {
        title: '2. Finding Accommodation',
        text: 'Explore property details, available amenities, facilities, location, pricing, and other important information before deciding where to stay.',
    },
    {
        title: '3. Reservations and Bookings',
        text: 'Follow the booking instructions provided on each property page. Review your selected dates, number of guests, accommodation options, and total cost before confirming your reservation.',
    },
    {
        title: '4. Managing Your Reservations',
        text: 'Visit the My Reservations page to view your upcoming stays and past reservations. Check your booking details, reservation status, payment information, and cancellation or refund updates when applicable.',
    },
    {
        title: '5. Reviews and Ratings',
        text: 'Read reviews from previous guests to learn about their experiences. If you’ve completed an eligible stay, you may also submit a review to help other travelers make informed decisions.',
    },
    {
        title: '6. Payments and Refunds',
        text: 'Review the payment terms, cancellation policy, and refund conditions associated with your reservation. Refund amounts and processing times may vary depending on the property’s policies and payment method.',
    },
    {
        title: '7. Property Information Accuracy',
        text: 'We aim to provide useful and accurate information about listed destinations. However, amenities, rates, operating hours, availability, and property policies may change. Contact the property directly to confirm important details before your visit.',
    },
    {
        title: '8. Need More Help?',
        text: 'For questions about a property’s facilities, availability, reservations, or policies, contact the property using its listed contact information. For issues concerning the District2rismo website, reach out through our official contact channels.',
    },
]

export const AdminHelp = () => (
    <section className="profile-panelN container-fluid p-3 p-md-4 text-white">
        <h1 className="h2 fw-bold text-warning mb-3">Help &amp; Information</h1>

        <div className="help-content-cardN rounded-3 p-3 p-md-4">
            <p className="small mb-2">
                <span className="text-warning">Welcome to District2rismo!</span>{' '}
                We’re here to help you discover destinations, explore resorts, and plan your next getaway across{' '}
                <strong>District 2, Bulacan.</strong>
            </p>

            {helpTopics.map((topic) => (
                <div key={topic.title} className="mb-3">
                    <h2 className="small fw-bold text-warning mb-0">{topic.title}</h2>
                    <p className="small mb-0">{topic.text}</p>
                </div>
            ))}

            <p className="small fw-bold text-warning mb-0">
                Discover more. Travel with confidence. Experience District 2, Bulacan.
            </p>
        </div>
    </section>
)