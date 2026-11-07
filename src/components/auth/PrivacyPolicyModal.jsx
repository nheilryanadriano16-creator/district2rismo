import Modal from 'react-bootstrap/Modal'

const policySections = [
    {
        title: '1. Information We Collect',
        subsections: [
            {
                title: '1.1 Personal Information',
                items: [
                    'Full name',
                    'Email address',
                    'Contact number',
                    'Account username and password',
                    'Profile information',
                    'Other information you provide when registering or using our services',
                ],
            },
            {
                title: '1.2 Booking Information',
                items: [
                    'Accommodation details',
                    'Check-in and check-out dates',
                    'Number of guests',
                    'Booking history',
                    'Reservation status',
                    'Special requests or additional instructions',
                ],
            },
            {
                title: '1.3 Payment Information',
                text: 'When making a reservation, we may collect payment-related information, such as payment method, transaction reference, payment status, and billing details. Actual payment card information may be handled by third-party payment providers.',
            },
            {
                title: '1.4 Technical Information',
                text: 'We may automatically collect certain technical information, including:',
                items: [
                    'IP address',
                    'Browser type and version',
                    'Device information',
                    'Website usage and activity',
                    'Cookies and similar technologies',
                ],
            },
        ],
    },
    {
        title: '2. How We Use Your Information',
        text: '2rismo uses collected information for the following purposes:',
        items: [
            'To create and manage user accounts.',
            'To process and manage accommodation reservations.',
            'To communicate booking confirmations and updates.',
            'To facilitate communication between guests and accommodation owners.',
            'To process and verify payments.',
            'To provide customer support and respond to inquiries.',
            'To improve website functionality and user experience.',
            'To detect, prevent, and investigate fraudulent or unauthorized activities.',
            'To comply with applicable legal requirements.',
        ],
    },
    {
        title: '3. Sharing of Personal Information',
        text: '2rismo does not sell users’ personal information. However, we may share relevant information with:',
        subsections: [
            {
                title: '3.1 Accommodation Owners or Hosts',
                text: 'We may share necessary guest information with accommodation owners to facilitate reservations, verify bookings, and coordinate check-in arrangements.',
            },
            {
                title: '3.2 Payment Service Providers',
                text: 'We may share payment-related information with authorized payment processors to complete and verify transactions.',
            },
            {
                title: '3.3 Service Providers',
                text: 'We may work with third-party providers that assist with website hosting, database management, security, analytics, and other technical services.',
            },
            {
                title: '3.4 Legal Authorities',
                text: 'We may disclose personal information when required by law, legal proceedings, or valid government requests.',
            },
        ],
    },
    {
        title: '4. Data Storage and Security',
        paragraphs: [
            '2rismo takes reasonable organizational, physical, and technical measures to protect personal information against unauthorized access, disclosure, alteration, loss, or misuse.',
            'Although we implement security measures, no online platform or electronic storage system can guarantee absolute security.',
        ],
    },
    {
        title: '5. Cookies and Tracking Technologies',
        text: '2rismo may use cookies and similar technologies to:',
        items: [
            'Maintain user login sessions.',
            'Remember user preferences.',
            'Improve website performance.',
            'Understand website traffic and user interactions.',
        ],
        ending: 'Users may manage or disable cookies through their browser settings. However, disabling certain cookies may affect website functionality.',
    },
    {
        title: '6. Data Retention',
        paragraphs: [
            '2rismo retains personal information only for as long as necessary to fulfill the purposes described in this Privacy Policy, including account management, reservation records, customer support, security, and legal obligations.',
            'When personal information is no longer necessary, it will be securely deleted, anonymized, or disposed of in accordance with applicable laws and retention requirements.',
        ],
    },
    {
        title: '7. User Rights',
        text: 'In accordance with applicable data privacy laws, including the Philippine Data Privacy Act of 2012 (Republic Act No. 10173), users may have the right to:',
        items: [
            'Be informed about how their personal information is collected and processed.',
            'Access their personal information.',
            'Request corrections to inaccurate or incomplete information.',
            'Request the blocking, removal, or destruction of personal information when legally appropriate.',
            'Object to certain forms of processing.',
            'Withdraw consent where processing is based on consent.',
            'File a complaint with the appropriate authority when their data privacy rights have been violated.',
        ],
        ending: 'Requests concerning personal information may be submitted through our official contact channels.',
    },
    {
        title: '8. Third-Party Websites and Services',
        paragraphs: [
            'Our website may contain links to third-party websites or services. 2rismo is not responsible for the privacy practices, content, or security of external websites.',
            'Users are encouraged to review the privacy policies of third-party services they access.',
        ],
    },
    {
        title: '9. Children’s Privacy',
        paragraphs: [
            '2rismo is not intended for individuals who are below the minimum age required to independently create an account or enter into a booking agreement under applicable laws.',
            'We do not knowingly collect personal information from children without the necessary consent or authorization.',
        ],
    },
    {
        title: '10. Changes to This Privacy Policy',
        paragraphs: [
            '2rismo reserves the right to update or modify this Privacy Policy when necessary. Any changes will be posted on this page with an updated effective date.',
            'Users are encouraged to review this page periodically.',
        ],
    },
    {
        title: '11. Contact Information',
        text: 'For questions, concerns, or requests regarding this Privacy Policy or your personal information, you may contact us through:',
        items: [
            'Website: 2rismo',
            'Email: 2rismo@rismo.ph',
            'Contact Number: 0993 323 5657',
        ],
    },
]

function PolicySection({ section }) {
    return (
        <section className="privacy-policy-sectionN">
            <h3>{section.title}</h3>
            {section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            {section.text && <p>{section.text}</p>}
            {section.items && (
                <ul>
                    {section.items.map((item) => <li key={item}>{item}</li>)}
                </ul>
            )}
            {section.subsections?.map((subsection) => (
                <div className="privacy-policy-subsectionN" key={subsection.title}>
                    <h4>{subsection.title}</h4>
                    {subsection.text && <p>{subsection.text}</p>}
                    {subsection.items && (
                        <ul>
                            {subsection.items.map((item) => <li key={item}>{item}</li>)}
                        </ul>
                    )}
                </div>
            ))}
            {section.ending && <p>{section.ending}</p>}
        </section>
    )
}

export function PrivacyPolicyModal({ show, onHide }) {
    return (
        <Modal
            show={show}
            onHide={onHide}
            centered
            scrollable
            dialogClassName="privacy-policy-dialogN"
            contentClassName="privacy-policy-modalN"
            aria-labelledby="privacy-policy-title"
        >
            <Modal.Header closeButton>
                <div>
                    <Modal.Title id="privacy-policy-title">Privacy Policy</Modal.Title>
                    <p className="privacy-policy-effectiveN mb-0">Effective Date: December 7, 2018</p>
                </div>
            </Modal.Header>
            <Modal.Body>
                <p>Welcome to 2rismo. Your privacy is important to us. This Privacy Policy explains how 2rismo collects, uses, stores, protects, and shares your personal information when you access or use our website and services.</p>
                <p>By using 2rismo, you acknowledge that you have read and understood this Privacy Policy.</p>
                {policySections.map((section) => <PolicySection section={section} key={section.title} />)}
                <p className="mb-0">Thank you for trusting 2rismo with your information.</p>
            </Modal.Body>
        </Modal>
    )
}
