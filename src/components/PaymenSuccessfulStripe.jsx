import Modal from 'react-bootstrap/Modal'
import { Link } from 'react-router-dom'

export default function PaymenSuccessfulStripe({ show, onHide, onReturnHome }) {
    return (
        <Modal
            show={show}
            onHide={onHide}
            centered
            dialogClassName="payment-success-dialogN"
            contentClassName="payment-success-modalN"
            aria-labelledby="payment-success-title"
        >
            <button type="button" className="payment-success-closeN" aria-label="Close payment confirmation" onClick={onHide}>
                <i className="bi bi-x-lg" aria-hidden="true" />
            </button>
            <Modal.Body className="payment-success-bodyN">
                <h2 id="payment-success-title" className="payment-success-titleN text-center fw-bold">Payment Successful</h2>
                <div className="payment-success-markN mx-auto mb-4" aria-hidden="true">
                    <i className="bi bi-check-lg" />
                </div>
                <p className="payment-success-messageN text-center mb-4">
                    Your payment has been confirmed and your reservation is complete.
                </p>
                <div className="d-flex flex-column flex-sm-row justify-content-center gap-2">
                    <button type="button" className="btn payment-success-closeButtonN" onClick={onHide}>Close</button>
                    <Link to="/" state={{ allowHomePage: true }} onClick={onReturnHome} className="btn payment-success-homeButtonN">Return Home</Link>
                </div>
            </Modal.Body>
        </Modal>
    )
}
