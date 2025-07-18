import { Flex, Typography, Upload, Button, Progress } from 'antd';
import { UploadSimpleIcon } from '@phosphor-icons/react';
import { FaImage } from "react-icons/fa";
import { RiUploadCloud2Fill } from "react-icons/ri";
import { ImagePreviewGallery } from '../../ImagePreviewGallery';
import styles from "../MainApp.module.css";

const { Title, Text, Paragraph } = Typography;

export const UploadImage = ({ 
    orientation, 
    previewSepia,
    previewBW, 
    uploadedImage, 
    previewImage, 
    isGenerating, 
    setUploadedImage,
    setUploadedFile,
    handleGenerate,
}) => {
    const handleImageUpload = info => {
        if (info.file.status === 'done' || info.file.status === 'uploading') {
          const file = info.file.originFileObj || info.file;
          if (file) {
            setUploadedImage(URL.createObjectURL(file));
            setUploadedFile(file);
          }
        }
      };

    return (
        <div className={styles.uploadSection} style={{ marginTop: "2rem", width: "100%" }}>
            <Flex style={{ width: "900px" }} vertical gap={20}>
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
                                    <Flex>
                                        <RiUploadCloud2Fill size={50} color='#9370DB' />
                                    </Flex>
                                    <Title
                                        id="uploadText"
                                        className={styles.uploadText}
                                        level={4}
                                    >
                                        Перетащите изображение сюда
                                    </Title>
                                    <Text className={styles.uploadSubtext} type='secondary'>
                                        или нажмите для выбора файла
                                    </Text>
                                    <Text className={styles.uploadHint} type='secondary'>
                                        Поддерживаемые форматы: JPG, PNG, GIF
                                    </Text>
                                </div>
                            </Upload.Dragger>
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
                            <FaImage size={50} color='#A9A9A9'/>
                            <Text type='secondary'>Изображение появится здесь</Text>
                            </div>
                        )}
                        </div>
                    </Flex>
                    </Flex>
                </div>
                <div className={styles.uploadInfoList}>
                    <div className={styles.uploadInfoItem}>
                        <i className="fas fa-check-circle" style={{ color: '#52c41a', marginRight: 8 }}></i>
                        Максимальный размер: 10 МБ
                    </div>
                    <div className={styles.uploadInfoItem}>
                        <i className="fas fa-check-circle" style={{ color: '#52c41a', marginRight: 8 }}></i>
                        Лучше всего подходят контрастные изображения
                    </div>
                </div>
            </Flex>
            {/* Показываем превью после генерации */}
            {/* <div style={{ marginTop: 32 }}>
                <ImagePreviewGallery
                    original={previewImage}
                    pixelBW={previewBW}
                    pixelSepia={previewSepia}
                    orientation={orientation}
                />
            </div> */}
        </div>
    )
}