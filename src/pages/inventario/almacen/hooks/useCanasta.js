import { useState, useCallback } from 'react';

export const useCanasta = () => {
  const [canasta, setCanasta] = useState([]);
  const [modoAgrupacion, setModoAgrupacion] = useState('unidad');

  const agregarProducto = useCallback((producto, modo = 'VENTA') => {
    setCanasta(prev => {
      const existe = prev.find(p => p.id === producto.id);
      const qty = existe ? existe.cantidad : 0;
      
      const rawStock = Number(producto.stock || 0);
      const esPorGrupo = modoAgrupacion === 'grupo' && producto.grup && producto.grup > 0;
      const baseStockValue = esPorGrupo ? Math.floor(rawStock / Number(producto.grup)) : rawStock;

      if ((modo === 'VENTA' || modo === 'VENTA_COTIZACION' || modo === 'ENTREGA_PEDIDO') && qty >= baseStockValue) {
        return prev;
      }

      if (existe) {
        return prev.map(p => p.id === producto.id ? { ...p, cantidad: (p.cantidad || 1) + 1 } : p);
      }
      return [...prev, { ...producto, cantidad: 1 }];
    });
  }, [modoAgrupacion]);

  const eliminarProducto = useCallback((id) => {
    setCanasta(prev => prev.filter(p => p.id !== id));
  }, []);

  const actualizarCantidad = useCallback((id, cantidad) => {
    setCanasta(prev => prev.map(p => p.id === id ? { ...p, cantidad } : p));
  }, []);

  const actualizarPrecio = useCallback((id, precioCustom) => {
    setCanasta(prev => prev.map(p => p.id === id ? { ...p, precioCustom } : p));
  }, []);

  const vaciarCanasta = useCallback(() => {
    setCanasta([]);
  }, []);

  return {
    canasta,
    modoAgrupacion,
    setModoAgrupacion,
    agregarProducto,
    eliminarProducto,
    actualizarCantidad,
    actualizarPrecio,
    vaciarCanasta
  };
};
