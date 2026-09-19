import React from 'react';
import Badge from '../components/Badge';
import Button from '../components/Button';

/**
 * CalendarPage React component.
 * Chronological grant deadlines grouped by year and month.
 */
export default function CalendarPage({
    grouped = {},
}) {
    const months = Object.keys(grouped || {});

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '22px', marginBottom: '6px', color: 'var(--ink)' }}>
                    Időrendi Pályázati Naptár
                </h1>
                <p style={{ color: 'var(--muted)', margin: 0 }}>
                    A nyitott és beadás alatt álló felhívások benyújtási határideje hónapok szerint rendezve.
                </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {months.length > 0 ? (
                    months.map((monthKey) => {
                        const opps = grouped[monthKey] || [];
                        return (
                            <div key={monthKey} className="card" style={{ marginBottom: 0 }}>
                                <div style={{
                                    fontFamily: 'var(--display)',
                                    fontSize: '18px',
                                    fontWeight: 700,
                                    color: 'var(--gold-deep)',
                                    marginBottom: '16px',
                                    borderBottom: '1px solid var(--line)',
                                    paddingBottom: '10px'
                                }}>
                                    📅 {monthKey} ({opps.length} felhívás)
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {opps.map((opp) => {
                                        const daysRemaining = opp.deadline
                                            ? Math.ceil((new Date(opp.deadline) - new Date()) / (1000 * 60 * 60 * 24))
                                            : 0;

                                        return (
                                            <div
                                                key={opp.id}
                                                style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    padding: '12px 16px',
                                                    background: 'var(--paper)',
                                                    borderRadius: 'var(--radius-sm)',
                                                    flexWrap: 'wrap',
                                                    gap: '12px',
                                                }}
                                            >
                                                <div>
                                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                                                        <Badge variant="gold" style={{ fontSize: '11px' }}>{opp.program}</Badge>
                                                        <span style={{ fontWeight: 600, fontSize: '15px', color: 'var(--ink)' }}>{opp.title}</span>
                                                    </div>
                                                    <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
                                                        Keret: {Math.round(opp.funding_min / 1000000)}–{Math.round(opp.funding_max / 1000000)} M Ft
                                                    </div>
                                                </div>

                                                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                                    <Badge variant={daysRemaining <= 14 ? 'amber' : 'slate'}>
                                                        {opp.deadline ? new Date(opp.deadline).toLocaleDateString('hu-HU') : 'Közelgő'} ({daysRemaining} nap)
                                                    </Badge>
                                                    <Button href={`/opportunities/${opp.code}`} variant="ghost" style={{ padding: '6px 12px', fontSize: '13px' }}>
                                                        Részletek
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="card" style={{ textAlign: 'center', color: 'var(--muted)', padding: '40px' }}>
                        Nincsenek közeledő pályázati határidők rögzítve.
                    </div>
                )}
            </div>
        </div>
    );
}
