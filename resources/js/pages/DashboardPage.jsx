import React from 'react';
import Badge from '../components/Badge';
import Button from '../components/Button';

/**
 * DashboardPage React component.
 * Displays SME overview metrics, profile completeness status, and ranked opportunity matches.
 */
export default function DashboardPage({
    stats = { totalOpen: 0, upcomingDeadlines: 0, totalPotentialFunding: 0 },
    profile = null,
    opportunities = [],
    csrfToken = '',
}) {
    const formatNumber = (num) => new Intl.NumberFormat('hu-HU').format(num);

    return (
        <div>
            {/* Metrics Header */}
            <div className="grid grid-cols-3" style={{ marginBottom: '24px' }}>
                <div className="card" style={{ marginBottom: 0 }}>
                    <div style={{ fontSize: '13px', color: 'var(--muted-2)', fontWeight: 500 }}>
                        Aktív Nyitott Kiírások
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--ink)', marginTop: '4px' }}>
                        {stats.totalOpen} db
                    </div>
                </div>

                <div className="card" style={{ marginBottom: 0 }}>
                    <div style={{ fontSize: '13px', color: 'var(--muted-2)', fontWeight: 500 }}>
                        30 Napon Belüli Határidők
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--amber)', marginTop: '4px' }}>
                        {stats.upcomingDeadlines} db
                    </div>
                </div>

                <div className="card" style={{ marginBottom: 0 }}>
                    <div style={{ fontSize: '13px', color: 'var(--muted-2)', fontWeight: 500 }}>
                        Elérhető Támogatási Keretösszeg
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--green)', marginTop: '4px' }}>
                        {Math.round((stats.totalPotentialFunding || 0) / 1000000)} M Ft
                    </div>
                </div>
            </div>

            {/* SME Profile Summary Notice */}
            {profile ? (
                <div className="card" style={{ background: 'var(--surface-2)', borderLeft: '4px solid var(--gold)', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                        <div>
                            <span style={{ fontWeight: 600, fontSize: '16px', color: 'var(--ink)' }}>
                                {profile.company_name}
                            </span>
                            <span style={{ color: 'var(--muted)', marginLeft: '8px', fontSize: '14px' }}>
                                ({profile.employees} fő • TEÁOR {profile.teaor_code} • {profile.county} vármegye)
                            </span>
                        </div>
                        <div>
                            <Button href="/onboarding" variant="ghost" style={{ padding: '6px 14px', fontSize: '13px' }}>
                                Profil Módosítása
                            </Button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="card" style={{ background: 'var(--amber-bg)', borderColor: 'var(--amber)', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                        <div>
                            <strong style={{ color: 'var(--ink)' }}>Még nincs kitöltve a cégprofilod!</strong>
                            <div style={{ color: 'var(--text)', fontSize: '14px' }}>
                                Töltsd ki az adataidat a pontos Fundor Score számításhoz és szabályalapú szűréshez.
                            </div>
                        </div>
                        <Button href="/onboarding" variant="gold" style={{ fontSize: '13px' }}>
                            Profil Kitöltése
                        </Button>
                    </div>
                </div>
            )}

            {/* Ranked Opportunity Cards */}
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '20px', margin: 0, color: 'var(--ink)' }}>
                    Releváns Pályázati Lehetőségek (Fundor Score ≥ 70)
                </h3>
                <Button href="/opportunities" variant="ghost" style={{ fontSize: '13px' }}>
                    Összes Megtekintése
                </Button>
            </div>

            <div className="grid grid-cols-2">
                {opportunities && opportunities.length > 0 ? (
                    opportunities.map((opp) => {
                        const daysRemaining = opp.deadline
                            ? Math.ceil((new Date(opp.deadline) - new Date()) / (1000 * 60 * 60 * 24))
                            : 0;

                        return (
                            <div key={opp.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                                        <Badge variant="gold">{opp.program}</Badge>
                                        <Badge variant={daysRemaining <= 14 ? 'amber' : 'slate'}>
                                            Határidő: {opp.deadline ? new Date(opp.deadline).toLocaleDateString('hu-HU') : 'Folyamatos'} ({daysRemaining} nap)
                                        </Badge>
                                    </div>
                                    <h4 style={{ fontSize: '18px', marginBottom: '8px', color: 'var(--ink)' }}>
                                        {opp.title}
                                    </h4>
                                    <div style={{ fontSize: '13.5px', color: 'var(--muted)', marginBottom: '16px' }}>
                                        Támogatás: {Math.round(opp.funding_min / 1000000)}–{Math.round(opp.funding_max / 1000000)} M Ft
                                        {' '}({Math.round(opp.intensity * 100)}% intenzitás)
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '14px', borderTop: '1px solid var(--line)' }}>
                                    <form action={`/favorites/${opp.id}/toggle`} method="POST">
                                        <input type="hidden" name="_token" value={csrfToken} />
                                        <button type="submit" className="btn btn-ghost" style={{ padding: '8px 12px', fontSize: '13px' }}>
                                            ⭐ Mentés
                                        </button>
                                    </form>
                                    <Button href={`/opportunities/${opp.code}`} variant="dark" style={{ fontSize: '13px', padding: '8px 16px' }}>
                                        Megnyitás & Pontozás
                                    </Button>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '36px' }}>
                        <p style={{ color: 'var(--muted)', margin: 0 }}>Nincsenek megjeleníthető pályázati lehetőségek.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
