import React, { useState } from 'react';
import './App.css';
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

  const handleColorSelect = (color) => {
    setCurrentColor(color);
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1>Paint By Number</h1>
          <p>Создай свою картину по номерам из любой фотографии</p>
        </div>
      </header>
      
      <main className="main-content">
        <section className="hero-section">
          <div className="hero-content">
            <h2>Создавай свои шедевры</h2>
            <p>Преврати любую фотографию в картину по номерам</p>
            <div className="upload-section">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageFile}
                id="image-upload"
                className="file-input"
              />
              <label htmlFor="image-upload" className="upload-button">
                Загрузить фото
              </label>
            </div>
          </div>
        </section>

        {previewImage && (
          <section className="preview-section">
            <h3>Исходное изображение</h3>
            <div className="preview-container">
              <img src={previewImage} alt="Preview" className="preview-image" />
            </div>
          </section>  
        )}

        {fName && (
          <section className="canvas-section">
            <h3>Картина по номерам</h3>
            <div className="canvas-layout">
              <MultiCanvas
                fName={fName}
                setIdList={setIdList}
                idList={idList}
                currentColor={currentColor}
                setColorCount={setColorCount}
                loading={loading}
                setLoading={setLoading}
                svgData={svgData}
              />
              
            </div>
            {idList.length > 0 && (
                <ColorPalette
                  colors={idList}
                  currentColor={currentColor}
                  onColorSelect={handleColorSelect}
                  colorCount={colorCount}
                />
              )}
          </section>
        )}

        <section className="features-section">
          <div className="feature">
            <h3>Детализация</h3>
            <p>Высокое качество обработки изображения</p>
          </div>
          <div className="feature">
            <h3>Качество</h3>
            <p>Точная передача цветов и оттенков</p>
          </div>
          <div className="feature">
            <h3>Простота</h3>
            <p>Интуитивно понятный интерфейс</p>
          </div>
        </section>
      </main>

      <footer className="footer">
        <p>© 2024 Paint By Number. Все права защищены.</p>
      </footer>
    </div>
  );
}

export default App;
