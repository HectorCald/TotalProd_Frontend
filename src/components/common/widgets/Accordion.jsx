import React, { useState } from 'react';
import styles from './Accordion.module.css';
import { BoxIcon } from 'boxicons-react';

const Accordion = ({ title, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    const toggleAccordion = () => {
        setIsOpen(!isOpen);
    };

    return (
        <div className={styles.accordion}>
            <div className={styles.header} onClick={toggleAccordion}>
                <h3 className={styles.title}>{title}</h3>
                <div className={`${styles.iconContainer} ${isOpen ? styles.open : ''}`}>
                    <BoxIcon name="chevron-down" color="#666" />
                </div>
            </div>
            <div className={`${styles.content} ${isOpen ? styles.open : ''}`}>
                <div className={styles.innerContent}>
                    <div className={styles.paddingWrapper}>
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Accordion;
