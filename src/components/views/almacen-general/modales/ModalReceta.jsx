import React, { useMemo } from 'react';
import ViewModal from '../../../ui/ViewModal';
import HeaderModal from '../../../common/HeaderModal';
import ListaProfesional from '../../../common/ListaProfesional';
import styles from '../../../../styles/view.module.css';

function formatCantidadIngrediente(detalle) {
    const tm = detalle.products_acopio?.type_measure || {};
    const codeMayor = tm.code || '';
    let codeMenor = tm.code_menor || '';
    let measureValue = tm.value ? Number(tm.value) : null;
    if (!measureValue || !codeMenor) {
        const map = {
            'kg': { v: 1000, m: 'gr' }, 'Kg': { v: 1000, m: 'gr' }, 'KG': { v: 1000, m: 'gr' },
            'l': { v: 1000, m: 'ml' }, 'L': { v: 1000, m: 'ml' }, 'Lt': { v: 1000, m: 'ml' },
            'm': { v: 1000, m: 'mm' },
        };
        const f = map[codeMayor];
        if (f) {
            measureValue = measureValue || f.v;
            codeMenor = codeMenor || f.m;
        }
    }
    const cantidadNum = parseFloat(String(detalle.cantidad ?? '0').replace(',', '.'));
    let valueText = '0';
    if (!isNaN(cantidadNum) && cantidadNum > 0) {
        if (measureValue && cantidadNum < 1) {
            const menor = Math.round(cantidadNum * measureValue);
            valueText = `${menor} ${codeMenor}`;
        } else {
            const rounded = Math.round(cantidadNum * 1000) / 1000;
            const formatted = Number.isInteger(rounded)
                ? `${rounded}`
                : `${rounded}`.replace(/\.0+$/, '').replace(/(\.[0-9]*?)0+$/, '$1');
            valueText = `${formatted} ${codeMayor}`;
        }
    }
    return valueText;
}

function ModalReceta({ isOpen, setIsOpen, productoActual }) {
    const items = useMemo(() => {
        const receta = productoActual?.recetas?.[0];
        if (!receta) return [];

        const descripcion = receta.descripcion?.trim() || 'Sin descripción';
        const detalle = receta.recetas_detalle || [];
        const ingredientes = detalle.map((d, index) => {
            const nombre = d.products_acopio?.name || 'Producto desconocido';
            const cantidad = formatCantidadIngrediente(d);
            return { label: `${nombre} — ${cantidad}` };
        });

        return [
            { label: 'Descripción', children: [{ label: descripcion }] },
            { label: 'Ingredientes', children: ingredientes.length > 0 ? ingredientes : [{ label: 'Sin ingredientes' }] },
        ];
    }, [productoActual?.recetas]);

    const tituloReceta = productoActual?.name ? `Receta: ${productoActual.name}` : 'Receta del producto';

    return (
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderModal
                title="Receta del Producto"
                onClose={() => setIsOpen(false)}
            />
            <div className={styles.modalContent}>
                {items.length > 0 ? (
                    <ListaProfesional
                        items={items}
                    />
                ) : (
                    <p className={styles.subTitle}>Este producto no tiene receta cargada.</p>
                )}
            </div>
        </ViewModal>
    );
}

export default ModalReceta;
