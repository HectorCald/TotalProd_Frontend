import React from 'react';
import View from '../../ui/View';
import Dato from '../../common/Dato';
import styles from '../../../styles/view.module.css';
import HeaderView from '../../common/HeaderView';

const VerBalance = ({ isOpen, setIsOpen, datosBalance, gastosData, movimientosAlmacen }) => {
  // Calcular totales detallados
  const calcularDetallesIngresos = () => {
    if (!movimientosAlmacen) return { totalVentas: 0, totalEfectivo: 0, totalOtros: 0 };

    const ventas = movimientosAlmacen.filter(mov => mov.type === 'salida');
    const totalVentas = ventas.length;
    
    let totalEfectivo = 0;
    let totalOtros = 0;

    ventas.forEach(venta => {
      if (venta.productos && venta.productos.length > 0) {
        const totalVenta = venta.productos.reduce((sum, prod) => {
          return sum + (prod.cantidad * prod.precio_unitario);
        }, 0);

        // Revisar el método de pago real de la venta
        if (venta.metodo_pago === 'efectivo') {
          totalEfectivo += totalVenta;
        } else {
          totalOtros += totalVenta;
        }
      }
    });

    return { totalVentas, totalEfectivo, totalOtros };
  };

  const calcularDetallesEgresos = () => {
    if (!gastosData) return { totalGastos: 0, totalEfectivo: 0, totalOtros: 0 };

    const totalGastos = gastosData.length;
    let totalEfectivo = 0;
    let totalOtros = 0;

    gastosData.forEach(gasto => {
      if (gasto.metodo_pago === 'efectivo') {
        totalEfectivo += gasto.valor || 0;
      } else {
        totalOtros += gasto.valor || 0;
      }
    });

    return { totalGastos, totalEfectivo, totalOtros };
  };

  const detallesIngresos = calcularDetallesIngresos();
  const detallesEgresos = calcularDetallesEgresos();

  return (
    <View isOpen={isOpen} setIsOpen={setIsOpen} isMainView={true}>
        <HeaderView onBack={() => setIsOpen(false)} />
      <div className={styles.container}>
       <h1 className={styles.title}>
                     Detalles del Balance

                 </h1>

         {/* Totales Generales */}
         <h3 className={styles.subTitle}>Totales Generales</h3>
         <div className={styles.content}>
           <Dato 
             label="Total Ingresos" 
             value={`Bs. ${datosBalance.ingresos.total.toFixed(2)}`}
             icon="trending-up"
           />
           <Dato 
             label="Total Egresos" 
             value={`Bs. ${datosBalance.salidas.total.toFixed(2)}`}
             icon="trending-down"
           />
           <Dato 
             label="Balance" 
             value={`Bs. ${(datosBalance.ingresos.total - datosBalance.salidas.total).toFixed(2)}`}
             icon="wallet"
             especial={datosBalance.ingresos.total - datosBalance.salidas.total < 0 ? "red" : "green"}
           />
         </div>

         {/* Resumen Ingresos */}
          <h3 className={styles.subTitle}>Resumen Ingresos</h3>
          <div className={styles.content}>
            <Dato 
              label="Total de Ventas" 
              value={detallesIngresos.totalVentas.toString()}
              icon="cart"
            />
            <Dato 
              label="Total Efectivo" 
              value={`Bs. ${detallesIngresos.totalEfectivo.toFixed(2)}`}
              icon="money"
            />
            <Dato 
              label="Total Otros" 
              value={`Bs. ${detallesIngresos.totalOtros.toFixed(2)}`}
              icon="credit-card"
            />
          </div>


        {/* Resumen Egresos */}

          <h3 className={styles.subTitle}>Resumen Egresos</h3>
          <div className={styles.content}>
            <Dato 
              label="Total de Gastos" 
              value={detallesEgresos.totalGastos.toString()}
              icon="receipt"
            />
            <Dato 
              label="Total Efectivo" 
              value={`Bs. ${detallesEgresos.totalEfectivo.toFixed(2)}`}
              icon="money"
            />
            <Dato 
              label="Total Otros" 
              value={`Bs. ${detallesEgresos.totalOtros.toFixed(2)}`}
              icon="credit-card"
            />
          </div>
        </div>
    </View>
  );
};

export default VerBalance;
