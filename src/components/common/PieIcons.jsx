import styles from './PieIcons.module.css';
import { FaFacebook, FaInstagram, FaTwitter } from "react-icons/fa";

function PieIcons() {
    return (
        <div className={styles.iconContainer}>
            <button className={styles.icon} ><FaFacebook /></button>
            <button className={styles.icon}><FaTwitter /></button>
            <button className={styles.icon}><FaInstagram /></button>
        </div>
    )
}
export default PieIcons