import { memo, useCallback } from "react";
import HorizontalCanvasFull from '../HorizontalCanvas/HorizontalCanvasFull';
import { useMediaQuery } from "usehooks-ts";

import Cropper from "react-easy-crop";
import Modal from "react-modal";
import { Switch, Upload, Progress, Button, Flex, Typography } from "antd";
import "antd/dist/reset.css";

import { GridInstructions } from "../GridInstructions";
import { ImagePreviewGallery } from "../ImagePreviewGallery";

import styles from "./MainApp.module.css";
import { useState } from "react";

const { Title, Paragraph } = Typography;

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
    }) => {
        const isPhone = useMediaQuery("(max-width: 600px)");
        
        // state for new upload
        const [uploadedImage, setUploadedImage] = useState(null);
        const [isGenerating, setIsGenerating] = useState(false);
        const [generationProgress, setGenerationProgress] = useState(0);
        const [uploadedFile, setUploadedFile] = useState(null);

        const handleImageUpload = info => {
          if (info.file.status === 'done' || info.file.status === 'uploading') {
            const file = info.file.originFileObj || info.file;
            if (file) {
              setUploadedImage(URL.createObjectURL(file));
              setUploadedFile(file);
            }
          }
        };

        const handleGenerate = async () => {
          if (!uploadedFile) return;
          setIsGenerating(true);
          setGenerationProgress(0);
          // Эмулируем event для handleUploadImageFile
          const fakeEvent = { target: { files: [uploadedFile] } };
          try {
            await handleUploadImageFile(fakeEvent);
            setGenerationProgress(100);
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
        
                    {showDemo && (
                      <div className={styles.uploadSection} style={{ marginTop: "2rem", width: "100%" }}>
                        <div className={styles.uploadGrid}>
                          <Flex vertical gap={16}>
                            <Flex vertical>
                              <Title level={4}>Загрузите ваше изображение</Title>
                              <Paragraph>Выберите фотографию, которую хотите превратить в пиксель арт</Paragraph>
                            </Flex>
                            <Flex justify='space-between'>
                              <div className={styles.uploadCol}>
                                <Upload.Dragger
                                  name="image"
                                  multiple={false}
                                  onChange={handleImageUpload}
                                  showUploadList={false}
                                  accept="image/*"
                                  className={styles.uploadDragger}
                                  style={{ height: "300px" }}
                                >
                                  <div className={styles.uploadDraggerContent}>
                                    <i className={`fas fa-cloud-upload-alt ${styles.uploadIcon}`}></i>
                                    <p
                                      id="uploadText"
                                      className={styles.uploadText}
                                    >
                                      Перетащите изображение сюда
                                    </p>
                                    <p className={styles.uploadSubtext}>
                                      или нажмите для выбора файла
                                    </p>
                                    <div className={styles.uploadHint}>
                                      Поддерживаемые форматы: JPG, PNG, GIF
                                    </div>
                                  </div>
                                </Upload.Dragger>
                                <div className={styles.uploadInfoList}>
                                  <div className={styles.uploadInfoItem}>
                                    <i className="fas fa-check-circle" style={{ color: '#52c41a', marginRight: 8 }}></i>
                                    Максимальный размер: 10 МБ
                                  </div>
                                  <div className={styles.uploadInfoItem}>
                                    <i className="fas fa-check-circle" style={{ color: '#52c41a', marginRight: 8 }}></i>
                                    Рекомендуемое разрешение: 800×600 пикселей
                                  </div>
                                  <div className={styles.uploadInfoItem}>
                                    <i className="fas fa-check-circle" style={{ color: '#52c41a', marginRight: 8 }}></i>
                                    Лучше всего подходят контрастные изображения
                                  </div>
                                </div>
                              </div>                        
                              <div className={styles.uploadCol}>
                                {uploadedImage ? (
                                  <div className={styles.previewCard}>
                                    <h3 className={styles.previewTitle}>Предпросмотр</h3>
                                    <img
                                      src={uploadedImage}
                                      alt="Uploaded"
                                      className={styles.previewImg}
                                    />
                                    {isGenerating ? (
                                      <div className={styles.generationProgress}>
                                        <div className={styles.progressText}>
                                          <i className="fas fa-cog fa-spin" style={{ color: '#764ba2', marginRight: 8 }}></i>
                                          <span>Генерация пиксель арта...</span>
                                        </div>
                                        <Progress
                                          percent={generationProgress}
                                          strokeColor={{
                                            "0%": "#667eea",
                                            "100%": "#764ba2",
                                          }}
                                          className={styles.progressBar}
                                        />
                                      </div>
                                    ) : (
                                      <Button
                                        type="primary"
                                        size="large"
                                        icon={<i className="fas fa-magic" style={{ marginRight: 8 }}></i>}
                                        onClick={handleGenerate}
                                        disabled={isGenerating}
                                        className={styles.generateButton}
                                        style={{
                                          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                          border: 'none',
                                        }}
                                      >
                                        Сгенерировать пиксель арт
                                      </Button>
                                    )}
                                  </div>
                                ) : (
                                  <div className={styles.previewPlaceholder}>
                                    <i className="fas fa-image" style={{ fontSize: 64, color: '#d1c4e9', marginBottom: 16 }}></i>
                                    <p className={styles.previewPlaceholderText}>Изображение появится здесь</p>
                                  </div>
                                )}
                              </div>
                            </Flex>
                          </Flex>  
                        </div>
                        {/* Показываем превью после генерации */}
                        <div style={{ marginTop: 32 }}>
                          <ImagePreviewGallery
                            original={previewImage}
                            pixelBW={previewBW}
                            pixelSepia={previewSepia}
                            orientation={orientation}
                          />
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
                          title="Инструкция ЧБ"
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
                          title="Инструкция Сепия"
                          orientation="horizontal"
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