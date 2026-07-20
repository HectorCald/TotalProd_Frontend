import React, { useState, useEffect } from 'react';
import { useLayout } from '../../../context/LayoutContext';
import { useToast } from '../../../context/ToastContext';
import SideBar from '../../../components/essentials/SideBar';
import NavBar from '../../../components/essentials/NavBar';
import MenuSide from '../../../components/essentials/MenuSide';
import styles from '../../../pages/home/View.module.css';
import LayoutGrid from '../../../components/layout/LayoutGrid';
import ItemMultiple from '../../../components/common/information/ItemMultiple';
import empresaService from '../../../services/empresaService';
import VincularSocioModal from './modals/VincularSocioModal';
import useSessionCache from '../../../hooks/useSessionCache';

const Socios = () => {
  const { isLargeScreen } = useLayout();
  const { showSuccess } = useToast();
  
  const { value: sociosDisponibles, setValue: setSociosDisponibles } = useSessionCache({
    key: 'sociosDisponiblesListado',
    defaultValue: []
  });

  const { value: sociosVinculados, setValue: setSociosVinculados } = useSessionCache({
    key: 'sociosVinculadosListado',
    defaultValue: []
  });

  const [isLoading, setIsLoading] = useState(false);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [socioSeleccionado, setSocioSeleccionado] = useState(null);

  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    const fetchSocios = async () => {
      // Solo mostrar loader si no hay datos cacheados
      if (!sessionStorage.getItem('sociosDisponiblesListado') && !sessionStorage.getItem('sociosVinculadosListado')) {
        setIsLoading(true);
      }
      
      const currentEmpresaId = localStorage.getItem('empresa_id');
      const res = await empresaService.getDisponibles(currentEmpresaId);
      if (res && res.success && res.data && res.data.empresas) {
        let sociosLocal = [];
        try {
          const stored = localStorage.getItem('socios');
          if (stored) sociosLocal = JSON.parse(stored);
        } catch (e) {}

        const disponibles = [];
        const vinculados = [];

        res.data.empresas.forEach(empresa => {
          if (sociosLocal.includes(empresa.id)) {
            vinculados.push(empresa);
          } else {
            disponibles.push(empresa);
          }
        });

        setSociosDisponibles(disponibles);
        setSociosVinculados(vinculados);
      }
      setIsLoading(false);
    };
    fetchSocios();
  }, []);

  const handleVincular = (socio) => {
    // Mover a vinculados
    setSociosDisponibles((prev) => prev.filter(s => s.id !== socio.id));
    setSociosVinculados((prev) => [...prev, socio]);
    
    // Guardar en local
    let sociosLocal = [];
    try {
      const stored = localStorage.getItem('socios');
      if (stored) sociosLocal = JSON.parse(stored);
    } catch (e) {}
    if (!sociosLocal.includes(socio.id)) {
      sociosLocal.push(socio.id);
      localStorage.setItem('socios', JSON.stringify(sociosLocal));
    }
    
    // Mostrar Toast
    showSuccess(null, `Te has vinculado exitosamente con la empresa: ${socio.name}`);
  };

  const handleDesvincular = (socio) => {
    // Mover a disponibles
    setSociosVinculados((prev) => prev.filter(s => s.id !== socio.id));
    setSociosDisponibles((prev) => [...prev, socio]);
    
    // Remover del local
    let sociosLocal = [];
    try {
      const stored = localStorage.getItem('socios');
      if (stored) sociosLocal = JSON.parse(stored);
    } catch (e) {}
    sociosLocal = sociosLocal.filter(id => id !== socio.id);
    localStorage.setItem('socios', JSON.stringify(sociosLocal));
    
    // Mostrar Toast
    showSuccess(null, `Te has desvinculado de la empresa: ${socio.name}`);
  };

  return (
    <>
      <NavBar />
      <div className={styles.dashboardContainer}>
        {isLargeScreen && <SideBar />}
        <div className={styles.contentArea}>
          <h1 className={styles.title}>Socios Vinculados</h1>
          <LayoutGrid
            columns={3}
            isLoading={isLoading} // Podría ser otro loading, pero usamos el mismo
            empty={sociosVinculados.length === 0}
            emptyMessage="No tienes socios vinculados aún."
          >
            {sociosVinculados.map((socio) => (
              <ItemMultiple
                key={socio.id}
                title={socio.name || 'Sin nombre'}
                description={socio.description || 'Socio Vinculado'}
                icon={socio.logo_tipo ? undefined : 'building'}
                logo={socio.logo_tipo}
                isHearted={true}
                onHeart={(isVinculado) => {
                  if (!isVinculado) {
                    handleDesvincular(socio);
                  }
                }}
              />
            ))}
          </LayoutGrid>

          <h1 className={styles.title} style={{ marginTop: '24px' }}>Socios Disponibles</h1>
          <LayoutGrid
            columns={3}
            isLoading={isLoading}
            empty={sociosDisponibles.length === 0}
            emptyMessage="No hay socios disponibles para vincular."
          >
            {sociosDisponibles.map((socio) => (
              <ItemMultiple
                key={`${socio.id}-${resetKey}`}
                title={socio.name || 'Sin nombre'}
                description={socio.description || 'Socio'}
                icon={socio.logo_tipo ? undefined : 'building'}
                logo={socio.logo_tipo}
                isHearted={false}
                onHeart={(isVinculado) => {
                  if (isVinculado) {
                    setSocioSeleccionado(socio);
                    setIsModalOpen(true);
                  }
                }}
              />
            ))}
          </LayoutGrid>
        </div>
      </div>

      <VincularSocioModal
        isOpen={isModalOpen}
        onClose={() => {
            setIsModalOpen(false);
            setSocioSeleccionado(null);
            // Revertir estado del corazón visual en el item
            setResetKey(prev => prev + 1);
        }}
        socioSeleccionado={socioSeleccionado}
        onVincular={handleVincular}
      />
      {!isLargeScreen && <MenuSide />}
    </>
  );
};

export default Socios;
