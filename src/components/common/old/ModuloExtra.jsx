import styles from './ModuloExtra.module.css';

function ModuloExtra({ title, image, onClick }) {
    return (
        <div className={styles.moduloExtra} onClick={onClick}>
            <img src={image} alt={title} />
            <h3 className={styles.title}>{title}</h3>
        </div>
    );
}

export default ModuloExtra;