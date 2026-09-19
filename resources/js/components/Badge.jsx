import React from 'react';

/**
 * Badge primitive for grant status and category chips.
 * Variants: gold, green, amber, red, slate.
 */
export default function Badge({
    children,
    variant = 'slate',
    className = '',
    style = {},
}) {
    return (
        <span className={`badge badge-${variant} ${className}`.trim()} style={style}>
            {children}
        </span>
    );
}
