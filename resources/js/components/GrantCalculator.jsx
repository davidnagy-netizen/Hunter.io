import React, { useState } from 'react';

/**
 * Interactive investment budget, intensity, and own-contribution calculator.
 * Supports dynamic slider and numeric adjustment with real-time recalculation.
 */
export default function GrantCalculator({
    initialInvestment = 30000000,
    intensity = 0.5,
    maxFunding = 100000000,
    currency = 'Ft',
}) {
    const [investment, setInvestment] = useState(initialInvestment);

    const calculatedGrant = Math.min(maxFunding, Math.round(investment * intensity));
    const calculatedOwn = Math.max(0, investment - calculatedGrant);
    const grantPercentage = investment > 0 ? Math.round((calculatedGrant / investment) * 100) : 0;
    const ownPercentage = 100 - grantPercentage;

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('hu-HU').format(val);
    };

    return (
        <div className="card" style={{ margin: 0 }}>
            <h4 style={{ fontSize: '18px', marginBottom: '16px' }}>
                Támogatás és Önerő Kalkulátor
            </h4>

            {/* Slider & Input */}
            <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label htmlFor="investment-slider" style={{ fontSize: '13.5px', color: 'var(--muted)', fontWeight: 500 }}>
                        Tervezett beruházás összege:
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
                        <span style={{ fontWeight: 600, fontSize: '14px' }}>{currency}</span>
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
                    aria-label="Tervezett beruházás csúszka"
                    style={{ width: '100%', accentColor: 'var(--gold-deep)', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--muted-2)' }}>
                    <span>5 M Ft</span>
                    <span>50 M Ft</span>
                    <span>100 M Ft</span>
                    <span>200 M Ft</span>
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
                        title={`Támogatás: ${grantPercentage}%`}
                    />
                    <div
                        style={{
                            width: `${ownPercentage}%`,
                            background: 'var(--ink-2)',
                            transition: 'width 0.2s ease',
                        }}
                        title={`Önerő: ${ownPercentage}%`}
                    />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '6px' }}>
                    <span style={{ color: 'var(--gold-deep)', fontWeight: 600 }}>
                        ● Vissza nem térítendő: {grantPercentage}%
                    </span>
                    <span style={{ color: 'var(--ink)', fontWeight: 600 }}>
                        ● Saját erő: {ownPercentage}%
                    </span>
                </div>
            </div>

            {/* Breakdown Summary */}
            <div style={{ background: 'var(--paper)', padding: '18px', borderRadius: 'var(--radius-sm)', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: 'var(--muted)' }}>Tervezett összeg:</span>
                    <strong>{formatCurrency(investment)} {currency}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: 'var(--muted)' }}>Támogatási intenzitás:</span>
                    <strong style={{ color: 'var(--green)' }}>{Math.round(intensity * 100)}%</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', borderTop: '1px solid var(--line)', paddingTop: '8px' }}>
                    <span>Várható vissza nem térítendő támogatás:</span>
                    <strong style={{ color: 'var(--gold-deep)', fontSize: '16px' }}>
                        {formatCurrency(calculatedGrant)} {currency}
                    </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Szükséges saját forrás (önerő):</span>
                    <strong>{formatCurrency(calculatedOwn)} {currency}</strong>
                </div>
            </div>

            <div style={{ fontSize: '12px', color: 'var(--muted-2)' }}>
                Megjegyzés: A maximális támogatási plafon ennél a konstrukciónál {Math.round(maxFunding / 1000000)} M {currency}.
            </div>
        </div>
    );
}
