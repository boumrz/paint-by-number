import { Button, Flex, Progress } from 'antd';
import { useMediaQuery } from "usehooks-ts";
import { FaCheckCircle } from "react-icons/fa";
import { GridInstructions } from '../../GridInstructions';
import { ImagePreviewGallery } from '../../ImagePreviewGallery';

import styles from './Instruction.module.css';

export const Instruction = ({ 
    previewImage,
    previewBW,
    previewSepia,
    orientation,
    handleExportAllSectors,
    isExporting,
    horizontalIdList,
    horizontalSvgDataBW,
    exportProgress,
    setExportProgress,
    setIsExporting,
    exportStatus,
    setExportStatus,
 }) => {
    const isPhone = useMediaQuery("(max-width: 600px)");
    
    return (
        <div className={styles.uploadSection} style={{ marginTop: "2rem", width: "100%" }}>
            <div className={styles.uploadGrid}>
                <div style={{ marginBottom: 32 }}>
                    <ImagePreviewGallery
                        original={previewImage}
                        pixelBW={previewBW}
                        pixelSepia={previewSepia}
                        orientation={orientation}
                    />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 32, flexWrap: 'wrap' }}>
                    <Flex vertical>
                        <h3 style={{ padding: '1rem', marginBottom: '1rem', marginTop: 0, color: '#333' }}>Инструкция</h3>

                        <div style={{ 
                            width: '100%',
                            maxWidth: isPhone ? '100%' : '400px',
                            margin: '0 auto 1rem auto',
                            textAlign: 'center'
                        }}>
                        <Button 
                            type="primary" 
                            size="large"
                            onClick={handleExportAllSectors}
                            disabled={isExporting}
                            style={{
                            background: isExporting
                                ? 'linear-gradient(135deg, #d9d9d9 0%, #bdbdbd 100%)'
                                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            borderColor: isExporting ? '#d9d9d9' : '#764ba2',
                            color: '#fff',
                            fontWeight: 'bold',
                            boxShadow: isExporting
                                ? 'none'
                                : '0 4px 16px rgba(102, 126, 234, 0.18)',
                            padding: '0 2rem',
                            height: 'auto',
                            width: '100%',
                            fontSize: '1rem',
                            borderRadius: '8px',
                            transition: 'background 0.2s, box-shadow 0.2s, transform 0.2s',
                            }}
                            loading={isExporting}
                        >
                            {isExporting ? '⏳ Создание PDF...' : '📄 Экспорт PDF'}
                        </Button>
                        
                        {isExporting && (
                            <div style={{
                                width: '100%',
                                margin: '1rem auto 0 auto',
                                padding: '1rem',
                                background: '#f8f9fa',
                                borderRadius: '8px',
                                border: '1px solid #e9ecef'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '0.5rem'
                                }}>
                                    <span style={{ fontSize: '0.875rem', color: '#495057' }}>
                                        {exportStatus}
                                    </span>
                                    <span style={{ fontSize: '0.875rem', color: '#1890ff', fontWeight: 'bold' }}>
                                        {exportProgress}%
                                    </span>
                                </div>
                                <Progress 
                                    percent={exportProgress} 
                                    size="small" 
                                    strokeColor="#1890ff"
                                    showInfo={false}
                                    status={exportProgress === 100 ? 'success' : 'active'}
                                />
                            </div>
                        )}
                        </div>
                    </Flex>
                    <Flex justify='center' gap={40}>
                        <div style={{ minWidth: 0 }}>
                            <div className={styles.instructionCard}>
                                <div style={{ marginBottom: 24 }}>
                                    <GridInstructions
                                        idList={horizontalIdList}
                                        svgData={horizontalSvgDataBW}
                                        orientation='horizontal'
                                        setExportProgress={setExportProgress}
                                        isExporting={isExporting}
                                        setIsExporting={setIsExporting}
                                        setExportStatus={setExportStatus}
                                        title="Инструкция"
                                    />
                                </div>
                            </div>
                        </div>
                        {/* Правая колонка: легенда и советы */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                            <div className={styles.tipsCard}>
                                <h3 style={{ marginBottom: 12, color: 'rgb(30, 64, 175)' }}>Советы</h3>
                                <ul style={{ padding: 0, margin: 0, textAlign: 'left', listStyle: 'none', color: 'rgb(29, 78, 216)' }}>
                                    <Flex alignItems='center' gap={4}>
                                    <Flex align="center"><FaCheckCircle color='rgb(59, 130, 246)'/></Flex><li>Начинайте с крупных областей</li>
                                    </Flex>
                                    <Flex alignItems='center' gap={4}>
                                    <Flex align="center"><FaCheckCircle color='rgb(59, 130, 246)'/></Flex><li>Используйте тонкую кисть для мелких деталей</li>
                                    </Flex>
                                    <Flex alignItems='center' gap={4}>
                                    <Flex align="center"><FaCheckCircle color='rgb(59, 130, 246)'/></Flex><li>Дайте слоям краски высохнуть</li>
                                    </Flex>
                                </ul>
                            </div>
                        </div>
                    </Flex>
                </div>
            </div>
        </div>
    )
}