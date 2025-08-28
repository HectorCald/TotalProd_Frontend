import React, {useState} from 'react';
import styles from './Info.module.css';
import { BoxIcon } from 'boxicons-react';

function Info({ title, message, onHover, onClick }) {
    const [showText, setShowText] = useState(false);
    return (
        <div className={styles.info} onClick={onClick} onMouseEnter={() => setShowText(true)} onMouseLeave={() => setShowText(false)}>
            <BoxIcon name='info-circle' className={styles.icon} />
            {showText &&
                <div className={styles.text}>
                    <p className={styles.title}>{title}</p>
                    <p className={styles.message}>{message}</p>
                </div>
            }
        </div>
    );
}
export default Info;