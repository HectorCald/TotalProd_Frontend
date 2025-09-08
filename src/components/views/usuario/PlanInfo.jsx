import React, { useState, useEffect } from 'react';
import styles from './PlanInfo.module.css';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/HeaderModal';
import { useUser } from '../../../context/UserContext';
import { BoxIcon } from 'boxicons-react';
import Carousel from '../../common/Carousel';
import Boton from '../../common/Boton';
import PlanService from '../../../services/planService';
import LoadingSpinner from '../../common/LoadingSpinner';

function PlanInfo({ isOpen, setIsOpen }) {
    const { user: usuario } = useUser();
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPlan, setCurrentPlan] = useState(null);

    // Cargar todos los planes y el plan actual al abrir el modal
    useEffect(() => {
        if (isOpen) {
            loadPlans();
            loadCurrentPlan();
        }
    }, [isOpen]);

    const loadPlans = async () => {
        try {
            const result = await PlanService.getAllPlans();
            if (result.success) {
                setPlans(result.data.plans);
            } else {
                console.error('Error al cargar planes:', result.error);
            }
        } catch (error) {
            console.error('Error al cargar planes:', error);
        }
    };

    const loadCurrentPlan = async () => {
        try {
            setLoading(true);
            const result = await PlanService.getCurrentPlan();
            
            if (result.success) {
                setCurrentPlan(result.data.plan);
            } else {
                // Fallback al plan del contexto si falla la consulta
                setCurrentPlan(usuario?.plan || null);
            }
        } catch (error) {
            console.error('Error al cargar plan actual:', error);
            // Fallback al plan del contexto si hay error
            setCurrentPlan(usuario?.plan || null);
        } finally {
            setLoading(false);
        }
    };

    // Función para obtener la clase CSS según el plan
    const getPlanCardClass = (planId) => {
        if (currentPlan?.id === planId) {
            return styles.planCardActive; // Plan activo - verde
        }
        return styles.planCardInactive; // Plan inactivo - gris
    };

    // Función para obtener el color del badge según el plan
    const getPlanBadgeClass = (planId) => {
        if (currentPlan?.id === planId) {
            return styles.planBadgeActive; // Badge verde para plan activo
        }
        return styles.planBadgeInactive; // Badge gris para plan inactivo
    };

    if (loading) {
        return (
            <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
                <HeaderModal
                    title="Planes Disponibles"
                    onClose={() => setIsOpen(false)}
                />
                <div className={styles.modalContent}>
                    <LoadingSpinner iconName='money' />
                </div>
            </ViewModal>
        );
    }

    return (
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderModal
                title="Planes Disponibles"
                onClose={() => setIsOpen(false)}
            />
            <Carousel>
                {plans.map((plan) => (
                    <div key={plan.id} className={styles.modalContent}>
                        <div className={`${styles.planCard} ${getPlanCardClass(plan.id)}`}>
                            <div className={styles.planHeader}>
                                <h3 className={styles.planName}>{plan.name}</h3>
                                <div className={styles.planPrice}>
                                    <span className={styles.priceAmount}>Bs. {plan.price}</span>
                                    <span className={styles.pricePeriod}>/{plan.duration}</span>
                                </div>
                                <div className={`${styles.planBadge} ${getPlanBadgeClass(plan.id)}`}>
                                    {currentPlan?.id === plan.id ? 'Plan Activo' : 'Disponible'}
                                </div>
                            </div>

                            <div className={styles.planDescription}>
                                {plan.description}
                            </div>

                            <h4 className={styles.planFeaturesTitle}>Este plan incluye:</h4>
                            <div className={styles.planFeatures}>
                                {plan.modules && plan.modules.length > 0 ? (
                                    <ul>
                                        {plan.modules.map((module, index) => (
                                            <li key={module.id || index}>
                                                <span className={styles.featureIcon}>
                                                    <BoxIcon name='check' className={styles.icon} />
                                                </span>
                                                <span>{module.description}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className={styles.noModules}>
                                        <p>Este plan no incluye módulos específicos</p>
                                    </div>
                                )}
                            </div>

                            {currentPlan?.id === plan.id ? (
                                <Boton
                                    className='btn-original'
                                    label='Plan Actual'
                                    style={{ marginTop: 'auto', opacity: 0.7 }}
                                    disabled={true}
                                />
                            ) : (
                                <Boton
                                    className='btn-original'
                                    label='Cambiar a este Plan'
                                    style={{ marginTop: 'auto' }}
                                    onClick={() => {
                                        // Aquí puedes implementar la lógica para cambiar de plan
                                        console.log('Cambiar a plan:', plan.name);
                                    }}
                                />
                            )}
                        </div>
                    </div>
                ))}
            </Carousel>
            <div style={{ marginTop: '10px' }}></div>
        </ViewModal>
    );
}

export default PlanInfo;
