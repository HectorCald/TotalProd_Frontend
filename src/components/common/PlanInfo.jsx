import React from 'react';
import styles from './PlanInfo.module.css';

function PlanInfo({ plan }) {
    if (!plan) {
        return (
            <div className={styles.planContainer}>
                <h3 className={styles.planTitle}>Plan</h3>
                <div className={styles.noPlan}>
                    <span className={styles.noPlanText}>Sin plan asignado</span>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.planContainer}>
            <h3 className={styles.planTitle}>Plan Actual</h3>
            <div className={styles.planCard}>
                <div className={styles.planHeader}>
                    <h4 className={styles.planName}>{plan.name}</h4>
                    <span className={styles.planPrice}>${plan.price}</span>
                </div>
                <div className={styles.planDetails}>
                    <span className={styles.planDuration}>{plan.duration}</span>
                </div>
            </div>
        </div>
    );
}

export default PlanInfo;
