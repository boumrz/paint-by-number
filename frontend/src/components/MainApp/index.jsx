import { memo } from "react";
import HorizontalCanvasFull from '../HorizontalCanvas/HorizontalCanvasFull';
import { useMediaQuery } from "usehooks-ts";

import Cropper from "react-easy-crop";
import Modal from "react-modal";
import { Switch, Button } from "antd";
import "antd/dist/reset.css";

import { GridInstructions } from "../GridInstructions";
import { ImagePreviewGallery } from "../ImagePreviewGallery";
import { SettingsUploadedImage } from './SettingsUploadedImage';

import styles from "./MainApp.module.css";
import { useState } from "react";

import { UploadImage } from './UploadImage';

export const MainApp = memo(
    ({
      previewImage,
      horizontalSvgDataBW,
      horizontalSvgDataSepia,
      previewBW,
      previewSepia,
      showCrop,
      cropImage,
      crop,
      zoom,
      selectedInstruction,
      horizontalIdList,
      handleUploadImageFile,
      handleCropCancel,
      handleCropConfirm,
      onCropComplete,
      setSelectedInstruction,
      setCrop,
      setZoom,
      showDemo,
      handleDemoGeneration,
      handleGetInstructions,
      isAccessGranted,
      orientation,
      handleOrientationChange,
      horizontalCurrentColor,
      setHorizontalColorCount,
      isCropping,
      isUserImageUploaded,
      isInstructionGenerated,
      handleExportAllSectors,
    }) => {
        const isPhone = useMediaQuery("(max-width: 600px)");

        const [uploadedImage, setUploadedImage] = useState(null);
        const [isGenerating, setIsGenerating] = useState(false);
        const [uploadedFile, setUploadedFile] = useState(null);

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
                          orientation={orientation}
                          previewSepia={previewSepia}
                          previewBW={previewBW}
                          previewImage={previewImage}
                          uploadedImage={uploadedImage}
                          handleGenerate={handleGenerate}
                          setUploadedImage={setUploadedImage}
                          setUploadedFile={setUploadedFile}
                      />
                    )}

                    {showDemo && isUserImageUploaded && !isInstructionGenerated && (
                      <SettingsUploadedImage
                          previewImage={previewImage}
                          previewSepia={previewSepia}
                          previewBW={previewBW}
                          orientation={orientation}
                          uploadedImage={uploadedImage}
                          handleGetInstructions={handleGetInstructions}
                      />
                    )}

                    {/* Третий шаг: просмотр инструкции */}
                    {showDemo && isUserImageUploaded && isInstructionGenerated && (
                      <div className={styles.uploadSection} style={{ marginTop: "2rem", width: "100%" }}>
                        <div className={styles.uploadGrid}>
                          {/* ВЕРХ: превью */}
                          <div style={{ marginBottom: 32 }}>
                            <ImagePreviewGallery
                              original={previewImage}
                              pixelBW={previewBW}
                              pixelSepia={previewSepia}
                              orientation={orientation}
                            />
                          </div>
                          {/* ОСНОВНОЙ КОНТЕНТ: две колонки */}
                          <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                            {/* Левая колонка: инструкция */}
                            <div style={{ flex: 2, minWidth: 0 }}>
                              <div className={styles.instructionCard}>
                                <h2 style={{ marginBottom: 16 }}>Инструкция</h2>
                                {/* Экспорт в PDF и карусель */}
                                <div style={{ marginBottom: 24 }}>
                                  <Button
                                    type="primary"
                                    size="large"
                                    className={styles.generateButton}
                                    style={{ marginBottom: 16, background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", border: 'none' }}
                                    onClick={handleExportAllSectors}
                                  >
                                    Экспорт в PDF
                                  </Button>
                                </div>
                                {/* Карусель номеров (перенести из GridInstructions) */}
                                <div style={{ marginBottom: 24 }}>
                                  <GridInstructions
                                    idList={horizontalIdList}
                                    svgData={horizontalSvgDataBW}
                                    orientation='horizontal'
                                    title="Инструкция"
                                  />
                                </div>
                              </div>
                            </div>
                            {/* Правая колонка: легенда и советы */}
                            <div style={{ flex: 1, minWidth: 260, maxWidth: 340, display: 'flex', flexDirection: 'column', gap: 24 }}>
                              <div className={styles.legendCard}>
                                <h3 style={{ marginBottom: 12 }}>Легенда цветов</h3>
                                <ul style={{ padding: 0, margin: 0, listStyle: 'none' }}>
                                  <li>1 — <span style={{ color: '#764ba2' }}>Фиолетовый</span></li>
                                  <li>2 — <span style={{ color: '#667eea' }}>Синий</span></li>
                                  <li>3 — <span style={{ color: '#52c41a' }}>Зелёный</span></li>
                                  <li>4 — <span style={{ color: '#ffb300' }}>Жёлтый</span></li>
                                </ul>
                              </div>
                              <div className={styles.tipsCard}>
                                <h3 style={{ marginBottom: 12 }}>Советы</h3>
                                <ul style={{ padding: 0, margin: 0, listStyle: 'none' }}>
                                  <li>Начинайте с крупных областей</li>
                                  <li>Используйте тонкую кисть для мелких деталей</li>
                                  <li>Дайте слоям краски высохнуть</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
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
        
              <footer className={styles.footer}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    maxWidth: "1200px",
                    margin: "0 auto",
                    padding: "0 1rem",
                  }}
                >
                  <p>© 2025 Картина по пикселям. Все права защищены.</p>
                  <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                    <button
                      onClick={() => window.location.reload()}
                      className={styles.footerButton}
                    >
                      НА ГЛАВНУЮ СТРАНИЦУ
                    </button>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        onClick={() =>
                          window.open("https://t.me/your_telegram", "_blank")
                        }
                        className={styles.footerButton}
                      >
                        НАПИСАТЬ В TELEGRAM
                      </button>
                      <button
                        onClick={() => window.open("mailto:your@email.com", "_blank")}
                        className={styles.footerButton}
                      >
                        НАПИСАТЬ НА ПОЧТУ
                      </button>
                    </div>
                  </div>
                </div>
              </footer>
            </div>
          );
    }
  );
  
  MainApp.displayName = 'MainApp';