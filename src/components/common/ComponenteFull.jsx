import styles from './ComponenteFull.module.css';
import { BoxIcon } from 'boxicons-react';

function ComponenteFull({ 
    title, 
    subtitle, 
    checked = false, 
    onChange, 
    icon, 
    type = 'checkbox', // 'checkbox', 'switch', 'arrow', 'none'
    onClick,
    loading = false,
    disabled = false
}) {
    const handleClick = () => {
        if (loading || disabled) {
            return;
        }
        if (type === 'checkbox' || type === 'switch') {
            if (onChange) {
                onChange(!checked);
            }
        } else if (type === 'arrow' || type === 'none') {
            if (onClick) {
                onClick();
            }
        }
    };

    const renderControl = () => {
        if (loading) {
            return (
                <div className={styles.loader}>
                    <BoxIcon name="loader-alt" className={`${styles.loaderIcon} ${styles.spinning}`} />
                </div>
            );
        }

        switch (type) {
            case 'checkbox':
                return (
                    <div className={styles.check}>
                        <input
                            className={styles.input}
                            type="checkbox"
                            checked={checked}
                            disabled={disabled || loading}
                            onChange={(e) => {
                                if (onChange && !disabled && !loading) onChange(e.target.checked);
                            }}
                        />
                        <span className={styles.checkmark}></span>
                    </div>
                );
            
            case 'switch':
                return (
                    <div className={styles.switchContainer}>
                        <input
                            className={styles.switchInput}
                            type="checkbox"
                            checked={checked}
                            disabled={disabled || loading}
                            onChange={(e) => {
                                if (onChange && !disabled && !loading) onChange(e.target.checked);
                            }}
                        />
                        <span className={`${styles.switch} ${checked ? styles.switchOn : ''}`}>
                            <span className={styles.switchSlider}></span>
                        </span>
                    </div>
                );
            
            case 'arrow':
                return (
                    <div className={styles.arrow}>
                        <BoxIcon name="chevron-right" className={styles.arrowIcon} />
                    </div>
                );
            
            case 'none':
            default:
                return null;
        }
    };

    return (
        <div 
            className={`${styles.container} ${checked ? styles.checked : ''} ${disabled ? styles.disabled : ''}`}
            onClick={handleClick}
            aria-disabled={disabled}
        >
            {icon && (
                <div className={styles.iconContainer}>
                    <BoxIcon name={icon} className={styles.icon} />
                </div>
            )}
            <div className={styles.text}>
                <p className={styles.title}>{title}</p>
                {subtitle && <p className={styles.subTitle}>{subtitle}</p>}
            </div>
            {renderControl()}
        </div>
    );
}
export default ComponenteFull;
