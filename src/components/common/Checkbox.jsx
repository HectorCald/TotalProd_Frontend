import styles from './Checkbox.module.css';
import { BoxIcon } from 'boxicons-react';

function Checkbox({ title, subtitle, checked, onChange, icon }) {
    return (
        <div 
            className={`${styles.checkboxContainer} ${checked ? styles.checked : ''}`}
            onClick={() => {
                onChange(!checked);
            }}
        >
            <div className={styles.icon}>
                <BoxIcon name={icon} className={styles.icon} />
            </div>
            <div className={styles.text}>
                <p className={styles.title}>{title}</p>
                {subtitle && <p className={styles.subTitle}>{subtitle}</p>}
            </div>
            <div className={styles.check}>
                <input
                    className={styles.input}
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                        onChange(e.target.checked);
                    }}
                />
                <span className={styles.checkmark}></span>
            </div>

        </div>
    );
}
export default Checkbox;