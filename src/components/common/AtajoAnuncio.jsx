import styles from './AtajoAnuncio.module.css';

function AtajoAnuncio({ title, description, image, onClick }) {
    return (
        <div className={styles.atajoAnuncio} onClick={onClick}>
            <img src={image} alt={title} className={styles.image} />
            <div className={styles.content}>
                <h3 className={styles.title}>{title}</h3>
                <p className={styles.description}>{description}</p>
            </div>
        </div>
    );
}

export default AtajoAnuncio;