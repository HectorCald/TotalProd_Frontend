import styles from './AtajoAnuncio.module.css';

function AtajoAnuncio({ title, description, image, onClick }) {
    return (
        <div className={styles.atajoAnuncio} onClick={onClick}>
            <img src={image} alt={title} />
            <div className={styles.content}>
                <h3>{title}</h3>
                <p>{description}</p>
            </div>
        </div>
    );
}

export default AtajoAnuncio;