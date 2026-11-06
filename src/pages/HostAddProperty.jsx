import { useEffect, useState } from 'react'
import { BasicPropInfo } from '../components/HostSide/AddProperty/1-Basic-Property-Information.jsx'
import { AmenitiesFacilities } from '../components/HostSide/AddProperty/2-Amenities-Facilities.jsx'
import { PhotosMedia } from '../components/HostSide/AddProperty/3-Photos-Media.jsx'
import { CheckInCheckOutTimesRules } from '../components/HostSide/AddProperty/4-CheckIn-CheckOu-TImes&Rules.jsx'
import { Bedrooms } from '../components/HostSide/AddProperty/5-Bedrooms.jsx'
import { PropertyRulesPolicies } from '../components/HostSide/AddProperty/6-Property-Rules&Policies.jsx'
import { VerificationSubmission } from '../components/HostSide/AddProperty/7-Verification-Submission.jsx'
import { HostViewPropertyNav } from '../components/HostSide/ViewPropertyDetails/HostViewPropertyNav.jsx'
import { useAuth } from '../context/AuthContext'
import { saveHostProperty } from '../utils/hostData'
import { useNotification } from '../context/NotificationContext'

export function HostAddProperty({
    onBack,
    onNext,
    onReject,
    onApprove,
    mode = 'add',
    property,
    approveText = 'Approve',
    rejectText = 'Reject'
}) {
    const [step, setStep] = useState(1)
    const [draft, setDraft] = useState(property || {})
    const [saving, setSaving] = useState(false)
    const { currentUser, userData } = useAuth()
    const { showNotification } = useNotification()

    const isReview = mode === 'review'

    useEffect(() => {
        if (property) {
            setDraft(property)
        }
    }, [property])

    const updateProperty = (changes) => {
        setDraft((current) => ({
            ...current,
            ...changes,
            ...(changes.mediaPhotos
                ? { mediaPhotos: { ...current?.mediaPhotos, ...changes.mediaPhotos } }
                : {}),
        }))
    }

    const editNavigation = mode === 'edit' || isReview ? (
        <HostViewPropertyNav
            activeStep={step}
            onStepChange={setStep}
            onBack={onBack}
            currentLabel={isReview ? 'Property Details' : 'Edit Property'}
            showBreadcrumb={!isReview}
            compact={isReview}
        />
    ) : null

    return (
        <main className={`host-add-property-pageN container-fluid px-0${mode === 'edit' ? ' host-edit-wizardN' : ''}`}>
            {isReview && editNavigation}

            <fieldset
                disabled={isReview || saving}
                className={isReview ? 'admin-property-review-fieldsN' : ''}
            >
                {step === 1 ? (
                    <BasicPropInfo
                        onBack={onBack}
                        onNext={() => setStep(2)}
                        property={draft}
                        onPropertyChange={updateProperty}
                        editNavigation={mode === 'edit' ? editNavigation : null}
                    />
                ) : step === 2 ? (
                    <AmenitiesFacilities
                        onExit={onBack}
                        onBack={() => setStep(1)}
                        onNext={() => setStep(3)}
                        property={draft}
                        onPropertyChange={updateProperty}
                        editNavigation={mode === 'edit' ? editNavigation : null}
                    />
                ) : step === 3 ? (
                    <PhotosMedia
                        onExit={onBack}
                        onBack={() => setStep(2)}
                        onNext={() => setStep(4)}
                        property={draft}
                        onPropertyChange={updateProperty}
                        editNavigation={mode === 'edit' ? editNavigation : null}
                    />
                ) : step === 4 ? (
                    <CheckInCheckOutTimesRules
                        onExit={onBack}
                        onBack={() => setStep(3)}
                        onNext={() => setStep(5)}
                        property={draft}
                        onPropertyChange={updateProperty}
                        editNavigation={mode === 'edit' ? editNavigation : null}
                    />
                ) : step === 5 ? (
                    <Bedrooms
                        onExit={onBack}
                        onBack={() => setStep(4)}
                        onNext={() => setStep(6)}
                        property={draft}
                        onPropertyChange={updateProperty}
                        editNavigation={mode === 'edit' ? editNavigation : null}
                    />
                ) : step === 6 ? (
                    <PropertyRulesPolicies
                        onExit={onBack}
                        onBack={() => setStep(5)}
                        onNext={() => setStep(7)}
                        property={draft}
                        onPropertyChange={updateProperty}
                        editNavigation={mode === 'edit' ? editNavigation : null}
                    />
                ) : (
                    <VerificationSubmission
                        onBack={() => setStep(6)}
                        onSubmit={async (verificationFiles) => {
                            const nextProperty = { ...draft, verificationFiles }
                            if ((mode === 'add' || mode === 'edit') && currentUser?.uid) {
                                try {
                                    setSaving(true)
                                    const saved = await saveHostProperty(currentUser?.uid, userData, {
                                        ...nextProperty,
                                        id: draft?.id || property?.id,
                                    }, mode)
                                    showNotification(mode === 'edit' ? 'Property updated.' : 'Property submitted for review.', 'success')
                                    onNext?.(saved)
                                    if (!onNext) onBack?.()
                                } catch (error) {
                                    console.error('Error saving property:', error)
                                    showNotification(error.message || 'Could not save property.', 'danger')
                                    return
                                } finally {
                                    setSaving(false)
                                }
                                return
                            }
                            onNext?.(nextProperty)
                        }}
                        property={draft}
                        onPropertyChange={updateProperty}
                        isEditing={mode === 'edit'}
                        editNavigation={mode === 'edit' ? editNavigation : null}
                    />
                )}
            </fieldset>

            {isReview && (
                <div className="d-flex flex-wrap justify-content-end gap-3 mt-3 admin-property-review-actionsN">
                    {onReject && (
                        <button
                            type="button"
                            className="btn rounded-pill admin-property-review-rejectN admin-user-account-buttonN"
                            onClick={() => onReject(draft)}
                        >
                            {rejectText}
                        </button>
                    )}

                    {onApprove && (
                        <button
                            type="button"
                            className="btn rounded-pill admin-property-review-approveN admin-user-account-buttonN"
                            onClick={() => onApprove(draft)}
                        >
                            {approveText}
                        </button>
                    )}
                </div>
            )}
        </main>
    )
}