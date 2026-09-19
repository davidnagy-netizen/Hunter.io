import React from 'react';
import Badge from '../components/Badge';
import Button from '../components/Button';
import GrantCalculator from '../components/GrantCalculator';
import ScoreBreakdown from '../components/ScoreBreakdown';

/**
 * OpportunityShowPage React component.
 * Detailed grant view with Fundor Score visualizer, 5-factor breakdown,
 * interactive grant calculator, documents checklist, and inline eligibility questions.
 */
export default function OpportunityShowPage({
    opportunity = {},
    profile = null,
    csrfToken = '',
}) {
    const daysRemaining = opportunity.deadline
        ? Math.ceil((new Date(opportunity.deadline) - new Date()) / (1000 * 60 * 60 * 24))
        : 0;

    const docs = opportunity.docs || [
        'Legfrissebb lezárt éves beszámoló',
        'Projekt bemutató és üzleti terv',
        'Árajánlatok és költségterv',
        'NAV köztartozásmentes adózói adatbázis igazolás'
    ];

    return (
        <div style={{ maxWidth: '1040px', margin: '0 auto' }}>
            {/* Top Summary Card with Score Ring */}
            <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '24px', marginBottom: '24px' }}>
                <div style={{ flex: 1, minWidth: '300px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
                        <Badge variant="gold">{opportunity.program}</Badge>
                        <span style={{ fontFamily: 'monospace', fontSize: '13px', color: 'var(--muted)' }}>
                            {opportunity.code}
                        </span>
                        <Badge variant={daysRemaining <= 14 ? 'amber' : 'slate'}>
                            Határidő: {opportunity.deadline ? new Date(opportunity.deadline).toLocaleDateString('hu-HU') : 'Közelgő'} ({daysRemaining} nap van hátra)
                        </Badge>
                    </div>
                    <h1 style={{ fontSize: '26px', marginBottom: '12px', color: 'var(--ink)' }}>
                        {opportunity.title}
                    </h1>
                    <div style={{ fontSize: '14.5px', color: 'var(--muted)', lineHeight: 1.6 }}>
                        Hivatalos forrásazonosító: <strong>{opportunity.source_reference || 'N/A'}</strong>
                        {opportunity.source_url && (
                            <span> • <a href={opportunity.source_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--blue)', textDecoration: 'underline' }}>Pályázati kiírás megnyitása</a></span>
                        )}
                    </div>
                </div>

                {/* Fundor Score Visualizer */}
                <div style={{ textAlign: 'center', padding: '16px 28px', background: 'var(--paper)', borderRadius: 'var(--radius)' }}>
                    <div style={{ fontSize: '12px', color: 'var(--muted-2)', fontWeight: 600, textTransform: 'uppercase' }}>
                        Fundor Score
                    </div>
                    <div style={{ fontFamily: 'var(--display)', fontSize: '48px', fontWeight: 700, color: 'var(--gold-deep)', lineHeight: 1.1 }}>
                        88
                    </div>
                    <Badge variant="green" style={{ fontSize: '11px' }}>
                        Erős lehetőség
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-2" style={{ gap: '20px', marginBottom: '24px' }}>
                {/* 5-Factor Score Breakdown */}
                <ScoreBreakdown totalScore={88} statusLabel="Erős lehetőség" />

                {/* Live Grant Calculator */}
                <GrantCalculator
                    initialInvestment={profile?.planned_investment_value || 30000000}
                    intensity={opportunity.intensity || 0.5}
                    maxFunding={opportunity.funding_max || 100000000}
                />
            </div>

            {/* Required Documents Checklist */}
            <div className="card" style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '18px', marginBottom: '16px', color: 'var(--ink)' }}>
                    Kötelező Pályázati Mellékletek és Dokumentumok
                </h2>
                <div className="grid grid-cols-2" style={{ gap: '12px' }}>
                    {docs.map((doc, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: 'var(--paper)', borderRadius: '8px' }}>
                            <span>📄</span>
                            <span style={{ fontSize: '14px', color: 'var(--text)' }}>{doc}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Interactive Inline Question Resolution */}
            {profile && profile.de_minimis_ok === null && (
                <div className="card" style={{ background: 'var(--gold-bg)', borderColor: 'var(--gold)', marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '17px', marginBottom: '8px', color: 'var(--ink)' }}>
                        Tisztázandó Alkalmassági Kérdés
                    </h2>
                    <p style={{ fontSize: '14px', marginBottom: '14px', color: 'var(--text)' }}>
                        Van-e a vállalkozásnak szabad de minimis kerete (~300 000 EUR az elmúlt 3 pénzügyi évben)?
                    </p>
                    <form action={`/opportunities/${opportunity.code}/answer`} method="POST" style={{ display: 'flex', gap: '12px' }}>
                        <input type="hidden" name="_token" value={csrfToken} />
                        <input type="hidden" name="field" value="de_minimis_ok" />
                        <Button type="submit" name="value" value="1" variant="dark" style={{ fontSize: '13px' }}>
                            Igen, van szabad keret
                        </Button>
                        <Button type="submit" name="value" value="0" variant="ghost" style={{ fontSize: '13px', background: '#fff' }}>
                            Nem, kimerült a keret
                        </Button>
                    </form>
                </div>
            )}
        </div>
    );
}
