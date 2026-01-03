import React, { useEffect, useMemo, useRef, useState } from 'react';
import ViewModal from './ViewModal';
import HeaderModal from '../common/HeaderModal';
import Etapa from '../common/Etapa';
import Boton from '../common/Boton';
import styles from '../../styles/Inicial.module.css';
import ListaProfesional from '../common/ListaProfesional';
import { detallesUpdate } from '../../constants/detallesUpdate';
import Text from '../common/Text';

function ModalActualizacion({
    isOpen,
    setIsOpen,
    versionAnterior,
    versionNueva
}) {
    const [etapaActual, setEtapaActual] = useState(-1);
    const [inProgress, setInProgress] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setEtapaActual(-1);
            setInProgress(false);
        }
    }, [isOpen]);

    const etapas = useMemo(() => ([
        { label: 'Procesando', icon: 'loader-alt' },
        { label: 'Actualizando', icon: 'cloud-download' },
        { label: 'Finalizado', icon: 'check-circle' }
    ]), []);

    const handleActualizar = () => {
        if (inProgress) return;
        setInProgress(true);
        setEtapaActual(0);

        // Avanzar 1 segundo por etapa y al final recargar
        setTimeout(() => setEtapaActual(1), 1000);
        setTimeout(() => setEtapaActual(2), 2000);
        setTimeout(() => {
            try {
                // Guardar la nueva versión solo cuando el usuario confirma actualizar
                if (versionNueva) {
                    localStorage.setItem('cacheVersion', versionNueva);
                }
                // Cerrar modal y recargar página
                setIsOpen(false);
            } finally {
                // Usar reload para refrescar assets del service worker
                window.location.reload();
            }
        }, 3000);
    };

    return (
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen} closed={true} style={{ zIndex: 2000 }}>
            <HeaderModal title={'Actualización disponible'} onClose={() => { }} closed={true} />
            <div className={styles.modalContent}>
                <p className={styles.subTitle}>Versión anterior: {versionAnterior || 'N/A'}</p>
                <p className={styles.subTitle}>Versión nueva: {versionNueva || 'N/A'}</p>
                <ListaProfesional title={'Detalles de la actualización'} items={detallesUpdate} />
                <Etapa etapas={etapas} etapaActual={etapaActual} />
                <Text type="warning" align="left">Debe actualizar para continuar</Text>

                <div className={styles.buttons}>
                    <Boton
                        className='btn-default'
                        label={inProgress ? 'Actualizando...' : 'Actualizar'}
                        onClick={handleActualizar}
                        disabled={inProgress}
                    />
                </div>
            </div>
        </ViewModal>
    );
}

export default ModalActualizacion;


