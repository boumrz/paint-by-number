import { memo, useCallback } from "react";
// import SecondCanvasFull from './components/SecondCanvasFull';
import HorizontalCanvasFull from '../HorizontalCanvas/HorizontalCanvasFull';
// import { ColorPalette } from "./components/ColorPalette/ColorPalette";

import Cropper from "react-easy-crop";
import Modal from "react-modal";
import { Switch } from "antd";
import "antd/dist/reset.css";

import { GridInstructions } from "../GridInstructions";
import { ImagePreviewGallery } from "../ImagePreviewGallery";

import styles from "./MainApp.module.css";

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
      croppingFor,
      selectedInstruction,
      horizontalIdList,
      isPhone,
      handleUploadImageFile,
      handleUploadImageFileHorizontal,
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
      // userUploadedImages,
      horizontalSvgData,
      horizontalCurrentColor,
      setHorizontalColorCount,
      horizontalColorCount,
    }) => {
        const handleVerticalSelect = useCallback((type) => {
            setSelectedInstruction({
              type,
              orientation: "horizontal", // Всегда горизонтальная ориентация
            });
        }, []);

        const handleHorizontalSelect = useCallback((type) => {
            setSelectedInstruction({
              type,
              orientation: "horizontal",
            })
        }, []);
        
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
                    <h2>Картина по номерам</h2>
                    <p>по фото</p>
        
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
        
                    {showDemo && (
                      <div className={styles.uploadSection} style={{ marginTop: "2rem" }}>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleUploadImageFile}
                          id="image-upload"
                          className={styles.fileInput}
                        />
                        <label htmlFor="image-upload" className={styles.uploadButton}>
                          Загрузить свое фото
                        </label>
                      </div>
                    )}
        
                    {showDemo && (
                      <div
                        style={{
                          display: "flex",
                          gap: "2rem",
                          minHeight: 400,
                          flexWrap: "wrap",
                          flexDirection: "column",
                          marginTop: "2rem",
                        }}
                      >
                        <div style={{ flex: 1, minWidth: !isPhone ? 400 : 0 }}>
                          <ImagePreviewGallery
                            original={previewImage}
                            pixelBW={previewBW}
                            pixelSepia={previewSepia}
                            orientation={orientation}
                            onSelect={handleHorizontalSelect}
                            disabled={!isAccessGranted}
                          />
                          {isAccessGranted && (
                            <div
                              style={{
                                textAlign: "center",
                                marginTop: "1rem",
                                padding: "1rem",
                                background: "rgba(0, 100, 0, 0.2)",
                                borderRadius: "0.5rem",
                                border: "1px solid rgba(0, 100, 0, 0.4)",
                                color: "#006400",
                              }}
                            >
                              <p style={{ margin: 0, fontSize: "0.9rem", color: "#006400", }}>
                                &#10003; Нажмите на карточку, чтобы получить инструкцию
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
        
                    {showDemo && !isAccessGranted && (
                      <div
                        style={{
                          textAlign: "center",
                          marginTop: "1rem",
                          padding: "1rem",
                          background: "rgba(0, 172, 193, 0.1)",
                          borderRadius: "0.5rem",
                          border: "1px solid rgba(0, 172, 193, 0.3)",
                          color: "#006064",
                        }}
                      >
                        <p style={{ margin: 0, fontSize: "0.9rem" }}>
                          💡 <strong>Демо-режим:</strong> Вы можете загружать свои
                          фотографии и смотреть результат генерации. Для получения
                          инструкций нажмите "ПОЛУЧИТЬ ИНСТРУКЦИЮ" и введите код
                          доступа.
                        </p>
                        <button
                          onClick={handleGetInstructions}
                          className={styles.uploadButton}
                          style={{ marginTop: "0.5rem" }}
                        >
                          ПОЛУЧИТЬ ИНСТРУКЦИЮ
                        </button>
                      </div>
                    )}
        
                    {isAccessGranted &&
                      selectedInstruction &&
                      selectedInstruction.orientation === "horizontal" &&
                      selectedInstruction.type === "bw" &&
                      horizontalSvgDataBW && (
                        <GridInstructions
                          idList={horizontalIdList}
                          svgData={horizontalSvgDataBW}
                          title="Инструкция (ЧБ, горизонтальный)"
                          orientation="horizontal"
                        />
                      )}
                    {isAccessGranted &&
                      selectedInstruction &&
                      selectedInstruction.orientation === "horizontal" &&
                      selectedInstruction.type === "sepia" &&
                      horizontalSvgDataSepia && (
                        <GridInstructions
                          idList={horizontalIdList}
                          svgData={horizontalSvgDataSepia}
                          title="Инструкция (Сепия, горизонтальный)"
                          orientation="horizontal"
                        />
                      )}
                    {horizontalSvgDataBW && (
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
                      style={{ padding: "8px 24px", fontSize: 16 }}
                    >
                      Обрезать
                    </button>
                    <button
                      onClick={handleCropCancel}
                      style={{ padding: "8px 24px", fontSize: 16 }}
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
                      style={{
                        background: "rgba(255,255,255,0.2)",
                        border: "1px solid rgba(255,255,255,0.3)",
                        color: "white",
                        padding: "0.5rem 1rem",
                        borderRadius: "0.5rem",
                        cursor: "pointer",
                        fontSize: "0.9rem",
                      }}
                    >
                      НА ГЛАВНУЮ СТРАНИЦУ
                    </button>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        onClick={() =>
                          window.open("https://t.me/your_telegram", "_blank")
                        }
                        style={{
                          background: "rgba(255,255,255,0.2)",
                          border: "1px solid rgba(255,255,255,0.3)",
                          color: "white",
                          padding: "0.5rem 1rem",
                          borderRadius: "0.5rem",
                          cursor: "pointer",
                          fontSize: "0.9rem",
                        }}
                      >
                        НАПИСАТЬ В TELEGRAM
                      </button>
                      <button
                        onClick={() => window.open("mailto:your@email.com", "_blank")}
                        style={{
                          background: "rgba(255,255,255,0.2)",
                          border: "1px solid rgba(255,255,255,0.3)",
                          color: "white",
                          padding: "0.5rem 1rem",
                          borderRadius: "0.5rem",
                          cursor: "pointer",
                          fontSize: "0.9rem",
                        }}
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