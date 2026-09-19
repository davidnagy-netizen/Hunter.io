import React, { useState } from 'react';
import Badge from '../components/Badge';
import Button from '../components/Button';

/**
 * OpportunitiesIndexPage React component.
 * Catalog search, program filter, and paginated grant list with full bilingual localization.
 */
export default function OpportunitiesIndexPage({
    opportunities = [],
    pagination = null,
    searchQuery = '',
    selectedProgram = '',
    csrfToken = '',
    currentLocale = 'hu',
}) {
    const isEn = currentLocale === 'en';
    const [q, setQ] = useState(searchQuery);
    const [program, setProgram] = useState(selectedProgram);

    const items = Array.isArray(opportunities)
        ? opportunities
        : (opportunities?.data || []);

    const t = {
        searchPlaceholder: isEn
            ? 'Search by keyword, code, or call title...'
            : 'Keresés kulcsszóra, kódra vagy felhívás címre...',
        allPrograms: isEn ? '-- All Program Families --' : '-- Minden programcsalád --',
        filterBtn: isEn ? 'Filter' : 'Szűrés',
        clearBtn: isEn ? 'Clear' : 'Törlés',
        deadline: isEn ? 'Deadline:' : 'Határidő:',
        daysUnit: isEn ? 'days left' : 'nap',
        rolling: isEn ? 'Upcoming' : 'Közelgő',
        budgetPrefix: isEn ? 'Funding:' : 'Keret:',
        budgetUnit: isEn ? 'million HUF' : 'M Ft',
        intensityLabel: isEn ? 'Funding intensity:' : 'Támogatási intenzitás:',
        openScore: isEn ? 'Open & Score →' : 'Megnyitás & Pontozás →',
        emptyMessage: isEn
            ? 'No grant opportunities match your search criteria.'
            : 'A keresési feltételeknek megfelelő pályázati lehetőség nem található.',
    };

    return (
        <div>
            {/* Filter Bar */}
            <div className="card" style={{ padding: '18px 24px', marginBottom: '24px' }}>
                <form action="/opportunities" method="GET" style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '240px' }}>
                        <input
                            type="text"
                            name="q"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder={t.searchPlaceholder}
                            style={{
                                width: '100%',
                                padding: '10px 14px',
                                border: '1px solid var(--line-strong)',
                                borderRadius: '8px',
                            }}
                        />
                    </div>
                    <div>
                        <select
                            name="program"
                            value={program}
                            onChange={(e) => setProgram(e.target.value)}
                            style={{
                                padding: '10px 14px',
                                border: '1px solid var(--line-strong)',
                                borderRadius: '8px',
                            }}
                        >
                            <option value="">{t.allPrograms}</option>
                            <option value="GINOP Plusz">GINOP Plusz</option>
                            <option value="KEHOP Plusz">KEHOP Plusz</option>
                            <option value="DIMOP Plusz">DIMOP Plusz</option>
                            <option value="Széchenyi Terv Plusz">Széchenyi Terv Plusz</option>
                        </select>
                    </div>
                    <Button type="submit" variant="dark" style={{ padding: '10px 18px' }}>
                        {t.filterBtn}
                    </Button>
                    {(q || program) && (
                        <Button href="/opportunities" variant="ghost" style={{ padding: '10px 14px' }}>
                            {t.clearBtn}
                        </Button>
                    )}
                </form>
            </div>

            {/* Opportunity Listings */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {items && items.length > 0 ? (
                    items.map((opp) => {
                        const daysRemaining = opp.deadline
                            ? Math.ceil((new Date(opp.deadline) - new Date()) / (1000 * 60 * 60 * 24))
                            : 0;

                        return (
                            <div
                                key={opp.id}
                                className="card"
                                style={{
                                    marginBottom: 0,
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    flexWrap: 'wrap',
                                    gap: '20px',
                                }}
                            >
                                <div style={{ flex: 1, minWidth: '280px' }}>
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                                        <Badge variant="gold">{opp.program}</Badge>
                                        <span style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--muted)' }}>
                                            {opp.code}
                                        </span>
                                        <Badge variant={daysRemaining <= 14 ? 'amber' : 'slate'}>
                                            {opp.deadline ? new Date(opp.deadline).toLocaleDateString(isEn ? 'en-US' : 'hu-HU') : t.rolling} ({daysRemaining} {t.daysUnit})
                                        </Badge>
                                    </div>
                                    <h3 style={{ fontSize: '18px', marginBottom: '6px', color: 'var(--ink)' }}>
                                        {opp.title}
                                    </h3>
                                    <div style={{ fontSize: '13.5px', color: 'var(--muted)' }}>
                                        {t.budgetPrefix} {Math.round(opp.funding_min / 1000000)}–{Math.round(opp.funding_max / 1000000)} {t.budgetUnit} • {t.intensityLabel} {Math.round(opp.intensity * 100)}%
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <form action={`/favorites/${opp.id}/toggle`} method="POST">
                                        <input type="hidden" name="_token" value={csrfToken} />
                                        <button type="submit" className="btn btn-ghost" style={{ padding: '9px 12px', fontSize: '13px' }}>
                                            ⭐
                                        </button>
                                    </form>
                                    <Button href={`/opportunities/${opp.code}`} variant="gold" style={{ fontSize: '13.5px' }}>
                                        {t.openScore}
                                    </Button>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="card" style={{ textAlign: 'center', color: 'var(--muted)', padding: '40px' }}>
                        {t.emptyMessage}
                    </div>
                )}
            </div>
        </div>
    );
}
