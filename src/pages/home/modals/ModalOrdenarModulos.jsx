import React, { useState, useEffect, useRef } from 'react';
import ModalLateral from '../../../components/common/modals/ModalLateral';
import Mensaje from '../../../components/common/outputs/Mensaje';
import Link from '../../../components/common/outputs/Link';
import styles from './ModalOrdenarModulos.module.css';

const ModalOrdenarModulos = ({ isOpen, onClose, modules = [], storageKey = 'home_modules_order', onSave }) => {
  const [items, setItems] = useState([]);
  const [dragState, setDragState] = useState(null);
  const dragStateRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      try {
        const savedOrderRaw = localStorage.getItem(storageKey);
        if (savedOrderRaw) {
          const savedOrder = JSON.parse(savedOrderRaw);
          if (Array.isArray(savedOrder)) {
            const sorted = [...modules].sort((a, b) => {
              const indexA = savedOrder.indexOf(a.id);
              const indexB = savedOrder.indexOf(b.id);
              if (indexA === -1 && indexB === -1) return 0;
              if (indexA === -1) return 1;
              if (indexB === -1) return -1;
              return indexA - indexB;
            });
            setItems(sorted);
            return;
          }
        }
      } catch (e) {
        console.error('Error loading module order from localStorage:', e);
      }
      setItems([...modules]);
    }
  }, [isOpen, modules, storageKey]);

  const handlePointerDown = (e, index) => {
    if (e.button !== 0 && e.button !== undefined) return;
    e.preventDefault();

    const handleElem = e.currentTarget;
    const itemElem = handleElem.closest('[data-item-index]');
    if (!itemElem) return;

    const rect = itemElem.getBoundingClientRect();

    const remaining = items.filter((_, i) => i !== index);
    const initialOver = Math.min(index, remaining.length);

    const initialDragState = {
      sourceIndex: index,
      draggedItem: items[index],
      overIndex: initialOver,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
    };

    dragStateRef.current = initialDragState;
    setDragState(initialDragState);

    const handleWindowPointerMove = (moveEvent) => {
      if (!dragStateRef.current) return;
      if (moveEvent.cancelable) moveEvent.preventDefault();

      const { offsetX, offsetY } = dragStateRef.current;
      const currentX = moveEvent.clientX - offsetX;
      const currentY = moveEvent.clientY - offsetY;

      let targetIndex = 0;
      if (listRef.current) {
        const itemElements = listRef.current.querySelectorAll('[data-remaining-index]');
        targetIndex = itemElements.length;

        for (let i = 0; i < itemElements.length; i++) {
          const itemRect = itemElements[i].getBoundingClientRect();
          const midY = itemRect.top + itemRect.height / 2;
          if (moveEvent.clientY < midY) {
            targetIndex = i;
            break;
          }
        }
      }

      dragStateRef.current.overIndex = targetIndex;
      dragStateRef.current.x = currentX;
      dragStateRef.current.y = currentY;

      setDragState({ ...dragStateRef.current });
    };

    const handleWindowPointerUp = () => {
      window.removeEventListener('pointermove', handleWindowPointerMove);
      window.removeEventListener('pointerup', handleWindowPointerUp);
      window.removeEventListener('pointercancel', handleWindowPointerUp);

      if (!dragStateRef.current) return;
      const { sourceIndex, overIndex, draggedItem } = dragStateRef.current;

      setItems((prev) => {
        const remainingItems = prev.filter((_, i) => i !== sourceIndex);
        const updated = [...remainingItems];
        updated.splice(overIndex, 0, draggedItem);
        return updated;
      });

      dragStateRef.current = null;
      setDragState(null);
    };

    window.addEventListener('pointermove', handleWindowPointerMove, { passive: false });
    window.addEventListener('pointerup', handleWindowPointerUp);
    window.addEventListener('pointercancel', handleWindowPointerUp);
  };

  const handleConfirm = () => {
    const orderIds = items.map((item) => item.id);
    try {
      localStorage.setItem(storageKey, JSON.stringify(orderIds));
    } catch (e) {
      console.error('Error saving module order to localStorage:', e);
    }
    if (onSave) {
      onSave(orderIds);
    }
    onClose();
  };

  const handleReset = () => {
    try {
      localStorage.removeItem(storageKey);
    } catch (e) {
      console.error('Error resetting module order:', e);
    }
    setItems([...modules]);
    if (onSave) {
      onSave(modules.map((item) => item.id));
    }
  };

  const renderList = () => {
    if (!dragState) {
      return items.map((item, index) => (
        <div
          key={item.id}
          data-item-index={index}
          className={styles.item}
        >
          <div className={styles.itemLeft}>
            <div
              className={styles.dragHandle}
              title="Presiona y arrastra para mover"
              onPointerDown={(e) => handlePointerDown(e, index)}
            >
              <i className="bx bx-menu"></i>
            </div>
            <div className={styles.moduleIconWrapper}>
              <i className={`bx bx-${item.icon}`}></i>
            </div>
            <span className={styles.itemTitle}>{item.title}</span>
          </div>
        </div>
      ));
    }

    const remaining = items.filter((_, i) => i !== dragState.sourceIndex);
    const elements = [];

    for (let i = 0; i <= remaining.length; i++) {
      if (i === dragState.overIndex) {
        elements.push(
          <div
            key="__drop_placeholder__"
            className={styles.dropPlaceholder}
            style={{ height: `${dragState.height}px` }}
          >
            <div className={styles.dropPlaceholderInner}>
              <i className="bx bx-down-arrow-alt"></i>
              <span>Mover aquí</span>
            </div>
          </div>
        );
      }

      if (i < remaining.length) {
        const item = remaining[i];
        elements.push(
          <div
            key={item.id}
            data-remaining-index={i}
            className={styles.item}
          >
            <div className={styles.itemLeft}>
              <div className={styles.dragHandle} style={{ cursor: 'grabbing' }}>
                <i className="bx bx-menu"></i>
              </div>
              <div className={styles.moduleIconWrapper}>
                <i className={`bx bx-${item.icon}`}></i>
              </div>
              <span className={styles.itemTitle}>{item.title}</span>
            </div>
          </div>
        );
      }
    }

    return elements;
  };

  return (
    <ModalLateral
      isOpen={isOpen}
      onClose={onClose}
      title="Organizar Módulos"
      confirmText="Guardar"
      onConfirm={handleConfirm}
    >
      <div className={styles.container}>
        <Mensaje
          type="info"
          message="Mantén presionado las 3 lineas de cualquier módulo para arrastrarlo y moverlo a la posición que desees."
        />

        <div className={styles.list} ref={listRef}>
          {renderList()}
        </div>

        {dragState && (
          <div
            className={styles.floatingGhost}
            style={{
              left: `${dragState.x}px`,
              top: `${dragState.y}px`,
              width: `${dragState.width}px`,
              height: `${dragState.height}px`,
            }}
          >
            <div className={styles.itemLeft}>
              <div className={styles.dragHandle} style={{ cursor: 'grabbing' }}>
                <i className="bx bx-menu"></i>
              </div>
              <div className={styles.moduleIconWrapper}>
                <i className={`bx bx-${dragState.draggedItem.icon}`}></i>
              </div>
              <span className={styles.itemTitle}>{dragState.draggedItem.title}</span>
            </div>
          </div>
        )}

        <div className={styles.resetBtnWrapper}>
          <Link
            text="Restablecer orden predeterminado"
            onClick={handleReset}
            iconStart="refresh"
            align="flex-start"
          />
        </div>
      </div>
    </ModalLateral>
  );
};

export default ModalOrdenarModulos;
