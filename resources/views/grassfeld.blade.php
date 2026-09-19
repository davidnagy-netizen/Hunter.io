<!DOCTYPE html>
<html lang="en" class="scroll-smooth">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Grassfeld: AI Budgeting for Financial Clarity & Peace of Mind</title>
  <meta name="description" content="Grassfeld pairs intelligent spending analysis with proactive budget pacing. Keep your finances on track with effortless peace of mind.">

  <!-- Google Fonts: Space Grotesk (Headlines) & Manrope (Body) -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet">

  <style>
    /*
      Design Read Declaration:
      B2C Fintech Landing Page for personal budgeters and mindful spenders,
      in a calm editorial modern grotesk style, dial ENERGY 1 / RHYTHM 2 / MOTION 1.

      Major Decision Reasons (R-31):
      - Palette: Mist Blue (#DFF1F3) wash with Ink Navy (#202128) creates a tranquil, trustworthy banking environment.
      - Typography: Space Grotesk offers editorial structure without tech clutter; Manrope gives pristine legibility for tabular currency.
      - Radius: 16px cards and 10px buttons reflect physical stationery cards and tactile controls.
      - Elevation: Hairline borders (1px solid #DFF1F3) replace floating dropshadows to preserve editorial groundedness.
    */

    :root {
      --color-ink: #202128;
      --color-surface: #FFFFFF;
      --color-mist: #DFF1F3;
      --color-mist-subtle: #F4FAFA;
      --color-slate: #525E6E;
      --color-slate-light: #64707F;
      --color-blue-accent: #476ADB;
      --color-blue-text: #2B52CD;
      --color-green: #0E7550;
      --color-green-bg: #E8F7F0;
      --color-amber: #B45309;
      --color-amber-bg: #FEF3C7;
      --color-border: #DFF1F3;
      --color-border-subtle: rgba(32, 33, 40, 0.08);

      --font-display: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      --font-body: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

      --radius-card: 16px;
      --radius-button: 10px;
      --radius-pill: 9999px;
    }

    /* Reset & Base */
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: var(--font-body);
      color: var(--color-ink);
      background-color: var(--color-surface);
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      overflow-x: hidden;
    }

    /* Focus styling for full keyboard accessibility (R-32) */
    a:focus-visible, button:focus-visible, input:focus-visible, select:focus-visible {
      outline: 2px solid var(--color-blue-accent);
      outline-offset: 3px;
    }

    /* Container constraints */
    .container-custom {
      width: 100%;
      max-width: 1240px;
      margin-left: auto;
      margin-right: auto;
      padding-left: 24px;
      padding-right: 24px;
    }

    @media (min-width: 768px) {
      .container-custom {
        padding-left: 40px;
        padding-right: 40px;
      }
    }

    /* Typography Utilities */
    .font-display {
      font-family: var(--font-display);
      letter-spacing: -0.025em;
    }

    /* Button styles */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      font-family: var(--font-body);
      font-weight: 600;
      font-size: 15px;
      padding: 12px 22px;
      border-radius: var(--radius-button);
      text-decoration: none;
      transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
      cursor: pointer;
      border: 1px solid transparent;
      min-height: 44px;
      line-height: 1;
    }

    .btn-dark {
      background-color: var(--color-ink);
      color: var(--color-surface);
      border-color: var(--color-ink);
    }
    .btn-dark:hover {
      background-color: #32343E;
      border-color: #32343E;
    }

    .btn-light {
      background-color: var(--color-surface);
      color: var(--color-ink);
      border-color: var(--color-border);
    }
    .btn-light:hover {
      background-color: var(--color-mist-subtle);
      border-color: #BDDFE3;
    }

    .btn-ghost {
      background-color: transparent;
      color: var(--color-ink);
      border-color: transparent;
    }
    .btn-ghost:hover {
      background-color: var(--color-mist-subtle);
    }

    .btn-blue {
      background-color: var(--color-blue-accent);
      color: var(--color-surface);
    }
    .btn-blue:hover {
      background-color: #3958BC;
    }

    /* Header & Navigation */
    .site-header {
      position: sticky;
      top: 0;
      z-index: 50;
      background-color: rgba(255, 255, 255, 0.95);
      border-bottom: 1px solid var(--color-border);
      backdrop-filter: blur(8px);
    }

    .header-inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 76px;
    }

    .brand-link {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;
      color: var(--color-ink);
    }

    .brand-mark {
      width: 34px;
      height: 34px;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--color-mist);
      border-radius: 8px;
    }

    .brand-text {
      font-family: var(--font-display);
      font-weight: 700;
      font-size: 21px;
      letter-spacing: -0.02em;
    }

    .nav-links-desktop {
      display: none;
      align-items: center;
      gap: 32px;
      list-style: none;
    }

    @media (min-width: 992px) {
      .nav-links-desktop {
        display: flex;
      }
    }

    .nav-link {
      text-decoration: none;
      color: var(--color-slate);
      font-size: 15px;
      font-weight: 500;
      transition: color 0.15s ease;
      padding: 8px 0;
    }
    .nav-link:hover {
      color: var(--color-ink);
    }

    .header-actions {
      display: none;
      align-items: center;
      gap: 12px;
    }

    @media (min-width: 992px) {
      .header-actions {
        display: flex;
      }
    }

    .mobile-menu-toggle {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      background: none;
      border: 1px solid var(--color-border);
      border-radius: 8px;
      color: var(--color-ink);
      cursor: pointer;
    }

    @media (min-width: 992px) {
      .mobile-menu-toggle {
        display: none;
      }
    }

    /* Mobile Navigation Drawer */
    .mobile-drawer {
      display: none;
      position: fixed;
      top: 76px;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #FFFFFF;
      z-index: 45;
      padding: 32px 24px;
      border-top: 1px solid var(--color-border);
      flex-direction: column;
      justify-content: space-between;
      overflow-y: auto;
    }

    .mobile-drawer.is-open {
      display: flex;
    }

    .mobile-nav-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .mobile-nav-item a {
      display: block;
      font-size: 19px;
      font-weight: 600;
      color: var(--color-ink);
      text-decoration: none;
      padding: 12px 0;
      border-bottom: 1px solid var(--color-border-subtle);
    }

    /* Hero Section */
    .hero-section {
      background: radial-gradient(circle at 50% 0%, #E8F6F8 0%, #FFFFFF 70%);
      padding-top: 60px;
      padding-bottom: 72px;
      border-bottom: 1px solid var(--color-border);
    }

    @media (min-width: 992px) {
      .hero-section {
        padding-top: 92px;
        padding-bottom: 96px;
      }
    }

    .hero-eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      background-color: #FFFFFF;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-pill);
      font-size: 13px;
      font-weight: 600;
      color: var(--color-blue-text);
      margin-bottom: 24px;
    }

    .hero-title {
      font-size: clamp(34px, 5.5vw, 68px);
      line-height: 1.08;
      font-weight: 700;
      color: var(--color-ink);
      max-width: 920px;
      margin-left: auto;
      margin-right: auto;
      text-align: center;
      margin-bottom: 24px;
    }

    .hero-subtitle {
      font-size: clamp(17px, 2vw, 20px);
      line-height: 1.55;
      color: var(--color-slate);
      max-width: 740px;
      margin-left: auto;
      margin-right: auto;
      text-align: center;
      margin-bottom: 36px;
    }

    .hero-cta-group {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: center;
      gap: 14px;
      margin-bottom: 20px;
    }

    .hero-trust-note {
      font-size: 14px;
      color: var(--color-slate);
      text-align: center;
      margin-bottom: 56px;
    }

    /* Hero Interactive Product Mockup Cockpit */
    .cockpit-canvas {
      background-color: #FFFFFF;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-card);
      box-shadow: 0 10px 30px rgba(32, 33, 40, 0.04);
      padding: 24px;
      max-width: 1040px;
      margin-left: auto;
      margin-right: auto;
    }

    @media (min-width: 768px) {
      .cockpit-canvas {
        padding: 32px;
      }
    }

    .cockpit-header {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding-bottom: 24px;
      border-bottom: 1px solid var(--color-border);
      margin-bottom: 24px;
    }

    @media (min-width: 768px) {
      .cockpit-header {
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
      }
    }

    .cockpit-metric-title {
      font-size: 14px;
      font-weight: 500;
      color: var(--color-slate);
      margin-bottom: 4px;
    }

    .cockpit-metric-value {
      font-size: 32px;
      font-weight: 700;
      color: var(--color-ink);
      font-family: var(--font-display);
    }

    .cockpit-cycle-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      background-color: var(--color-mist);
      border-radius: var(--radius-pill);
      font-size: 13px;
      font-weight: 600;
      color: var(--color-ink);
    }

    .cockpit-ai-alert {
      background-color: #F8FBFB;
      border: 1px solid var(--color-border);
      border-radius: 12px;
      padding: 18px 20px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      margin-bottom: 28px;
    }

    @media (min-width: 768px) {
      .cockpit-ai-alert {
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
      }
    }

    .cockpit-ai-message {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }

    .cockpit-ai-tag {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      background-color: var(--color-ink);
      color: #FFFFFF;
      padding: 3px 7px;
      border-radius: 4px;
      white-space: nowrap;
      margin-top: 2px;
    }

    .cockpit-ai-text {
      font-size: 14px;
      color: var(--color-ink);
      line-height: 1.5;
    }

    .cockpit-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 20px;
    }

    @media (min-width: 840px) {
      .cockpit-grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    .gauge-card {
      background-color: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: 12px;
      padding: 18px;
    }

    .gauge-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }

    .gauge-name {
      font-size: 14px;
      font-weight: 600;
      color: var(--color-ink);
    }

    .gauge-spent {
      font-size: 14px;
      font-weight: 600;
      color: var(--color-slate);
    }

    .gauge-track {
      width: 100%;
      height: 8px;
      background-color: #EDF3F3;
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 8px;
    }

    .gauge-fill {
      height: 100%;
      border-radius: 4px;
      transition: width 0.4s ease;
    }

    .gauge-fill-green {
      background-color: #199268;
    }

    .gauge-fill-blue {
      background-color: var(--color-blue-accent);
    }

    .gauge-fill-amber {
      background-color: #DD8331;
    }

    .gauge-meta {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: var(--color-slate);
    }

    /* Trust & Recognition Section */
    .trust-section {
      padding-top: 64px;
      padding-bottom: 64px;
      background-color: #FFFFFF;
      border-bottom: 1px solid var(--color-border);
    }

    .trust-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 20px;
    }

    @media (min-width: 640px) {
      .trust-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (min-width: 1024px) {
      .trust-grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    .trust-card {
      border: 1px solid var(--color-border);
      border-radius: var(--radius-card);
      padding: 24px;
      background-color: var(--color-surface);
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .trust-badge-label {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--color-blue-text);
    }

    .trust-card-title {
      font-size: 18px;
      font-weight: 700;
      color: var(--color-ink);
      line-height: 1.35;
    }

    .trust-card-desc {
      font-size: 14px;
      color: var(--color-slate);
      line-height: 1.55;
    }

    /* Section Headers */
    .section-header-wrap {
      text-align: center;
      max-width: 760px;
      margin-left: auto;
      margin-right: auto;
      margin-bottom: 48px;
    }

    .section-tag {
      display: inline-block;
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-blue-text);
      margin-bottom: 12px;
    }

    .section-title {
      font-size: clamp(28px, 4vw, 44px);
      line-height: 1.15;
      font-weight: 700;
      color: var(--color-ink);
      margin-bottom: 16px;
    }

    .section-lead {
      font-size: 17px;
      color: var(--color-slate);
      line-height: 1.6;
    }

    /* 8-Module Feature Overview */
    .features-section {
      padding-top: 88px;
      padding-bottom: 96px;
      background-color: var(--color-mist-subtle);
      border-bottom: 1px solid var(--color-border);
    }

    .tabs-wrapper {
      margin-top: 40px;
    }

    .tabs-bar {
      display: flex;
      overflow-x: auto;
      gap: 8px;
      padding-bottom: 16px;
      margin-bottom: 32px;
      scrollbar-width: thin;
      -webkit-overflow-scrolling: touch;
    }

    .tab-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      background-color: #FFFFFF;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-pill);
      font-family: var(--font-body);
      font-size: 15px;
      font-weight: 600;
      color: var(--color-slate);
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.15s ease;
    }

    .tab-btn:hover {
      color: var(--color-ink);
      border-color: #B5D7DC;
    }

    .tab-btn.is-active {
      background-color: var(--color-ink);
      color: #FFFFFF;
      border-color: var(--color-ink);
    }

    .tab-panel {
      display: none;
      background-color: #FFFFFF;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-card);
      padding: 28px;
      box-shadow: 0 10px 30px rgba(32, 33, 40, 0.03);
    }

    @media (min-width: 992px) {
      .tab-panel {
        padding: 44px;
      }
    }

    .tab-panel.is-active {
      display: block;
    }

    .panel-split {
      display: grid;
      grid-template-columns: 1fr;
      gap: 36px;
      align-items: center;
    }

    @media (min-width: 992px) {
      .panel-split {
        grid-template-columns: 1.1fr 0.9fr;
      }
    }

    .panel-content h3 {
      font-size: 28px;
      font-weight: 700;
      color: var(--color-ink);
      margin-bottom: 14px;
      line-height: 1.25;
    }

    .panel-content p {
      font-size: 16px;
      color: var(--color-slate);
      line-height: 1.6;
      margin-bottom: 24px;
    }

    .panel-checklist {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 28px;
    }

    .panel-check-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      font-size: 15px;
      color: var(--color-ink);
      font-weight: 500;
    }

    .panel-check-icon {
      flex-shrink: 0;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background-color: var(--color-green-bg);
      color: var(--color-green);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-top: 2px;
    }

    .panel-interactive-box {
      background-color: #F8FBFB;
      border: 1px solid var(--color-border);
      border-radius: 12px;
      padding: 24px;
    }

    /* AI Architecture Section */
    .ai-section {
      padding-top: 88px;
      padding-bottom: 88px;
      background-color: #FFFFFF;
      border-bottom: 1px solid var(--color-border);
    }

    .ai-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 24px;
    }

    @media (min-width: 992px) {
      .ai-grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    .ai-card {
      border: 1px solid var(--color-border);
      border-radius: var(--radius-card);
      padding: 32px 28px;
      background-color: #FFFFFF;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .ai-step-num {
      font-family: var(--font-display);
      font-size: 14px;
      font-weight: 700;
      color: var(--color-blue-text);
      background-color: var(--color-mist);
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .ai-card-title {
      font-size: 20px;
      font-weight: 700;
      color: var(--color-ink);
      line-height: 1.3;
    }

    .ai-card-desc {
      font-size: 15px;
      color: var(--color-slate);
      line-height: 1.6;
    }

    /* Simulator & FAQ Section */
    .simulator-section {
      padding-top: 88px;
      padding-bottom: 96px;
      background-color: var(--color-mist-subtle);
      border-bottom: 1px solid var(--color-border);
    }

    .simulator-card {
      background-color: #FFFFFF;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-card);
      padding: 32px;
      max-width: 980px;
      margin-left: auto;
      margin-right: auto;
      margin-bottom: 80px;
    }

    @media (min-width: 768px) {
      .simulator-card {
        padding: 44px;
      }
    }

    .sim-controls {
      display: grid;
      grid-template-columns: 1fr;
      gap: 28px;
      margin-bottom: 36px;
    }

    @media (min-width: 768px) {
      .sim-controls {
        grid-template-columns: 1.4fr 1fr;
      }
    }

    .sim-slider-wrap label {
      display: block;
      font-size: 14px;
      font-weight: 600;
      color: var(--color-ink);
      margin-bottom: 8px;
    }

    .sim-slider-val {
      font-size: 32px;
      font-weight: 700;
      font-family: var(--font-display);
      color: var(--color-ink);
      margin-bottom: 12px;
    }

    .sim-range-input {
      width: 100%;
      height: 8px;
      border-radius: 4px;
      background: #DFF1F3;
      outline: none;
      -webkit-appearance: none;
      cursor: pointer;
    }

    .sim-range-input::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: var(--color-ink);
      cursor: pointer;
      border: 2px solid #FFFFFF;
      box-shadow: 0 2px 6px rgba(0,0,0,0.15);
    }

    .sim-results-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }

    @media (min-width: 768px) {
      .sim-results-grid {
        grid-template-columns: repeat(4, 1fr);
      }
    }

    .sim-res-box {
      background-color: #F8FBFB;
      border: 1px solid var(--color-border);
      border-radius: 12px;
      padding: 16px;
    }

    .sim-res-label {
      font-size: 12px;
      font-weight: 600;
      color: var(--color-slate);
      margin-bottom: 4px;
    }

    .sim-res-value {
      font-size: 22px;
      font-weight: 700;
      font-family: var(--font-display);
      color: var(--color-ink);
    }

    /* FAQ Accordion */
    .faq-wrapper {
      max-width: 820px;
      margin-left: auto;
      margin-right: auto;
    }

    .faq-item {
      background-color: #FFFFFF;
      border: 1px solid var(--color-border);
      border-radius: 12px;
      margin-bottom: 14px;
      overflow: hidden;
    }

    .faq-trigger {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 22px 24px;
      background: none;
      border: none;
      text-align: left;
      font-family: var(--font-body);
      font-size: 17px;
      font-weight: 600;
      color: var(--color-ink);
      cursor: pointer;
      gap: 16px;
    }

    .faq-trigger:hover {
      background-color: #FAFDFD;
    }

    .faq-chevron {
      flex-shrink: 0;
      transition: transform 0.2s ease;
      color: var(--color-slate);
    }

    .faq-item.is-open .faq-chevron {
      transform: rotate(180deg);
    }

    .faq-content {
      display: none;
      padding: 0 24px 22px 24px;
      font-size: 15px;
      color: var(--color-slate);
      line-height: 1.65;
    }

    .faq-item.is-open .faq-content {
      display: block;
    }

    /* Closing Conversion Banner */
    .cta-banner-section {
      padding-top: 80px;
      padding-bottom: 80px;
      background-color: var(--color-ink);
      color: #FFFFFF;
    }

    .cta-banner-box {
      display: grid;
      grid-template-columns: 1fr;
      gap: 40px;
      align-items: center;
    }

    @media (min-width: 992px) {
      .cta-banner-box {
        grid-template-columns: 1.4fr 1fr;
      }
    }

    .cta-banner-title {
      font-size: clamp(32px, 4vw, 52px);
      line-height: 1.12;
      font-weight: 700;
      margin-bottom: 20px;
      color: #FFFFFF;
    }

    .cta-banner-desc {
      font-size: 18px;
      color: #A3AFBF;
      line-height: 1.6;
      margin-bottom: 32px;
      max-width: 580px;
    }

    .qr-card {
      background-color: #FFFFFF;
      border-radius: 16px;
      padding: 24px;
      color: var(--color-ink);
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 16px;
      max-width: 340px;
      margin-left: auto;
      margin-right: auto;
    }

    /* Footer */
    .site-footer {
      background-color: #17181E;
      color: #8D99A9;
      padding-top: 64px;
      padding-bottom: 48px;
      font-size: 14px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
    }

    .footer-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 40px;
      margin-bottom: 48px;
    }

    @media (min-width: 768px) {
      .footer-grid {
        grid-template-columns: 2fr 1fr 1fr 1fr;
      }
    }

    .footer-col h4 {
      color: #FFFFFF;
      font-size: 15px;
      font-weight: 600;
      margin-bottom: 18px;
    }

    .footer-col ul {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .footer-col a {
      color: #8D99A9;
      text-decoration: none;
      transition: color 0.15s ease;
    }

    .footer-col a:hover {
      color: #FFFFFF;
    }

    .footer-bottom {
      padding-top: 32px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      flex-direction: column;
      gap: 16px;
      font-size: 13px;
    }

    @media (min-width: 768px) {
      .footer-bottom {
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
      }
    }

    /* Modals & Dialogs (R-26, R-32) */
    .modal-backdrop {
      display: none;
      position: fixed;
      inset: 0;
      background-color: rgba(32, 33, 40, 0.6);
      z-index: 100;
      align-items: center;
      justify-content: center;
      padding: 20px;
      backdrop-filter: blur(4px);
    }

    .modal-backdrop.is-open {
      display: flex;
    }

    .modal-card {
      background-color: #FFFFFF;
      border-radius: var(--radius-card);
      max-width: 480px;
      width: 100%;
      padding: 32px;
      position: relative;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
    }

    .modal-close-btn {
      position: absolute;
      top: 20px;
      right: 20px;
      background: none;
      border: none;
      color: var(--color-slate);
      cursor: pointer;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
    }

    .modal-close-btn:hover {
      background-color: var(--color-mist-subtle);
      color: var(--color-ink);
    }

    /* Toast Notification Feedback */
    .toast-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 120;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    }

    .toast-msg {
      background-color: var(--color-ink);
      color: #FFFFFF;
      padding: 14px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 8px 20px rgba(0,0,0,0.15);
      display: flex;
      align-items: center;
      gap: 10px;
      opacity: 0;
      transform: translateY(10px);
      transition: opacity 0.2s ease, transform 0.2s ease;
      pointer-events: auto;
    }

    .toast-msg.show {
      opacity: 1;
      transform: translateY(0);
    }
  </style>
  @viteReactRefresh
  @vite(['resources/css/app.css', 'resources/js/app.jsx'])
</head>
<body>
<div id="react-root" data-react-component="GrassfeldPage">

  <!-- 1. Header & Navigation -->
  <header class="site-header" role="banner">
    <div class="container-custom">
      <div class="header-inner">
        <!-- Logo -->
        <a href="#overview" class="brand-link" aria-label="Grassfeld Home">
          <div class="brand-mark" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#202128" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z"/>
              <path d="M12 9v6"/>
              <path d="M9 12h6"/>
            </svg>
          </div>
          <span class="brand-text">Grassfeld</span>
        </a>

        <!-- Desktop Navigation Links (R-24: every link points to a real section) -->
        <nav role="navigation" aria-label="Main Navigation">
          <ul class="nav-links-desktop">
            <li><a href="#overview" class="nav-link">Overview</a></li>
            <li><a href="#features" class="nav-link">Features</a></li>
            <li><a href="#intelligence" class="nav-link">AI Pacing</a></li>
            <li><a href="#security" class="nav-link">Security & Privacy</a></li>
            <li><a href="#faq" class="nav-link">FAQ</a></li>
          </ul>
        </nav>

        <!-- Header CTAs -->
        <div class="header-actions">
          <button type="button" class="btn btn-ghost" id="open-download-header-btn">
            Download App
          </button>
          <button type="button" class="btn btn-dark" id="open-onboarding-header-btn">
            Get Started
          </button>
        </div>

        <!-- Mobile Menu Hamburger Button -->
        <button type="button" class="mobile-menu-toggle" id="mobile-menu-btn" aria-expanded="false" aria-controls="mobile-nav" aria-label="Toggle navigation menu">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" id="hamburger-icon">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>
  </header>

  <!-- Mobile Drawer Menu (R-03) -->
  <div class="mobile-drawer" id="mobile-nav" aria-hidden="true">
    <ul class="mobile-nav-list">
      <li class="mobile-nav-item"><a href="#overview" class="mobile-nav-link">Overview</a></li>
      <li class="mobile-nav-item"><a href="#features" class="mobile-nav-link">Features</a></li>
      <li class="mobile-nav-item"><a href="#intelligence" class="mobile-nav-link">AI Pacing</a></li>
      <li class="mobile-nav-item"><a href="#security" class="mobile-nav-link">Security & Privacy</a></li>
      <li class="mobile-nav-item"><a href="#faq" class="mobile-nav-link">FAQ</a></li>
    </ul>

    <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 24px;">
      <button type="button" class="btn btn-light" id="open-download-mobile-btn" style="width: 100%;">
        Download App
      </button>
      <button type="button" class="btn btn-dark" id="open-onboarding-mobile-btn" style="width: 100%;">
        Start Free Plan
      </button>
    </div>
  </div>

  <main id="main-content">
    <!-- 2. Hero Section with Financial Cockpit Mockup -->
    <section id="overview" class="hero-section">
      <div class="container-custom">
        <div style="text-align: center;">
          <div class="hero-eyebrow">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span>Next-Day Budget Velocity Analysis</span>
          </div>

          <h1 class="hero-title font-display">
            Keep your finances on track with effortless peace of mind.
          </h1>

          <p class="hero-subtitle">
            Grassfeld pairs intelligent spending analysis with proactive budget pacing. No tedious spreadsheets, no restrictive guesswork: just clear financial clarity every single day.
          </p>

          <div class="hero-cta-group">
            <button type="button" class="btn btn-dark" id="hero-onboarding-btn">
              Start Your Free Plan
            </button>
            <button type="button" class="btn btn-light" id="hero-appstore-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.38c.62-.75 1.04-1.8 0.92-2.85-.9.04-1.99.6-2.64 1.35-.58.65-1.09 1.73-.95 2.76 1.01.08 2.05-.51 2.67-1.26z"/>
              </svg>
              <span>App Store</span>
            </button>
            <button type="button" class="btn btn-light" id="hero-googleplay-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3.609 1.814L13.793 12 3.61 22.186a2.213 2.213 0 0 1-.22-.962V2.776c0-.36.082-.693.219-.962zm11.243 11.244l2.585 2.585-11.75 6.784 9.165-9.369zm2.586-2.586l-2.586 2.586-9.165-9.369 11.75 6.783zm.797.797l3.83 2.212c1.073.619 1.073 1.633 0 2.253l-3.83 2.212-2.316-2.339 2.316-2.338z"/>
              </svg>
              <span>Google Play</span>
            </button>
          </div>

          <p class="hero-trust-note">
            No credit card required. Connects securely in 60 seconds.
          </p>
        </div>

        <!-- Cockpit Mockup -->
        <div class="cockpit-canvas">
          <div class="cockpit-header">
            <div>
              <div class="cockpit-metric-title">Monthly Safe-to-Spend Balance</div>
              <div class="cockpit-metric-value" id="safe-spend-amount">$2,840.00</div>
            </div>
            <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
              <span class="cockpit-cycle-pill">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                14 Days Left in Pay Cycle
              </span>
              <span class="cockpit-cycle-pill" style="background-color: var(--color-green-bg); color: var(--color-green);">
                96/100 · Optimal Stability
              </span>
            </div>
          </div>

          <!-- Live Dynamic AI Alert Box -->
          <div class="cockpit-ai-alert" id="cockpit-alert-box">
            <div class="cockpit-ai-message">
              <span class="cockpit-ai-tag">AI Smart Pacing</span>
              <p class="cockpit-ai-text" id="ai-alert-text">
                Dining spending is $85 below your monthly trajectory. Moving $100 into your High-Yield Emergency Fund maintains 100% budget health.
              </p>
            </div>
            <button type="button" class="btn btn-dark" id="apply-ai-suggestion-btn" style="padding: 8px 16px; font-size: 13px; white-space: nowrap;">
              Apply Suggestion
            </button>
          </div>

          <!-- Live Gauges Grid -->
          <div class="cockpit-grid">
            <div class="gauge-card">
              <div class="gauge-top">
                <span class="gauge-name">Housing & Utilities</span>
                <span class="gauge-spent">$1,650 / $1,650</span>
              </div>
              <div class="gauge-track">
                <div class="gauge-fill gauge-fill-blue" style="width: 100%;"></div>
              </div>
              <div class="gauge-meta">
                <span>Fixed Monthly</span>
                <span>100% Allocated</span>
              </div>
            </div>

            <div class="gauge-card">
              <div class="gauge-top">
                <span class="gauge-name">Groceries & Household</span>
                <span class="gauge-spent" id="gauge-groceries-spent">$580 / $900</span>
              </div>
              <div class="gauge-track">
                <div class="gauge-fill gauge-fill-green" id="gauge-groceries-bar" style="width: 64%;"></div>
              </div>
              <div class="gauge-meta">
                <span>64% Consumed</span>
                <span style="color: var(--color-green); font-weight: 600;">$320 Left</span>
              </div>
            </div>

            <div class="gauge-card">
              <div class="gauge-top">
                <span class="gauge-name">Discretionary & Leisure</span>
                <span class="gauge-spent" id="gauge-leisure-spent">$450 / $800</span>
              </div>
              <div class="gauge-track">
                <div class="gauge-fill gauge-fill-amber" id="gauge-leisure-bar" style="width: 56%;"></div>
              </div>
              <div class="gauge-meta">
                <span>56% Consumed</span>
                <span style="color: var(--color-amber); font-weight: 600;">$350 Left</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 3. Trust & Recognition Section -->
    <section class="trust-section" aria-label="Trust and Recognition Accolades">
      <div class="container-custom">
        <div class="trust-grid">
          <div class="trust-card">
            <span class="trust-badge-label">Design & Wellness Award</span>
            <h2 class="trust-card-title">Best Financial Wellness Experience 2025</h2>
            <p class="trust-card-desc">
              Recognized by the Fintech Design Annual for calm, non-punitive budget architecture that reduces user money anxiety.
            </p>
          </div>

          <div class="trust-card">
            <span class="trust-badge-label">App Store Spotlight</span>
            <h2 class="trust-card-title">Apple App Store Editorial Feature</h2>
            <p class="trust-card-desc">
              Featured as the essential budgeting companion for mindful spenders seeking clarity without spreadsheet upkeep.
            </p>
          </div>

          <div class="trust-card">
            <span class="trust-badge-label">Community Reputation</span>
            <h2 class="trust-card-title">4.9 / 5 Rating Across 8,400+ Reviews</h2>
            <p class="trust-card-desc">
              Maintained verified top-tier customer satisfaction across both iOS App Store and Google Play ecosystems.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- 4. 8-Module Interactive Tabbed Product Overview -->
    <section id="features" class="features-section">
      <div class="container-custom">
        <div class="section-header-wrap">
          <span class="section-tag">Complete Financial Architecture</span>
          <h2 class="section-title font-display">Eight integrated tools. One quiet dashboard.</h2>
          <p class="section-lead">
            Grassfeld unites budgeting, savings, debt elimination, and documentation into a single calm workspace built for daily life.
          </p>
        </div>

        <div class="tabs-wrapper">
          <!-- Accessible ARIA Tab List (R-32) -->
          <div class="tabs-bar" role="tablist" aria-label="Feature modules">
            <button type="button" role="tab" class="tab-btn is-active" id="tab-btn-1" aria-selected="true" aria-controls="panel-1">
              Budgets
            </button>
            <button type="button" role="tab" class="tab-btn" id="tab-btn-2" aria-selected="false" aria-controls="panel-2">
              Savings Goals
            </button>
            <button type="button" role="tab" class="tab-btn" id="tab-btn-3" aria-selected="false" aria-controls="panel-3">
              Analytics
            </button>
            <button type="button" role="tab" class="tab-btn" id="tab-btn-4" aria-selected="false" aria-controls="panel-4">
              Accounts & Sync
            </button>
            <button type="button" role="tab" class="tab-btn" id="tab-btn-5" aria-selected="false" aria-controls="panel-5">
              Reports
            </button>
            <button type="button" role="tab" class="tab-btn" id="tab-btn-6" aria-selected="false" aria-controls="panel-6">
              Loyalty Cards
            </button>
            <button type="button" role="tab" class="tab-btn" id="tab-btn-7" aria-selected="false" aria-controls="panel-7">
              Documents
            </button>
            <button type="button" role="tab" class="tab-btn" id="tab-btn-8" aria-selected="false" aria-controls="panel-8">
              Debts & Loans
            </button>
          </div>

          <!-- Panel 1: Budgets -->
          <div class="tab-panel is-active" id="panel-1" role="tabpanel" aria-labelledby="tab-btn-1">
            <div class="panel-split">
              <div class="panel-content">
                <h3>Adaptive Envelope Budgeting with Velocity Forecasts</h3>
                <p>
                  Set flexible spending limits that naturally adjust to variable income and paydays. Grassfeld predicts end-of-month balances so you never face surprise deficits.
                </p>
                <ul class="panel-checklist">
                  <li class="panel-check-item">
                    <div class="panel-check-icon">&#10003;</div>
                    <span>Predictive day-by-day velocity tracking</span>
                  </li>
                  <li class="panel-check-item">
                    <div class="panel-check-icon">&#10003;</div>
                    <span>Automatic category rollover or savings sweep</span>
                  </li>
                  <li class="panel-check-item">
                    <div class="panel-check-icon">&#10003;</div>
                    <span>Zero penalty envelope transfers</span>
                  </li>
                </ul>
                <button type="button" class="btn btn-dark panel-open-onboarding">Explore Budget Controls</button>
              </div>
              <div class="panel-interactive-box">
                <div style="font-weight: 700; font-size: 15px; margin-bottom: 16px; color: var(--color-ink);">Live Velocity Demo</div>
                <div style="display: flex; flex-direction: column; gap: 14px;">
                  <div style="display: flex; justify-content: space-between; font-size: 14px;">
                    <span>Daily Safe Pace:</span>
                    <strong style="color: var(--color-ink);">$62.40 / day</strong>
                  </div>
                  <div style="display: flex; justify-content: space-between; font-size: 14px;">
                    <span>Current Spend Today:</span>
                    <strong style="color: var(--color-green);">$18.50 (Comfortable)</strong>
                  </div>
                  <div style="height: 6px; background: #DFF1F3; border-radius: 3px; overflow: hidden;">
                    <div style="width: 30%; height: 100%; background: #199268;"></div>
                  </div>
                  <div style="font-size: 13px; color: var(--color-slate); line-height: 1.4;">
                    Pacing buffer preserves $43.90 to absorb weekend dining out without touching savings reserves.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Panel 2: Savings Goals -->
          <div class="tab-panel" id="panel-2" role="tabpanel" aria-labelledby="tab-btn-2">
            <div class="panel-split">
              <div class="panel-content">
                <h3>Visual Milestone Trackers & Automatic Micro-Saves</h3>
                <p>
                  Lock away funds for long-term aspirations. Turn spare transaction round-ups into substantial emergency safety cushions with real-time completion forecasts.
                </p>
                <ul class="panel-checklist">
                  <li class="panel-check-item">
                    <div class="panel-check-icon">&#10003;</div>
                    <span>Dedicated goal vaults separated from daily cash</span>
                  </li>
                  <li class="panel-check-item">
                    <div class="panel-check-icon">&#10003;</div>
                    <span>Automated cent-by-cent transaction round-ups</span>
                  </li>
                  <li class="panel-check-item">
                    <div class="panel-check-icon">&#10003;</div>
                    <span>Projected completion calendar based on savings habits</span>
                  </li>
                </ul>
                <button type="button" class="btn btn-dark panel-open-onboarding">Set Your First Goal</button>
              </div>
              <div class="panel-interactive-box">
                <div style="font-weight: 700; font-size: 15px; margin-bottom: 14px;">High-Yield Emergency Vault</div>
                <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 6px;">
                  <span>$12,450 saved</span>
                  <span style="font-weight: 700;">$15,000 target</span>
                </div>
                <div style="height: 8px; background: #DFF1F3; border-radius: 4px; overflow: hidden; margin-bottom: 14px;">
                  <div style="width: 83%; height: 100%; background: var(--color-blue-accent);"></div>
                </div>
                <div style="font-size: 13px; color: var(--color-slate); line-height: 1.4;">
                  On track to reach complete 6-month buffer by November 2025 with $350 monthly auto-transfers.
                </div>
              </div>
            </div>
          </div>

          <!-- Panel 3: Analytics -->
          <div class="tab-panel" id="panel-3" role="tabpanel" aria-labelledby="tab-btn-3">
            <div class="panel-split">
              <div class="panel-content">
                <h3>Merchant Breakdown & Hidden Subscription Audits</h3>
                <p>
                  Examine where every dollar flows. Grassfeld continuously scans transaction histories to spot stealth price hikes, double billings, and forgotten digital subscriptions.
                </p>
                <ul class="panel-checklist">
                  <li class="panel-check-item">
                    <div class="panel-check-icon">&#10003;</div>
                    <span>Month-over-month category variance detection</span>
                  </li>
                  <li class="panel-check-item">
                    <div class="panel-check-icon">&#10003;</div>
                    <span>Recurring charge audit with renewal calendar alerts</span>
                  </li>
                  <li class="panel-check-item">
                    <div class="panel-check-icon">&#10003;</div>
                    <span>Merchant-level frequency and average basket analysis</span>
                  </li>
                </ul>
                <button type="button" class="btn btn-dark panel-open-onboarding">Audit Recurring Charges</button>
              </div>
              <div class="panel-interactive-box">
                <div style="font-weight: 700; font-size: 15px; margin-bottom: 12px;">Active Subscriptions Audit</div>
                <div style="display: flex; flex-direction: column; gap: 10px;">
                  <div style="display: flex; justify-content: space-between; align-items: center; font-size: 14px; padding-bottom: 8px; border-bottom: 1px solid var(--color-border);">
                    <span>Streaming Bundle</span>
                    <strong>$19.99 / mo</strong>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center; font-size: 14px; padding-bottom: 8px; border-bottom: 1px solid var(--color-border);">
                    <span>Gym Membership</span>
                    <strong>$45.00 / mo</strong>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center; font-size: 14px;">
                    <span>Cloud Storage (Unused 90d)</span>
                    <strong style="color: var(--color-amber);">$9.99 / mo</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Panel 4: Accounts & Transactions -->
          <div class="tab-panel" id="panel-4" role="tabpanel" aria-labelledby="tab-btn-4">
            <div class="panel-split">
              <div class="panel-content">
                <h3>Unified Multi-Bank Aggregation with Receipt Matching</h3>
                <p>
                  Sync checking accounts, credit cards, mortgages, and investment portfolios through read-only Open Banking connections across 11,000+ financial institutions.
                </p>
                <ul class="panel-checklist">
                  <li class="panel-check-item">
                    <div class="panel-check-icon">&#10003;</div>
                    <span>Instant automatic transaction categorization</span>
                  </li>
                  <li class="panel-check-item">
                    <div class="panel-check-icon">&#10003;</div>
                    <span>Split-transaction capability for complex store receipts</span>
                  </li>
                  <li class="panel-check-item">
                    <div class="panel-check-icon">&#10003;</div>
                    <span>Manual cash entry support for offline purchases</span>
                  </li>
                </ul>
                <button type="button" class="btn btn-dark panel-open-onboarding">Connect Securely</button>
              </div>
              <div class="panel-interactive-box">
                <div style="font-weight: 700; font-size: 15px; margin-bottom: 12px;">Connected Institutions</div>
                <div style="display: flex; flex-direction: column; gap: 10px;">
                  <div style="display: flex; justify-content: space-between; font-size: 14px;">
                    <span>Primary Checking (Chase)</span>
                    <span style="color: var(--color-green); font-weight: 600;">Synced 2m ago</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; font-size: 14px;">
                    <span>Everyday Rewards (Amex)</span>
                    <span style="color: var(--color-green); font-weight: 600;">Synced 15m ago</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; font-size: 14px;">
                    <span>Retirement IRA (Vanguard)</span>
                    <span style="color: var(--color-green); font-weight: 600;">Synced 1h ago</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Panel 5: Reports -->
          <div class="tab-panel" id="panel-5" role="tabpanel" aria-labelledby="tab-btn-5">
            <div class="panel-split">
              <div class="panel-content">
                <h3>Tax-Ready Expense Reports & Net Worth Trajectories</h3>
                <p>
                  Generate tidy PDF and CSV summaries for accountant review or self-filed tax returns. Track long-term net worth growth without complex accounting software.
                </p>
                <ul class="panel-checklist">
                  <li class="panel-check-item">
                    <div class="panel-check-icon">&#10003;</div>
                    <span>One-click Schedule C expense categorization</span>
                  </li>
                  <li class="panel-check-item">
                    <div class="panel-check-icon">&#10003;</div>
                    <span>Downloadable standardized CSV and PDF statements</span>
                  </li>
                  <li class="panel-check-item">
                    <div class="panel-check-icon">&#10003;</div>
                    <span>Customizable reporting periods and multi-year comparisons</span>
                  </li>
                </ul>
                <button type="button" class="btn btn-dark panel-open-onboarding">Preview Sample Report</button>
              </div>
              <div class="panel-interactive-box">
                <div style="font-weight: 700; font-size: 15px; margin-bottom: 12px;">Annual Tax Deduction Summary</div>
                <div style="display: flex; flex-direction: column; gap: 10px; font-size: 14px;">
                  <div style="display: flex; justify-content: space-between;">
                    <span>Charitable Contributions:</span>
                    <strong>$1,850.00</strong>
                  </div>
                  <div style="display: flex; justify-content: space-between;">
                    <span>Home Office Expenses:</span>
                    <strong>$2,420.00</strong>
                  </div>
                  <div style="display: flex; justify-content: space-between;">
                    <span>Medical & Health Out-of-Pocket:</span>
                    <strong>$980.00</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Panel 6: Loyalty Cards -->
          <div class="tab-panel" id="panel-6" role="tabpanel" aria-labelledby="tab-btn-6">
            <div class="panel-split">
              <div class="panel-content">
                <h3>Digital Barcode & QR Wallet for Store Rewards</h3>
                <p>
                  Store your retail club cards, airline mileage credentials, and grocery reward barcodes in one quick-access card deck. Never fumble for plastic tags at the checkout register.
                </p>
                <ul class="panel-checklist">
                  <li class="panel-check-item">
                    <div class="panel-check-icon">&#10003;</div>
                    <span>Instant optical barcode and QR scanner rendering</span>
                  </li>
                  <li class="panel-check-item">
                    <div class="panel-check-icon">&#10003;</div>
                    <span>Offline access for low-reception grocery stores</span>
                  </li>
                  <li class="panel-check-item">
                    <div class="panel-check-icon">&#10003;</div>
                    <span>Reward point balance estimation notes</span>
                  </li>
                </ul>
                <button type="button" class="btn btn-dark panel-open-onboarding">Add Your First Card</button>
              </div>
              <div class="panel-interactive-box">
                <div style="font-weight: 700; font-size: 15px; margin-bottom: 12px;">Stored Digital Wallet</div>
                <div style="display: flex; flex-direction: column; gap: 8px; font-size: 14px;">
                  <div style="padding: 10px 14px; background: #FFFFFF; border: 1px solid var(--color-border); border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
                    <span>Whole Foods Market Club</span>
                    <span style="font-family: monospace; font-size: 12px; background: #EEF7F8; padding: 2px 6px; border-radius: 4px;">#9281-4421</span>
                  </div>
                  <div style="padding: 10px 14px; background: #FFFFFF; border: 1px solid var(--color-border); border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
                    <span>Delta SkyMiles Rewards</span>
                    <span style="font-family: monospace; font-size: 12px; background: #EEF7F8; padding: 2px 6px; border-radius: 4px;">#DL-88219</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Panel 7: Documents -->
          <div class="tab-panel" id="panel-7" role="tabpanel" aria-labelledby="tab-btn-7">
            <div class="panel-split">
              <div class="panel-content">
                <h3>Encrypted Vault for Invoices, Receipts & Warranties</h3>
                <p>
                  Attach digital receipts, warranty certificates, and vehicle lease agreements directly to ledger transactions. Everything is encrypted with zero server-side exposure.
                </p>
                <ul class="panel-checklist">
                  <li class="panel-check-item">
                    <div class="panel-check-icon">&#10003;</div>
                    <span>Zero-knowledge client-side AES document encryption</span>
                  </li>
                  <li class="panel-check-item">
                    <div class="panel-check-icon">&#10003;</div>
                    <span>Direct ledger attachment to corresponding transactions</span>
                  </li>
                  <li class="panel-check-item">
                    <div class="panel-check-icon">&#10003;</div>
                    <span>Expiry date alerts for home appliance warranties</span>
                  </li>
                </ul>
                <button type="button" class="btn btn-dark panel-open-onboarding">Explore Vault</button>
              </div>
              <div class="panel-interactive-box">
                <div style="font-weight: 700; font-size: 15px; margin-bottom: 12px;">Recent Vault Uploads</div>
                <div style="display: flex; flex-direction: column; gap: 8px; font-size: 14px;">
                  <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--color-border);">
                    <span>MacBook Pro Purchase Receipt.pdf</span>
                    <span style="font-size: 12px; color: var(--color-slate);">2.1 MB</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0;">
                    <span>Water Heater 5-Year Warranty.pdf</span>
                    <span style="font-size: 12px; color: var(--color-slate);">1.4 MB</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Panel 8: Debts & Loans -->
          <div class="tab-panel" id="panel-8" role="tabpanel" aria-labelledby="tab-btn-8">
            <div class="panel-split">
              <div class="panel-content">
                <h3>Avalanche & Snowball Debt Payoff Acceleration</h3>
                <p>
                  Eliminate high-interest debt with scientific repayment strategies. Compare interest savings between Debt Snowball and Debt Avalanche approaches in real time.
                </p>
                <ul class="panel-checklist">
                  <li class="panel-check-item">
                    <div class="panel-check-icon">&#10003;</div>
                    <span>Side-by-side strategy payoff timeline comparisons</span>
                  </li>
                  <li class="panel-check-item">
                    <div class="panel-check-icon">&#10003;</div>
                    <span>Amortization breakdown showing principal vs interest ratios</span>
                  </li>
                  <li class="panel-check-item">
                    <div class="panel-check-icon">&#10003;</div>
                    <span>Custom extra-payment impact calculator</span>
                  </li>
                </ul>
                <button type="button" class="btn btn-dark panel-open-onboarding">Calculate Debt Payoff</button>
              </div>
              <div class="panel-interactive-box">
                <div style="font-weight: 700; font-size: 15px; margin-bottom: 12px;">Avalanche Payoff Forecast</div>
                <div style="display: flex; flex-direction: column; gap: 10px; font-size: 14px;">
                  <div style="display: flex; justify-content: space-between;">
                    <span>Remaining Principal:</span>
                    <strong>$14,200.00</strong>
                  </div>
                  <div style="display: flex; justify-content: space-between;">
                    <span>Projected Interest Saved:</span>
                    <strong style="color: var(--color-green);">$3,420.00</strong>
                  </div>
                  <div style="display: flex; justify-content: space-between;">
                    <span>Freedom Date:</span>
                    <strong>March 2027 (14 mos faster)</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 5. AI Architecture & Privacy Assurance Section -->
    <section id="intelligence" class="ai-section">
      <div class="container-custom">
        <div class="section-header-wrap">
          <span class="section-tag">Deterministic Intelligence</span>
          <h2 class="section-title font-display">Proactive guidance. Zero buzzwords.</h2>
          <p class="section-lead">
            Grassfeld uses deterministic cashflow models to protect your savings. Here is exactly how the intelligence operates behind the scenes.
          </p>
        </div>

        <div class="ai-grid">
          <div class="ai-card">
            <div class="ai-step-num">01</div>
            <h3 class="ai-card-title">Read-Only Data Access</h3>
            <p class="ai-card-desc">
              Grassfeld connects via regulated Open Banking OAuth protocols. The application holds strictly read-only permissions: it has zero capability to move money, initiate transfers, or change account credentials.
            </p>
          </div>

          <div class="ai-card">
            <div class="ai-step-num">02</div>
            <h3 class="ai-card-title">Velocity Pace Tracking</h3>
            <p class="ai-card-desc">
              Rather than alerting you after an overdraft occurs, our velocity algorithm monitors daily spending burn rates against your cycle calendar, highlighting risks while you still have budget room.
            </p>
          </div>

          <div class="ai-card">
            <div class="ai-step-num">03</div>
            <h3 class="ai-card-title">Autonomous Rebalancing</h3>
            <p class="ai-card-desc">
              When an unexpected dentist bill or car repair occurs, Grassfeld suggests painless temporary reductions across discretionary categories so your core savings targets remain protected.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- 6. Security, Compliance & Data Isolation -->
    <section id="security" class="trust-section">
      <div class="container-custom">
        <div class="section-header-wrap" style="margin-bottom: 40px;">
          <span class="section-tag">Security Architecture</span>
          <h2 class="section-title font-display">Your financial records belong to you alone.</h2>
          <p class="section-lead">
            We follow strict financial security standards to ensure complete data isolation and peace of mind.
          </p>
        </div>

        <div class="trust-grid">
          <div class="trust-card">
            <span class="trust-badge-label">Encryption Standard</span>
            <h3 class="trust-card-title">Bank-Grade 256-Bit AES Encryption</h3>
            <p class="trust-card-desc">
              All data in transit and at rest is secured with TLS 1.3 and military-grade 256-bit AES encryption with isolated cryptographic key rotations.
            </p>
          </div>

          <div class="trust-card">
            <span class="trust-badge-label">Regulatory Compliance</span>
            <h3 class="trust-card-title">EU GDPR & PSD2 Open Banking Standards</h3>
            <p class="trust-card-desc">
              Built in accordance with European PSD2 Open Banking guidelines and stringent GDPR data sovereignty rules for comprehensive privacy protection.
            </p>
          </div>

          <div class="trust-card">
            <span class="trust-badge-label">Zero Monetization</span>
            <h3 class="trust-card-title">Zero Ad Tracking & Zero Data Sales</h3>
            <p class="trust-card-desc">
              Grassfeld generates revenue solely from transparent subscription plans. We never monetize, sell, or license transaction data to lenders or third-party marketers.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- 7. Interactive Budget Pace Simulator & Real-World FAQ -->
    <section class="simulator-section">
      <div class="container-custom">
        <div class="section-header-wrap">
          <span class="section-tag">Interactive Pace Simulator</span>
          <h2 class="section-title font-display">Calculate your recommended allocation.</h2>
          <p class="section-lead">
            Move the slider to see how Grassfeld structures your monthly cashflow across essential needs, flexible lifestyle, and accelerated wealth buffers.
          </p>
        </div>

        <!-- Simulator Widget -->
        <div class="simulator-card">
          <div class="sim-controls">
            <div class="sim-slider-wrap">
              <label for="income-slider">Monthly Net Take-Home Income</label>
              <div class="sim-slider-val" id="income-display">$5,000 / month</div>
              <input type="range" id="income-slider" class="sim-range-input" min="2000" max="15000" step="100" value="5000" aria-label="Monthly Take-Home Income Slider">
            </div>

            <div>
              <label for="goal-select" style="display: block; font-size: 14px; font-weight: 600; color: var(--color-ink); margin-bottom: 8px;">Primary Financial Priority</label>
              <select id="goal-select" style="width: 100%; height: 44px; border: 1px solid var(--color-border); border-radius: var(--radius-button); padding: 0 14px; font-family: var(--font-body); font-size: 15px; color: var(--color-ink); background-color: #FFFFFF;">
                <option value="emergency">High-Yield Emergency Buffer</option>
                <option value="debt">Aggressive Debt Payoff</option>
                <option value="home">Home Down Payment</option>
                <option value="invest">Long-Term Investment Growth</option>
              </select>
              <div style="font-size: 13px; color: var(--color-slate); margin-top: 6px;">
                Grassfeld optimizes the 50/30/20 framework to accelerate this target.
              </div>
            </div>
          </div>

          <div class="sim-results-grid">
            <div class="sim-res-box">
              <div class="sim-res-label">Fixed Needs (50%)</div>
              <div class="sim-res-value" id="res-needs">$2,500</div>
              <div style="font-size: 12px; color: var(--color-slate); margin-top: 4px;">Housing, utilities, groceries</div>
            </div>

            <div class="sim-res-box">
              <div class="sim-res-label">Flexible Living (30%)</div>
              <div class="sim-res-value" id="res-wants">$1,500</div>
              <div style="font-size: 12px; color: var(--color-slate); margin-top: 4px;">Dining, hobbies, leisure</div>
            </div>

            <div class="sim-res-box">
              <div class="sim-res-label">Wealth Reserve (20%)</div>
              <div class="sim-res-value" style="color: var(--color-green);" id="res-savings">$1,000</div>
              <div style="font-size: 12px; color: var(--color-slate); margin-top: 4px;">Direct to priority goal</div>
            </div>

            <div class="sim-res-box">
              <div class="sim-res-label">12-Month Buffer</div>
              <div class="sim-res-value" style="color: var(--color-blue-text);" id="res-annual">$12,000</div>
              <div style="font-size: 12px; color: var(--color-slate); margin-top: 4px;">Projected 1-year cushion</div>
            </div>
          </div>
        </div>

        <!-- FAQ Section (R-28) -->
        <div id="faq">
          <div class="section-header-wrap">
            <span class="section-tag">Frequently Asked Questions</span>
            <h2 class="section-title font-display">Direct answers to common questions.</h2>
            <p class="section-lead">
              Everything you need to know about security, bank connectivity, and daily usage.
            </p>
          </div>

          <div class="faq-wrapper">
            <!-- FAQ 1 -->
            <div class="faq-item is-open">
              <button type="button" class="faq-trigger" aria-expanded="true" aria-controls="faq-ans-1">
                <span>Can Grassfeld move money or execute transfers from my bank accounts?</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="faq-chevron">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
              <div class="faq-content" id="faq-ans-1">
                No. Grassfeld connects exclusively through standardized read-only Open Banking APIs. We hold zero credential access and zero authority to execute payments, initiate wires, or move money between accounts.
              </div>
            </div>

            <!-- FAQ 2 -->
            <div class="faq-item">
              <button type="button" class="faq-trigger" aria-expanded="false" aria-controls="faq-ans-2">
                <span>How does the AI create personalized budget recommendations?</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="faq-chevron">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
              <div class="faq-content" id="faq-ans-2">
                Grassfeld examines your historical recurring cashflows over a 90-day window. It clusters transactions into fixed obligations and variable spending, then calculates your safe daily velocity to ensure you never overspend before payday.
              </div>
            </div>

            <!-- FAQ 3 -->
            <div class="faq-item">
              <button type="button" class="faq-trigger" aria-expanded="false" aria-controls="faq-ans-3">
                <span>Do you sell my spending history to credit card issuers or advertisers?</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="faq-chevron">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
              <div class="faq-content" id="faq-ans-3">
                Never. Our business model relies strictly on transparent consumer software subscriptions. We do not display sponsored financial offers, credit card affiliate links, or broker data access to third parties.
              </div>
            </div>

            <!-- FAQ 4 -->
            <div class="faq-item">
              <button type="button" class="faq-trigger" aria-expanded="false" aria-controls="faq-ans-4">
                <span>Can I track manual cash expenses or split mixed receipts?</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="faq-chevron">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
              <div class="faq-content" id="faq-ans-4">
                Yes. You can add manual cash transactions in seconds or split any synchronized bank receipt into multiple envelopes (for example, dividing a grocery store receipt between food and household items).
              </div>
            </div>

            <!-- FAQ 5 -->
            <div class="faq-item">
              <button type="button" class="faq-trigger" aria-expanded="false" aria-controls="faq-ans-5">
                <span>Which devices and operating systems are supported?</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="faq-chevron">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
              <div class="faq-content" id="faq-ans-5">
                Grassfeld is natively available on iOS (iPhone and iPad), Android devices via Google Play, and on any modern desktop browser through our web application interface.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 8. Final Conversion Banner -->
    <section id="download" class="cta-banner-section">
      <div class="container-custom">
        <div class="cta-banner-box">
          <div>
            <h2 class="cta-banner-title font-display">Bring financial peace of mind to your daily routine.</h2>
            <p class="cta-banner-desc">
              Join thousands of individuals who have replaced spreadsheets with Grassfeld. Connect your accounts securely and start your 30-day free plan today.
            </p>
            <div style="display: flex; gap: 14px; flex-wrap: wrap;">
              <button type="button" class="btn btn-blue" id="cta-onboarding-btn" style="color: #FFFFFF;">
                Start Your Free Plan
              </button>
              <button type="button" class="btn btn-light" id="cta-download-btn">
                Download Mobile App
              </button>
            </div>
          </div>

          <div class="qr-card">
            <div style="font-size: 15px; font-weight: 700; color: var(--color-ink);">
              Scan to Download on Mobile
            </div>
            <!-- Minimalist Accessible SVG QR Code representation -->
            <div style="width: 140px; height: 140px; background: #FAFDFD; border: 1px solid var(--color-border); border-radius: 8px; display: flex; align-items: center; justify-content: center;" aria-label="QR Code link to download mobile app">
              <svg width="110" height="110" viewBox="0 0 24 24" fill="none" stroke="#202128" stroke-width="1.8">
                <rect x="3" y="3" width="6" height="6" rx="1"/>
                <rect x="15" y="3" width="6" height="6" rx="1"/>
                <rect x="3" y="15" width="6" height="6" rx="1"/>
                <rect x="15" y="15" width="6" height="6" rx="1"/>
                <path d="M7 10v4"/>
                <path d="M10 7h4"/>
                <path d="M14 14h3"/>
                <path d="M10 17v-3"/>
              </svg>
            </div>
            <div style="font-size: 13px; color: var(--color-slate);">
              Compatible with iOS 16+ & Android 12+
            </div>
          </div>
        </div>
      </div>
    </section>
  </main>

  <!-- 9. Editorial Footer -->
  <footer class="site-footer" role="contentinfo">
    <div class="container-custom">
      <div class="footer-grid">
        <div>
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px;">
            <div class="brand-mark" style="background-color: rgba(255,255,255,0.1);" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z"/>
                <path d="M12 9v6"/>
                <path d="M9 12h6"/>
              </svg>
            </div>
            <span style="font-family: var(--font-display); font-size: 20px; font-weight: 700; color: #FFFFFF;">Grassfeld</span>
          </div>
          <p style="font-size: 14px; line-height: 1.6; max-width: 300px; color: #A3AFBF;">
            Calm, proactive financial management designed to replace anxiety with confidence and lasting clarity.
          </p>
        </div>

        <div class="footer-col">
          <h4>Product</h4>
          <ul>
            <li><a href="#overview">Overview</a></li>
            <li><a href="#features">Feature Modules</a></li>
            <li><a href="#intelligence">AI Velocity</a></li>
            <li><a href="#download">Mobile Apps</a></li>
          </ul>
        </div>

        <div class="footer-col">
          <h4>Security</h4>
          <ul>
            <li><a href="#security">Encryption Standards</a></li>
            <li><a href="#security">Open Banking Protocol</a></li>
            <li><a href="#security">Data Isolation Policy</a></li>
            <li><a href="#faq">Compliance FAQ</a></li>
          </ul>
        </div>

        <div class="footer-col">
          <h4>Legal & Company</h4>
          <ul>
            <li><a href="#faq" id="footer-terms-btn">Terms of Service</a></li>
            <li><a href="#faq" id="footer-privacy-btn">Privacy Policy</a></li>
            <li><a href="#faq" id="footer-contact-btn">Security Disclosure</a></li>
            <li><a href="#faq">Status & Uptime</a></li>
          </ul>
        </div>
      </div>

      <div class="footer-bottom">
        <div>
          &copy; <span id="current-year">2025</span> Grassfeld Technologies Inc. All rights reserved.
        </div>
        <div style="font-size: 12px; color: #6E7A8A; max-width: 580px;">
          Grassfeld is a financial budgeting application and does not provide fiduciary financial advice or investment management services. Bank connection is managed via authorized Open Banking providers.
        </div>
      </div>
    </div>
  </footer>

  <!-- Modal 1: Download App Dialog (R-26, R-32) -->
  <div class="modal-backdrop" id="download-modal" role="dialog" aria-modal="true" aria-labelledby="download-modal-title">
    <div class="modal-card">
      <button type="button" class="modal-close-btn" id="close-download-modal-btn" aria-label="Close download dialog">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>

      <h3 id="download-modal-title" style="font-family: var(--font-display); font-size: 22px; font-weight: 700; margin-bottom: 8px; color: var(--color-ink);">
        Download Grassfeld
      </h3>
      <p style="font-size: 15px; color: var(--color-slate); margin-bottom: 24px; line-height: 1.5;">
        Choose your platform to install Grassfeld on your device.
      </p>

      <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px;">
        <a href="https://apps.apple.com" target="_blank" rel="noopener noreferrer" class="btn btn-dark" style="width: 100%; justify-content: flex-start;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.38c.62-.75 1.04-1.8 0.92-2.85-.9.04-1.99.6-2.64 1.35-.58.65-1.09 1.73-.95 2.76 1.01.08 2.05-.51 2.67-1.26z"/>
          </svg>
          <span>Download for iOS (App Store)</span>
        </a>
        <a href="https://play.google.com" target="_blank" rel="noopener noreferrer" class="btn btn-light" style="width: 100%; justify-content: flex-start;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3.609 1.814L13.793 12 3.61 22.186a2.213 2.213 0 0 1-.22-.962V2.776c0-.36.082-.693.219-.962zm11.243 11.244l2.585 2.585-11.75 6.784 9.165-9.369zm2.586-2.586l-2.586 2.586-9.165-9.369 11.75 6.783zm.797.797l3.83 2.212c1.073.619 1.073 1.633 0 2.253l-3.83 2.212-2.316-2.339 2.316-2.338z"/>
          </svg>
          <span>Download for Android (Google Play)</span>
        </a>
      </div>

      <div style="text-align: center; font-size: 13px; color: var(--color-slate);">
        Includes 30-day complimentary full access on all platforms.
      </div>
    </div>
  </div>

  <!-- Modal 2: Start Free Plan Onboarding Dialog (R-26, R-27, R-32) -->
  <div class="modal-backdrop" id="onboarding-modal" role="dialog" aria-modal="true" aria-labelledby="onboarding-modal-title">
    <div class="modal-card">
      <button type="button" class="modal-close-btn" id="close-onboarding-modal-btn" aria-label="Close onboarding dialog">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>

      <div id="onboarding-form-state">
        <h3 id="onboarding-modal-title" style="font-family: var(--font-display); font-size: 22px; font-weight: 700; margin-bottom: 8px; color: var(--color-ink);">
          Start Your Free Plan
        </h3>
        <p style="font-size: 15px; color: var(--color-slate); margin-bottom: 20px; line-height: 1.5;">
          Enter your email address to receive your secure account activation invite.
        </p>

        <form id="onboarding-email-form" novalidate>
          <div style="margin-bottom: 16px;">
            <label for="onboarding-email" style="display: block; font-size: 14px; font-weight: 600; color: var(--color-ink); margin-bottom: 6px;">
              Work or Personal Email
            </label>
            <input type="email" id="onboarding-email" required placeholder="you@example.com" style="width: 100%; height: 44px; border: 1px solid var(--color-border); border-radius: var(--radius-button); padding: 0 14px; font-family: var(--font-body); font-size: 15px; color: var(--color-ink); background: #FFFFFF;">
            <!-- Accessible Error Message Container (R-27) -->
            <div id="email-error-msg" style="display: none; color: #D9381E; font-size: 13px; font-weight: 500; margin-top: 6px;">
              Please provide a valid email address (e.g. name@domain.com).
            </div>
          </div>

          <button type="submit" class="btn btn-dark" id="submit-onboarding-btn" style="width: 100%;">
            Send Activation Link
          </button>
        </form>

        <div style="margin-top: 18px; font-size: 13px; color: var(--color-slate); text-align: center;">
          No credit card required. Encrypted with 256-bit bank security.
        </div>
      </div>

      <!-- Success State (R-27) -->
      <div id="onboarding-success-state" style="display: none; text-align: center; padding: 12px 0;">
        <div style="width: 54px; height: 54px; border-radius: 50%; background-color: var(--color-green-bg); color: var(--color-green); display: inline-flex; align-items: center; justify-content: center; font-size: 26px; margin-bottom: 16px;">
          &#10003;
        </div>
        <h4 style="font-family: var(--font-display); font-size: 20px; font-weight: 700; color: var(--color-ink); margin-bottom: 8px;">
          Check Your Inbox
        </h4>
        <p style="font-size: 14px; color: var(--color-slate); line-height: 1.5; margin-bottom: 24px;" id="success-email-notice">
          We have dispatched your secure setup token to your email. Click the link inside to begin your free plan.
        </p>
        <button type="button" class="btn btn-light" id="finish-onboarding-btn" style="width: 100%;">
          Back to Dashboard
        </button>
      </div>
    </div>
  </div>

  <!-- Toast Feedbacks -->
  <div class="toast-container" id="toast-container" aria-live="polite"></div>

  <!-- JavaScript Interactivity -->
  <script>
    document.addEventListener('DOMContentLoaded', () => {
      // 1. Toast Notification Helper
      function showToast(message) {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = 'toast-msg';
        toast.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <span>${message}</span>
        `;
        container.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 20);
        setTimeout(() => {
          toast.classList.remove('show');
          setTimeout(() => toast.remove(), 250);
        }, 3800);
      }

      // 2. Mobile Menu Toggle
      const mobileBtn = document.getElementById('mobile-menu-btn');
      const mobileNav = document.getElementById('mobile-nav');
      const mobileLinks = document.querySelectorAll('.mobile-nav-link');

      if (mobileBtn && mobileNav) {
        mobileBtn.addEventListener('click', () => {
          const isOpen = mobileNav.classList.contains('is-open');
          if (isOpen) {
            mobileNav.classList.remove('is-open');
            mobileNav.setAttribute('aria-hidden', 'true');
            mobileBtn.setAttribute('aria-expanded', 'false');
          } else {
            mobileNav.classList.add('is-open');
            mobileNav.setAttribute('aria-hidden', 'false');
            mobileBtn.setAttribute('aria-expanded', 'true');
          }
        });

        mobileLinks.forEach(link => {
          link.addEventListener('click', () => {
            mobileNav.classList.remove('is-open');
            mobileNav.setAttribute('aria-hidden', 'true');
            mobileBtn.setAttribute('aria-expanded', 'false');
          });
        });
      }

      // 3. Hero Live AI Suggestion Update Interaction (C-2, R-26)
      const applyAiBtn = document.getElementById('apply-ai-suggestion-btn');
      const safeSpendAmount = document.getElementById('safe-spend-amount');
      const aiAlertText = document.getElementById('ai-alert-text');
      const cockpitAlertBox = document.getElementById('cockpit-alert-box');
      let aiApplied = false;

      if (applyAiBtn) {
        applyAiBtn.addEventListener('click', () => {
          if (!aiApplied) {
            safeSpendAmount.textContent = '$2,740.00';
            aiAlertText.innerHTML = '<strong>Applied!</strong> $100 transferred to High-Yield Emergency Fund. Monthly trajectory optimal.';
            applyAiBtn.textContent = 'Undo Transfer';
            applyAiBtn.classList.remove('btn-dark');
            applyAiBtn.classList.add('btn-light');
            cockpitAlertBox.style.borderColor = '#199268';
            showToast('Transferred $100 into Emergency Fund.');
            aiApplied = true;
          } else {
            safeSpendAmount.textContent = '$2,840.00';
            aiAlertText.textContent = 'Dining spending is $85 below your monthly trajectory. Moving $100 into your High-Yield Emergency Fund maintains 100% budget health.';
            applyAiBtn.textContent = 'Apply Suggestion';
            applyAiBtn.classList.remove('btn-light');
            applyAiBtn.classList.add('btn-dark');
            cockpitAlertBox.style.borderColor = 'var(--color-border)';
            showToast('Reversed transfer back to Safe-to-Spend balance.');
            aiApplied = false;
          }
        });
      }

      // 4. Accessible 8-Module Feature Tabs Navigation (R-32)
      const tabButtons = document.querySelectorAll('.tab-btn');
      const tabPanels = document.querySelectorAll('.tab-panel');

      function switchTab(index) {
        tabButtons.forEach((btn, i) => {
          const isActive = (i === index);
          btn.classList.toggle('is-active', isActive);
          btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });
        tabPanels.forEach((panel, i) => {
          panel.classList.toggle('is-active', i === index);
        });
      }

      tabButtons.forEach((btn, index) => {
        btn.addEventListener('click', () => switchTab(index));

        // Keyboard arrow navigation
        btn.addEventListener('keydown', (e) => {
          let newIndex = null;
          if (e.key === 'ArrowRight') {
            newIndex = (index + 1) % tabButtons.length;
          } else if (e.key === 'ArrowLeft') {
            newIndex = (index - 1 + tabButtons.length) % tabButtons.length;
          } else if (e.key === 'Home') {
            newIndex = 0;
          } else if (e.key === 'End') {
            newIndex = tabButtons.length - 1;
          }
          if (newIndex !== null) {
            e.preventDefault();
            tabButtons[newIndex].focus();
            switchTab(newIndex);
          }
        });
      });

      // 5. Interactive Budget Pace Simulator
      const incomeSlider = document.getElementById('income-slider');
      const incomeDisplay = document.getElementById('income-display');
      const resNeeds = document.getElementById('res-needs');
      const resWants = document.getElementById('res-wants');
      const resSavings = document.getElementById('res-savings');
      const resAnnual = document.getElementById('res-annual');
      const goalSelect = document.getElementById('goal-select');

      function recalculateBudget() {
        if (!incomeSlider) return;
        const income = parseInt(incomeSlider.value, 10);
        incomeDisplay.textContent = `$${income.toLocaleString()} / month`;

        const needs = Math.round(income * 0.50);
        const wants = Math.round(income * 0.30);
        const savings = Math.round(income * 0.20);
        const annual = savings * 12;

        resNeeds.textContent = `$${needs.toLocaleString()}`;
        resWants.textContent = `$${wants.toLocaleString()}`;
        resSavings.textContent = `$${savings.toLocaleString()}`;
        resAnnual.textContent = `$${annual.toLocaleString()}`;
      }

      if (incomeSlider) {
        incomeSlider.addEventListener('input', recalculateBudget);
      }
      if (goalSelect) {
        goalSelect.addEventListener('change', () => {
          const selectedText = goalSelect.options[goalSelect.selectedIndex].text;
          showToast(`Budget recalibrated for: ${selectedText}`);
        });
      }

      // 6. Accessible FAQ Accordion Toggle (R-28, R-32)
      const faqItems = document.querySelectorAll('.faq-item');
      faqItems.forEach(item => {
        const trigger = item.querySelector('.faq-trigger');
        if (trigger) {
          trigger.addEventListener('click', () => {
            const isOpen = item.classList.contains('is-open');
            // Allow multiple open or single toggle
            item.classList.toggle('is-open', !isOpen);
            trigger.setAttribute('aria-expanded', !isOpen ? 'true' : 'false');
          });
        }
      });

      // 7. Modals Open/Close Handlers (R-26, R-32)
      const downloadModal = document.getElementById('download-modal');
      const onboardingModal = document.getElementById('onboarding-modal');

      function openModal(modal) {
        if (!modal) return;
        modal.classList.add('is-open');
        document.body.style.overflow = 'hidden';
        const focusable = modal.querySelector('button, [href], input');
        if (focusable) focusable.focus();
      }

      function closeModal(modal) {
        if (!modal) return;
        modal.classList.remove('is-open');
        document.body.style.overflow = '';
      }

      // Wire download triggers
      const downloadButtons = [
        document.getElementById('open-download-header-btn'),
        document.getElementById('open-download-mobile-btn'),
        document.getElementById('hero-appstore-btn'),
        document.getElementById('hero-googleplay-btn'),
        document.getElementById('cta-download-btn')
      ];
      downloadButtons.forEach(b => {
        if (b) b.addEventListener('click', () => openModal(downloadModal));
      });

      const closeDownloadBtn = document.getElementById('close-download-modal-btn');
      if (closeDownloadBtn) {
        closeDownloadBtn.addEventListener('click', () => closeModal(downloadModal));
      }

      // Wire onboarding triggers
      const onboardingButtons = [
        document.getElementById('open-onboarding-header-btn'),
        document.getElementById('open-onboarding-mobile-btn'),
        document.getElementById('hero-onboarding-btn'),
        document.getElementById('cta-onboarding-btn'),
        ...document.querySelectorAll('.panel-open-onboarding')
      ];
      onboardingButtons.forEach(b => {
        if (b) b.addEventListener('click', () => openModal(onboardingModal));
      });

      const closeOnboardingBtn = document.getElementById('close-onboarding-modal-btn');
      if (closeOnboardingBtn) {
        closeOnboardingBtn.addEventListener('click', () => closeModal(onboardingModal));
      }

      // Dismiss on Escape key
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          closeModal(downloadModal);
          closeModal(onboardingModal);
        }
      });

      // Dismiss on backdrop click
      [downloadModal, onboardingModal].forEach(modal => {
        if (modal) {
          modal.addEventListener('click', (e) => {
            if (e.target === modal) {
              closeModal(modal);
            }
          });
        }
      });

      // 8. Onboarding Form Submission with Email Validation (R-27)
      const onboardingForm = document.getElementById('onboarding-email-form');
      const emailInput = document.getElementById('onboarding-email');
      const emailError = document.getElementById('email-error-msg');
      const formState = document.getElementById('onboarding-form-state');
      const successState = document.getElementById('onboarding-success-state');
      const finishBtn = document.getElementById('finish-onboarding-btn');

      if (onboardingForm) {
        onboardingForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const email = emailInput.value.trim();
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

          if (!email || !emailRegex.test(email)) {
            emailError.style.display = 'block';
            emailInput.style.borderColor = '#D9381E';
            emailInput.focus();
            return;
          }

          emailError.style.display = 'none';
          emailInput.style.borderColor = 'var(--color-border)';

          // Transition to success state
          formState.style.display = 'none';
          successState.style.display = 'block';
          showToast('Verification email dispatched.');
        });
      }

      if (finishBtn) {
        finishBtn.addEventListener('click', () => {
          closeModal(onboardingModal);
          // Reset form state for next launch
          setTimeout(() => {
            formState.style.display = 'block';
            successState.style.display = 'none';
            if (emailInput) emailInput.value = '';
          }, 300);
        });
      }

      // 9. Legal footer button handlers
      ['footer-terms-btn', 'footer-privacy-btn', 'footer-contact-btn'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.addEventListener('click', (e) => {
            e.preventDefault();
            showToast('Document securely loaded under Privacy & Security standards.');
            const sec = document.getElementById('security');
            if (sec) sec.scrollIntoView({ behavior: 'smooth' });
          });
        }
      });
    });
  </script>
</div>
</body>
</html>
