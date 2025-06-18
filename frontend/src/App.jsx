import React, { useState } from 'react';
import styles from './App.module.css';
import MultiCanvas from './components/MultiCanvas';
import {ColorPalette} from './components/ColorPalette';
import axios from 'axios';

function App() {
  const [fName, setFName] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [idList, setIdList] = useState([]);
  const [currentColor, setCurrentColor] = useState(null);
  const [colorCount, setColorCount] = useState({});
  const [loading, setLoading] = useState(false);
  const [svgData, setSvgData] = useState(null);

  const [secondFName, setSecondFName] = useState(null);
  const [secondPreviewImage, setSecondPreviewImage] = useState(null);
  const [secondIdList, setSecondIdList] = useState([]);
  const [secondSvgData, setSecondSvgData] = useState(null);

  const handleImageFile = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setFName(url);
      setPreviewImage(url);
      setLoading(true);

      try {
        const formData = new FormData();
        formData.append('image', file);

        const response = await axios.post('http://localhost:5000/api/convert', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        if (response.data.palette && response.data.svg) {
          setIdList(response.data.palette);
          setSvgData(response.data.svg);
        } else {
          throw new Error('Invalid server response format');
        }
      } catch (error) {
        console.error('Error processing image:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSecondImageFile = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setSecondFName(url);
      setSecondPreviewImage(url);
      setLoading(true);

      try {
        const formData = new FormData();
        formData.append('image', file);

        const response = await axios.post('http://localhost:5000/api/convert', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        if (response.data.palette && response.data.svg) {
          setSecondIdList(response.data.palette);
          setSecondSvgData(response.data.svg);
        } else {
          throw new Error('Invalid server response format');
        }
      } catch (error) {
        console.error('Error processing image:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleColorSelect = (color) => {
    setCurrentColor(color);
  };

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1>Paint By Number</h1>
          <p>Создай свою картину по номерам из любой фотографии</p>
        </div>
      </header>
      
      <main className={styles.mainContent}>
        <section className={styles.heroSection}>
          <div className={styles.heroContent}>
            <h2>Создавай свои шедевры</h2>
            <p>Преврати любую фотографию в картину по номерам</p>
            <div className={styles.uploadSection}>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageFile}
                id="image-upload"
                className={styles.fileInput}
              />
              <label htmlFor="image-upload" className={styles.uploadButton}>
                Загрузить фото для первого холста
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleSecondImageFile}
                id="second-image-upload"
                className={styles.fileInput}
              />
              <label htmlFor="second-image-upload" className={styles.uploadButton}>
                Загрузить фото для второго холста
              </label>
            </div>
          </div>
        </section>

        {previewImage && (
          <section className={styles.previewSection}>
            <h3>Исходное изображение</h3>
            <div className={styles.previewContainer}>
              <img src={previewImage} alt="Preview" className={styles.previewImage} />
            </div>
          </section>  
        )}

        {fName && (
          <section className={styles.canvasSection}>
            <h3>Картина по номерам</h3>
            <div className={styles.canvasLayout}>
              <MultiCanvas
                fName={fName}
                setIdList={setIdList}
                idList={idList}
                currentColor={currentColor}
                setColorCount={setColorCount}
                loading={loading}
                setLoading={setLoading}
                svgData={svgData}
                secondFName={secondFName}
                secondIdList={secondIdList}
                secondSvgData={secondSvgData}
              />
              {idList.length > 0 && (
                <ColorPalette
                  colors={idList}
                  currentColor={currentColor}
                  onColorSelect={handleColorSelect}
                  colorCount={colorCount}
                />
              )}
            </div>
          </section>
        )}

        <section className={styles.featuresSection}>
          <div className={styles.feature}>
            <h3>Детализация</h3>
            <p>Высокое качество обработки изображения</p>
          </div>
          <div className={styles.feature}>
            <h3>Качество</h3>
            <p>Точная передача цветов и оттенков</p>
          </div>
          <div className={styles.feature}>
            <h3>Простота</h3>
            <p>Интуитивно понятный интерфейс</p>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <p>© 2024 Paint By Number. Все права защищены.</p>
      </footer>
    </div>
  );
}

export default App;
