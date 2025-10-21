import React from 'react';
import AtajoAnuncio from '../common/AtajoAnuncio';
import SalesCard from '../ui/SalesCard';
import SalesChart from '../ui/SalesChart';
import almacenImage from '../../assets/almacen.png';
import acopioImage from '../../assets/acopio.png';
import movimientosImage from '../../assets/movimientos.png';
import pedidosImage from '../../assets/pedidos.png';
import './InicioPC.css';

const InicioPC = ({ onViewOpen, sucuId = 1 }) => {
  
  return (
    <div className="inicio-pc-container">
      {/* Atajos de Acceso Rápido */}
      <div className="atajoAnuncioOtros">
        <AtajoAnuncio 
          title="Almacén General" 
          description="Administra tu almacén de productos terminados" 
          image={almacenImage} 
          onClick={() => onViewOpen('almacenMedioGeneral')} 
        />
        <AtajoAnuncio 
          title="Materia Prima" 
          description="Administra tu materia prima" 
          image={acopioImage} 
          onClick={() => onViewOpen('almacenMedio')} 
        />
      </div>
      <div className="atajoAnuncioOtros" style={{ marginTop: '10px' }}>
        <AtajoAnuncio 
          title="Movimientos" 
          description="Gestiona movimientos de inventario" 
          image={movimientosImage} 
          onClick={() => onViewOpen('movimientos')} 
        />
        <AtajoAnuncio 
          title="Pedidos" 
          description="Administra pedidos y órdenes" 
          image={pedidosImage} 
          onClick={() => onViewOpen('pedidos')} 
        />
      </div>

      {/* Cards de Estadísticas lado a lado */}
      <div style={{ marginTop: '5px', display: 'flex', gap: '10px' }}>
        <div style={{ flex: 1 }}>
          <SalesCard sucuId={sucuId} />
        </div>
        <div style={{ flex: 1 }}>
          <SalesChart sucuId={sucuId} />
        </div>
      </div>
    </div>
  );
};

export default InicioPC;