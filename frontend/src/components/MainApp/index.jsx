import "antd/dist/reset.css";

import { Switch } from "antd";
import { memo } from "react";
import { useState } from "react";
import Cropper from "react-easy-crop";
import Modal from "react-modal";
import { useMediaQuery } from "usehooks-ts";

import { exportAllSectorsToPdf } from '../GridInstructions/InstructionSlide';
import HorizontalCanvasFull from '../HorizontalCanvas/HorizontalCanvasFull';
import { Instruction } from './Instruction';
import styles from "./MainApp.module.css";
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
                                    previewBW={previewBW}
                                    previewSepia={previewSepia}
                                    orientation={orientation}
                                    handleExportAllSectors={handleExportAllSectors}
                                    isExporting={isExporting}
                                    horizontalIdList={horizontalIdList}
                                    horizontalSvgDataBW={horizontalSvgDataBW}
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
                        isOpen={showCrop}
                        onRequestClose={handleCropCancel}
                        ariaHideApp={false}
                        style={{
                            overlay: { zIndex: 1000, background: "rgba(0,0,0,0.7)" },
                            content: { maxWidth: 600, margin: "auto", height: 600, padding: 0 },
                        }}
                    >
                        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", margin: "12px 0" }}>
                            <span style={{ marginRight: 12, color: "#fff" }}>Вертикально</span>
                            <Switch
                                checked={orientation === "horizontal"}
                                onChange={checked => handleOrientationChange(checked ? "horizontal" : "vertical")}
                                checkedChildren="Горизонтально"
                                unCheckedChildren="Вертикально"
                                style={{ background: orientation === "horizontal" ? "#1890ff" : undefined }}
                            />
                            <span style={{ marginLeft: 12, color: "#fff" }}>Горизонтально</span>
                        </div>
                        <div
                            style={{
                                position: "relative",
                                width: "100%",
                                height: "75%",
                                background: "#222",
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
                                margin: 16,
                            }}
                        >
                            <button
                                onClick={handleCropConfirm}
                                style={{ padding: "8px 24px", fontSize: 16, position: 'relative', minWidth: 120 }}
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
                                style={{ padding: "8px 24px", fontSize: 16 }}
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