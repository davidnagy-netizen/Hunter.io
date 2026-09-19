import React from 'react';
import GrantCalculator from '../components/GrantCalculator';
import FaqAccordion from '../components/FaqAccordion';
import Button from '../components/Button';
import Badge from '../components/Badge';

/**
 * HomePage React implementation.
 * Supports full bilingual localization (HU / EN) based on currentLocale prop.
 */
export default function HomePage({
    featuredOpportunities = [],
    currentLocale = 'hu',
}) {
    const isEn = currentLocale === 'en';

    const t = {
        badge: isEn ? 'Hungarian SME Grant Intelligence' : 'MAGYAR KKV PÁLYÁZATI INTELLIGENCIA',
        heroTitle1: isEn ? 'Stop searching for grants.' : 'Ne te keresd a pályázatot.',
        heroTitle2: isEn ? 'Fundor finds and scores them for you.' : 'A Fundor megtalálja és pontozza neked.',
        heroLead: isEn
            ? 'Instant, rule-based eligibility screening and five-factor relevance scoring for Hungarian and EU funding. Clear explanations, grant calculator, and deadline tracking.'
            : 'Determinisztikus szabályrendszeren alapuló pályázatfigyelő és minősítő motor magyar vállalkozásoknak. Objektív alkalmassági pontszám percek alatt, rejtett kizáró okok azonnali azonosításával.',
        ctaAssessment: isEn ? 'Free Eligibility Assessment' : 'Ingyenes Alkalmassági Felmérés',
        ctaBrowse: isEn ? 'Browse Open Grants' : 'Nyitott Pályázatok Böngészése',
        featuredBadge: isEn ? 'FEATURED GRANTS' : 'KIEMELT KIÍRÁSOK',
        featuredTitle: isEn ? 'Current Funding Opportunities' : 'Aktuális Támogatási Lehetőségek',
        viewAll: isEn ? 'View all open calls' : 'Minden pályázat megtekintése (32 db)',
        fundingRange: isEn ? 'Funding volume:' : 'Támogatási keret:',
        intensity: isEn ? 'intensity' : 'intenzitás',
        deadline: isEn ? 'Deadline:' : 'Határidő:',
        details: isEn ? 'Details' : 'Részletek',
        calcBadge: isEn ? 'INTERACTIVE PLANNER' : 'INTERAKTÍV TERVEZŐ',
        calcTitle: isEn ? 'Calculate Your Grant Funding Ratio' : 'Számítsa ki beruházása támogatási arányát',
        calcDesc: isEn
            ? 'Test our interactive grant calculator to preview non-repayable subsidies and required equity contribution.'
            : 'Próbálja ki kalkulátorunkat, és nézze meg a vissza nem térítendő támogatás és saját erő megoszlását.',
        compBadge: isEn ? 'COMPARISON' : 'ÖSSZEHASONLÍTÁS',
        compTitle: isEn ? 'Traditional Grant Searching vs. Fundor Intelligence' : 'Hagyományos pályázatkeresés vs. Fundor Intelligencia',
        tradTitle: isEn ? 'Traditional process' : 'Hagyományos folyamat',
        tradList: isEn ? [
            '✗ Manual reading of 150-page complex tender documentation',
            '✗ Late discovery of disqualifying criteria (e.g. de minimis limits)',
            '✗ Subjective consultant estimates with hidden bias',
            '✗ Slow negotiation cycles lasting several weeks'
        ] : [
            '✗ 150 oldalas felhívási dokumentumok kézi átolvasása',
            '✗ Későn kiderülő kizáró okok (pl. de minimis keret túllépés)',
            '✗ Nem átlátható, szubjektív pályázatírói becslések',
            '✗ Lassú, hetekig tartó egyeztetési ciklusok'
        ],
        fundorTitle: isEn ? 'Fundor platform' : 'Fundor platform',
        recommendedBadge: isEn ? 'RECOMMENDED' : 'AJÁNLOTT',
        fundorList: isEn ? [
            '✓ Automated rule matching executed in 5 seconds',
            '✓ Preliminary checking of exhaustive disqualifying conditions',
            '✓ Mathematical Fundor Score between 0 and 100 points',
            '✓ Real-time deadline tracking and automated alerts'
        ] : [
            '✓ 5 másodperc alatt lefutó szabályalapú illesztés',
            '✓ Tételes kizáró feltételek előzetes ellenőrzése',
            '✓ 0-100 pont közötti matematikai Fundor Score',
            '✓ Valós idejű határidő-követés és automata riasztások'
        ],
        faqBadge: isEn ? 'FREQUENTLY ASKED QUESTIONS' : 'GYAKORI KÉRDÉSEK',
        faqTitle: isEn ? 'Frequently Asked Questions' : 'Gyakran Ismételt Kérdések',
        ctaBottomTitle: isEn ? 'Start Your Free Company Assessment Now' : 'Indítsa el cége ingyenes minősítését most',
        ctaBottomDesc: isEn
            ? 'Complete our 2-minute questionnaire to receive an immediate preliminary score and curated list of relevant grant opportunities.'
            : 'Töltse ki a 2 perces alapkérdőívet, és azonnal megkapja az előzetes pontszámot és a releváns pályázatok listáját.',
        ctaBottomBtn: isEn ? 'Start Free Assessment' : 'Ingyenes Felmérés Indítása',
    };

    const faqItems = isEn ? [
        {
            question: 'How does deterministic scoring work in Fundor?',
            answer: 'The system is not a black box: it evaluates 5 specific dimensions (Eligibility, Project Fit, Financial Scale, Timing, Feasibility) against explicit rules to generate an objective 0 to 100 score with line-item justifications.'
        },
        {
            question: 'Is a subscription required for the free assessment?',
            answer: 'No. The preliminary eligibility assessment is completely free and provides an instant score upon entering basic company attributes.'
        },
        {
            question: 'Which grant programs are tracked in the database?',
            answer: 'Hungarian operational programs (GINOP Plusz, KEHOP Plusz, DIMOP Plusz) alongside direct European Union SME-focused schemes (Horizon Europe, Digital Europe).'
        },
        {
            question: 'How does this differ from traditional grant writing consultants?',
            answer: 'Fundor is a data-driven decision engine: it disqualifies irrelevant or unviable calls within seconds so you only invest time into truly winnable funding.'
        }
    ] : [
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
                    <span>{t.badge}</span>
                </div>

                <h1 style={{
                    fontSize: 'clamp(32px, 5vw, 56px)',
                    lineHeight: 1.15,
                    fontWeight: 700,
                    color: 'var(--ink)',
                    marginBottom: '20px'
                }}>
                    {t.heroTitle1}<br />
                    <span style={{ color: 'var(--gold-deep)' }}>{t.heroTitle2}</span>
                </h1>

                <p style={{
                    fontSize: 'clamp(16px, 2vw, 19px)',
                    color: 'var(--muted)',
                    lineHeight: 1.6,
                    maxWidth: '760px',
                    margin: '0 auto 32px'
                }}>
                    {t.heroLead}
                </p>

                <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Button href="/assessment" variant="gold" style={{ padding: '12px 28px', fontSize: '15px' }}>
                        {t.ctaAssessment}
                    </Button>
                    <Button href="/opportunities" variant="ghost" style={{ padding: '12px 24px', fontSize: '15px' }}>
                        {t.ctaBrowse}
                    </Button>
                </div>
            </section>

            {/* Featured Opportunities Section */}
            <section style={{ marginBottom: '64px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                        <Badge variant="gold" style={{ marginBottom: '8px' }}>{t.featuredBadge}</Badge>
                        <h2 style={{ fontSize: '26px', margin: 0, color: 'var(--ink)' }}>{t.featuredTitle}</h2>
                    </div>
                    <Button href="/opportunities" variant="ghost" style={{ fontSize: '13px' }}>
                        {t.viewAll}
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
                                        {t.fundingRange} <strong>{Math.round((opp.funding_min || 10000000) / 1000000)} - {Math.round((opp.funding_max || 100000000) / 1000000)} M Ft</strong> ({Math.round((opp.intensity || 0.5) * 100)}% {t.intensity})
                                    </p>
                                </div>
                                <div style={{ borderTop: '1px solid var(--line)', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '12px', color: 'var(--amber)', fontWeight: 600 }}>
                                        {t.deadline} {opp.deadline ? new Date(opp.deadline).toLocaleDateString(isEn ? 'en-US' : 'hu-HU') : 'Közelgő'}
                                    </span>
                                    <Button href={`/opportunities/${opp.code}`} variant="dark" style={{ fontSize: '12.5px', padding: '6px 14px' }}>
                                        {t.details}
                                    </Button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>
                            <p style={{ color: 'var(--muted)', margin: 0 }}>
                                {isEn ? 'Featured grants loading...' : 'A kiemelt pályázatok betöltése folyamatban.'}
                            </p>
                        </div>
                    )}
                </div>
            </section>

            {/* Interactive Calculator Section */}
            <section style={{ marginBottom: '64px', maxWidth: '840px', marginInline: 'auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                    <Badge variant="gold" style={{ marginBottom: '8px' }}>{t.calcBadge}</Badge>
                    <h2 style={{ fontSize: '28px', color: 'var(--ink)', marginBottom: '8px' }}>
                        {t.calcTitle}
                    </h2>
                    <p style={{ color: 'var(--muted)', fontSize: '15px' }}>
                        {t.calcDesc}
                    </p>
                </div>

                <GrantCalculator initialInvestment={30000000} intensity={0.5} maxFunding={100000000} />
            </section>

            {/* Comparison Section */}
            <section style={{ marginBottom: '64px' }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <Badge variant="slate" style={{ marginBottom: '8px' }}>{t.compBadge}</Badge>
                    <h2 style={{ fontSize: '28px', color: 'var(--ink)', marginBottom: '8px' }}>
                        {t.compTitle}
                    </h2>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                    <div className="card" style={{ background: 'var(--surface-2)', borderColor: 'var(--line)', margin: 0 }}>
                        <h3 style={{ fontSize: '18px', color: 'var(--muted)', marginBottom: '16px' }}>{t.tradTitle}</h3>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', color: 'var(--muted)' }}>
                            {t.tradList.map((item, i) => (
                                <li key={i}>{item}</li>
                            ))}
                        </ul>
                    </div>

                    <div className="card" style={{ background: 'var(--surface)', borderColor: 'var(--gold)', borderWidth: '2px', margin: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ fontSize: '18px', color: 'var(--ink)', margin: 0 }}>{t.fundorTitle}</h3>
                            <Badge variant="gold">{t.recommendedBadge}</Badge>
                        </div>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', color: 'var(--text)' }}>
                            {t.fundorList.map((item, i) => (
                                <li key={i}>{item}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>

            {/* FAQ Accordion Section */}
            <section style={{ marginBottom: '64px', maxWidth: '840px', marginInline: 'auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <Badge variant="slate" style={{ marginBottom: '8px' }}>{t.faqBadge}</Badge>
                    <h2 style={{ fontSize: '28px', color: 'var(--ink)', marginBottom: '8px' }}>{t.faqTitle}</h2>
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
                    {t.ctaBottomTitle}
                </h2>
                <p style={{ color: 'var(--muted-2)', maxWidth: '600px', margin: '0 auto 28px', fontSize: '16px' }}>
                    {t.ctaBottomDesc}
                </p>
                <Button href="/assessment" variant="gold" style={{ padding: '14px 32px', fontSize: '16px' }}>
                    {t.ctaBottomBtn}
                </Button>
            </section>
        </div>
    );
}
