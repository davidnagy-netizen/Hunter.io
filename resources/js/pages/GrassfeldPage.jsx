import React, { useState } from 'react';
import FaqAccordion from '../components/FaqAccordion';

/**
 * GrassfeldPage React implementation for Grassfeld AI Budgeting App.
 * Design Read: Calm editorial modern grotesk style, dial ENERGY 1 / RHYTHM 2 / MOTION 1.
 */
export default function GrassfeldPage() {
    const [monthlyIncome, setMonthlyIncome] = useState(4800);
    const [activeToolTab, setActiveToolTab] = useState(0);

    const needs = Math.round(monthlyIncome * 0.5);
    const wants = Math.round(monthlyIncome * 0.3);
    const savings = Math.round(monthlyIncome * 0.2);
    const safeToSpendDaily = Math.round(wants / 30);

    const tools = [
        {
            title: 'Proactive Pacing',
            description: 'Dynamic burn-rate monitoring updates your safe-to-spend target each morning so month-end surprises disappear.'
        },
        {
            title: 'Cashflow Projection',
            description: 'Anticipate upcoming recurring bills, subscription renewals, and seasonal expenses before they clear.'
        },
        {
            title: 'Subscription Audit',
            description: 'Automatic discovery of dormant or price-hiked recurring charges with 1-click cancellation guidance.'
        },
        {
            title: 'Smart Categorization',
            description: 'Clean transaction labeling without manually tagging coffee receipts or utility bills.'
        }
    ];

    const grassfeldFaqs = [
        {
            question: 'Can Grassfeld move money or execute transfers from my bank accounts?',
            answer: 'Never. Grassfeld operates exclusively on encrypted read-only banking connections. We cannot initiate payments, move funds, or alter your accounts.'
        },
        {
            question: 'How does Grassfeld protect my financial privacy and banking credentials?',
            answer: 'We utilize bank-grade 256-bit encryption with certified open banking aggregators. Your credentials are never stored on our servers.'
        },
        {
            question: 'What makes Grassfeld different from spreadsheets or traditional budgeting apps?',
            answer: 'Traditional apps ask you to log yesterday’s coffee. Grassfeld calculates today’s safe pacing in advance so you can spend without anxiety.'
        },
        {
            question: 'Can I share Grassfeld with my partner or family members?',
            answer: 'Yes. Shared Household plans allow linked joint accounts while preserving optional private personal spending allowances.'
        },
        {
            question: 'Is there a free trial, and how do cancellations work?',
            answer: 'Every plan includes a 30-day trial with full access. You can cancel at any time directly from account settings without phone calls.'
        }
    ];

    return (
        <div style={{ background: '#FFFFFF', color: '#202128', minHeight: '100vh', fontFamily: 'var(--font)' }}>
            {/* Header */}
            <header style={{ borderBottom: '1px solid #DFF1F3', padding: '18px 24px' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '22px', fontWeight: 700, fontFamily: 'var(--display)', color: '#202128' }}>
                            Grassfeld
                        </span>
                        <span style={{ fontSize: '11px', background: '#E8F7F0', color: '#0E7550', padding: '3px 8px', borderRadius: '6px', fontWeight: 600 }}>
                            AI BUDGETING
                        </span>
                    </div>
                    <nav style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <a href="/" style={{ fontSize: '14px', color: '#525E6E' }}>Fundor Home</a>
                        <a href="/login" className="btn btn-ghost" style={{ fontSize: '13px', padding: '8px 16px' }}>Sign in</a>
                        <a href="/register" className="btn btn-gold" style={{ fontSize: '13px', padding: '8px 18px' }}>Start 30-day trial</a>
                    </nav>
                </div>
            </header>

            {/* Hero */}
            <section style={{ padding: '64px 24px', textAlign: 'center', maxWidth: '860px', margin: '0 auto' }}>
                <h1 style={{ fontSize: 'clamp(34px, 5vw, 54px)', lineHeight: 1.15, fontWeight: 700, marginBottom: '20px', color: '#202128' }}>
                    Keep your finances on track with effortless peace of mind.
                </h1>
                <p style={{ fontSize: '18px', color: '#525E6E', lineHeight: 1.6, maxWidth: '680px', margin: '0 auto 36px' }}>
                    Grassfeld pairs intelligent spending analysis with proactive budget pacing. Know exactly what is safe to spend today without spreadsheet maintenance.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
                    <a href="/register" className="btn btn-gold" style={{ padding: '12px 28px', fontSize: '15px' }}>
                        Get Started Free
                    </a>
                    <a href="#safe-to-spend" className="btn btn-ghost" style={{ padding: '12px 24px', fontSize: '15px' }}>
                        Explore Dashboard Pacing
                    </a>
                </div>
            </section>

            {/* Safe-to-Spend Interactive Balance Card */}
            <section id="safe-to-spend" style={{ maxWidth: '780px', margin: '0 auto 72px', padding: '0 20px' }}>
                <div style={{ background: '#F4FAFA', border: '1px solid #DFF1F3', borderRadius: '16px', padding: '32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                        <div>
                            <h2 style={{ fontSize: '20px', margin: '0 0 4px', color: '#202128' }}>
                                Monthly Safe-to-Spend Balance
                            </h2>
                            <p style={{ fontSize: '13px', color: '#525E6E', margin: 0 }}>
                                Interactive 50/30/20 balanced pacing preview
                            </p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '12px', color: '#525E6E', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Daily Allowance</div>
                            <div style={{ fontSize: '24px', fontWeight: 700, color: '#0E7550', fontFamily: 'var(--display)' }}>
                                ${safeToSpendDaily} / day
                            </div>
                        </div>
                    </div>

                    {/* Income Slider */}
                    <div style={{ marginBottom: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px', marginBottom: '8px' }}>
                            <label htmlFor="grassfeld-income">Monthly Net Income:</label>
                            <strong>${monthlyIncome.toLocaleString()}</strong>
                        </div>
                        <input
                            id="grassfeld-income"
                            type="range"
                            min="2000"
                            max="15000"
                            step="100"
                            value={monthlyIncome}
                            onChange={(e) => setMonthlyIncome(Number(e.target.value))}
                            style={{ width: '100%', accentColor: '#2B52CD', cursor: 'pointer' }}
                        />
                    </div>

                    {/* Breakdown Pillars */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                        <div style={{ background: '#FFFFFF', padding: '16px', borderRadius: '10px', border: '1px solid #DFF1F3' }}>
                            <div style={{ fontSize: '12px', color: '#525E6E', fontWeight: 600 }}>Fixed Needs (50%)</div>
                            <div style={{ fontSize: '20px', fontWeight: 700, color: '#202128', marginTop: '4px' }}>
                                ${needs.toLocaleString()}
                            </div>
                            <div style={{ fontSize: '11px', color: '#64707F', marginTop: '4px' }}>Rent, utilities, groceries</div>
                        </div>

                        <div style={{ background: '#FFFFFF', padding: '16px', borderRadius: '10px', border: '1px solid #DFF1F3' }}>
                            <div style={{ fontSize: '12px', color: '#2B52CD', fontWeight: 600 }}>Flexible Wants (30%)</div>
                            <div style={{ fontSize: '20px', fontWeight: 700, color: '#2B52CD', marginTop: '4px' }}>
                                ${wants.toLocaleString()}
                            </div>
                            <div style={{ fontSize: '11px', color: '#64707F', marginTop: '4px' }}>Dining, leisure, shopping</div>
                        </div>

                        <div style={{ background: '#FFFFFF', padding: '16px', borderRadius: '10px', border: '1px solid #DFF1F3' }}>
                            <div style={{ fontSize: '12px', color: '#0E7550', fontWeight: 600 }}>Future Savings (20%)</div>
                            <div style={{ fontSize: '20px', fontWeight: 700, color: '#0E7550', marginTop: '4px' }}>
                                ${savings.toLocaleString()}
                            </div>
                            <div style={{ fontSize: '11px', color: '#64707F', marginTop: '4px' }}>Emergency fund, investments</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Feature Tools Section */}
            <section style={{ maxWidth: '960px', margin: '0 auto 72px', padding: '0 20px' }}>
                <div style={{ textAlign: 'center', marginBottom: '36px' }}>
                    <h2 style={{ fontSize: '28px', color: '#202128', marginBottom: '10px' }}>
                        Eight integrated tools. One quiet dashboard.
                    </h2>
                    <p style={{ color: '#525E6E', fontSize: '16px' }}>
                        Designed to deliver clarity in under 30 seconds per day.
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                    {tools.map((tool, idx) => (
                        <div
                            key={idx}
                            onClick={() => setActiveToolTab(idx)}
                            style={{
                                background: activeToolTab === idx ? '#F4FAFA' : '#FFFFFF',
                                border: activeToolTab === idx ? '2px solid #2B52CD' : '1px solid #DFF1F3',
                                borderRadius: '12px',
                                padding: '20px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            <h3 style={{ fontSize: '16px', color: '#202128', marginBottom: '8px' }}>{tool.title}</h3>
                            <p style={{ fontSize: '13px', color: '#525E6E', lineHeight: 1.5, margin: 0 }}>{tool.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Grassfeld FAQ */}
            <section style={{ maxWidth: '800px', margin: '0 auto 80px', padding: '0 20px' }}>
                <h2 style={{ fontSize: '26px', textAlign: 'center', marginBottom: '32px', color: '#202128' }}>
                    Frequently Asked Questions
                </h2>
                <FaqAccordion items={grassfeldFaqs} />
            </section>

            {/* Footer */}
            <footer style={{ borderTop: '1px solid #DFF1F3', padding: '36px 24px', textAlign: 'center', fontSize: '13px', color: '#64707F' }}>
                <p>© {new Date().getFullYear()} Grassfeld Financial Systems. Crafted for peaceful personal budgeting.</p>
            </footer>
        </div>
    );
}
