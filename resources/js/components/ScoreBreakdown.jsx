import React from 'react';

/**
 * 5-Factor relevance ring and progress bar gauges for Fundor Score.
 * Factors:
 * 1. Alkalmasság (35%)
 * 2. Projekt Illeszkedés (25%)
 * 3. Finanszírozási Méret (15%)
 * 4. Időzítés & Határidő (15%)
 * 5. Megvalósíthatóság (10%)
 */
export default function ScoreBreakdown({
    totalScore = 88,
    statusLabel = 'Erős lehetőség',
    factors = [
        { label: 'Alkalmasság (35%)', current: 35, max: 35, color: 'var(--green)' },
        { label: 'Projekt Illeszkedés (25%)', current: 22, max: 25, color: 'var(--gold)' },
        { label: 'Finanszírozási Méret (15%)', current: 14, max: 15, color: 'var(--gold)' },
        { label: 'Időzítés & Határidő (15%)', current: 12, max: 15, color: 'var(--green)' },
        { label: 'Megvalósíthatóság (10%)', current: 5, max: 10, color: 'var(--slate)' },
    ],
}) {
    return (
        <div className="card" style={{ margin: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h4 style={{ fontSize: '18px', margin: 0 }}>5-Faktoros Pontozás Részletezése</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontFamily: 'var(--display)', fontSize: '24px', fontWeight: 700, color: 'var(--gold-deep)' }}>
                        {totalScore}
                    </span>
                    <span className="badge badge-green" style={{ fontSize: '11px' }}>
                        {statusLabel}
                    </span>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {factors.map((factor, idx) => {
                    const percentage = factor.max > 0 ? Math.round((factor.current / factor.max) * 100) : 0;
                    return (
                        <div key={idx}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px', fontWeight: 600, marginBottom: '4px' }}>
                                <span>{factor.label}</span>
                                <span style={{ color: factor.color }}>
                                    {factor.current} / {factor.max}
                                </span>
                            </div>
                            <div style={{ background: 'var(--line)', height: '6px', borderRadius: '4px', overflow: 'hidden' }}>
                                <div
                                    style={{
                                        background: factor.color,
                                        width: `${percentage}%`,
                                        height: '100%',
                                        transition: 'width 0.3s ease',
                                    }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
