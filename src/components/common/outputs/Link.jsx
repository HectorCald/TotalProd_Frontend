import React from 'react';
import styles from './Link.module.css';

const Link = ({ text, onClick, iconStart, iconEnd, href, style, className, readOnly, align }) => {
    return (
        <a 
            href={readOnly ? undefined : (href || '#')} 
            onClick={(e) => {
                if (readOnly) {
                    e.preventDefault();
                    return;
                }
                if (!href || href === '#') e.preventDefault();
                if (onClick) onClick(e);
            }}
            className={`${styles.link} ${className || ''} ${readOnly ? styles.readOnly : ''}`.trim()}
            style={{ ...style, width: align ? '100%' : undefined, justifyContent: align }}
        >
            {iconStart && <i className={`bx bx-${iconStart}`}></i>}
            {text && <span>{text}</span>}
            {iconEnd && <i className={`bx bx-${iconEnd}`}></i>}
        </a>
    );
};

export default Link;
