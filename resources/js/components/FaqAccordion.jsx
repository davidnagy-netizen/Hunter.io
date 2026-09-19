import React, { useState } from 'react';

/**
 * Accessible FAQ Accordion adhering to WAI-ARIA and antislop guidelines.
 */
export default function FaqAccordion({
    items = [],
    allowMultiple = false,
}) {
    const [openIndices, setOpenIndices] = useState([0]);

    const toggle = (index) => {
        if (allowMultiple) {
            setOpenIndices((prev) =>
                prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
            );
        } else {
            setOpenIndices((prev) => (prev.includes(index) ? [] : [index]));
        }
    };

    if (!items || items.length === 0) {
        return null;
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {items.map((item, index) => {
                const isOpen = openIndices.includes(index);
                const headingId = `faq-heading-${index}`;
                const panelId = `faq-panel-${index}`;

                return (
                    <div
                        key={index}
                        style={{
                            background: 'var(--surface)',
                            border: '1px solid var(--line)',
                            borderRadius: 'var(--radius-sm)',
                            overflow: 'hidden',
                            transition: 'border-color 0.2s ease',
                        }}
                    >
                        <h3>
                            <button
                                type="button"
                                id={headingId}
                                aria-expanded={isOpen}
                                aria-controls={panelId}
                                onClick={() => toggle(index)}
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '18px 20px',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    fontFamily: 'var(--display)',
                                    fontSize: '16px',
                                    fontWeight: 600,
                                    color: 'var(--ink)',
                                }}
                            >
                                <span>{item.question}</span>
                                <span
                                    aria-hidden="true"
                                    style={{
                                        display: 'inline-block',
                                        transition: 'transform 0.2s ease',
                                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                        fontSize: '14px',
                                        color: 'var(--muted)',
                                        marginLeft: '16px',
                                    }}
                                >
                                    ▼
                                </span>
                            </button>
                        </h3>

                        {isOpen && (
                            <div
                                id={panelId}
                                role="region"
                                aria-labelledby={headingId}
                                style={{
                                    padding: '0 20px 20px 20px',
                                    color: 'var(--muted)',
                                    fontSize: '14.5px',
                                    lineHeight: 1.6,
                                    borderTop: '1px solid var(--paper)',
                                    paddingTop: '12px',
                                }}
                            >
                                {item.answer}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
