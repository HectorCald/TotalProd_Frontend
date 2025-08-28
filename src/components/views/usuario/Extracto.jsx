import styles from './Extracto.module.css';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';

function Extracto({ isOpen, setIsOpen, usuario }) {
    const handleClose = () => {
        setIsOpen(false);
    };

    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderView onBack={handleClose} />
            <div className={styles.container}>
                <h1 className={styles.title}>Extractos de cuenta</h1>
                <p className={styles.subTitle}>Selecciona el tipo de registro</p>
                <div className={styles.content}>
                    
                </div>
            </div>
        </View>
    );
}
export default Extracto;