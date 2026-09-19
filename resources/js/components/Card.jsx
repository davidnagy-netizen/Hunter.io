import React from 'react';

/**
 * Card container primitive styled with Fundor surface tokens, hairline border, and radius.
 */
export default function Card({
    children,
    className = '',
    style = {},
    ...props
}) {
    return (
        <div className={`card ${className}`.trim()} style={style} {...props}>
            {children}
        </div>
    );
}
