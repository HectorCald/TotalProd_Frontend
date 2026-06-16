import { useState, useCallback } from 'react';

export const useCanasta = () => {
  const [canasta, setCanasta] = useState([]);

  const agregarProducto = useCallback((producto) => {
    setCanasta(prev => {
      const existe = prev.find(p => p.id === producto.id);
      
      if (existe) {
        return prev.map(p => p.id === producto.id ? { ...p, cantidad: (p.cantidad || 1) + 1 } : p);
      }
      return [...prev, { ...producto, cantidad: 1 }];
    });
  }, []);

  const eliminarProducto = useCallback((id) => {
    setCanasta(prev => prev.filter(p => p.id !== id));
  }, []);

  const actualizarCantidad = useCallback((id, cantidad) => {
    setCanasta(prev => prev.map(p => p.id === id ? { ...p, cantidad } : p));
  }, []);

  const vaciarCanasta = useCallback(() => {
    setCanasta([]);
  }, []);

  return {
    canasta,
    agregarProducto,
    eliminarProducto,
    actualizarCantidad,
    vaciarCanasta
  };
};
