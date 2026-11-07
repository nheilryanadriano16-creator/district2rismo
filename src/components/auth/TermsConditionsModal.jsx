import Modal from 'react-bootstrap/Modal'

const termsSections = [
    {
        title: '1. About 2rismo',
        paragraphs: [
            '2rismo provides an online platform where guests can search for accommodations, view property information, and make reservations.',
            'The platform may also allow accommodation owners or hosts to list their properties, manage availability, and receive booking requests from guests.',
            '2rismo serves as a platform connecting guests and accommodation providers.',
        ],
    },
    {
        title: '2. User Accounts and Registration',
        text: 'To access certain features of 2rismo, users may be required to create an account. When registering, users agree to:',
        items: [
            'Provide accurate, complete, and updated information.',
            'Maintain the confidentiality of their account credentials.',
            'Avoid sharing their account with unauthorized individuals.',
            'Notify 2rismo if they suspect unauthorized access to their account.',
            'Use the platform only for lawful purposes.',
        ],
        ending: '2rismo reserves the right to suspend or terminate accounts that contain false information, violate these terms, or engage in suspicious or fraudulent activities.',
    },
    {
        title: '3. Booking and Reservations',
        text: 'Guests may browse available accommodations and submit reservation requests through the platform. When making a reservation, guests must:',
        items: [
            'Select the correct accommodation.',
            'Provide accurate check-in and check-out dates.',
            'Specify the correct number of guests.',
            'Review the accommodation details and applicable rules.',
            'Provide the required booking information.',
            'Complete any required payment process.',
        ],
        ending: 'A reservation will be considered confirmed only when the platform displays a confirmed booking status or provides an official confirmation.',
    },
    {
        title: '4. Payments and Fees',
        paragraphs: [
            'Users agree to pay the applicable accommodation fees and other charges displayed during the booking process.',
            'Payment methods and payment procedures will depend on the options supported by 2rismo.',
            'Guests are responsible for reviewing the total booking amount before confirming their reservations.',
            'Any additional charges, service fees, deposits, or applicable taxes must be disclosed before the guest completes the booking.',
            '2rismo may use third-party payment providers to process transactions.',
        ],
    },
    {
        title: '5. Cancellation and Refund Policy',
        text: 'Guests may request cancellation of their reservations, subject to the applicable cancellation policy of the accommodation. The following general conditions apply:',
        items: [
            'Cancellation requests must be submitted through the available booking or customer support channels.',
            'Refund eligibility depends on the cancellation terms presented during the booking process.',
            'Refund processing times may vary depending on the payment provider.',
            'Non-refundable reservations may not qualify for a refund except where required by applicable law or the stated booking terms.',
            'If an accommodation provider cancels a confirmed reservation, 2rismo may assist the guest with the available resolution options.',
        ],
        ending: 'The specific cancellation and refund conditions must be reviewed before completing a reservation.',
    },
    {
        title: '6. Responsibilities of Guests',
        text: 'Guests using 2rismo agree to:',
        items: [
            'Respect the accommodation owner’s property and house rules.',
            'Provide truthful booking information.',
            'Follow the agreed check-in and check-out schedules.',
            'Avoid damaging, stealing, or misusing accommodation property.',
            'Respect other guests, property owners, and surrounding communities.',
            'Avoid illegal activities while using the accommodation.',
            'Pay any legitimate additional charges resulting from damages or violations, subject to applicable law and the disclosed booking terms.',
        ],
    },
    {
        title: '7. Responsibilities of Accommodation Owners or Hosts',
        text: 'Accommodation owners or hosts who list properties on 2rismo agree to:',
        items: [
            'Provide accurate descriptions and photographs of their accommodations.',
            'Ensure that property information and availability are updated.',
            'Disclose accommodation prices, fees, facilities, and house rules.',
            'Maintain their accommodations in a safe and suitable condition.',
            'Honor confirmed reservations.',
            'Communicate professionally with guests.',
            'Comply with applicable laws, permits, and regulations concerning accommodation operations.',
            'Avoid misleading advertisements and discriminatory practices.',
        ],
    },
    {
        title: '8. Accommodation Listings and Accuracy',
        paragraphs: [
            '2rismo aims to provide accurate accommodation information based on the details submitted by property owners or hosts.',
            'However, accommodation descriptions, photographs, amenities, availability, and pricing may be provided or updated by the respective accommodation providers.',
            'Users are encouraged to review all listing details before making reservations.',
            '2rismo may remove, modify, or restrict listings that contain misleading, incomplete, prohibited, or inappropriate information.',
        ],
    },
    {
        title: '9. Prohibited Activities',
        text: 'Users are prohibited from:',
        items: [
            'Providing false or misleading information.',
            'Creating fraudulent accounts or reservations.',
            'Using the platform for illegal activities.',
            'Attempting to access another user’s account without authorization.',
            'Uploading malicious software or harmful content.',
            'Interfering with the website’s functionality or security.',
            'Harassing, threatening, or abusing other users.',
            'Posting fraudulent accommodation listings.',
            'Circumventing platform rules to conduct unauthorized transactions.',
        ],
        ending: 'Violations may result in account suspension, booking cancellation, or other appropriate action.',
    },
    {
        title: '10. Limitation of Responsibility',
        text: '2rismo makes reasonable efforts to maintain the availability and proper operation of its website. However, to the extent permitted by applicable law, 2rismo is not responsible for:',
        items: [
            'Temporary website interruptions or technical errors.',
            'Inaccurate information submitted by accommodation providers.',
            'Disputes arising from interactions between guests and accommodation providers.',
            'Losses resulting from inaccurate information provided by users.',
            'Circumstances beyond its reasonable control.',
        ],
        ending: 'Nothing in these terms excludes liability that cannot legally be excluded under applicable law.',
    },
    {
        title: '11. Intellectual Property',
        paragraphs: [
            'All website content owned by 2rismo, including its name, logo, design, graphics, text, and original materials, is protected by applicable intellectual property laws.',
            'Users may not reproduce, distribute, modify, or commercially use 2rismo’s original content without prior written permission.',
            'Accommodation owners retain responsibility for ensuring that they have the necessary rights to upload photographs, descriptions, and other materials to the platform.',
        ],
    },
    {
        title: '12. Account Suspension and Termination',
        text: '2rismo reserves the right to suspend, restrict, or terminate user accounts when:',
        items: [
            'Users violate these Terms and Conditions.',
            'Fraudulent or suspicious activities are detected.',
            'Users provide false or misleading information.',
            'Users misuse the platform or compromise its security.',
            'Termination is necessary to comply with applicable laws.',
        ],
        ending: 'Where appropriate, affected users may be informed of the reason for the action.',
    },
    {
        title: '13. Changes to These Terms',
        paragraphs: [
            '2rismo reserves the right to update or modify these Terms and Conditions when necessary.',
            'Any changes will be posted on this page with an updated effective date.',
            'Continued use of the platform after the updated terms take effect constitutes acceptance of the revised terms, to the extent permitted by applicable law.',
        ],
    },
    {
        title: '14. Governing Law',
        paragraphs: [
            'These Terms and Conditions shall be governed by and interpreted in accordance with the laws of the Republic of the Philippines.',
            'Any disputes arising from the use of 2rismo shall be handled in accordance with applicable Philippine laws and regulations.',
        ],
    },
    {
        title: '15. Contact Information',
        text: 'For questions, concerns, or assistance regarding these Terms and Conditions, please contact us through:',
        items: [
            'Website: 2rismo',
            'Email: 2rismo@rismo.ph',
            'Contact Number: 0993 323 5657',
        ],
    },
]

export function TermsConditionsModal({ show, onHide }) {
    return (
        <Modal
            show={show}
            onHide={onHide}
            centered
            scrollable
            dialogClassName="privacy-policy-dialogN"
            contentClassName="terms-conditions-modalN"
            aria-labelledby="terms-conditions-title"
        >
            <Modal.Header closeButton>
                <div>
                    <Modal.Title id="terms-conditions-title">Terms and Conditions</Modal.Title>
                    <p className="privacy-policy-effectiveN mb-0">Effective Date: December 9, 2018</p>
                </div>
            </Modal.Header>
            <Modal.Body>
                <p>Welcome to 2rismo, an online accommodation booking platform that allows users to discover, explore, and reserve available accommodations.</p>
                <p>These Terms and Conditions govern your access to and use of the 2rismo website and its services. By creating an account, browsing accommodations, or making a reservation, you agree to comply with these terms.</p>
                <p>Please read these terms carefully before using our platform.</p>
                {termsSections.map((section) => (
                    <section className="privacy-policy-sectionN" key={section.title}>
                        <h3>{section.title}</h3>
                        {section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                        {section.text && <p>{section.text}</p>}
                        {section.items && (
                            <ul>
                                {section.items.map((item) => <li key={item}>{item}</li>)}
                            </ul>
                        )}
                        {section.ending && <p>{section.ending}</p>}
                    </section>
                ))}
                <p className="mb-0">By using 2rismo, you acknowledge that you have read, understood, and agreed to these Terms and Conditions.</p>
            </Modal.Body>
        </Modal>
    )
}
