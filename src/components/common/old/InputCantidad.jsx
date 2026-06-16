import styles from './InputCantidad.module.css';
function InputCantidad({ value, onChange, min = 0, max = 100000}) {
    return(
        <div className={styles.inputGroup}>
            <button className={styles.buttonMinus}>-</button>
            <input
                type="number"
                className={styles.input}
                value={value}
                onChange={onChange}
                min={min}
                max={max}
            />
            <button className={styles.buttonPlus}>+</button>
        </div>
    );
}
export default InputCantidad;