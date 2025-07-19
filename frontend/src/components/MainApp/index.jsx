import "antd/dist/reset.css";

import { Modal } from "antd";
import { memo } from "react";
import { useState } from "react";
import Cropper from "react-easy-crop";
import { useMediaQuery } from "usehooks-ts";

import { exportAllSectorsToPdf } from '../GridInstructions/InstructionSlide';
import HorizontalCanvasFull from '../HorizontalCanvas/HorizontalCanvasFull';
import { Instruction } from './Instruction';
import styles from "./MainApp.module.css";
import OrientationSwitch from "./OrientationSwitch";
import { SettingsUploadedImage } from './SettingsUploadedImage';
import { UploadImage } from './UploadImage';

export const MainApp = memo(
    ({
        previewImage,
        horizontalSvgDataBW,
        previewBW,
        previewSepia,
        showCrop,
        cropImage,
        crop,
        zoom,
        horizontalIdList,
        handleUploadImageFile,
        handleCropCancel,
        handleCropConfirm,
        onCropComplete,
        setCrop,
        setZoom,
        showDemo,
        handleDemoGeneration,
        handleGetInstructions,
        orientation,
        handleOrientationChange,
        horizontalCurrentColor,
        setHorizontalColorCount,
        isCropping,
        isUserImageUploaded,
        isInstructionGenerated,
        selectedInstruction,
        horizontalSvgDataSepia,
    }) => {
        const isPhone = useMediaQuery("(max-width: 600px)");

        const [uploadedImage, setUploadedImage] = useState(null);
        const [isGenerating, setIsGenerating] = useState(false);
        const [uploadedFile, setUploadedFile] = useState(null);
        const [exportProgress, setExportProgress] = useState(0);
        const [isExporting, setIsExporting] = useState(false);
        const [exportStatus, setExportStatus] = useState('');

        const handleGenerate = async () => {
            if (!uploadedFile) return;
            setIsGenerating(true);
            const fakeEvent = { target: { files: [uploadedFile] } };
            try {
                await handleUploadImageFile(fakeEvent);
            } finally {
                setIsGenerating(false);
            }
        };

        const handleExportAllSectors = async () => {
            if (isExporting) return;
          
            setIsExporting(true);
            setExportProgress(0);
            setExportStatus('Подготовка к экспорту...');
          
            try {
                await exportAllSectorsToPdf(
                    horizontalSvgDataBW, 
                    horizontalIdList, 
                    'horizontal',
                    (progress, status) => {
                        setExportProgress(progress);
                        setExportStatus(status);
                    }
                );
            } catch (error) {
                console.error('Ошибка при экспорте всех секторов:', error);
                setExportStatus('Ошибка при создании PDF');
            } finally {
                setIsExporting(false);
                setExportProgress(0);
                setExportStatus('');
            }
        };

        return (
            <div className={styles.app}>
                <header className={styles.header}>
                    <div className={styles.headerContent}>
                        <h1>Картина по пикселям</h1>
                        <p>Создай свою картину по номерам из любой фотографии</p>
                    </div>
                </header>
        
                <main className={styles.mainContent}>
                    <section className={styles.heroSection}>
                        <div className={styles.heroContent}>        
                            {!showDemo && (
                                <div className={styles.uploadSection}>
                                    <button
                                        onClick={handleDemoGeneration}
                                        className={styles.uploadButton}
                                    >
                                        ГЕНЕРАЦИЯ
                                    </button>
                                    <a href="#" className={styles.orderButton}>
                                        ЗАКАЗАТЬ
                                    </a>
                                </div>
                            )}
        
                            {showDemo && !isUserImageUploaded && (
                                <UploadImage
                                    isGenerating={isGenerating}
                                    uploadedImage={uploadedImage}
                                    handleGenerate={handleGenerate}
                                    setUploadedImage={setUploadedImage}
                                    setUploadedFile={setUploadedFile}
                                />
                            )} 

                            {showDemo && isUserImageUploaded && !isInstructionGenerated && (
                                <SettingsUploadedImage                      
                                    previewImage={previewImage}
                                    uploadedImage={uploadedImage}
                                    handleGetInstructions={handleGetInstructions}
                                />
                            )}

                            {showDemo && isUserImageUploaded && isInstructionGenerated && (
                                <Instruction
                                    previewImage={previewImage}
                                    previewBW={selectedInstruction?.type === 'sepia' ? previewSepia : previewBW}
                                    previewSepia={selectedInstruction?.type === 'sepia' ? previewSepia : previewBW}
                                    orientation={orientation}
                                    handleExportAllSectors={handleExportAllSectors}
                                    isExporting={isExporting}
                                    horizontalIdList={horizontalIdList}
                                    horizontalSvgDataBW={selectedInstruction?.type === 'sepia' ? horizontalSvgDataSepia : horizontalSvgDataBW}
                                    exportStatus={exportStatus}
                                    exportProgress={exportProgress}
                                    setExportProgress={setExportProgress}
                                    setIsExporting={setIsExporting}
                                    setExportStatus={setExportStatus}
                                />
                            )}
        
                            {horizontalSvgDataBW && !isPhone && (
                                <HorizontalCanvasFull
                                    svgData={horizontalSvgDataBW}
                                    idList={horizontalIdList}
                                    currentColor={horizontalCurrentColor}
                                    setColorCount={setHorizontalColorCount}
                                />
                            )}
                        </div>
                    </section>
        
                    <Modal
                        open={showCrop}
                        onCancel={handleCropCancel}
                        footer={null}
                        centered
                        width={600}
                        bodyStyle={{ padding: 0, borderRadius: 16, overflow: 'hidden', background: '#fff' }}
                        style={{ borderRadius: 16 }}
                        maskStyle={{ background: "rgba(0,0,0,0.7)" }}
                    >
                        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", margin: "20px 0 8px 0" }}>
                            <OrientationSwitch orientation={orientation} onChange={handleOrientationChange} />
                        </div>
                        <div
                            style={{
                                position: "relative",
                                width: "100%",
                                height: 400,
                                background: "#222",
                                borderRadius: 12,
                                margin: '0 24px',
                            }}
                        >
                            {cropImage && (
                                <Cropper
                                    image={cropImage}
                                    crop={crop}
                                    zoom={zoom}
                                    aspect={orientation === "horizontal" ? 1.25 : 0.8}
                                    onCropChange={setCrop}
                                    onZoomChange={setZoom}
                                    onCropComplete={onCropComplete}
                                    cropShape="rect"
                                    showGrid={true}
                                />
                            )}
                        </div>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "center",
                                gap: 16,
                                margin: "24px 0 24px 0",
                            }}
                        >
                            <button
                                onClick={handleCropConfirm}
                                className={styles.uploadButton}
                                style={{ minWidth: 120, fontSize: 16, position: 'relative', borderRadius: 8 }}
                                disabled={isCropping}
                            >
                                {isCropping ? (
                                    <>
                                        <span className="spinner" style={{ marginRight: 8, display: 'inline-block', verticalAlign: 'middle' }}>⏳</span>
                                        Обрезка...
                                    </>
                                ) : (
                                    "Обрезать"
                                )}
                            </button>
                            <button
                                onClick={handleCropCancel}
                                className={styles.uploadButton}
                                style={{ background: '#e0e0e0', color: '#333', minWidth: 120, fontSize: 16, borderRadius: 8 }}
                                disabled={isCropping}
                            >
                                Отмена
                            </button>
                        </div>
                    </Modal>
                </main>
            </div>
        );
    }
);
  
MainApp.displayName = 'MainApp';