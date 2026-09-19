import React from 'react';
import Badge from '../components/Badge';
import Button from '../components/Button';

/**
 * FavoritesPage React component.
 * Displays user bookmarked grant opportunities with bilingual localization.
 */
export default function FavoritesPage({
    favorites = [],
    csrfToken = '',
    currentLocale = 'hu',
}) {
    const isEn = currentLocale === 'en';

    const t = {
        title: isEn ? 'Saved Grant Opportunities' : 'Elmentett Pályázati Lehetőségek',
        desc: isEn
            ? 'Track your bookmarked calls and their upcoming submission deadlines in one place.'
            : 'Itt követheted nyomon a könyvjelzőzött felhívásokat és azok beadási határidőit.',
        rolling: isEn ? 'Upcoming' : 'Közelgő',
        fundingPrefix: isEn ? 'Grant amount:' : 'Támogatási összeg:',
        fundingUnit: isEn ? 'million HUF' : 'M Ft',
        removeBtn: isEn ? 'Remove' : 'Eltávolítás',
        openBtn: isEn ? 'Open →' : 'Megnyitás →',
        emptyTitle: isEn ? 'You have no bookmarked grants yet' : 'Még nincsenek elmentett pályázataid',
        emptyDesc: isEn
            ? 'Browse the grant catalog and click the star icon to save relevant calls.'
            : 'Böngéssz a katalógusban, és a csillag ikonra kattintva mentsd el a releváns kiírásokat.',
        browseBtn: isEn ? 'Browse Grants →' : 'Pályázatok Böngészése →',
    };

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '22px', marginBottom: '6px', color: 'var(--ink)' }}>
                    {t.title}
                </h1>
                <p style={{ color: 'var(--muted)', margin: 0 }}>
                    {t.desc}
                </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {favorites && favorites.length > 0 ? (
                    favorites.map((opp) => (
                        <div
                            key={opp.id}
                            className="card"
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: 0,
                                flexWrap: 'wrap',
                                gap: '16px',
                            }}
                        >
                            <div>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                                    <Badge variant="gold">{opp.program}</Badge>
                                    <Badge variant="slate">
                                        {opp.deadline ? new Date(opp.deadline).toLocaleDateString(isEn ? 'en-US' : 'hu-HU') : t.rolling}
                                    </Badge>
                                </div>
                                <h2 style={{ fontSize: '17px', marginBottom: '4px', color: 'var(--ink)' }}>
                                    {opp.title}
                                </h2>
                                <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
                                    {t.fundingPrefix} {Math.round(opp.funding_min / 1000000)}–{Math.round(opp.funding_max / 1000000)} {t.fundingUnit}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <form action={`/favorites/${opp.id}/toggle`} method="POST">
                                    <input type="hidden" name="_token" value={csrfToken} />
                                    <button
                                        type="submit"
                                        className="btn btn-ghost"
                                        style={{ padding: '8px 12px', fontSize: '13px', color: 'var(--red)' }}
                                    >
                                        {t.removeBtn}
                                    </button>
                                </form>
                                <Button href={`/opportunities/${opp.code}`} variant="dark" style={{ padding: '8px 14px', fontSize: '13px' }}>
                                    {t.openBtn}
                                </Button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="card" style={{ textAlign: 'center', color: 'var(--muted)', padding: '48px 24px' }}>
                        <div style={{ fontSize: '32px', marginBottom: '12px' }}>⭐</div>
                        <h2 style={{ fontWeight: 600, fontSize: '16px', marginBottom: '6px', color: 'var(--ink)' }}>
                            {t.emptyTitle}
                        </h2>
                        <p style={{ marginBottom: '20px' }}>
                            {t.emptyDesc}
                        </p>
                        <Button href="/opportunities" variant="gold">
                            {t.browseBtn}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
