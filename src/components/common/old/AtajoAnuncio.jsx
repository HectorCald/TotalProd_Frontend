import styles from './AtajoAnuncio.module.css';

function AtajoAnuncio({ title, description, image, onClick, disabled = false }) {
    const handleClick = () => {
        if (disabled) return;
        if (onClick) onClick();
    };

    return (
        <div
            className={`${styles.atajoAnuncio} ${disabled ? styles.disabled : ''}`}
            onClick={handleClick}
            aria-disabled={disabled}
        >
            <img src={image} alt={title} className={styles.image} />
            <div className={styles.content}>
                <h3 className={styles.title}>{title}</h3>
                <p className={styles.description}>{description}</p>
            </div>
        </div>
    );
}

export default AtajoAnuncio;