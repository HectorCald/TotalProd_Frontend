import styles from './Version.module.css';

function Version() {
    return (
        <div className={styles.versionContainer}>
            <p className={styles.version} >Versión TP-APP 1.0.0</p>
        </div>
    )
}
export default Version