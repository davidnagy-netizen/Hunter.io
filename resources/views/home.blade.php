@extends('layouts.guest')

@section('title', __('Determinisztikus pályázatfigyelő és pontozó'))

@push('styles')
<style>
    /*
      Design Read Declaration:
      B2B Fintech & Grant Intelligence for Hungarian SMEs,
      in an authoritative modern grotesk editorial style, dial ENERGY 1 / RHYTHM 2 / MOTION 1.

      Color Tokens (per HUNTER-PROJECT-OVERVIEW specification):
      - Ink: #0E1726 (Dark background and deep typography)
      - Hunter Gold: #D99A2B (Accent and target metaphor)
      - Accessible Gold text on light: #8D5E06 (5.62:1 contrast)
      - Semantic Green (Eligible): #199268
      - Semantic Amber (Conditional): #DD8331
      - Semantic Red (Not Eligible): #CA4A4A
      - Semantic Slate (Insufficient Data): #8A94A6
    */

    .fundor-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 56px 24px 80px;
    }

    .fundor-container .btn {
        font-size: 13px;
        padding: 9px 16px;
        border-radius: 8px;
        line-height: 1.4;
    }

    @media (min-width: 768px) {
        .fundor-container {
            padding: 72px 40px 96px;
        }
    }

    /* Hero */
    .fundor-hero {
        text-align: center;
        max-width: 880px;
        margin: 0 auto 56px;
    }

    .fundor-hero-badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: var(--gold-bg);
        color: #8D5E06;
        border: 1px solid rgba(217, 154, 43, 0.35);
        border-radius: 9999px;
        font-size: 13px;
        font-weight: 700;
        padding: 6px 16px;
        margin-bottom: 20px;
        text-transform: uppercase;
        letter-spacing: 0.04em;
    }

    .fundor-hero-title {
        font-size: clamp(32px, 5vw, 56px);
        line-height: 1.12;
        font-weight: 700;
        color: var(--ink);
        margin-bottom: 20px;
    }

    .fundor-hero-title .gold-accent {
        color: var(--gold-deep);
    }

    .fundor-hero-lead {
        font-size: clamp(16px, 2vw, 19px);
        color: var(--muted);
        line-height: 1.6;
        max-width: 760px;
        margin: 0 auto 32px;
    }

    .fundor-hero-actions {
        display: flex;
        gap: 10px;
        justify-content: center;
        flex-wrap: wrap;
        margin-bottom: 20px;
    }

    .fundor-trust-caption {
        font-size: 13.5px;
        color: var(--muted-2);
        margin-top: 8px;
    }

    /* Section Headers */
    .section-wrap-center {
        text-align: center;
        max-width: 780px;
        margin: 0 auto 44px;
    }

    .section-eyebrow {
        font-size: 12.5px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #8D5E06;
        margin-bottom: 10px;
        display: inline-block;
    }

    .section-h2 {
        font-size: clamp(26px, 3.5vw, 38px);
        line-height: 1.2;
        font-weight: 700;
        color: var(--ink);
        margin-bottom: 14px;
    }

    .section-desc {
        font-size: 16px;
        color: var(--muted);
        line-height: 1.6;
    }

    /* Interactive Flagship Card */
    .flagship-card {
        background: var(--ink);
        color: #FFFFFF;
        border: 1px solid var(--ink-2);
        border-radius: var(--radius);
        padding: 32px 24px;
        box-shadow: var(--shadow-lg);
        margin-bottom: 64px;
    }

    @media (min-width: 768px) {
        .flagship-card {
            padding: 40px;
        }
    }

    .flagship-top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        flex-wrap: wrap;
        gap: 24px;
        padding-bottom: 24px;
        border-bottom: 1px solid var(--ink-2);
        margin-bottom: 28px;
    }

    .score-circle-box {
        background: var(--ink-2);
        border: 1px solid rgba(217, 154, 43, 0.3);
        border-radius: 12px;
        padding: 16px 20px;
        text-align: right;
        min-width: 160px;
    }

    .score-circle-val {
        font-family: var(--display);
        font-size: 40px;
        font-weight: 700;
        color: var(--gold);
        line-height: 1;
        margin: 4px 0;
    }

    /* 5-Factor Score Matrix */
    .factor-matrix {
        display: grid;
        grid-template-columns: 1fr;
        gap: 16px;
        margin-bottom: 28px;
    }

    @media (min-width: 860px) {
        .factor-matrix {
            grid-template-columns: repeat(5, 1fr);
        }
    }

    .factor-box {
        background: var(--ink-2);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: var(--radius-sm);
        padding: 16px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        gap: 8px;
    }

    .factor-title {
        font-size: 13px;
        color: var(--muted-2);
        font-weight: 500;
    }

    .factor-weight {
        font-size: 11px;
        color: var(--gold);
        font-weight: 700;
        text-transform: uppercase;
    }

    .factor-bar-track {
        height: 6px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 3px;
        overflow: hidden;
        margin: 4px 0;
    }

    .factor-bar-fill {
        height: 100%;
        border-radius: 3px;
        background: var(--gold);
    }

    .factor-score-num {
        font-size: 14px;
        font-weight: 700;
        color: #FFFFFF;
        font-family: var(--display);
    }

    /* Worked Comparison Example Grid */
    .comparison-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 24px;
        margin-bottom: 72px;
    }

    @media (min-width: 900px) {
        .comparison-grid {
            grid-template-columns: 1.1fr 0.9fr;
        }
    }

    .comp-panel {
        background: var(--surface);
        border: 1px solid var(--line);
        border-radius: var(--radius);
        padding: 28px;
        box-shadow: var(--shadow);
    }

    .comp-item-row {
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding: 16px;
        border-radius: 8px;
        margin-bottom: 12px;
        background: var(--paper);
        border-left: 4px solid transparent;
    }

    /* Verdicts Explanation Grid */
    .verdicts-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 16px;
        margin-bottom: 64px;
    }

    @media (min-width: 640px) {
        .verdicts-grid {
            grid-template-columns: repeat(2, 1fr);
        }
    }

    @media (min-width: 1024px) {
        .verdicts-grid {
            grid-template-columns: repeat(4, 1fr);
        }
    }

    .verdict-card {
        background: var(--surface);
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
        padding: 22px;
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    /* Interactive Simulator */
    .sim-container {
        background: var(--surface);
        border: 1px solid var(--line);
        border-radius: var(--radius);
        padding: 32px 24px;
        box-shadow: var(--shadow);
        margin-bottom: 72px;
    }

    @media (min-width: 768px) {
        .sim-container {
            padding: 44px;
        }
    }

    .sim-split {
        display: grid;
        grid-template-columns: 1fr;
        gap: 36px;
        align-items: center;
    }

    @media (min-width: 900px) {
        .sim-split {
            grid-template-columns: 1.2fr 0.8fr;
        }
    }

    .sim-slider-row {
        margin-bottom: 24px;
    }

    .sim-label-val {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
        font-size: 14.5px;
        font-weight: 600;
        color: var(--text);
    }

    .sim-slider-input {
        width: 100%;
        height: 8px;
        border-radius: 4px;
        background: var(--line);
        outline: none;
        -webkit-appearance: none;
        cursor: pointer;
    }

    .sim-slider-input::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: var(--gold);
        cursor: pointer;
        border: 2px solid #FFFFFF;
        box-shadow: 0 2px 6px rgba(0,0,0,0.2);
    }

    .sim-output-card {
        background: var(--ink);
        color: #FFFFFF;
        border-radius: var(--radius-sm);
        padding: 28px;
        display: flex;
        flex-direction: column;
        gap: 18px;
    }

    /* FAQ Accordion */
    .faq-stack {
        max-width: 820px;
        margin: 0 auto 72px;
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .faq-block {
        background: var(--surface);
        border: 1px solid var(--line);
        border-radius: 12px;
        overflow: hidden;
    }

    .faq-btn {
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 14px 18px;
        background: none;
        border: none;
        text-align: left;
        font-family: var(--font);
        font-size: 14px;
        font-weight: 600;
        color: var(--text);
        cursor: pointer;
        gap: 16px;
    }

    .faq-btn:hover {
        background: var(--paper);
    }

    .faq-btn:focus-visible {
        outline: 2px solid var(--blue);
        outline-offset: -2px;
    }

    .faq-arrow {
        flex-shrink: 0;
        transition: transform 0.2s ease;
        color: var(--muted);
    }

    .faq-block.is-open .faq-arrow {
        transform: rotate(180deg);
    }

    .faq-body {
        display: none;
        padding: 0 24px 20px;
        font-size: 14.5px;
        color: var(--muted);
        line-height: 1.6;
    }

    .faq-block.is-open .faq-body {
        display: block;
    }

    /* Closing Banner */
    .closing-banner {
        background: var(--ink);
        color: #FFFFFF;
        border-radius: var(--radius);
        padding: 48px 28px;
        text-align: center;
        box-shadow: var(--shadow-lg);
    }

    @media (min-width: 768px) {
        .closing-banner {
            padding: 64px 48px;
        }
    }
</style>
@endpush

@section('content')
<div id="react-root" data-react-component="HomePage" data-props="{{ json_encode(['featuredOpportunities' => $featuredOpportunities, 'currentLocale' => app()->getLocale()]) }}">
<div class="fundor-container">

    <!-- 1. Hero Section -->
    <div class="fundor-hero">
        <div class="fundor-hero-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <circle cx="12" cy="12" r="10"></circle>
                <polygon points="12 8 8 12 12 16 16 12 12 8"></polygon>
            </svg>
            <span>{{ __('Magyar KKV Pályázati Intelligencia') }}</span>
        </div>

        <h1 class="fundor-hero-title">
            {{ __('Ne te keresd a pályázatot.') }}<br>
            <span class="gold-accent">{{ __('A Fundor megtalálja neked.') }}</span>
        </h1>

        <p class="fundor-hero-lead">
            {{ __('Azonnali, szabályalapú alkalmassági szűrés és 5-faktoros relevancia-pontozás hazai és uniós forrásokhoz. Nem pusztán lista: pontos tételes indoklás, grant kalkulátor és határidő-monitoring.') }}
        </p>

        <div class="fundor-hero-actions">
            <a href="{{ route('assessment.show') }}" class="btn btn-gold" style="font-weight: 700;">
                {{ __('Ingyenes Alkalmassági Felmérés (2 perc)') }}
            </a>
            <a href="{{ route('register') }}" class="btn btn-dark" style="border: 1px solid var(--ink-3);">
                {{ __('Cégprofil Regisztráció') }}
            </a>
        </div>

        <p class="fundor-trust-caption">
            {{ __('Nem szükséges bankkártya. 6 kérdéses gyorsfelmérés, azonnali Fundor Readiness Score.') }}
        </p>
    </div>

    <!-- 2. Flagship Interactive Opportunity Card & Scoring Engine Cockpit -->
    <div class="flagship-card" id="demo">
        <div class="flagship-top">
            <div>
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px; flex-wrap: wrap;">
                    <span class="badge badge-gold" style="font-size: 12px;">{{ __('Széchenyi Terv Plusz') }}</span>
                    <span class="badge badge-green" style="font-size: 12px;">{{ __('Feltételesen alkalmas') }}</span>
                    <span style="font-size: 13px; color: var(--muted-2);">{{ __('Kód: SZTP-TECH-2025') }}</span>
                </div>
                <h2 style="font-size: clamp(22px, 3vw, 30px); color: #FFFFFF; margin-bottom: 8px; font-weight: 700;">
                    {{ __('Technológiafejlesztés KKV-k Részére') }}
                </h2>
                <div style="font-size: 14px; color: #CBD5E1;">
                    {{ __('Mintapélda profil: Alfa Gyártó Kft. (28 fős KKV, Pest megye, TEÁOR 28, 30 M Ft beruházás)') }}
                </div>
            </div>

            <div class="score-circle-box">
                <div style="font-size: 12px; color: var(--muted-2); text-transform: uppercase; font-weight: 600;">{{ __('Fundor Score') }}</div>
                <div class="score-circle-val">95<span style="font-size: 20px; color: var(--muted-2);"> / 100</span></div>
                <div style="font-size: 11.5px; color: var(--green); font-weight: 600;">{{ __('Kiemelten ajánlott kategória') }}</div>
            </div>
        </div>

        <!-- 5-Factor Weighted Score Breakdown -->
        <div style="font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: var(--gold); margin-bottom: 12px;">
            {{ __('5-Faktoros Relevancia Pontbontás') }}
        </div>

        <div class="factor-matrix">
            <div class="factor-box">
                <div>
                    <div class="factor-title">{{ __('1. Jogosultság') }}</div>
                    <div class="factor-weight">{{ __('35% súly') }}</div>
                </div>
                <div class="factor-bar-track">
                    <div class="factor-bar-fill" style="width: 100%;"></div>
                </div>
                <div class="factor-score-num">100 / 100</div>
            </div>

            <div class="factor-box">
                <div>
                    <div class="factor-title">{{ __('2. Cél-illeszkedés') }}</div>
                    <div class="factor-weight">{{ __('25% súly') }}</div>
                </div>
                <div class="factor-bar-track">
                    <div class="factor-bar-fill" style="width: 95%;"></div>
                </div>
                <div class="factor-score-num">95 / 100</div>
            </div>

            <div class="factor-box">
                <div>
                    <div class="factor-title">{{ __('3. Támogatási Méret') }}</div>
                    <div class="factor-weight">{{ __('15% súly') }}</div>
                </div>
                <div class="factor-bar-track">
                    <div class="factor-bar-fill" style="width: 100%;"></div>
                </div>
                <div class="factor-score-num">100 / 100</div>
            </div>

            <div class="factor-box">
                <div>
                    <div class="factor-title">{{ __('4. Időzítés') }}</div>
                    <div class="factor-weight">{{ __('15% súly') }}</div>
                </div>
                <div class="factor-bar-track">
                    <div class="factor-bar-fill" style="width: 90%;"></div>
                </div>
                <div class="factor-score-num">90 / 100</div>
            </div>

            <div class="factor-box">
                <div>
                    <div class="factor-title">{{ __('5. Megvalósíthatóság') }}</div>
                    <div class="factor-weight">{{ __('10% súly') }}</div>
                </div>
                <div class="factor-bar-track">
                    <div class="factor-bar-fill" style="width: 85%;"></div>
                </div>
                <div class="factor-score-num">85 / 100</div>
            </div>
        </div>

        <!-- Itemized Reasons: "Miért ajánljuk?" -->
        <div style="background: var(--ink-2); border-radius: var(--radius-sm); padding: 22px; margin-bottom: 24px; border-left: 4px solid var(--gold);">
            <div style="font-weight: 700; font-size: 15px; margin-bottom: 12px; color: #FFFFFF;">
                {{ __('Miért illeszkedik a cégedhez? Tételes indoklás:') }}
            </div>
            <div style="display: flex; flex-direction: column; gap: 10px; font-size: 14px; line-height: 1.5;">
                <div style="display: flex; align-items: flex-start; gap: 10px;">
                    <span style="color: var(--green); font-weight: bold;">[{{ __('ALKALMAS') }}]</span>
                    <span><strong>{{ __('Létszám (28 fő):') }}</strong> {{ __('Pontosan beleesik a KKV támogatotti sávba (10 és 49 fő között).') }}</span>
                </div>
                <div style="display: flex; align-items: flex-start; gap: 10px;">
                    <span style="color: var(--green); font-weight: bold;">[{{ __('ALKALMAS') }}]</span>
                    <span><strong>{{ __('Tervezett beruházás (30 M Ft):') }}</strong> {{ __('Bőven a kiírás 10 M Ft és 100 M Ft közötti finanszírozási keretén belül van.') }}</span>
                </div>
                <div style="display: flex; align-items: flex-start; gap: 10px;">
                    <span style="color: var(--amber); font-weight: bold;">[{{ __('FIGYELMEZTETÉS') }}]</span>
                    <span><strong>{{ __('De minimis keret:') }}</strong> {{ __('Az elmúlt 3 pénzügyi év csekély összegű támogatásairól igazoló nyilatkozat feltöltése szükséges.') }}</span>
                </div>
            </div>
        </div>

        <!-- Live Grant Calculator Widget inside Cockpit -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; padding-top: 10px;">
            <div style="background: rgba(255,255,255,0.05); padding: 14px 18px; border-radius: 8px;">
                <div style="font-size: 12px; color: var(--muted-2);">{{ __('Beruházási Költségvetés') }}</div>
                <div style="font-size: 20px; font-weight: 700; color: #FFFFFF; font-family: var(--display);">30 000 000 Ft</div>
            </div>
            <div style="background: rgba(255,255,255,0.05); padding: 14px 18px; border-radius: 8px;">
                <div style="font-size: 12px; color: var(--muted-2);">{{ __('Támogatási Intenzitás') }}</div>
                <div style="font-size: 20px; font-weight: 700; color: var(--gold); font-family: var(--display);">{{ __('50% (Max)') }}</div>
            </div>
            <div style="background: rgba(255,255,255,0.05); padding: 14px 18px; border-radius: 8px;">
                <div style="font-size: 12px; color: var(--muted-2);">{{ __('Vissza Nem Térítendő Támogatás') }}</div>
                <div style="font-size: 20px; font-weight: 700; color: var(--green); font-family: var(--display);">15 000 000 Ft</div>
            </div>
            <div style="background: rgba(255,255,255,0.05); padding: 14px 18px; border-radius: 8px;">
                <div style="font-size: 12px; color: var(--muted-2);">{{ __('Szükséges Saját Forrás') }}</div>
                <div style="font-size: 20px; font-weight: 700; color: #CBD5E1; font-family: var(--display);">15 000 000 Ft</div>
            </div>
        </div>
    </div>

    <!-- 3. Worked Comparison Example: Relevant vs Excluded Grants -->
    <div class="section-wrap-center">
        <span class="section-eyebrow">{{ __('A Fundor Alapvető Különbsége') }}</span>
        <h2 class="section-h2">{{ __('A hagyományos keresők listáznak. A Fundor döntési réteget ad.') }}</h2>
        <p class="section-desc">
            {{ __('Más portálok kiadnak 400 felhívást, aminek 95%-ára a céged nem jogosult. A Fundor tételesen kimutatja a releváns nyerteseket, és egzakt jogi okkal zárja ki a nem megfelelőt.') }}
        </p>
    </div>

    <div class="comparison-grid">
        <!-- Relevant Matches Column -->
        <div class="comp-panel" style="border-top: 4px solid var(--green);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px;">
                <h3 style="font-size: 20px; font-weight: 700; color: var(--ink); margin: 0;">
                    {{ __('Rangsorolt Releváns Találatok (3)') }}
                </h3>
                <span class="badge badge-green">{{ __('Nyerhető források') }}</span>
            </div>

            <div class="comp-item-row" style="border-left-color: var(--green);">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <strong>{{ __('Széchenyi Terv Plusz: Technológia') }}</strong>
                    <span style="color: var(--gold-deep); font-weight: 700; font-family: var(--display);">Score: 95</span>
                </div>
                <div style="font-size: 13px; color: var(--muted);">{{ __('Támogatás: 10–100 M Ft (50%). Cél: modern gépbeszerzés.') }}</div>
                <div style="font-size: 12px; color: var(--green); font-weight: 600;">{{ __('Teljesen alkalmas, azonnal pályázható.') }}</div>
            </div>

            <div class="comp-item-row" style="border-left-color: var(--amber);">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <strong>{{ __('GINOP Plusz: Vállalati Digitalizáció & ERP') }}</strong>
                    <span style="color: var(--gold-deep); font-weight: 700; font-family: var(--display);">Score: 87</span>
                </div>
                <div style="font-size: 13px; color: var(--muted);">{{ __('Támogatás: 5–30 M Ft (50%). Cél: felhőszoftver és hardver.') }}</div>
                <div style="font-size: 12px; color: var(--amber); font-weight: 600;">{{ __('Feltételes: de minimis keretigazolás rákérdezést igényel.') }}</div>
            </div>

            <div class="comp-item-row" style="border-left-color: var(--amber);">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <strong>{{ __('DIMOP Plusz: Mesterséges Intelligencia KKV-knak') }}</strong>
                    <span style="color: var(--gold-deep); font-weight: 700; font-family: var(--display);">Score: 87</span>
                </div>
                <div style="font-size: 13px; color: var(--muted);">{{ __('Támogatás: 8–25 M Ft (60%). Cél: folyamatautomatizáció.') }}</div>
                <div style="font-size: 12px; color: var(--amber); font-weight: 600;">{{ __('Feltételes: informatikai előminősítés szükséges.') }}</div>
            </div>
        </div>

        <!-- Excluded Calls Column with Explicit Reasons -->
        <div class="comp-panel" style="border-top: 4px solid var(--red);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px;">
                <h3 style="font-size: 20px; font-weight: 700; color: var(--ink); margin: 0;">
                    {{ __('Kizárt Felhívások Indoklással (3)') }}
                </h3>
                <span class="badge badge-red">{{ __('Megspórolt hetek') }}</span>
            </div>

            <div class="comp-item-row" style="border-left-color: var(--red);">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <strong>{{ __('TOP Plusz: Telephelyfejlesztés') }}</strong>
                    <span class="badge badge-red" style="font-size: 11px;">{{ __('Kizárva') }}</span>
                </div>
                <div style="font-size: 13px; color: var(--muted);">{{ __('Pest megyei megvalósítási helyszín miatt automatikusan kizárva (kizárólag konvergencia régiók jogosultak).') }}</div>
            </div>

            <div class="comp-item-row" style="border-left-color: var(--red);">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <strong>{{ __('KAP: Mezőgazdasági Üzemkorszerűsítés') }}</strong>
                    <span class="badge badge-red" style="font-size: 11px;">{{ __('Kizárva') }}</span>
                </div>
                <div style="font-size: 13px; color: var(--muted);">{{ __('A cég főtevékenysége nem mezőgazdasági (TEÁOR 28 gépgyártás nem felel meg az 50% árbevételi feltételnek).') }}</div>
            </div>

            <div class="comp-item-row" style="border-left-color: var(--red);">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <strong>{{ __('EIC Accelerator: Deeptech Innováció') }}</strong>
                    <span class="badge badge-red" style="font-size: 11px;">{{ __('Kizárva') }}</span>
                </div>
                <div style="font-size: 13px; color: var(--muted);">{{ __('A 30 M Ft tervezett költségvetés nem éri el a kiírás 50 M Ft-os minimális projektméret korlátját.') }}</div>
            </div>
        </div>
    </div>

    <!-- 4. Deterministic Engine: The 4 Explicit Verdicts -->
    <div class="section-wrap-center">
        <span class="section-eyebrow">{{ __('Determinisztikus Szabályrendszer') }}</span>
        <h2 class="section-h2">{{ __('A motor szűr, az MI magyaráz.') }}</h2>
        <p class="section-desc">
            {{ __('A jogosultság nem lehet algoritmus-tippelés. A Fundor determinisztikus matematikai szabályrendszere 4 egzakt kimenet egyikét adja minden nyitott forrásra.') }}
        </p>
    </div>

    <div class="verdicts-grid">
        <div class="verdict-card" style="border-top: 3px solid var(--green);">
            <span class="badge badge-green" style="align-self: flex-start;">ELIGIBLE</span>
            <div style="font-weight: 700; font-size: 16px; color: var(--ink);">{{ __('Teljesen Alkalmas') }}</div>
            <div style="font-size: 13.5px; color: var(--muted); line-height: 1.5;">
                {{ __('Minden hard szabály maradéktalanul teljesül. Nincs kizáró ok, a projektméret, a régió és a TEÁOR kód valid.') }}
            </div>
        </div>

        <div class="verdict-card" style="border-top: 3px solid var(--amber);">
            <span class="badge badge-amber" style="align-self: flex-start;">CONDITIONAL</span>
            <div style="font-weight: 700; font-size: 16px; color: var(--ink);">{{ __('Feltételes Alkalmasság') }}</div>
            <div style="font-size: 13.5px; color: var(--muted); line-height: 1.5;">
                {{ __('A kemény szabályok stimmelnek, de teljesítendő feltétel áll fenn: önerő-igazolás, de minimis nyilatkozat vagy szűk beadási szakasz.') }}
            </div>
        </div>

        <div class="verdict-card" style="border-top: 3px solid var(--slate);">
            <span class="badge badge-slate" style="align-self: flex-start;">INSUFFICIENT DATA</span>
            <div style="font-weight: 700; font-size: 16px; color: var(--ink);">{{ __('Hiányzó Adat') }}</div>
            <div style="font-size: 13.5px; color: var(--muted); line-height: 1.5;">
                {{ __('A rendszer nem találgat: rákérdez a hiányzó értékre. A válaszadás azonnal frissíti a profilt és újraszámolja a pontot.') }}
            </div>
        </div>

        <div class="verdict-card" style="border-top: 3px solid var(--red);">
            <span class="badge badge-red" style="align-self: flex-start;">NOT ELIGIBLE</span>
            <div style="font-weight: 700; font-size: 16px; color: var(--ink);">{{ __('Nem Jogosult') }}</div>
            <div style="font-size: 13.5px; color: var(--muted); line-height: 1.5;">
                {{ __('Legalább egy kemény kizáró szabály meghiúsult. A kiírás azonnal kizárásra kerül, felesleges adminisztráció nélkül.') }}
            </div>
        </div>
    </div>

    <!-- 5. Interactive Grant Readiness & Score Calculator -->
    <div class="sim-container" id="scoring">
        <div class="section-wrap-center" style="margin-bottom: 32px;">
            <span class="section-eyebrow">{{ __('Interaktív Pályázati Kalkulátor') }}</span>
            <h2 class="section-h2">{{ __('Mekkora támogatásra számíthat a céged?') }}</h2>
            <p class="section-desc">
                {{ __('Állítsd be a cégméretet és a beruházási célt a várható támogatási összeg és Fundor Score kalkulációjához.') }}
            </p>
        </div>

        <div class="sim-split">
            <div>
                <div class="sim-slider-row">
                    <div class="sim-label-val">
                        <span>{{ __('Foglalkoztatotti Létszám (Fő)') }}</span>
                        <strong id="sim-employees-val" style="color: var(--ink); font-size: 17px; font-family: var(--display);">28 {{ __('fő') }} ({{ __('Kisvállalkozás') }})</strong>
                    </div>
                    <input type="range" id="sim-employees" class="sim-slider-input" min="1" max="250" value="28">
                </div>

                <div class="sim-slider-row">
                    <div class="sim-label-val">
                        <span>{{ __('Tervezett Beruházási Költségvetés') }}</span>
                        <strong id="sim-investment-val" style="color: var(--ink); font-size: 17px; font-family: var(--display);">30 M Ft</strong>
                    </div>
                    <input type="range" id="sim-investment" class="sim-slider-input" min="5" max="150" step="5" value="30">
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
                    <div>
                        <label for="sim-region" style="display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px; color: var(--text);">{{ __('Régió Elhelyezkedés') }}</label>
                        <select id="sim-region" style="width: 100%; height: 42px; border: 1px solid var(--line-strong); border-radius: 8px; padding: 0 10px; font-family: var(--font); font-size: 14px; background: #FFF;">
                            <option value="pest">{{ __('Pest megye') }}</option>
                            <option value="konvergencia" selected>{{ __('Konvergencia Régiók (Vidék)') }}</option>
                            <option value="budapest">{{ __('Budapest') }}</option>
                        </select>
                    </div>

                    <div>
                        <label for="sim-goal" style="display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px; color: var(--text);">{{ __('Fejlesztési Főcél') }}</label>
                        <select id="sim-goal" style="width: 100%; height: 42px; border: 1px solid var(--line-strong); border-radius: 8px; padding: 0 10px; font-family: var(--font); font-size: 14px; background: #FFF;">
                            <option value="tech" selected>{{ __('Gépbeszerzés / Technológia') }}</option>
                            <option value="digital">{{ __('Digitalizáció & ERP') }}</option>
                            <option value="energy">{{ __('Energetikai Hatékonyság') }}</option>
                            <option value="rnd">{{ __('Kutatás-Fejlesztés (K+F)') }}</option>
                        </select>
                    </div>
                </div>
            </div>

            <div class="sim-output-card">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 12px;">
                    <span style="font-size: 13px; color: var(--muted-2);">{{ __('Becsült Fundor Score') }}</span>
                    <span id="sim-score-display" style="font-size: 32px; font-weight: 700; color: var(--gold); font-family: var(--display);">95 / 100</span>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 13.5px; color: #CBD5E1;">{{ __('Várható Támogatási Arány:') }}</span>
                    <strong id="sim-intensity-display" style="font-size: 16px; color: #FFFFFF;">50%</strong>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 13.5px; color: #CBD5E1;">{{ __('Számított Támogatási Összeg:') }}</span>
                    <strong id="sim-grant-display" style="font-size: 22px; font-weight: 700; color: var(--green); font-family: var(--display);">15 M Ft</strong>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 13.5px; color: #CBD5E1;">{{ __('Szükséges Saját Tőke:') }}</span>
                    <strong id="sim-own-display" style="font-size: 16px; color: #FFFFFF; font-family: var(--display);">15 M Ft</strong>
                </div>

                <div style="margin-top: 6px;">
                    <a href="{{ route('assessment.show') }}" class="btn btn-gold" style="width: 100%; font-weight: 700;">
                        {{ __('Részletes Cégelemzés Indítása') }}
                    </a>
                </div>
            </div>
        </div>
    </div>

    <!-- 6. Curated Open Opportunities Showcase (Wired to Database) -->
    <div style="margin-bottom: 72px;" id="opportunities">
        <div class="section-wrap-center">
            <span class="section-eyebrow">{{ __('Valós Adatbázis') }}</span>
            <h2 class="section-h2">{{ __('Kiemelt Nyitott Pályázati Felhívások') }}</h2>
            <p class="section-desc">
                {{ __('Hivatalos forrásokból auditált, azonnal megpályázható hazai és uniós konstrukciók.') }}
            </p>
        </div>

        <div class="grid grid-cols-3">
            @forelse($featuredOpportunities as $opp)
                <div class="card" style="display: flex; flex-direction: column; justify-content: space-between;">
                    <div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                            <span class="badge badge-gold">{{ $opp->program }}</span>
                            <span style="font-size: 12px; color: var(--muted);">{{ $opp->deadline->format('Y.m.d.') }}</span>
                        </div>
                        <h4 style="font-size: 17px; margin-bottom: 10px; color: var(--ink);">{{ __($opp->title) }}</h4>
                        <div style="font-size: 13.5px; color: var(--muted); margin-bottom: 16px;">
                            {{ __('Támogatás:') }} {{ number_format($opp->funding_min / 1000000, 0) }} {{ __('és') }} {{ number_format($opp->funding_max / 1000000, 0) }} {{ __('M Ft között') }} ({{ round($opp->intensity * 100) }}%)
                        </div>
                    </div>
                    <div>
                        <a href="{{ route('opportunities.show', $opp->code) }}" class="btn btn-ghost" style="width: 100%; font-size: 13px;">
                            {{ __('Részletek és Pontozás') }}
                        </a>
                    </div>
                </div>
            @empty
                <div class="card" style="grid-column: 1 / -1; text-align: center; color: var(--muted); padding: 40px;">
                    {{ __('Jelenleg nincsenek kiemelt pályázatok rögzítve az adatbázisban.') }}
                </div>
            @endforelse
        </div>
    </div>

    <!-- 7. Official Primary-Source Attributions -->
    <div style="margin-bottom: 72px;" id="architecture">
        <div class="section-wrap-center">
            <span class="section-eyebrow">{{ __('Auditált Források') }}</span>
            <h2 class="section-h2">{{ __('Közvetlen forrás-ellenőrzés minden ponton.') }}</h2>
            <p class="section-desc">
                {{ __('A Fundor kizárólag hivatalos kormányzati és uniós adatbázisok hitelesített felhívásaiból dolgozik.') }}
            </p>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px;">
            <div style="background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-sm); padding: 20px; text-align: center;">
                <div style="font-weight: 700; font-size: 16px; margin-bottom: 6px; color: var(--ink);">palyazat.gov.hu</div>
                <div style="font-size: 13px; color: var(--muted);">{{ __('Nemzeti Fejlesztési Központ és Széchenyi Terv Plusz felhívások.') }}</div>
            </div>

            <div style="background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-sm); padding: 20px; text-align: center;">
                <div style="font-weight: 700; font-size: 16px; margin-bottom: 6px; color: var(--ink);">EU Funding & Tenders</div>
                <div style="font-size: 13px; color: var(--muted);">{{ __('Európai Bizottság közvetlen SEDIA forrásai és Horizon Europe.') }}</div>
            </div>

            <div style="background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-sm); padding: 20px; text-align: center;">
                <div style="font-weight: 700; font-size: 16px; margin-bottom: 6px; color: var(--ink);">kap.gov.hu</div>
                <div style="font-size: 13px; color: var(--muted);">{{ __('Közös Agrárpolitika stratégiai tervek és élelmiszeripari támogatások.') }}</div>
            </div>

            <div style="background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-sm); padding: 20px; text-align: center;">
                <div style="font-weight: 700; font-size: 16px; margin-bottom: 6px; color: var(--ink);">Kohesio Benchmarks</div>
                <div style="font-size: 13px; color: var(--muted);">{{ __('400+ korábban elnyert magyarországi projekt referencia-adatai.') }}</div>
            </div>
        </div>
    </div>

    <!-- 8. Transparent Pricing Teaser -->
    <div class="card" style="background: var(--paper); border: 1px solid var(--line-strong); padding: 40px; margin-bottom: 72px; text-align: center;" id="pricing">
        <span class="badge badge-gold" style="margin-bottom: 12px;">{{ __('Kiszámítható Előfizetés') }}</span>
        <h2 style="font-size: 32px; font-weight: 700; color: var(--ink); margin-bottom: 12px;">{{ __('5 990 Ft / hó') }}</h2>
        <p style="font-size: 16px; color: var(--muted); max-width: 600px; margin: 0 auto 24px; line-height: 1.6;">
            {{ __('Egyetlen elnyert 15 millió forintos támogatás díja kevesebb mint a támogatás 0.04%-a. Folyamatos cégprofil-figyelés, kalkulátorok és szakértői indoklás.') }}
        </p>
        <div>
            <a href="{{ route('assessment.show') }}" class="btn btn-gold" style="font-weight: 700;">
                {{ __('Kezdd az Ingyenes Felméréssel') }}
            </a>
        </div>
    </div>

    <!-- 9. Targeted SME Grant FAQ Accordion -->
    <div id="faq">
        <div class="section-wrap-center">
            <span class="section-eyebrow">{{ __('Gyakori Kérdések') }}</span>
            <h2 class="section-h2">{{ __('Világos válaszok a pályázati döntésekhez.') }}</h2>
            <p class="section-desc">
                {{ __('Minden részlet a működésről, megbízhatóságról és a pontozási logikáról.') }}
            </p>
        </div>

        <div class="faq-stack">
            <div class="faq-block is-open">
                <button type="button" class="faq-btn" aria-expanded="true">
                    <span>{{ __('Hogyan működik a determinisztikus alkalmassági szűrés?') }}</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="faq-arrow">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </button>
                <div class="faq-body">
                    {{ __('A motor deklaratív szabályokat értékel ki a céged adatai (létszám, TEÁOR kód, lezárt üzleti évek, beruházási cél, helyszín) alapján. Nem becslés: ha egy pályázat kizárja a budapesti cégeket, vagy agrártevékenységet követel meg, a rendszer azonnal kizárja, és nem ad megtévesztő pontszámot.') }}
                </div>
            </div>

            <div class="faq-block">
                <button type="button" class="faq-btn" aria-expanded="false">
                    <span>{{ __('Mi a különbség az 5 pontozási faktor között?') }}</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="faq-arrow">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </button>
                <div class="faq-body">
                    {{ __('A Fundor Score öt súlyozott tényezőből épül fel: Jogosultság (35%), Cél-illeszkedés (25%), Támogatási összeg és projektméret aránya (15%), Határidő és időzítés (15%), valamint a Megvalósíthatóság és adminisztratív teher (10%).') }}
                </div>
            </div>

            <div class="faq-block">
                <button type="button" class="faq-btn" aria-expanded="false">
                    <span>{{ __('Mi történik, ha hiányzik egy adat a cégünkről?') }}</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="faq-arrow">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </button>
                <div class="faq-body">
                    {{ __('Ha egy szükséges feltétel (például de minimis támogatási előzmény) nem ismert, a rendszer nem találgat: INSUFFICIENT DATA státuszt ad. Egyetlen kattintással megválaszolhatod a kérdést, ami automatikusan újraszámolja a relevanciát az összes kapcsolódó pályázatra.') }}
                </div>
            </div>

            <div class="faq-block">
                <button type="button" class="faq-btn" aria-expanded="false">
                    <span>{{ __('Garantálja a Fundor a pályázat elnyerését?') }}</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="faq-arrow">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </button>
                <div class="faq-body">
                    {{ __('Nem. A Fundor döntéstámogató intelligencia: megmutatja, hova érdemes beadni a pályázatot, és tételesen kiszűri a kizáró tényezőket. A végső támogatási döntést a hatóságok hozzák meg a beadott pályázati anyag minősége alapján.') }}
                </div>
            </div>

            <div class="faq-block">
                <button type="button" class="faq-btn" aria-expanded="false">
                    <span>{{ __('Segít a Fundor a pályázat megírásában is?') }}</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="faq-arrow">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </button>
                <div class="faq-body">
                    {{ __('Igen, a felkészülést támogatja a részletes dokumentum-ellenőrző lista, az önerő kalkulátor, valamint az előkészületben lévő Fundor Plus intelligens pályázatíró munkaterület.') }}
                </div>
            </div>
        </div>
    </div>

    <!-- 10. Closing High-Impact Call to Action -->
    <div class="closing-banner">
        <h2 style="font-size: clamp(26px, 4vw, 42px); font-weight: 700; margin-bottom: 16px; color: #FFFFFF;">
            {{ __('Ne maradj le a cégednek járó vissza nem térítendő forrásokról.') }}
        </h2>
        <p style="font-size: 17px; color: #CBD5E1; max-width: 640px; margin: 0 auto 32px; line-height: 1.6;">
            {{ __('Töltsd ki az ingyenes 2 perces alkalmassági tesztet, és fedezd fel a vállalkozásodra szabott támogatási lehetőségeket.') }}
        </p>
        <div style="display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;">
            <a href="{{ route('assessment.show') }}" class="btn btn-gold" style="font-weight: 700;">
                {{ __('Ingyenes Felmérés Indítása') }}
            </a>
            <a href="{{ route('register') }}" class="btn btn-ghost" style="color: #FFFFFF; border-color: rgba(255,255,255,0.2);">
                {{ __('Cég Regisztráció') }}
            </a>
        </div>
    </div>

</div>
</div>
@endsection

@push('scripts')
<script>
    document.addEventListener('DOMContentLoaded', () => {
        // 1. FAQ Accordion Interaction
        const faqBlocks = document.querySelectorAll('.faq-block');
        faqBlocks.forEach(block => {
            const btn = block.querySelector('.faq-btn');
            if (btn) {
                btn.addEventListener('click', () => {
                    const isOpen = block.classList.contains('is-open');
                    block.classList.toggle('is-open', !isOpen);
                    btn.setAttribute('aria-expanded', !isOpen ? 'true' : 'false');
                });
            }
        });

        // 2. Interactive Grant Readiness & Score Calculator
        const empInput = document.getElementById('sim-employees');
        const empVal = document.getElementById('sim-employees-val');
        const invInput = document.getElementById('sim-investment');
        const invVal = document.getElementById('sim-investment-val');
        const regionInput = document.getElementById('sim-region');
        const goalInput = document.getElementById('sim-goal');

        const scoreDisplay = document.getElementById('sim-score-display');
        const intensityDisplay = document.getElementById('sim-intensity-display');
        const grantDisplay = document.getElementById('sim-grant-display');
        const ownDisplay = document.getElementById('sim-own-display');

        const lblMicro = @json(__('Mikrovállalkozás'));
        const lblSmall = @json(__('Kisvállalkozás'));
        const lblMedium = @json(__('Középvállalkozás'));
        const lblEmployees = @json(__('fő'));

        function updateGrantCalculation() {
            if (!empInput || !invInput) return;
            const emp = parseInt(empInput.value, 10);
            const inv = parseInt(invInput.value, 10);
            const region = regionInput.value;
            const goal = goalInput.value;

            // Update Label Displays
            let category = lblMicro;
            if (emp >= 50) category = lblMedium;
            else if (emp >= 10) category = lblSmall;
            empVal.textContent = `${emp} ${lblEmployees} (${category})`;
            invVal.textContent = `${inv} M Ft`;

            // Intensity Logic: Konvergencia 50-60%, Pest 40-50%, Budapest 30-40%
            let intensity = 0.50;
            if (region === 'konvergencia') {
                intensity = goal === 'rnd' || goal === 'energy' ? 0.65 : 0.50;
            } else if (region === 'pest') {
                intensity = 0.50;
            } else if (region === 'budapest') {
                intensity = 0.35;
            }

            // Score Logic based on typical criteria
            let score = 90;
            if (region === 'pest' && goal === 'tech') score = 95;
            if (region === 'konvergencia') score += 4;
            if (region === 'budapest') score -= 15;
            if (inv > 100) score -= 5;
            score = Math.min(99, Math.max(45, score));

            const grantAmount = Math.round(inv * intensity);
            const ownAmount = inv - grantAmount;

            scoreDisplay.textContent = `${score} / 100`;
            intensityDisplay.textContent = `${Math.round(intensity * 100)}%`;
            grantDisplay.textContent = `${grantAmount} M Ft`;
            ownDisplay.textContent = `${ownAmount} M Ft`;
        }

        if (empInput) empInput.addEventListener('input', updateGrantCalculation);
        if (invInput) invInput.addEventListener('input', updateGrantCalculation);
        if (regionInput) regionInput.addEventListener('change', updateGrantCalculation);
        if (goalInput) goalInput.addEventListener('change', updateGrantCalculation);
    });
</script>
@endpush
