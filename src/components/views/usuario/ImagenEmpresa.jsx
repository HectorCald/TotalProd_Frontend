import React, { useState, useRef, useEffect } from 'react';
import styles from '../../../styles/view.module.css';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/HeaderModal';
import ItemView from '../../common/ItemView';
import Boton from '../../common/Boton';
import Notification from '../../common/Notification';
import { BoxIcon } from 'boxicons-react';
import EmpresaImagenService from '../../../services/empresaImagenService';
import { useUser } from '../../../context/UserContext';
import { useEmployee } from '../../../context/EmployeeContext';

const ImagenEmpresa = ({ isOpen, setIsOpen, currentImage, onImageChange, empresaId }) => {
    const [previewImage, setPreviewImage] = useState(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [serverImage, setServerImage] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [notification, setNotification] = useState({ isVisible: false, type: 'success', text: '' });
    const [isZoomOpen, setIsZoomOpen] = useState(false);
    const fileInputRef = useRef(null);

    // Obtener contextos
    const { updateEmpresaImage: updateUserImage } = useUser();
    const { updateEmpresaImage: updateEmployeeImage } = useEmployee();

    // Función para mostrar notificaciones
    const mostrarNotificacion = (tipo, texto) => {
        setNotification({
            isVisible: true,
            type: tipo,
            text: texto
        });

        // Auto-ocultar después de 3 segundos
        setTimeout(() => {
            setNotification(prev => ({ ...prev, isVisible: false }));
        }, 3000);
    };

    // Actualizar currentImage cuando serverImage cambie
    useEffect(() => {
        if (serverImage && onImageChange) {
            onImageChange(serverImage);
        }
    }, [serverImage, onImageChange]);

    const handleClose = () => {
        setIsOpen(false);
        setPreviewImage(null);
        setIsDragOver(false);
        setError(null);
        setLoading(false);
        setProcessing(false);
        // No limpiar serverImage para mantener la imagen actual
    };

    const handleFileSelect = async (file) => {
        try {
            setError(null);
            setProcessing(true);
            EmpresaImagenService.validateImageFile(file);
            
            // Comprimir y recortar la imagen
            const processedImage = await compressAndCropImage(file);
            setPreviewImage(processedImage);
        } catch (error) {
            setError(error.message);
        } finally {
            setProcessing(false);
        }
    };

    const handleFileInputChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleSave = async () => {
        if (!previewImage) return;

        try {
            setLoading(true);
            setError(null);

            if (!empresaId) {
                mostrarNotificacion('error', 'No se encontró el ID de la empresa. Contacta al administrador.');
                return;
            }

            // Convertir la imagen a base64 si es necesario
            let imageBase64 = previewImage;
            if (previewImage.startsWith('data:image/')) {
                imageBase64 = previewImage;
            }

            let response;
            if (serverImage) {
                // Actualizar imagen existente
                response = await EmpresaImagenService.updateImage(imageBase64, empresaId);
            } else {
                // Crear nueva imagen
                response = await EmpresaImagenService.createImage(imageBase64, empresaId);
            }

            if (response.success) {
                // Limpiar preview ya que se guardó
                setPreviewImage(null);
                
                // Actualizar contextos con la nueva URL
                updateUserImage(response.data.secure_url);
                updateEmployeeImage(response.data.secure_url);
                
                // Notificar al componente padre del cambio con la nueva URL
                if (onImageChange) {
                    onImageChange(response.data.secure_url, 'success', 'Imagen guardada correctamente');
                }
                
                handleClose();
            } else {
                // Notificar al componente padre del error
                if (onImageChange) {
                    onImageChange(null, 'error', response.message || 'Error al guardar la imagen');
                }
            }
        } catch (error) {
            console.error('Error saving image:', error);
            // Notificar al componente padre del error
            if (onImageChange) {
                if (error.message && error.message.includes('No se encontró la empresa del usuario')) {
                    onImageChange(null, 'error', 'No se encontró la empresa del usuario. Contacta al administrador.');
                } else {
                    onImageChange(null, 'error', 'Error al guardar la imagen');
                }
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setPreviewImage(null);
        handleClose();
    };

    const handleClickUpload = () => {
        fileInputRef.current?.click();
    };

    const handleImageClick = () => {
        if (displayImage) {
            setIsZoomOpen(true);
        }
    };

    const handleDeleteImage = async () => {
        try {
            console.log('🚀🚀🚀 HANDLE DELETE IMAGE CALLED IN COMPONENT 🚀🚀🚀');
            setLoading(true);
            setError(null);

            if (!empresaId) {
                mostrarNotificacion('error', 'No se encontró el ID de la empresa. Contacta al administrador.');
                return;
            }

            console.log('About to call EmpresaImagenService.deleteImage() with empresaId:', empresaId);
            const response = await EmpresaImagenService.deleteImage(empresaId);

            if (response.success) {
                // Limpiar todas las imágenes
                setPreviewImage(null);
                setServerImage(null);
                
                // Actualizar contextos
                updateUserImage(null);
                updateEmployeeImage(null);
                
                // Notificar al componente padre del cambio
                if (onImageChange) {
                    onImageChange(null);
                }
                
                // Cerrar el modal de zoom
                setIsZoomOpen(false);
                
                // Notificar al componente padre del éxito
                if (onImageChange) {
                    onImageChange(null, 'success', 'Imagen eliminada correctamente');
                }
            } else {
                // Notificar al componente padre del error
                if (onImageChange) {
                    onImageChange(null, 'error', response.message || 'Error al eliminar la imagen');
                }
            }
        } catch (error) {
            console.error('Error deleting image:', error);
            // Notificar al componente padre del error
            if (onImageChange) {
                onImageChange(null, 'error', 'Error al eliminar la imagen');
            }
        } finally {
            setLoading(false);
        }
    };

    // Función para comprimir y recortar la imagen
    const compressAndCropImage = async (file) => {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                try {
                    const { width, height } = img;
                    let cropX = 0, cropY = 0, cropWidth = width, cropHeight = height;

                    // Determinar si es cuadrado, horizontal o vertical
                    if (width === height) {
                        // Es cuadrado, no recortar
                        cropWidth = width;
                        cropHeight = height;
                    } else if (width > height) {
                        // Es horizontal, recortar los lados
                        const sideCrop = (width - height) / 2;
                        cropX = sideCrop;
                        cropY = 0;
                        cropWidth = height;
                        cropHeight = height;
                    } else {
                        // Es vertical, recortar arriba y abajo
                        const topBottomCrop = (height - width) / 2;
                        cropX = 0;
                        cropY = topBottomCrop;
                        cropWidth = width;
                        cropHeight = width;
                    }

                    // Configurar el canvas con el tamaño final
                    canvas.width = cropWidth;
                    canvas.height = cropHeight;

                    // Dibujar la imagen recortada
                    ctx.drawImage(
                        img,
                        cropX, cropY, cropWidth, cropHeight,
                        0, 0, cropWidth, cropHeight
                    );

                    // Comprimir la imagen hasta que sea menor a 3MB
                    let quality = 0.9;
                    let dataURL = canvas.toDataURL('image/jpeg', quality);

                    // Verificar el tamaño y reducir calidad si es necesario
                    while (getBase64Size(dataURL) > 3 * 1024 * 1024 && quality > 0.1) {
                        quality -= 0.1;
                        dataURL = canvas.toDataURL('image/jpeg', quality);
                    }

                    // Si aún es muy grande, reducir el tamaño de la imagen
                    if (getBase64Size(dataURL) > 3 * 1024 * 1024) {
                        const scaleFactor = Math.sqrt((3 * 1024 * 1024) / getBase64Size(dataURL));
                        const newWidth = Math.floor(cropWidth * scaleFactor);
                        const newHeight = Math.floor(cropHeight * scaleFactor);

                        canvas.width = newWidth;
                        canvas.height = newHeight;

                        ctx.drawImage(
                            img,
                            cropX, cropY, cropWidth, cropHeight,
                            0, 0, newWidth, newHeight
                        );

                        dataURL = canvas.toDataURL('image/jpeg', 0.8);
                    }

                    resolve(dataURL);
                } catch (error) {
                    reject(new Error('Error al procesar la imagen: ' + error.message));
                }
            };

            img.onerror = () => {
                reject(new Error('Error al cargar la imagen'));
            };

            img.src = URL.createObjectURL(file);
        });
    };

    // Función para calcular el tamaño de una cadena base64
    const getBase64Size = (base64String) => {
        const padding = base64String.endsWith('==') ? 2 : base64String.endsWith('=') ? 1 : 0;
        return (base64String.length * 3) / 4 - padding;
    };

    // Función para generar iniciales del nombre de la empresa
    const generateInitials = (name) => {
        if (!name) return 'E';
        const words = name.trim().split(' ').filter(word => word.length > 0);
        if (words.length === 1) {
            return words[0].charAt(0).toUpperCase();
        } else if (words.length >= 2) {
            return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
        }
        return 'E';
    };

    // Función para generar color basado en la letra
    const generateColor = (letter) => {
        const colors = {
            'A': '#E74C3C', 'B': '#3498DB', 'C': '#9B59B6', 'D': '#2ECC71',
            'E': '#F39C12', 'F': '#E67E22', 'G': '#1ABC9C', 'H': '#F1C40F',
            'I': '#8E44AD', 'J': '#2980B9', 'K': '#D35400', 'L': '#27AE60',
            'M': '#C0392B', 'N': '#34495E', 'O': '#E67E22', 'P': '#8E44AD',
            'Q': '#16A085', 'R': '#E74C3C', 'S': '#9B59B6', 'T': '#2ECC71',
            'U': '#F39C12', 'V': '#8E44AD', 'W': '#3498DB', 'X': '#E67E22',
            'Y': '#9B59B6', 'Z': '#16A085'
        };
        const upperLetter = letter.toUpperCase();
        return colors[upperLetter] || '#7F8C8D';
    };

    const displayImage = previewImage || serverImage || currentImage;
    const initials = generateInitials('Empresa');
    const initialsColor = generateColor(initials.charAt(0));

    return (
        <>
            <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
                <HeaderModal
                    title="Cambiar imagen de empresa"
                    onClose={handleClose}
                />
                <div className={styles.modalContent}>
                    <div className={styles.imagePreviewContainer}>
                        <ItemView
                            title={displayImage ? "Logo actual" : "Nuevo logo"}
                            description={displayImage ? "Esta es la imagen que se mostrará en tu perfil" : "Selecciona una imagen para tu empresa"}
                            circulo={true}
                            transparent={false}
                            style={{ 
                                padding: '20px', 
                                minHeight: 'auto',
                            }}
                            icon={displayImage ? undefined : 'building'}
                            customIcon={displayImage ? (
                                <div 
                                    style={{ 
                                        width: '50px',
                                        height: '50px',
                                        borderRadius: '10px',
                                        backgroundImage: `url(${displayImage})`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        backgroundRepeat: 'no-repeat',
                                        cursor: 'pointer',
                                        transition: 'transform 0.2s ease'
                                    }}
                                    onClick={handleImageClick}
                                    onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                                    onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                                />
                            ) : undefined}
                        />
                    </div>

                    <div 
                        className={`${styles.uploadArea} ${isDragOver ? styles.uploadAreaDragOver : ''} ${processing ? styles.uploadAreaProcessing : ''}`}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onClick={processing ? undefined : handleClickUpload}
                    >
                        <div className={styles.uploadContent}>
                            {processing ? (
                                <>
                                    <BoxIcon name="loader-circle" className={styles.processingIcon} />
                                    <p className={styles.uploadText}>
                                        Procesando imagen...
                                    </p>
                                    <p className={styles.uploadSubtext}>
                                        Comprimiendo y recortando
                                    </p>
                                </>
                            ) : (
                                <>
                                    <BoxIcon name="cloud-upload" className={styles.uploadIcon} />
                                    <p className={styles.uploadText}>
                                        {isDragOver ? 'Suelta la imagen aquí' : 'Arrastra una imagen aquí o haz clic para seleccionar'}
                                    </p>
                                    <p className={styles.uploadSubtext}>
                                        Formato recomendado: PNG con fondo transparente (máx. 3MB)
                                    </p>
                                </>
                            )}
                        </div>
                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileInputChange}
                        disabled={processing}
                        style={{ display: 'none' }}
                    />

                    <div className={styles.buttons}>
                        <Boton
                            className='btn-default'
                            label='Cancelar'
                            style={{ marginTop: 'auto' }}
                            onClick={handleCancel}
                            disabled={loading || processing}
                        />
                        <Boton
                            className='btn-original'
                            label={loading ? 'Guardando...' : processing ? 'Procesando...' : 'Guardar cambios'}
                            style={{ marginTop: 'auto' }}
                            onClick={handleSave}
                            disabled={!previewImage || loading || processing}
                            loading={loading || processing}
                        />
                    </div>
                </div>
                
                <Notification
                    isVisible={notification.isVisible}
                    type={notification.type}
                    text={notification.text}
                />
            </ViewModal>
            
            {/* Modal de zoom para la imagen */}
            <ViewModal isOpen={isZoomOpen} setIsOpen={setIsZoomOpen}>
                <HeaderModal
                    title="Vista previa de la imagen"
                    onClose={() => setIsZoomOpen(false)}
                />
                <div className={styles.modalContent} style={{ padding: '20px', textAlign: 'center' }}>
                    {displayImage && (
                        <div style={{ 
                            maxWidth: '100%', 
                            maxHeight: '70vh', 
                            display: 'flex', 
                            justifyContent: 'center', 
                            alignItems: 'center' 
                        }}>
                            <img 
                                src={displayImage} 
                                alt="Imagen de empresa" 
                                style={{ 
                                    maxWidth: '100%', 
                                    maxHeight: '70vh', 
                                    objectFit: 'contain',
                                    borderRadius: '10px',
                                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
                                }} 
                            />
                        </div>
                    )}
                    
                    {/* Botones de acción */}
                    <div className={styles.buttons}>
                        <Boton
                            className='btn-red'
                            label='Eliminar imagen'
                            style={{ marginTop: 'auto' }}
                            onClick={handleDeleteImage}
                            disabled={loading}
                            loading={loading}
                        />
                    </div>
                </div>
            </ViewModal>
        </>
    );
};

export default ImagenEmpresa;