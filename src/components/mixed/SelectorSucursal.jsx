import React, { useState, useEffect, useRef, useCallback } from 'react';
import Select from '../common/old/Select';
import sucursalesService from '../../services/sucursalesService';
import { useUser } from '../../context/UserContext';
import { useEmployee } from '../../context/EmployeeContext';
import useSessionCache from '../../hooks/useSessionCache';

function SelectorSucursal({ 
    value, 
    onChange, 
    disabled = false, 
    placeholder = 'Sucursal de destino (obligatorio)',
    excludeCurrentSucursal = true,
    openUpward = true
}) {
    const { sucursalSeleccionada: userSucursal } = useUser();
    const { sucursalSeleccionada: employeeSucursal } = useEmployee();
    
    const sucursalActual = userSucursal || employeeSucursal;
    const empresaId = sucursalActual?.empresas?.id || null;
    
    // Usar useSessionCache para persistir las sucursales en la sesión
    const {
        value: sucursalesCache,
        setValue: setSucursalesCache,
        hasCache: hasSucursalesCache
    } = useSessionCache({
        key: 'ListadoSucursales',
        defaultValue: []
    });
    
    const [sucursales, setSucursales] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const defaultValueSetRef = useRef(false);

    // Función para cargar sucursales desde el servicio
    const cargarSucursales = useCallback(async (showLoading = true) => {
        if (!empresaId) {
            setSucursales([]);
            setError('No hay empresa seleccionada');
            return;
        }

        if (showLoading) {
            setLoading(true);
        }
        setError(null);
        
        try {
            const response = await sucursalesService.getByEmpresaId(empresaId);
            
            if (response.success && response.data) {
                // Guardar en cache sin filtrar
                setSucursalesCache(response.data);
                
                let sucursalesFiltradas = response.data;
                
                // Filtrar la sucursal actual si se requiere
                if (excludeCurrentSucursal && sucursalActual?.id) {
                    sucursalesFiltradas = sucursalesFiltradas.filter(
                        sucursal => sucursal.id !== sucursalActual.id
                    );
                }
                
                // Mapear a formato de opciones (incluir empresa_id)
                const opciones = sucursalesFiltradas.map(sucursal => ({
                    value: sucursal.id,
                    label: sucursal.name,
                    id: sucursal.id,
                    name: sucursal.name,
                    empresa_id: sucursal.empresas?.id || null
                }));
                
                setSucursales(opciones);
                defaultValueSetRef.current = false; // Reset cuando se cargan nuevas sucursales
            } else {
                setError(response.message || 'Error al cargar sucursales');
                setSucursales([]);
            }
        } catch (err) {
            console.error('Error cargando sucursales:', err);
            setError('Error al cargar sucursales');
            setSucursales([]);
        } finally {
            if (showLoading) {
                setLoading(false);
            }
        }
    }, [empresaId, excludeCurrentSucursal, sucursalActual?.id, setSucursalesCache]);

    // Cargar desde cache primero, luego actualizar en segundo plano
    useEffect(() => {
        if (!empresaId) {
            setSucursales([]);
            setError('No hay empresa seleccionada');
            return;
        }

        // Si hay cache, usarlo inmediatamente
        if (hasSucursalesCache && sucursalesCache.length > 0) {
            let sucursalesFiltradas = sucursalesCache;
            
            // Filtrar la sucursal actual si se requiere
            if (excludeCurrentSucursal && sucursalActual?.id) {
                sucursalesFiltradas = sucursalesFiltradas.filter(
                    sucursal => sucursal.id !== sucursalActual.id
                );
            }
            
            // Mapear a formato de opciones (incluir empresa_id)
            const opciones = sucursalesFiltradas.map(sucursal => ({
                value: sucursal.id,
                label: sucursal.name,
                id: sucursal.id,
                name: sucursal.name,
                empresa_id: sucursal.empresas?.id || null
            }));
            
            setSucursales(opciones);
            setLoading(false);
            
            // Actualizar en segundo plano sin mostrar loading
            cargarSucursales(false);
        } else {
            // Si no hay cache, cargar normalmente con loading
            cargarSucursales(true);
        }
    }, [empresaId, excludeCurrentSucursal, sucursalActual?.id, hasSucursalesCache, sucursalesCache, cargarSucursales]);

    // Establecer "Casa Matriz" como valor por defecto solo una vez cuando se cargan las sucursales
    useEffect(() => {
        if (!defaultValueSetRef.current && !value && sucursales.length > 0 && onChange) {
            const casaMatriz = sucursales.find(sucursal => sucursal.label === 'Casa Matriz');
            if (casaMatriz) {
                defaultValueSetRef.current = true;
                onChange(casaMatriz.value);
            }
        }
    }, [sucursales, value, onChange]);

    return (
        <Select
            value={value}
            onChange={onChange}
            options={sucursales}
            placeholder={loading ? 'Cargando sucursales...' : (error || placeholder)}
            disabled={disabled || loading || sucursales.length === 0}
            icon='building'
            openUpward={openUpward}
        />
    );
}

export default SelectorSucursal;

