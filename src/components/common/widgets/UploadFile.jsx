import React, { useRef, useState } from 'react';
import { BoxIcon } from 'boxicons-react';
import styles from './UploadFile.module.css';

const UploadFile = ({ onFileSelect, maxMb = 50, acceptedTypes = '.xlsx, .csv, .json', style, className }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleClick = (e) => {
    if (e.target !== fileInputRef.current) {
      fileInputRef.current?.click();
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
      // Resetear el valor para permitir seleccionar el mismo archivo si se editó
      e.target.value = null;
    }
  };

  return (
    <div 
      className={`${styles.container} ${isDragging ? styles.dragging : ''} ${className || ''}`}
      style={style}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleChange} 
        className={styles.hiddenInput} 
        accept={acceptedTypes}
      />
      <div className={styles.iconWrapper}>
        <BoxIcon name="file-blank" className={styles.icon} />
        <BoxIcon name="up-arrow-alt" className={styles.arrowIcon} />
      </div>
      <h3 className={styles.title}>Haz clic o arrastra el archivo a esta área para subirlo</h3>
      <p className={styles.subtitle}>Soporta {acceptedTypes} (máx. {maxMb}MB)</p>
    </div>
  );
};

export default UploadFile;
