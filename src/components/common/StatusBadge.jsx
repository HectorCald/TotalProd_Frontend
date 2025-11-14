import React, { useState, useEffect, useRef } from 'react';
import styles from './StatusBadge.module.css';

const TYPE_CONFIG = {
    info: {
        color: '#3b82f6',
        background: 'rgba(59, 130, 246, 0.15)'
    },
    error: {
        color: '#dc2626',
        background: 'rgba(220, 38, 38, 0.15)'
    },
    warning: {
        color: '#ea990c',
        background: 'rgba(234, 153, 12, 0.15)'
    },
    success: {
        color: '#16a34a',
        background: 'rgba(22, 163, 74, 0.15)'
    }
};

function StatusBadge({
    label,
    type = 'info',
    detail = '',
    className = ''
}) {
    const [isOpen, setIsOpen] = useState(false);
    const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.info;
    const wrapperRef = useRef(null);

    const toggleDetail = () => {
        if (!detail) return;
        setIsOpen((prev) => !prev);
    };

    useEffect(() => {
        if (!isOpen) return;
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div ref={wrapperRef} className={`${styles.badgeWrapper} ${className}`} onClick={toggleDetail}>
            <div
                className={styles.badge}
                style={{
                    color: cfg.color,
                    backgroundColor: cfg.background,
                    cursor: detail ? 'pointer' : 'default'
                }}
            >
                <span
                    className={styles.dot}
                    style={{ backgroundColor: cfg.color }}
                />
                <span className={styles.label}>{label}</span>
            </div>
            {detail && isOpen && (
                <div className={styles.popover}>
                    {detail}
                </div>
            )}
        </div>
    );
}

export default StatusBadge;

