import styles from './Switch.module.css';
import { BoxIcon } from 'boxicons-react';

function Switch({ title, subtitle, checked, onChange, icon, disabled = false }) {
    return (
        <div className={`${styles.checkboxContainer} ${checked ? styles.checked : ''} ${disabled ? styles.disabled : ''}`}>
            <div className={styles.icon}>
                <BoxIcon name={icon} className={styles.icon} />
            </div>
            <div className={styles.text}>
                <p className={styles.title}>{title}</p>
                <p className={styles.subTitle}>{subtitle}</p>
            </div>
            <label className={styles.switch}>
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => !disabled && onChange(e.target.checked)}
                    disabled={disabled}
                />
                <span className={styles.slider}></span>
            </label>
        </div>
    );
}
export default Switch;