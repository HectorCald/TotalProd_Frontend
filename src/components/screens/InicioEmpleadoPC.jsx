import React from 'react';
import { BoxIcon } from 'boxicons-react';
import './InicioPC.css';

const InicioEmpleadoPC = ({ onViewOpen }) => {
  return (
    <div className="inicio-pc-container">
      {/* Mensaje de restricción para empleados */}
      <div style={{
        textAlign: 'center',
        padding: '60px 20px',
        backgroundColor: 'var(--secondary-color)',
        borderRadius: '12px',
        marginBottom: '30px',
        border: '2px dashed #dee2e6'
      }}>
        <BoxIcon 
          name="lock" 
          size="64px" 
          style={{ 
            color: '#6c757d', 
            marginBottom: '20px',
            display: 'block',
            margin: '0 auto 20px auto'
          }} 
        />
        <h2 style={{ 
          color: '#495057', 
          fontSize: '28px', 
          fontWeight: '600',
          marginBottom: '10px'
        }}>
          No puedes ver estadísticas
        </h2>
        <p style={{ 
          color: '#6c757d', 
          fontSize: '16px',
          maxWidth: '500px',
          margin: '0 auto',
          lineHeight: '1.5'
        }}>
          Como empleado, no tienes permisos para acceder a las estadísticas y gráficos del sistema. 
          Puedes usar las funciones disponibles en el menú lateral.
        </p>
      </div>
    </div>
  );
};

export default InicioEmpleadoPC;
