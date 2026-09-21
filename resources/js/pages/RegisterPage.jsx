import React, { useState } from 'react';
import Button from '../components/Button';
import StageOneAccount from '../components/Registration/StageOneAccount';
import StageTwoCompanyProfile from '../components/Registration/StageTwoCompanyProfile';
import StageThreeProjectScope from '../components/Registration/StageThreeProjectScope';
import { useTaxpayerLookup } from '../hooks/useTaxpayerLookup';

/**
 * RegisterPage React Component: Progressive 3-Stage Registration & Onboarding.
 *
 * Reference: CR-03 Section 4.3 - Progressive Registration Architecture & GDPR Compliance:
 * - Stage 1 (Sign-Up): Collect Email, Password, and Tax Number. Auto-fetch official company
 *   name and seat address via NAV Online Invoice API (queryTaxpayer) as read-only confirmation.
 *   Strict GDPR independent checkboxes (Terms of Service, Privacy Notice, optional Marketing).
 * - Stage 2 (Company Profile): Collect headcount, TEÁOR'25 sector code, statutory 6 SME revenue
 *   bands (Act XXXIV of 2004), registered county, closed business years, and legal form.
 * - Stage 3 (Project Scope Context): Collect development goals, investment scale (HUF), and
 *   historical de minimis allocations.
 *
 * @param {Object} props
 * @param {string} props.csrfToken Laravel CSRF session token.
 * @param {Object} props.oldInput Pre-filled values on validation redirect.
 */
export default function RegisterPage({
    csrfToken = '',
    oldInput = {},
}) {
    // Current active wizard stage (1, 2, or 3)
    const [currentStage, setCurrentStage] = useState(1);

    // Form data state spanning all 3 stages
    const [formData, setFormData] = useState({
        email: oldInput.email || '',
        password: '',
        password_confirmation: '',
        tax_number: oldInput.tax_number || '',
        company: oldInput.company || '',
        username: oldInput.username || '',
        name: oldInput.name || '',
        termsAccepted: false,
        privacyAccepted: false,
        marketingConsent: false,
        employees: oldInput.employees || 15,
        legal_form: oldInput.legal_form || 'kft',
        sector_code: oldInput.sector_code || '6201',
        revenue_band: oldInput.revenue_band || 2,
        exact_revenue: oldInput.exact_revenue || null,
        closed_business_years: oldInput.closed_business_years || 3,
        county: oldInput.county || 'Budapest',
        goals: ['digitalization'],
        investment_scale: 30000000,
        de_minimis_allocation: 0,
    });

    // Custom hook for on-demand NAV taxpayer resolution
    const {
        status: taxpayerStatus,
        data: taxpayerData,
        error: taxpayerError,
        lookupTaxpayer,
    } = useTaxpayerLookup();

    // Field updater helper
    const handleFieldChange = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    // Trigger NAV query on tax number input blur
    const handleTaxNumberBlur = async (taxNumber) => {
        if (!taxNumber) return;
        const result = await lookupTaxpayer(taxNumber);
        if (result && result.companyName) {
            setFormData((prev) => ({
                ...prev,
                company: result.companyName,
                name: prev.name || result.companyName,
                username: prev.username || taxNumber.replace(/\D/g, '').substring(0, 8),
            }));
        }
    };

    // Stage 1 validation gate
    const isStageOneValid = () => {
        return (
            formData.email.includes('@') &&
            formData.password.length >= 4 &&
            formData.password === formData.password_confirmation &&
            (formData.tax_number || '').replace(/\D/g, '').length >= 8 &&
            formData.termsAccepted === true &&
            formData.privacyAccepted === true
        );
    };

    // Stage 2 validation gate
    const isStageTwoValid = () => {
        return (
            formData.employees !== undefined &&
            formData.employees >= 0 &&
            formData.sector_code &&
            formData.revenue_band >= 1 &&
            formData.revenue_band <= 6
        );
    };

    // Navigation handlers
    const handleNext = (e) => {
        e.preventDefault();
        if (currentStage === 1 && isStageOneValid()) {
            setCurrentStage(2);
        } else if (currentStage === 2 && isStageTwoValid()) {
            setCurrentStage(3);
        }
    };

    const handlePrev = (e) => {
        e.preventDefault();
        if (currentStage > 1) {
            setCurrentStage(currentStage - 1);
        }
    };

    return (
        <div style={{ maxWidth: '640px', margin: '40px auto', padding: '0 20px' }}>
            <div className="card" style={{ padding: '36px 32px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '6px', textAlign: 'center', color: 'var(--ink)' }}>
                    Fundor Vállalati Regisztráció
                </h1>
                <p style={{ color: 'var(--muted)', fontSize: '13.5px', textAlign: 'center', marginBottom: '24px' }}>
                    3 lépéses hitelesített onboarding a pontos pályázati alkalmasság kiszámításához.
                </p>

                {/* Step Progress Indicator */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', position: 'relative' }}>
                    <div style={{
                        position: 'absolute',
                        top: '16px',
                        left: '15%',
                        right: '15%',
                        height: '2px',
                        background: 'var(--line)',
                        zIndex: 1,
                    }}>
                        <div style={{
                            height: '100%',
                            background: 'var(--gold)',
                            width: currentStage === 1 ? '0%' : currentStage === 2 ? '50%' : '100%',
                            transition: 'width 0.3s ease',
                        }} />
                    </div>

                    {[
                        { step: 1, label: '1. Fiók & NAV' },
                        { step: 2, label: '2. Cégprofil' },
                        { step: 3, label: '3. Projekt Célok' },
                    ].map((s) => {
                        const isActive = currentStage >= s.step;
                        const isCurrent = currentStage === s.step;
                        return (
                            <div key={s.step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2 }}>
                                <div style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    background: isCurrent ? 'var(--gold)' : isActive ? 'var(--gold-deep)' : 'var(--card)',
                                    color: isActive ? '#fff' : 'var(--muted)',
                                    border: isActive ? 'none' : '2px solid var(--line-strong)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 700,
                                    fontSize: '13px',
                                }}>
                                    {s.step}
                                </div>
                                <span style={{
                                    fontSize: '11.5px',
                                    fontWeight: isCurrent ? 700 : 500,
                                    color: isCurrent ? 'var(--gold-deep)' : 'var(--muted)',
                                    marginTop: '6px',
                                }}>
                                    {s.label}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Main Registration Form */}
                <form action="/register" method="POST">
                    <input type="hidden" name="_token" value={csrfToken} />
                    <input type="hidden" name="name" value={formData.name || formData.company || 'Felhasználó'} />
                    <input type="hidden" name="username" value={formData.username || formData.email.split('@')[0]} />
                    <input type="hidden" name="company" value={formData.company || taxpayerData?.companyName || ''} />
                    <input type="hidden" name="tax_number" value={formData.tax_number} />
                    <input type="hidden" name="employees" value={formData.employees} />
                    <input type="hidden" name="legal_form" value={formData.legal_form} />
                    <input type="hidden" name="sector_code" value={formData.sector_code} />
                    <input type="hidden" name="revenue_band" value={formData.revenue_band} />
                    <input type="hidden" name="exact_revenue" value={formData.exact_revenue || ''} />
                    <input type="hidden" name="closed_business_years" value={formData.closed_business_years} />
                    <input type="hidden" name="county" value={formData.county} />
                    <input type="hidden" name="goals" value={JSON.stringify(formData.goals)} />
                    <input type="hidden" name="investment_scale" value={formData.investment_scale} />
                    <input type="hidden" name="de_minimis_allocation" value={formData.de_minimis_allocation} />

                    {/* Stage 1: Account & NAV Verification */}
                    {currentStage === 1 && (
                        <StageOneAccount
                            formData={formData}
                            onChange={handleFieldChange}
                            taxpayerData={taxpayerData}
                            taxpayerStatus={taxpayerStatus}
                            taxpayerError={taxpayerError}
                            onTaxNumberBlur={handleTaxNumberBlur}
                        />
                    )}

                    {/* Stage 2: Company Profile & TEÁOR'25 */}
                    {currentStage === 2 && (
                        <StageTwoCompanyProfile
                            formData={formData}
                            onChange={handleFieldChange}
                        />
                    )}

                    {/* Stage 3: Project Scope Context */}
                    {currentStage === 3 && (
                        <StageThreeProjectScope
                            formData={formData}
                            onChange={handleFieldChange}
                        />
                    )}

                    {/* Navigation Buttons */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginTop: '28px' }}>
                        {currentStage > 1 ? (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handlePrev}
                                style={{ padding: '10px 20px', fontSize: '14px' }}
                            >
                                ← Vissza
                            </Button>
                        ) : (
                            <div />
                        )}

                        {currentStage < 3 ? (
                            <Button
                                type="button"
                                variant="gold"
                                onClick={handleNext}
                                disabled={currentStage === 1 ? !isStageOneValid() : !isStageTwoValid()}
                                style={{
                                    padding: '10px 24px',
                                    fontSize: '14px',
                                    opacity: (currentStage === 1 ? !isStageOneValid() : !isStageTwoValid()) ? 0.6 : 1,
                                    cursor: (currentStage === 1 ? !isStageOneValid() : !isStageTwoValid()) ? 'not-allowed' : 'pointer',
                                }}
                            >
                                Következő Lépés →
                            </Button>
                        ) : (
                            <Button
                                type="submit"
                                variant="gold"
                                style={{ padding: '10px 28px', fontSize: '14.5px', fontWeight: 700 }}
                            >
                                Regisztráció Befejezése és Pályázatok Megnyitása ✨
                            </Button>
                        )}
                    </div>
                </form>

                <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '13.5px', color: 'var(--muted)', borderTop: '1px solid var(--line)', paddingTop: '16px' }}>
                    Már rendelkezik fiókkal?{' '}
                    <a href="/login" style={{ color: 'var(--gold-deep)', fontWeight: 600 }}>
                        Jelentkezzen be
                    </a>
                </div>
            </div>
        </div>
    );
}
