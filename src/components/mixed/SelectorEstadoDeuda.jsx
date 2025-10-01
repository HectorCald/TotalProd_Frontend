import React, { useState } from 'react';
import { BoxIcon } from 'boxicons-react';
import styles from '../../styles/view.module.css';

function SelectorEstadoDeuda({ value, onChange }) {
    const [isOpen, setIsOpen] = useState(false);

    const estados = [
        { value: 'pendiente', label: 'Pendiente', color: '#f39c12', icon: 'time' },
        { value: 'pagada', label: 'Pagada', color: '#27ae60', icon: 'check-circle' },
        { value: 'vencida', label: 'Vencida', color: '#e74c3c', icon: 'x-circle' }
    ];

    const estadoSeleccionado = estados.find(estado => estado.value === value) || estados[0];

    const handleEstadoClick = (estado) => {
        onChange(estado.value);
        setIsOpen(false);
    };

    return (
        <div className={styles.selectorContainer}>
            <div 
                className={styles.selectorButton}
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    border: `2px solid ${estadoSeleccionado.color}`,
                    borderRadius: '8px',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    backgroundColor: 'white',
                    marginBottom: '10px'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <BoxIcon 
                        name={estadoSeleccionado.icon} 
                        size="20px" 
                        color={estadoSeleccionado.color}
                    />
                    <span style={{ 
                        color: estadoSeleccionado.color,
                        fontWeight: 'bold'
                    }}>
                        {estadoSeleccionado.label}
                    </span>
                </div>
                <BoxIcon 
                    name={isOpen ? 'chevron-up' : 'chevron-down'} 
                    size="20px" 
                    color="#666"
                />
            </div>

            {isOpen && (
                <div 
                    className={styles.selectorDropdown}
                    style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        backgroundColor: 'white',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                        zIndex: 1000,
                        maxHeight: '200px',
                        overflowY: 'auto'
                    }}
                >
                    {estados.map((estado) => (
                        <div
                            key={estado.value}
                            className={styles.selectorOption}
                            onClick={() => handleEstadoClick(estado)}
                            style={{
                                padding: '12px 16px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                cursor: 'pointer',
                                borderBottom: '1px solid #f0f0f0',
                                backgroundColor: value === estado.value ? '#f8f9fa' : 'white',
                                transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                if (value !== estado.value) {
                                    e.target.style.backgroundColor = '#f8f9fa';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (value !== estado.value) {
                                    e.target.style.backgroundColor = 'white';
                                }
                            }}
                        >
                            <BoxIcon 
                                name={estado.icon} 
                                size="18px" 
                                color={estado.color}
                            />
                            <span style={{ 
                                color: estado.color,
                                fontWeight: value === estado.value ? 'bold' : 'normal'
                            }}>
                                {estado.label}
                            </span>
                            {value === estado.value && (
                                <BoxIcon 
                                    name="check" 
                                    size="16px" 
                                    color={estado.color}
                                    style={{ marginLeft: 'auto' }}
                                />
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default SelectorEstadoDeuda;
