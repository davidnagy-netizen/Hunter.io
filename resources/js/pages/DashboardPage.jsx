import React from 'react';
import Badge from '../components/Badge';
import Button from '../components/Button';

/**
 * DashboardPage React component.
 * Displays SME overview metrics, profile completeness status, and ranked opportunity matches.
 * Fully supports Hungarian and English localization.
 */
export default function DashboardPage({
    stats = { totalOpen: 0, upcomingDeadlines: 0, totalPotentialFunding: 0 },
    profile = null,
    opportunities = [],
    csrfToken = '',
    currentLocale = 'hu',
}) {
    const isEn = currentLocale === 'en';

    const t = {
        openCalls: isEn ? 'Open Grant Calls' : 'Aktív Nyitott Kiírások',
        callsUnit: isEn ? 'calls' : 'db',
        deadlines30Days: isEn ? 'Deadlines Within 30 Days' : '30 Napon Belüli Határidők',
        availableFunding: isEn ? 'Total Available Funding' : 'Elérhető Támogatási Keretösszeg',
        fundingUnit: isEn ? 'million HUF' : 'M Ft',
        editProfile: isEn ? 'Edit Profile' : 'Profil Módosítása',
        profileEmployees: isEn ? 'employees' : 'fő',
        profileCounty: isEn ? 'county' : 'vármegye',
        profileIncompleteTitle: isEn ? 'Your company profile is incomplete!' : 'Még nincs kitöltve a cégprofilod!',
        profileIncompleteDesc: isEn
            ? 'Complete your profile for accurate Fundor Scores and rule-based filtering.'
            : 'Töltsd ki az adataidat a pontos Fundor Score számításhoz és szabályalapú szűréshez.',
        fillProfile: isEn ? 'Complete Profile' : 'Profil Kitöltése',
        rankedMatchesTitle: isEn ? 'Relevant Grant Opportunities (Fundor Score ≥ 70)' : 'Releváns Pályázati Lehetőségek (Fundor Score ≥ 70)',
        viewAll: isEn ? 'View All →' : 'Összes Megtekintése →',
        deadline: isEn ? 'Deadline:' : 'Határidő:',
        daysUnit: isEn ? 'days left' : 'nap',
        rolling: isEn ? 'Continuous' : 'Folyamatos',
        funding: isEn ? 'Funding:' : 'Támogatás:',
        intensity: isEn ? 'intensity' : 'intenzitás',
        save: isEn ? '⭐ Save' : '⭐ Mentés',
        openDetails: isEn ? 'Detailed Assessment →' : 'Részletes Értékelés →',
        noOpportunities: isEn ? 'There are currently no grant calls available.' : 'Jelenleg nincsenek elérhető pályázati kiírások.',
    };

    return (
        <div>
            {/* Metrics Header */}
            <div className="grid grid-cols-3" style={{ marginBottom: '24px' }}>
                <div className="card" style={{ marginBottom: 0 }}>
                    <div style={{ fontSize: '13px', color: 'var(--muted-2)', fontWeight: 500 }}>
                        {t.openCalls}
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--ink)', marginTop: '4px' }}>
                        {stats.totalOpen} {t.callsUnit}
                    </div>
                </div>

                <div className="card" style={{ marginBottom: 0 }}>
                    <div style={{ fontSize: '13px', color: 'var(--muted-2)', fontWeight: 500 }}>
                        {t.deadlines30Days}
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--amber)', marginTop: '4px' }}>
                        {stats.upcomingDeadlines} {t.callsUnit}
                    </div>
                </div>

                <div className="card" style={{ marginBottom: 0 }}>
                    <div style={{ fontSize: '13px', color: 'var(--muted-2)', fontWeight: 500 }}>
                        {t.availableFunding}
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--green)', marginTop: '4px' }}>
                        {Math.round((stats.totalPotentialFunding || 0) / 1000000)} {t.fundingUnit}
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
                                ({profile.employees} {t.profileEmployees} • TEÁOR {profile.teaor_code} • {profile.county} {t.profileCounty})
                            </span>
                        </div>
                        <div>
                            <Button href="/onboarding" variant="ghost" style={{ padding: '6px 14px', fontSize: '13px' }}>
                                {t.editProfile}
                            </Button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="card" style={{ background: 'var(--amber-bg)', borderColor: 'var(--amber)', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                        <div>
                            <strong style={{ color: 'var(--ink)' }}>{t.profileIncompleteTitle}</strong>
                            <div style={{ color: 'var(--text)', fontSize: '14px' }}>
                                {t.profileIncompleteDesc}
                            </div>
                        </div>
                        <Button href="/onboarding" variant="gold" style={{ fontSize: '13px' }}>
                            {t.fillProfile}
                        </Button>
                    </div>
                </div>
            )}

            {/* Ranked Opportunity Cards */}
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '20px', margin: 0, color: 'var(--ink)' }}>
                    {t.rankedMatchesTitle}
                </h3>
                <Button href="/opportunities" variant="ghost" style={{ fontSize: '13px' }}>
                    {t.viewAll}
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
                                            {t.deadline} {opp.deadline ? new Date(opp.deadline).toLocaleDateString(isEn ? 'en-US' : 'hu-HU') : t.rolling} ({daysRemaining} {t.daysUnit})
                                        </Badge>
                                    </div>
                                    <h4 style={{ fontSize: '18px', marginBottom: '8px', color: 'var(--ink)' }}>
                                        {opp.title}
                                    </h4>
                                    <div style={{ fontSize: '13.5px', color: 'var(--muted)', marginBottom: '16px' }}>
                                        {t.funding} {Math.round(opp.funding_min / 1000000)}–{Math.round(opp.funding_max / 1000000)} {t.fundingUnit}
                                        {' '}({Math.round(opp.intensity * 100)}% {t.intensity})
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '14px', borderTop: '1px solid var(--line)' }}>
                                    <form action={`/favorites/${opp.id}/toggle`} method="POST">
                                        <input type="hidden" name="_token" value={csrfToken} />
                                        <button type="submit" className="btn btn-ghost" style={{ padding: '8px 12px', fontSize: '13px' }}>
                                            {t.save}
                                        </button>
                                    </form>
                                    <Button href={`/opportunities/${opp.code}`} variant="dark" style={{ fontSize: '13px', padding: '8px 16px' }}>
                                        {t.openDetails}
                                    </Button>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '36px' }}>
                        <p style={{ color: 'var(--muted)', margin: 0 }}>{t.noOpportunities}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
