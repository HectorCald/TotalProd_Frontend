import styles from '../../../styles/view.module.css';
import HeaderView from '../../common/old/HeaderView';
import View from '../../ui/View';

function Apariencia({ isOpen, setIsOpen}) {
    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen} isMainView={true}>
            <HeaderView onBack={() => setIsOpen(false)} />
            <div className={styles.container}>
                <h1 className={styles.title}>Apariencia</h1>
                <div className={styles.content}>
                    <p className={styles.subTitle}>El tema de la aplicación está fijado en modo claro.</p>
                </div>
            </div>
        </View>
    );
}
export default Apariencia;