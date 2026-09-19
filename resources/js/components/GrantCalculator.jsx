import React, { useState } from 'react';

/**
 * Interactive investment budget, intensity, and own-contribution calculator.
 * Supports dynamic slider and numeric adjustment with real-time recalculation and localization.
 */
export default function GrantCalculator({
    initialInvestment = 30000000,
    intensity = 0.5,
    maxFunding = 100000000,
    currency,
    currentLocale = 'hu',
}) {
    const isEn = currentLocale === 'en';
    const activeCurrency = currency || (isEn ? 'HUF' : 'Ft');
    const [investment, setInvestment] = useState(initialInvestment);

    const calculatedGrant = Math.min(maxFunding, Math.round(investment * intensity));
    const calculatedOwn = Math.max(0, investment - calculatedGrant);
    const grantPercentage = investment > 0 ? Math.round((calculatedGrant / investment) * 100) : 0;
    const ownPercentage = 100 - grantPercentage;

    const formatCurrency = (val) => {
        return new Intl.NumberFormat(isEn ? 'en-US' : 'hu-HU').format(val);
    };

    const t = {
        title: isEn ? 'Grant and Equity Calculator' : 'Támogatás és Önerő Kalkulátor',
        investmentLabel: isEn ? 'Planned project investment:' : 'Tervezett beruházás összege:',
        sliderAria: isEn ? 'Planned investment slider' : 'Tervezett beruházás csúszka',
        slider5M: isEn ? '5M HUF' : '5 M Ft',
        slider50M: isEn ? '50M HUF' : '50 M Ft',
        slider100M: isEn ? '100M HUF' : '100 M Ft',
        slider200M: isEn ? '200M HUF' : '200 M Ft',
        grantRatioTitle: isEn ? `Grant: ${grantPercentage}%` : `Támogatás: ${grantPercentage}%`,
        ownRatioTitle: isEn ? `Own equity: ${ownPercentage}%` : `Önerő: ${ownPercentage}%`,
        grantRatioLabel: isEn ? `● Non-repayable grant: ${grantPercentage}%` : `● Vissza nem térítendő: ${grantPercentage}%`,
        ownRatioLabel: isEn ? `● Own funds: ${ownPercentage}%` : `● Saját erő: ${ownPercentage}%`,
        plannedTotal: isEn ? 'Planned total:' : 'Tervezett összeg:',
        intensityLabel: isEn ? 'Funding intensity:' : 'Támogatási intenzitás:',
        grantExpected: isEn ? 'Estimated non-repayable grant:' : 'Várható vissza nem térítendő támogatás:',
        ownRequired: isEn ? 'Required own equity:' : 'Szükséges saját forrás (önerő):',
        note: isEn
            ? `Note: Maximum funding cap for this scheme is ${Math.round(maxFunding / 1000000)}M ${activeCurrency}.`
            : `Megjegyzés: A maximális támogatási plafon ennél a konstrukciónál ${Math.round(maxFunding / 1000000)} M ${activeCurrency}.`,
    };

    return (
        <div className="card" style={{ margin: 0 }}>
            <h4 style={{ fontSize: '18px', marginBottom: '16px' }}>
                {t.title}
            </h4>

            {/* Slider & Input */}
            <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label htmlFor="investment-slider" style={{ fontSize: '13.5px', color: 'var(--muted)', fontWeight: 500 }}>
                        {t.investmentLabel}
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input
                            id="investment-input"
                            type="number"
                            min="1000000"
                            max="500000000"
                            step="1000000"
                            value={investment}
                            onChange={(e) => setInvestment(Math.max(0, Number(e.target.value) || 0))}
                            style={{
                                width: '150px',
                                padding: '6px 10px',
                                borderRadius: '6px',
                                border: '1px solid var(--line-strong)',
                                fontWeight: 700,
                                fontSize: '14px',
                                textAlign: 'right',
                            }}
                        />
                        <span style={{ fontWeight: 600, fontSize: '14px' }}>{activeCurrency}</span>
                    </div>
                </div>

                <input
                    id="investment-slider"
                    type="range"
                    min="5000000"
                    max="200000000"
                    step="1000000"
                    value={investment}
                    onChange={(e) => setInvestment(Number(e.target.value))}
                    aria-label={t.sliderAria}
                    style={{ width: '100%', accentColor: 'var(--gold-deep)', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--muted-2)' }}>
                    <span>{t.slider5M}</span>
                    <span>{t.slider50M}</span>
                    <span>{t.slider100M}</span>
                    <span>{t.slider200M}</span>
                </div>
            </div>

            {/* Visual ratio bar */}
            <div style={{ marginBottom: '16px' }}>
                <div style={{ height: '10px', borderRadius: '5px', overflow: 'hidden', display: 'flex', background: 'var(--line)' }}>
                    <div
                        style={{
                            width: `${grantPercentage}%`,
                            background: 'var(--gold-deep)',
                            transition: 'width 0.2s ease',
                        }}
                        title={t.grantRatioTitle}
                    />
                    <div
                        style={{
                            width: `${ownPercentage}%`,
                            background: 'var(--ink-2)',
                            transition: 'width 0.2s ease',
                        }}
                        title={t.ownRatioTitle}
                    />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '6px' }}>
                    <span style={{ color: 'var(--gold-deep)', fontWeight: 600 }}>
                        {t.grantRatioLabel}
                    </span>
                    <span style={{ color: 'var(--ink)', fontWeight: 600 }}>
                        {t.ownRatioLabel}
                    </span>
                </div>
            </div>

            {/* Breakdown Summary */}
            <div style={{ background: 'var(--paper)', padding: '18px', borderRadius: 'var(--radius-sm)', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: 'var(--muted)' }}>{t.plannedTotal}</span>
                    <strong>{formatCurrency(investment)} {activeCurrency}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: 'var(--muted)' }}>{t.intensityLabel}</span>
                    <strong style={{ color: 'var(--green)' }}>{Math.round(intensity * 100)}%</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', borderTop: '1px solid var(--line)', paddingTop: '8px' }}>
                    <span>{t.grantExpected}</span>
                    <strong style={{ color: 'var(--gold-deep)', fontSize: '16px' }}>
                        {formatCurrency(calculatedGrant)} {activeCurrency}
                    </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{t.ownRequired}</span>
                    <strong>{formatCurrency(calculatedOwn)} {activeCurrency}</strong>
                </div>
            </div>

            <div style={{ fontSize: '12px', color: 'var(--muted-2)' }}>
                {t.note}
            </div>
        </div>
    );
}
