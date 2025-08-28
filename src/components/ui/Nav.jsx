import React, { useState } from 'react';
import styles from './Nav.module.css';
import { BoxIcon } from 'boxicons-react';
import Usuario from '../views/usuario/Usuario';

const Nav = () => {
    const [isOpen, setIsOpen] = useState(false);

    const handleOpen = () => {
        setIsOpen(!isOpen);
    }

    return (
        <div className={styles.navContainer}>
            <div className={styles.navContent}>
                <h1 className={styles.navTitle}>Total<span className={styles.navTitleSpan}>Prod</span></h1>
                <button className={styles.icon} onClick={handleOpen}>
                    <BoxIcon name='user' />
                </button>
            </div>
            <Usuario isOpen={isOpen} setIsOpen={setIsOpen}/>
        </div>
    );
};

export default Nav;