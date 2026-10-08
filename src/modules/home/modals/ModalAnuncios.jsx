import React, { useState } from 'react';
import ModalCentro from '../../../components/common/modals/ModalCentro';
import BotonCuadrante from '../../../components/common/botones/BotonCuadrante';
import ModalEncuestaIA from './ModalEncuestaIA';

const ModalAnuncios = ({ isOpen, onClose }) => {
  const [modalEncuestaOpen, setModalEncuestaOpen] = useState(false);

  const handleOpenEncuesta = () => {
    setModalEncuestaOpen(true);
  };

  return (
    <>
      <ModalCentro
        isOpen={isOpen}
        onClose={onClose}
        title="¡ANUNCIOS!"
        hideFooter={true}
        contentStyle={{ paddingTop: 0 }}
      >
        <div style={{ padding: '6px 0', width: '100%' }}>
          <BotonCuadrante
            anuncio={true}
            icon="bot"
            title="Encuesta sobre IA"
            badge="Sugerido"
            badgeStatus="warning"
            description="¿Dónde te gustaría implementarla y de qué manera te gustaría que te ayude?"
            onClick={handleOpenEncuesta}
          />
        </div>
      </ModalCentro>

      {modalEncuestaOpen && (
        <ModalEncuestaIA
          isOpen={modalEncuestaOpen}
          onClose={() => setModalEncuestaOpen(false)}
        />
      )}
    </>
  );
};

export default ModalAnuncios;
