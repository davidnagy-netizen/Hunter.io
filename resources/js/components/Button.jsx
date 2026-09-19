import React from 'react';

/**
 * Button primitive adhering to Fundor design tokens (btn-gold, btn-dark, btn-ghost).
 * Supports both button and anchor (href) rendering with visible focus states.
 */
export default function Button({
    children,
    variant = 'gold',
    href,
    type = 'button',
    onClick,
    className = '',
    disabled = false,
    style = {},
    ...props
}) {
    const variantClass = variant ? `btn-${variant}` : '';
    const combinedClass = `btn ${variantClass} ${className}`.trim();

    if (href) {
        return (
            <a href={href} className={combinedClass} style={style} {...props}>
                {children}
            </a>
        );
    }

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={combinedClass}
            style={style}
            {...props}
        >
            {children}
        </button>
    );
}
