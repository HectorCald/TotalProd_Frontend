import styles from './MensajeError.module.css';
import { motion, AnimatePresence } from 'framer-motion';
import { BoxIcon } from 'boxicons-react';

function MensajeError({ mensaje }) {

    return (
        <motion.div
            className={styles.info}
            animate={{
                height: mensaje !== '' ? 40 : 0,
                opacity: mensaje !== '' ? 1 : 0
            }}
            transition={{
                duration: 0.5,
                ease: "easeInOut"
            }}
        >
            <BoxIcon name='info-circle' className={styles.icon} />
            <p className={styles.text} >{mensaje}</p>
        </motion.div>
    );
}
export default MensajeError;