import { useState } from 'react'

const guestPolicies = [
    {
        label: 'Outside Food & Drinks',
        options: ['Allowed', 'Not Allowed', 'Allowed with Additional Fee'],
    },
    {
        label: 'Pets',
        options: ['Allowed', 'Not Allowed', 'Allowed with Restrictions'],
    },
    {
        label: 'Alcohol',
        options: ['Allowed', 'Not Allowed', 'Allowed in Designated Areas', 'Allowed with Restrictions',
        ],
    },
    {
        label: 'Smoking',
        options: ['Allowed', 'Not Allowed', 'Designated Smoking Areas Only'],
    },
]
const resortRules = [
    'Proper swimming attire required',
    'Shower before entering',
    'No running',
]

const countWords = (text) => text.trim() ? text.trim().split(/\s+/).length : 0

export const PropertyRulesPolicies = ({ onBack, onNext, onExit, property, onPropertyChange, editNavigation }) => {
    const [policies, setPolicies] = useState(() => Object.fromEntries(
        guestPolicies.map(({ label, options }) => [
            label,
            options.includes(property?.policies?.[label]) ? property.policies[label] : '',
        ])
    ))
    const [selectedRules, setSelectedRules] = useState(property?.selectedRules || [])
    const [ruleText, setRuleText] = useState(property?.rulesDescription || '')
    const [validationError, setValidationError] = useState('')

    const toggleRule = (rule) => {
        const updated = selectedRules.includes(rule)
            ? selectedRules.filter((item) => item !== rule)
            : [...selectedRules, rule]
        setSelectedRules(updated)
        onPropertyChange?.({ selectedRules: updated })
    }

    return (
        <section className="host-add-propertyN container-fluid p-3 p-md-4 p-lg-5">
            {editNavigation}
            <nav aria-label="Breadcrumb" className="mb-4">
                <ol className="breadcrumb mb-0">
                    <li className="breadcrumb-item">
                        <button
                            type="button"
                            className="btn btn-link p-0 host-add-property-crumbN"
                            onClick={onExit}
                        >
                            Properties
                        </button>
                    </li>
                    <li className="breadcrumb-item active text-warning" aria-current="page">
                        Add Property
                    </li>
                </ol>
            </nav>

            <h1 className="h5 fw-bold text-warning mb-3">
                6. Property Rules &amp; Policies
            </h1>
            {validationError && <div className="alert alert-danger py-2" role="alert">{validationError}</div>}

            <div className="row g-4">
                <div className="col-12 col-md-5">
                    <h2 className="small mb-2">General Guest Policies</h2>

                    {guestPolicies.map((policy, index) => (
                        <div className="mb-2" key={policy.label}>
                            <label
                                className="form-label small mb-1"
                                htmlFor={`guest-policy-${index}`}
                            >
                                {policy.label}
                            </label>
                            <select
                                id={`guest-policy-${index}`}
                                className="form-select host-add-property-inputN host-policy-selectN"
                                value={policies[policy.label]}
                                required
                                onChange={(event) => {
                                    const updated = { ...policies, [policy.label]: event.target.value }
                                    setPolicies(updated)
                                    setValidationError('')
                                    onPropertyChange?.({ policies: updated })
                                }}
                            >
                                <option value="">Select a policy</option>
                                {policy.options.map((option) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                        </div>
                    ))}
                </div>

                <div className="col-12 col-md-5">
                    <h2 className="small mb-2">Resort-Specific Rules</h2>

                    <fieldset className="mb-3">
                        <legend className="form-label small mb-1">
                            Swimming Pool Rules
                        </legend>

                        {resortRules.map((rule, index) => (
                            <div className="form-check mb-1" key={rule}>
                                <input
                                    id={`pool-rule-${index}`}
                                    className="form-check-input host-policy-checkN"
                                    type="checkbox"
                                    checked={selectedRules.includes(rule)}
                                    onChange={() => toggleRule(rule)}
                                />
                                <label
                                    className="form-check-label small"
                                    htmlFor={`pool-rule-${index}`}
                                >
                                    {rule}
                                </label>
                            </div>
                        ))}
                    </fieldset>

                    <label
                        className="form-label small mb-1"
                        htmlFor="resort-specific-rules"
                    >
                        Additional Resort Rules
                    </label>
                    <textarea
                        id="resort-specific-rules"
                        className="form-control host-add-property-inputN"
                        rows="5"
                        maxLength={5000}
                        value={ruleText}
                        onChange={(event) => {
                            setRuleText(event.target.value)
                            onPropertyChange?.({ rulesDescription: event.target.value })
                        }}
                    />
                    <div className="small text-end host-add-property-countN">
                        {countWords(ruleText)} words
                    </div>
                </div>
            </div>

            <hr className="host-add-property-dividerN mt-5 mb-3" />

            <div className="d-flex justify-content-end gap-2">
                <button
                    type="button"
                    className="btn host-add-property-backN rounded-pill px-5 py-2"
                    onClick={onBack}
                >
                    Back
                </button>
                <button
                    type="button"
                    className="btn btn-warning rounded-pill px-5 py-2 host-add-property-nextN"
                    onClick={() => {
                        const missingPolicies = guestPolicies
                            .filter((policy) => !policies[policy.label])
                            .map((policy) => policy.label)
                        if (missingPolicies.length) {
                            setValidationError(`Choose a policy for each item: ${missingPolicies.join(', ')}.`)
                            return
                        }
                        setValidationError('')
                        onPropertyChange?.({
                            policies,
                            selectedRules,
                            rulesDescription: ruleText,
                        })
                        onNext?.()
                    }}
                >
                    Next
                </button>
            </div>
        </section>
    )
}