import React, { useState } from 'react';
import axios from 'axios';
import { config } from '../../config.js';
import styles from './AccessCode.module.css';

const AccessCode = ({ onCodeVerified, onBackToGeneration }) => {
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleCodeChange = (e) => {
    let value = e.target.value;
    
    // Автоматически добавляем дефисы
    if (value.length >= 4 && !value.includes('-')) {
      value = value.slice(0, 4) + '-' + value.slice(4);
    }
    if (value.length >= 9 && value.split('-').length === 2) {
      value = value.slice(0, 9) + '-' + value.slice(9);
    }
    
    // Ограничиваем длину
    if (value.length <= 14) {
      setCode(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (code.length !== 14) {
      setMessage('Введите полный код доступа');
      setIsError(true);
      return;
    }

    setIsVerifying(true);
    setMessage('');
    setIsError(false);

    try {
      const response = await axios.post(`${config.apiUrl}/api/verify-code`, {
        code: code
      });

      if (response.data.valid) {
        setMessage('Код действителен! Доступ разрешен.');
        setIsError(false);
        // Вызываем callback для разблокировки основного функционала и передачи типа кода
        if (onCodeVerified) {
          onCodeVerified(response.data.mode || 'bw');
        }
      } else {
        setMessage(response.data.message || 'Неверный код');
        setIsError(true);
      }
    } catch (error) {
      console.error('Error verifying code:', error);
      setMessage('Ошибка при проверке кода');
      setIsError(true);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className={styles.accessCodeOverlay}>
      <div className={styles.accessCodeModal}>
        <div className={styles.accessCodeHeader}>
          <h2>Получить инструкцию</h2>
          <p>Введите код доступа для получения подробной инструкции</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.accessCodeForm}>
          <div className={styles.codeInputContainer}>
            <input
              type="text"
              value={code}
              onChange={handleCodeChange}
              placeholder="XXXX-XXXX-XXXX"
              className={styles.codeInput}
              maxLength={14}
              disabled={isVerifying}
            />
          </div>

          <button 
            type="submit" 
            className={styles.verifyBtn}
            disabled={isVerifying || code.length !== 14}
          >
            {isVerifying ? 'Проверка...' : 'Проверить код'}
          </button>
        </form>

        {message && (
          <div className={isError ? styles.message + ' ' + styles.error : styles.message + ' ' + styles.success}>
            {message}
          </div>
        )}

        <div className={styles.accessCodeInfo}>
          <p><strong>Формат кода:</strong> XXXX-XXXX-XXXX</p>
          <p><strong>Пример:</strong> 1234-5678-9012</p>
        </div>

        <button 
          onClick={onBackToGeneration}
          className={styles.backBtn}
        >
          ← Вернуться к генерации
        </button>
      </div>
    </div>
  );
};

export default AccessCode; 