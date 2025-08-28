import styles from './Version.module.css';

function Version() {
    return (
        <div className={styles.versionContainer}>
            <p className={styles.version} >Versión 1.0.0</p>
        </div>
    )
}
export default Version