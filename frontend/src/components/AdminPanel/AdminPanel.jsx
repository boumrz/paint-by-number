import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { config } from '../../config.js';
import styles from './AdminPanel.module.css';

const AdminPanel = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [stats, setStats] = useState(null);
  const [lastGeneratedFile, setLastGeneratedFile] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await axios.get(`${config.apiUrl}/api/admin/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
      setMessage('Ошибка при загрузке статистики');
    }
  };

  const generateCodes = async () => {
    setIsGenerating(true);
    setMessage('');
    
    try {
      const response = await axios.post(`${config.apiUrl}/api/admin/generate-codes`);
      
      if (response.data.success) {
        setMessage(response.data.message);
        setLastGeneratedFile(response.data.excel_file);
        await loadStats(); // Обновляем статистику
      } else {
        setMessage('Ошибка при генерации кодов');
      }
    } catch (error) {
      console.error('Error generating codes:', error);
      setMessage('Ошибка при генерации кодов');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadCodes = async (filename) => {
    try {
      const response = await axios.get(`${config.apiUrl}/api/admin/download-codes/${filename}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      setMessage('Ошибка при скачивании файла');
    }
  };

  return (
    <div className={styles.adminPanel}>
      <div className={styles.adminHeader}>
        <h1>Панель администратора</h1>
        <p>Управление кодами доступа</p>
      </div>

      <div className={styles.adminContent}>
        <div className={styles.statsSection}>
          <h2>Статистика</h2>
          {stats ? (
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statNumber}>{stats.total_codes}</div>
                <div className={styles.statLabel}>Всего кодов</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statNumber}>{stats.used_codes}</div>
                <div className={styles.statLabel}>Использовано</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statNumber}>{stats.unused_codes}</div>
                <div className={styles.statLabel}>Доступно</div>
              </div>
            </div>
          ) : (
            <p>Загрузка статистики...</p>
          )}
        </div>

        <div className={styles.actionsSection}>
          <h2>Действия</h2>
          
          <div className={styles.actionButtons}>
            <button 
              className={styles.generateBtn}
              onClick={generateCodes}
              disabled={isGenerating}
            >
              {isGenerating ? 'Генерация...' : 'Сгенерировать 500 кодов'}
            </button>
            
            {lastGeneratedFile && (
              <button 
                className={styles.downloadBtn}
                onClick={() => downloadCodes(lastGeneratedFile)}
              >
                Скачать Excel файл
              </button>
            )}
          </div>

          {message && (
            <div className={message.includes('Ошибка') ? styles.message + ' ' + styles.error : styles.message + ' ' + styles.success}>
              {message}
            </div>
          )}
        </div>

        <div className={styles.infoSection}>
          <h2>Информация</h2>
          <div className={styles.infoContent}>
            <p><strong>Формат кодов:</strong> XXXX-XXXX-XXXX (где X - цифра от 0 до 9)</p>
            <p><strong>Хранение:</strong> Коды сохраняются в файле access_codes.json</p>
            <p><strong>Безопасность:</strong> Коды хешируются для безопасного хранения</p>
            <p><strong>Использование:</strong> Каждый код может быть использован только один раз</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel; 