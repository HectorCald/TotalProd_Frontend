import React from 'react';
import { BoxIcon } from 'boxicons-react';
import './InicioPC.css';

const InicioEmpleadoPC = ({ onViewOpen }) => {
  return (
    <div className="inicio-pc-container">
      {/* Mensaje de restricción para empleados */}
      <div className="noData">
        <BoxIcon
          name="lock"
          className="noDataIcon"
        />
        <p className="noDataTitle">Inicio para empleados</p>
        <p className="noDataDescription">
          Como empleado, no puedes ver los graficos o atajos de módulos en la pantalla de inicio usa el menú lateral para acceder a los módulos.
        </p>
      </div>
    </div>
  );
};

export default InicioEmpleadoPC;
