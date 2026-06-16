import React, { useState, useEffect } from 'react';
import styles from './PlanInfo.module.css';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/old/HeaderModal';
import { useUser } from '../../../context/UserContext';
import { BoxIcon } from 'boxicons-react';
import Carousel from '../../common/old/Carousel';
import Boton from '../../common/botones/Boton';
import PlanService from '../../../services/planService';
import LoadingSpinner from '../../common/old/LoadingSpinner';

function PlanInfo({ isOpen, setIsOpen }) {
    const { user: usuario } = useUser();
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPlan, setCurrentPlan] = useState(null);
    const [timeUpdate, setTimeUpdate] = useState(0); // Para forzar actualización del contador

    // Cargar todos los planes y el plan actual al abrir el modal
    useEffect(() => {
        if (isOpen) {
            loadPlans();
            loadCurrentPlan();
        }
    }, [isOpen]);

    // Actualizar contador cada segundo solo si el plan no es infinito
    useEffect(() => {
        if (isOpen && currentPlan) {
            // Verificar si el plan es infinito antes de crear el intervalo
            const isInfinite = !currentPlan.end_date || 
                              currentPlan.end_date === 'infinity' ||
                              currentPlan.end_date === 'Infinity' ||
                              currentPlan.end_date === '9999-12-31' || 
                              currentPlan.end_date === '9999-12-31T23:59:59.999Z' ||
                              currentPlan.end_date === null ||
                              currentPlan.end_date === undefined ||
                              currentPlan.end_date === '';
            
            // Solo actualizar el contador si el plan NO es infinito
            if (!isInfinite) {
                const interval = setInterval(() => {
                    setTimeUpdate(prev => prev + 1);
                }, 1000);

                return () => clearInterval(interval);
            }
        }
    }, [isOpen, currentPlan]);

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

    // Componente para renderizar el contador de tiempo
    const renderTimeCounter = (planStartDate, planEndDate) => {
        // Usar timeUpdate para forzar re-render solo si el plan no es infinito
        const _ = timeUpdate;
        
        // Verificar si el plan es infinito (sin fecha de fin o fecha muy lejana)
        // Incluir el string 'infinity' que viene del backend
        const isInfinitePlan = !planEndDate || 
                              planEndDate === 'infinity' ||
                              planEndDate === 'Infinity' ||
                              planEndDate === 'INFINITY' ||
                              planEndDate === '9999-12-31' || 
                              planEndDate === '9999-12-31T23:59:59.999Z' ||
                              planEndDate === null ||
                              planEndDate === undefined ||
                              planEndDate === '';
        
        // Si es infinito, retornar directamente sin intentar parsear fechas
        if (isInfinitePlan) {
            return (
                <div className={styles.infinitePlan}>
                    <div className={styles.infiniteText}>Infinito</div>
                    <div className={styles.infiniteSubtext}>Sin límite de tiempo</div>
                </div>
            );
        }
        
        // Verificar si la fecha es válida antes de intentar parsearla
        let end;
        try {
            end = new Date(planEndDate).getTime();
            // Si la fecha es inválida o muy lejana, considerarla infinita
            if (isNaN(end) || end > new Date('2099-12-31').getTime()) {
                return (
                    <div className={styles.infinitePlan}>
                        <div className={styles.infiniteText}>Infinito</div>
                        <div className={styles.infiniteSubtext}>Sin límite de tiempo</div>
                    </div>
                );
            }
        } catch (error) {
            // Si hay error al parsear, considerar el plan como infinito
            return (
                <div className={styles.infinitePlan}>
                    <div className={styles.infiniteText}>Infinito</div>
                    <div className={styles.infiniteSubtext}>Sin límite de tiempo</div>
                </div>
            );
        }
        
        // Calcular tiempo restante para este plan específico
        const now = new Date().getTime();
        const start = planStartDate ? new Date(planStartDate).getTime() : now;

        // Si el plan aún no ha comenzado
        if (now < start) {
            const timeUntilStart = end - start;
            const timeLeft = calculateTimeComponents(timeUntilStart);
            return renderTimeDisplay(timeLeft);
        }

        // Si el plan ha expirado
        if (now >= end) {
            return (
                <div className={styles.expiredMessage}>
                    Plan Expirado
                </div>
            );
        }

        // Calcular tiempo restante
        const timeRemaining = end - now;
        const timeLeft = calculateTimeComponents(timeRemaining);
        return renderTimeDisplay(timeLeft);
    };

    // Función para calcular componentes de tiempo
    const calculateTimeComponents = (milliseconds) => {
        // Verificar si el valor es válido
        if (!milliseconds || isNaN(milliseconds) || milliseconds < 0) {
            return null; // Retornar null para indicar que es infinito
        }
        
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        const months = Math.floor(days / 30);

        // Determinar qué mostrar basado en la duración
        if (months > 0) {
            return {
                months: months,
                days: days % 30,
                hours: 0,
                seconds: 0,
                display: 'months'
            };
        } else if (days > 0) {
            return {
                months: 0,
                days: days,
                hours: hours % 24,
                seconds: 0,
                display: 'days'
            };
        } else if (hours > 0) {
            return {
                months: 0,
                days: 0,
                hours: hours,
                seconds: seconds % 60,
                display: 'hours'
            };
        } else {
            return {
                months: 0,
                days: 0,
                hours: 0,
                seconds: seconds,
                display: 'seconds'
            };
        }
    };

    // Función para renderizar la visualización del tiempo
    const renderTimeDisplay = (timeLeft) => {
        if (!timeLeft) {
            return (
                <div className={styles.infinitePlan}>
                    <div className={styles.infiniteText}>Infinito</div>
                    <div className={styles.infiniteSubtext}>Sin límite de tiempo</div>
                </div>
            );
        }

        const { months, days, hours, seconds, display } = timeLeft;

        return (
            <div className={styles.timeCounter}>
                <div className={styles.timeDisplay}>
                    {display === 'months' && (
                        <>
                            <div className={styles.timeUnit}>
                                <span className={styles.timeValue}>{months}</span>
                                <span className={styles.timeLabel}>Meses</span>
                            </div>
                            {days > 0 && (
                                <>
                                    <span className={styles.timeSeparator}>:</span>
                                    <div className={styles.timeUnit}>
                                        <span className={styles.timeValue}>{days}</span>
                                        <span className={styles.timeLabel}>Días</span>
                                    </div>
                                </>
                            )}
                        </>
                    )}
                    
                    {display === 'days' && (
                        <>
                            <div className={styles.timeUnit}>
                                <span className={styles.timeValue}>{days}</span>
                                <span className={styles.timeLabel}>Días</span>
                            </div>
                            {hours > 0 && (
                                <>
                                    <span className={styles.timeSeparator}>:</span>
                                    <div className={styles.timeUnit}>
                                        <span className={styles.timeValue}>{hours}</span>
                                        <span className={styles.timeLabel}>Horas</span>
                                    </div>
                                </>
                            )}
                        </>
                    )}
                    
                    {display === 'hours' && (
                        <>
                            <div className={styles.timeUnit}>
                                <span className={styles.timeValue}>{hours}</span>
                                <span className={styles.timeLabel}>Horas</span>
                            </div>
                            {seconds > 0 && (
                                <>
                                    <span className={styles.timeSeparator}>:</span>
                                    <div className={styles.timeUnit}>
                                        <span className={styles.timeValue}>{seconds}</span>
                                        <span className={styles.timeLabel}>Seg</span>
                                    </div>
                                </>
                            )}
                        </>
                    )}
                    
                    {display === 'seconds' && (
                        <div className={styles.timeUnit}>
                            <span className={styles.timeValue}>{seconds}</span>
                            <span className={styles.timeLabel}>Segundos</span>
                        </div>
                    )}
                </div>
            </div>
        );
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
                                
                                {/* Mostrar contador de tiempo si es el plan activo, sino mostrar precio */}
                                {currentPlan?.id === plan.id ? (
                                    renderTimeCounter(currentPlan.start_date, currentPlan.end_date)
                                ) : (
                                    <div className={styles.planPrice}>
                                        <span className={styles.priceAmount}>Bs. {plan.price}</span>
                                        <span className={styles.pricePeriod}>/{plan.duration}</span>
                                    </div>
                                )}
                                
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
