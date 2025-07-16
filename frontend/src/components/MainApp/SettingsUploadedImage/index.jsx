import { Flex, Typography, Upload, Button, Progress } from 'antd';
import { ImagePreviewGallery } from '../../ImagePreviewGallery';
import styles from "../MainApp.module.css";

const { Title, Paragraph } = Typography;

export const SettingsUploadedImage = ({ 
    previewImage, 
    uploadedImage, 
    orientation,
    previewBW,
    previewSepia,
    handleGetInstructions,
}) => {
    return (
        <div className={styles.uploadSection} style={{ marginTop: "2rem", width: "100%" }}>
            <div className={styles.uploadGrid}>
                <Flex vertical gap={16}>
                <Flex vertical>
                    <Title level={4}>Настройка генерации</Title>
                    <Paragraph>Проверьте фото и выберите параметры генерации</Paragraph>
                </Flex>
                <Flex justify='space-between' gap={32}>
                    <div className={styles.uploadCol}>
                    <div className={styles.previewCard}>
                        <h3 className={styles.previewTitle}>Предпросмотр</h3>
                        <img
                        src={previewImage || uploadedImage}
                        alt="Preview"
                        className={styles.previewImg}
                        />
                    </div>
                    </div>
                    <div className={styles.uploadCol}>
                    <div className={styles.previewCard} style={{ minHeight: 300, justifyContent: 'center' }}>
                        <h3 className={styles.previewTitle}>Параметры генерации</h3>
                        <div style={{ marginBottom: 16 }}>
                        <div style={{ marginBottom: 8, color: '#888' }}>Количество цветов: <b>12</b></div>
                        <div style={{ marginBottom: 8, color: '#888' }}>Размер сетки: <b>8x16</b></div>
                        <div style={{ marginBottom: 8, color: '#888' }}>Режим: <b>ЧБ</b></div>
                        <div style={{ marginBottom: 8, color: '#888' }}>Ориентация: <b>Вертикально</b></div>
                        </div>
                        <Button
                        type="primary"
                        size="large"
                        className={styles.generateButton}
                        style={{
                            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                            border: 'none',
                        }}
                        onClick={handleGetInstructions}
                        >
                        Создать инструкцию
                        </Button>
                    </div>
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
    );
}