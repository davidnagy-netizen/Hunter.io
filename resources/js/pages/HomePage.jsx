import React from 'react';
import GrantCalculator from '../components/GrantCalculator';
import FaqAccordion from '../components/FaqAccordion';
import Button from '../components/Button';
import Badge from '../components/Badge';

/**
 * HomePage React implementation.
 * Reading this as: B2B grant intelligence & discovery portal for Hungarian & European SMEs,
 * in a Fundor editorial financial-fintech style (Ink & Gold palette, Inter & Space Grotesk typography),
 * dial ENERGY 2 / RHYTHM 2 / MOTION 1.
 */
export default function HomePage({
    featuredOpportunities = [],
}) {
    const faqItems = [
        {
            question: 'Hogyan működik a determinisztikus pontozás a Fundorban?',
            answer: 'A rendszer nem fekete doboz: 5 konkrét dimenzióban (Alkalmasság, Projekt Illeszkedés, Pénzügyi Méret, Időzítés, Megvalósíthatóság) tételes szabályok alapján ad 0 és 100 közötti pontszámot, minden pont indoklásával.'
        },
        {
            question: 'Szükséges-e előfizetés az ingyenes felméréshez?',
            answer: 'Nem. Az előzetes alkalmassági felmérés teljesen ingyenes, és azonnali előzetes pontszámot ad a vállalkozás alapadatainak megadásakor.'
        },
        {
            question: 'Milyen felhívások találhatók a rendszerben?',
            answer: 'A magyar GINOP Plusz, KEHOP Plusz, DIMOP Plusz, valamint közvetlen európai uniós (Horizon Europe, Digital Europe) KKV-fókuszú támogatási programok.'
        },
        {
            question: 'Miben különbözik a hagyományos pályázatíró cégektől?',
            answer: 'A Fundor adatvezérelt döntéstámogató szoftver: másodpercek alatt kiszűri a valótlan vagy irreleváns pályázatokat, így csak a valóban nyerhető lehetőségekre kell időt és pénzt fordítani.'
        }
    ];

    return (
        <div className="fundor-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px 80px' }}>
            {/* Hero Section */}
            <section style={{ textAlign: 'center', maxWidth: '880px', margin: '0 auto 56px' }}>
                <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'var(--gold-bg)',
                    color: '#8D5E06',
                    border: '1px solid rgba(217, 154, 43, 0.35)',
                    borderRadius: '9999px',
                    fontSize: '13px',
                    fontWeight: 700,
                    padding: '6px 16px',
                    marginBottom: '20px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em'
                }}>
                    <span>MAGYAR KKV PÁLYÁZATI INTELLIGENCIA</span>
                </div>

                <h1 style={{
                    fontSize: 'clamp(32px, 5vw, 56px)',
                    lineHeight: 1.15,
                    fontWeight: 700,
                    color: 'var(--ink)',
                    marginBottom: '20px'
                }}>
                    Ne te keresd a pályázatot.<br />
                    <span style={{ color: 'var(--gold-deep)' }}>A Fundor megtalálja és pontozza neked.</span>
                </h1>

                <p style={{
                    fontSize: 'clamp(16px, 2vw, 19px)',
                    color: 'var(--muted)',
                    lineHeight: 1.6,
                    maxWidth: '760px',
                    margin: '0 auto 32px'
                }}>
                    Determinisztikus szabályrendszeren alapuló pályázatfigyelő és minősítő motor magyar vállalkozásoknak.
                    Objektív alkalmassági pontszám percek alatt, rejtett kizáró okok azonnali azonosításával.
                </p>

                <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Button href="/assessment" variant="gold" style={{ padding: '12px 28px', fontSize: '15px' }}>
                        Ingyenes Alkalmassági Felmérés
                    </Button>
                    <Button href="/opportunities" variant="ghost" style={{ padding: '12px 24px', fontSize: '15px' }}>
                        Nyitott Pályázatok Böngészése
                    </Button>
                </div>
            </section>

            {/* Featured Opportunities Section */}
            <section style={{ marginBottom: '64px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                        <Badge variant="gold" style={{ marginBottom: '8px' }}>KIEMELT KIÍRÁSOK</Badge>
                        <h2 style={{ fontSize: '26px', margin: 0, color: 'var(--ink)' }}>Aktuális Támogatási Lehetőségek</h2>
                    </div>
                    <Button href="/opportunities" variant="ghost" style={{ fontSize: '13px' }}>
                        Minden pályázat megtekintése (32 db)
                    </Button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                    {featuredOpportunities && featuredOpportunities.length > 0 ? (
                        featuredOpportunities.map((opp, idx) => (
                            <div key={idx} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', margin: 0 }}>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                        <Badge variant="gold">{opp.program || 'GINOP Plusz'}</Badge>
                                        <span style={{ fontSize: '12px', color: 'var(--muted)', fontFamily: 'monospace' }}>
                                            {opp.code}
                                        </span>
                                    </div>
                                    <h3 style={{ fontSize: '18px', marginBottom: '10px', color: 'var(--ink)' }}>
                                        {opp.title}
                                    </h3>
                                    <p style={{ fontSize: '13.5px', color: 'var(--muted)', lineHeight: 1.5, marginBottom: '16px' }}>
                                        Támogatási keret: <strong>{Math.round((opp.funding_min || 10000000) / 1000000)} - {Math.round((opp.funding_max || 100000000) / 1000000)} M Ft</strong> ({Math.round((opp.intensity || 0.5) * 100)}% intenzitás)
                                    </p>
                                </div>
                                <div style={{ borderTop: '1px solid var(--line)', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '12px', color: 'var(--amber)', fontWeight: 600 }}>
                                        Határidő: {opp.deadline ? new Date(opp.deadline).toLocaleDateString('hu-HU') : 'Közelgő'}
                                    </span>
                                    <Button href={`/opportunities/${opp.code}`} variant="dark" style={{ fontSize: '12.5px', padding: '6px 14px' }}>
                                        Részletek
                                    </Button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>
                            <p style={{ color: 'var(--muted)', margin: 0 }}>A kiemelt pályázatok betöltése folyamatban.</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Interactive Calculator Section */}
            <section style={{ marginBottom: '64px', maxWidth: '840px', marginInline: 'auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                    <Badge variant="gold" style={{ marginBottom: '8px' }}>INTERAKTÍV TERVEZŐ</Badge>
                    <h2 style={{ fontSize: '28px', color: 'var(--ink)', marginBottom: '8px' }}>
                        Számítsa ki beruházása támogatási arányát
                    </h2>
                    <p style={{ color: 'var(--muted)', fontSize: '15px' }}>
                        Próbálja ki kalkulátorunkat, és nézze meg a vissza nem térítendő támogatás és saját erő megoszlását.
                    </p>
                </div>

                <GrantCalculator initialInvestment={30000000} intensity={0.5} maxFunding={100000000} />
            </section>

            {/* Comparison Section */}
            <section style={{ marginBottom: '64px' }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <Badge variant="slate" style={{ marginBottom: '8px' }}>ÖSSZEHASONLÍTÁS</Badge>
                    <h2 style={{ fontSize: '28px', color: 'var(--ink)', marginBottom: '8px' }}>
                        Hagyományos pályázatkeresés vs. Fundor Intelligencia
                    </h2>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                    <div className="card" style={{ background: 'var(--surface-2)', borderColor: 'var(--line)', margin: 0 }}>
                        <h3 style={{ fontSize: '18px', color: 'var(--muted)', marginBottom: '16px' }}>Hagyományos folyamat</h3>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', color: 'var(--muted)' }}>
                            <li>✗ 150 oldalas felhívási dokumentumok kézi átolvasása</li>
                            <li>✗ Későn kiderülő kizáró okok (pl. de minimis keret túllépés)</li>
                            <li>✗ Nem átlátható, szubjektív pályázatírói becslések</li>
                            <li>✗ Lassú, hetekig tartó egyeztetési ciklusok</li>
                        </ul>
                    </div>

                    <div className="card" style={{ background: 'var(--surface)', borderColor: 'var(--gold)', borderWidth: '2px', margin: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ fontSize: '18px', color: 'var(--ink)', margin: 0 }}>Fundor platform</h3>
                            <Badge variant="gold">AJÁNLOTT</Badge>
                        </div>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', color: 'var(--text)' }}>
                            <li>✓ 5 másodperc alatt lefutó szabályalapú illesztés</li>
                            <li>✓ Tételes kizáró feltételek előzetes ellenőrzése</li>
                            <li>✓ 0-100 pont közötti matematikai Fundor Score</li>
                            <li>✓ Valós idejű határidő-követés és automata riasztások</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* FAQ Accordion Section */}
            <section style={{ marginBottom: '64px', maxWidth: '840px', marginInline: 'auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <Badge variant="slate" style={{ marginBottom: '8px' }}>GYAKORI KÉRDÉSEK</Badge>
                    <h2 style={{ fontSize: '28px', color: 'var(--ink)', marginBottom: '8px' }}>Gyakran Ismételt Kérdések</h2>
                </div>

                <FaqAccordion items={faqItems} />
            </section>

            {/* Bottom Call to Action */}
            <section style={{
                background: 'var(--ink)',
                color: '#fff',
                borderRadius: 'var(--radius)',
                padding: '48px 32px',
                textAlign: 'center',
                boxShadow: 'var(--shadow-lg)'
            }}>
                <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 36px)', marginBottom: '14px', color: '#fff' }}>
                    Indítsa el cége ingyenes minősítését most
                </h2>
                <p style={{ color: 'var(--muted-2)', maxWidth: '600px', margin: '0 auto 28px', fontSize: '16px' }}>
                    Töltse ki a 2 perces alapkérdőívet, és azonnal megkapja az előzetes pontszámot és a releváns pályázatok listáját.
                </p>
                <Button href="/assessment" variant="gold" style={{ padding: '14px 32px', fontSize: '16px' }}>
                    Ingyenes Felmérés Indítása
                </Button>
            </section>
        </div>
    );
}
