import React, { useState, useEffect } from 'react';
import styles from './App.module.css';
import SecondCanvasFull from './components/SecondCanvasFull';
import { ColorPalette } from './components/ColorPalette/ColorPalette';
import HorizontalCanvasFull from './components/HorizontalCanvas/HorizontalCanvasFull';

import axios from 'axios';
import { Select } from 'antd';
import Cropper from 'react-easy-crop';
import Modal from 'react-modal';
import { useMediaQuery } from 'usehooks-ts';
import { config } from './config.js';

import { GridInstructions  } from './components/GridInstructions';
import { ImagePreviewGallery } from './components/ImagePreviewGallery';

function App() {
  // Второй холст
  const [secondPreviewImage, setSecondPreviewImage] = useState(null);
  const [secondIdList, setSecondIdList] = useState([]);
  const [secondCurrentColor, setSecondCurrentColor] = useState(null);
  const [secondColorCount, setSecondColorCount] = useState({});
  const [secondSvgData, setSecondSvgData] = useState(null);
  const [secondSvgDataBW, setSecondSvgDataBW] = useState(null);
  const [secondSvgDataSepia, setSecondSvgDataSepia] = useState(null);

  // Третий холст (Horizontal)
  const [horizontalPreviewImage, setHorizontalPreviewImage] = useState(null);
  const [horizontalIdList, setHorizontalIdList] = useState([]);
  const [horizontalCurrentColor, setHorizontalCurrentColor] = useState(null);
  const [horizontalColorCount, setHorizontalColorCount] = useState({});
  const [horizontalSvgData, setHorizontalSvgData] = useState(null);
  const [horizontalSvgDataBW, setHorizontalSvgDataBW] = useState(null);
  const [horizontalSvgDataSepia, setHorizontalSvgDataSepia] = useState(null);

  const [showCrop, setShowCrop] = useState(false);
  const [cropImage, setCropImage] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [croppingFor, setCroppingFor] = useState(null);

  // Делаю одно:
  const [selectedInstruction, setSelectedInstruction] = useState(null); // { type: 'bw'|'sepia', orientation: 'vertical'|'horizontal' }
  const isTablet = useMediaQuery('(max-width: 1010px)');
  const isPhone = useMediaQuery('(max-width: 400px)');

  // Crop image to square using react-easy-crop
  const onCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const getCroppedImg = (imageSrc, cropPixels, callback) => {
    console.log('=== getCroppedImg called ===');
    console.log('Image source:', imageSrc);
    console.log('Crop pixels:', cropPixels);
    
    const img = new window.Image();
    img.onload = function () {
      console.log('Image loaded successfully');
      console.log('Original image size:', img.width, 'x', img.height);
      
      const canvas = document.createElement('canvas');
      canvas.width = cropPixels.width;
      canvas.height = cropPixels.height;
      console.log('Canvas size:', canvas.width, 'x', canvas.height);
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(
        img,
        cropPixels.x,
        cropPixels.y,
        cropPixels.width,
        cropPixels.height,
        0,
        0,
        cropPixels.width,
        cropPixels.height
      );
      console.log('Image drawn to canvas');
      
      canvas.toBlob((blob) => {
        if (blob) {
          console.log('Blob created successfully');
          console.log('Blob size:', blob.size);
          console.log('Blob type:', blob.type);
          callback(blob, canvas.toDataURL('image/jpeg'));
        } else {
          console.error('Failed to create blob');
          alert('Не удалось обработать изображение.');
        }
      }, 'image/jpeg');
    };
    img.onerror = function () {
      console.error('Failed to load image');
      alert('Не удалось прочитать изображение.');
    };
    img.src = imageSrc;
  };

  const handleUploadImageFile = (event) => {
    const file = event.target.files[0];
    if (file) {
      setCroppingFor('Обычное');
      setCropImage(URL.createObjectURL(file));
      setShowCrop(true);
    }
  };

  const handleUploadImageFileHorizontal = (event) => {
    const file = event.target.files[0];
    if (file) {
      setCroppingFor('horizontal');
      setCropImage(URL.createObjectURL(file));
      setShowCrop(true);
    }
  };

  const handleCropConfirm = async () => {
    if (!cropImage || !croppedAreaPixels) return;
    getCroppedImg(cropImage, croppedAreaPixels, async (croppedBlob, previewUrl) => {
      setShowCrop(false);
      setCropImage(null);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      if (croppingFor === 'Обычное' || croppingFor === 'Чернобелое' || croppingFor === 'Сепия') {
        setSecondPreviewImage(previewUrl);
        try {
          // Обычная генерация
          const formData = new FormData();
          formData.append('image', croppedBlob, 'cropped.jpg');
          const respColor = await axios.post(`${config.apiUrl}/api/convert-pixels`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
          setSecondSvgData(respColor.data.svg);
          setSecondIdList(respColor.data.palette);
          // ЧБ генерация
          const respBW = await axios.post(`${config.apiUrl}/api/convert-pixels-bw`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
          setSecondSvgDataBW(respBW.data.svg);
          // Сепия генерация
          const respSepia = await axios.post(`${config.apiUrl}/api/convert-pixels-sepia`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
          setSecondSvgDataSepia(respSepia.data.svg);
        } catch (error) {
          console.error('Error processing image:', error);
          console.error('Error response:', error.response?.data);
          console.error('Error status:', error.response?.status);
        }
      } else if (croppingFor === 'horizontal') {
        setHorizontalPreviewImage(previewUrl);
        try {
          const formData = new FormData();
          formData.append('image', croppedBlob, 'cropped.jpg');
          // ЧБ генерация
          const respBW = await axios.post(`${config.apiUrl}/api/convert-pixels-horizontal-bw`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
          setHorizontalSvgDataBW(respBW.data.svg);
          // Сепия генерация
          const respSepia = await axios.post(`${config.apiUrl}/api/convert-pixels-horizontal-sepia`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
          setHorizontalSvgDataSepia(respSepia.data.svg);
        } catch (error) {
          console.error('Error processing horizontal image:', error);
          console.error('Error response:', error.response?.data);
          console.error('Error status:', error.response?.status);
        }
      }
      setCroppingFor(null);
    });
  };

  const handleCropCancel = () => {
    setShowCrop(false);
    setCropImage(null);
    setCroppingFor(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  // Добавляю функции для заполнения и очистки SVG
  function fillSvgColors(svg) {
    if (!svg) return svg;
    try {
      const parser = new window.DOMParser();
      const doc = parser.parseFromString(svg, 'image/svg+xml');
      const rects = doc.querySelectorAll('rect[data-color]');
      rects.forEach(rect => {
        const color = rect.getAttribute('data-color');
        if (color) rect.setAttribute('fill', color);
      });
      return doc.documentElement.outerHTML;
    } catch {
      return svg;
    }
  }
  function clearSvgColors(svg) {
    if (!svg) return svg;
    try {
      const parser = new window.DOMParser();
      const doc = parser.parseFromString(svg, 'image/svg+xml');
      const rects = doc.querySelectorAll('rect[data-color]');
      rects.forEach(rect => {
        rect.setAttribute('fill', 'white');
      });
      return doc.documentElement.outerHTML;
    } catch {
      return svg;
    }
  }

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
            <h2>Создавай свои шедевры</h2>
            <p>Преврати любую фотографию в картину по номерам</p>
            <div className={styles.uploadSection}>
              <input
                type="file"
                accept="image/*"
                onChange={handleUploadImageFile}
                id="image-upload"
                className={styles.fileInput}
              />
              <label htmlFor="image-upload" className={styles.uploadButton}>
                Загрузить
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleUploadImageFileHorizontal}
                id="image-upload-horizontal"
                className={styles.fileInput}
              />
              <label htmlFor="image-upload-horizontal" className={styles.uploadButton}>
                Загрузить (горизонтальный)
              </label>
            </div>
          </div>
        </section>

        <div style={{ display: 'flex', gap: '2rem', minHeight: 400, flexWrap: 'wrap', flexDirection: 'column' }}>
          <div style={{ flex: 1, minWidth: !isPhone ? 400 : 0 }}>
            {(secondPreviewImage || secondSvgDataBW || secondSvgDataSepia) && (
              <ImagePreviewGallery
                original={secondPreviewImage}
                pixelBW={secondSvgDataBW}
                pixelSepia={secondSvgDataSepia}
                orientation="vertical"
                onSelect={type => setSelectedInstruction({ type, orientation: 'vertical' })}
              />
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '2rem', minHeight: 400, flexWrap: 'wrap', flexDirection: 'column' }}>
          <div style={{ flex: 1, minWidth: !isPhone ? 400 : 0 }}>
            {(horizontalPreviewImage || horizontalSvgDataBW || horizontalSvgDataSepia) && (
              <ImagePreviewGallery
                original={horizontalPreviewImage}
                pixelBW={horizontalSvgDataBW}
                pixelSepia={horizontalSvgDataSepia}
                orientation="horizontal"
                onSelect={type => setSelectedInstruction({ type, orientation: 'horizontal' })}
              />
            )}
          </div>
        </div>
        
        <Modal
          isOpen={showCrop}
          onRequestClose={handleCropCancel}
          ariaHideApp={false}
          style={{
            overlay: { zIndex: 1000, background: 'rgba(0,0,0,0.7)' },
            content: { maxWidth: 600, margin: 'auto', height: 600, padding: 0 }
          }}
        >
          <div style={{ position: 'relative', width: '100%', height: '88%', background: '#222' }}>
            {cropImage && (
              <Cropper
                image={cropImage}
                crop={crop}
                zoom={zoom}
                aspect={croppingFor === 'horizontal' ? 1.25 : 0.8}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                cropShape="rect"
                showGrid={true}
              />
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, margin: 16 }}>
            <button onClick={handleCropConfirm} style={{ padding: '8px 24px', fontSize: 16 }}>Обрезать</button>
            <button onClick={handleCropCancel} style={{ padding: '8px 24px', fontSize: 16 }}>Отмена</button>
          </div>
        </Modal>

        {selectedInstruction && selectedInstruction.orientation === 'vertical' && selectedInstruction.type === 'bw' && secondSvgDataBW && (
          <GridInstructions
            idList={secondIdList}
            svgData={secondSvgDataBW}
            title="Инструкция (ЧБ)"
            orientation="vertical"
          />
        )}
        {selectedInstruction && selectedInstruction.orientation === 'vertical' && selectedInstruction.type === 'sepia' && secondSvgDataSepia && (
          <GridInstructions
            idList={secondIdList}
            svgData={secondSvgDataSepia}
            title="Инструкция (Сепия)"
            orientation="vertical"
          />
        )}
        {selectedInstruction && selectedInstruction.orientation === 'horizontal' && selectedInstruction.type === 'bw' && horizontalSvgDataBW && (
          <GridInstructions
            idList={horizontalIdList}
            svgData={horizontalSvgDataBW}
            title="Инструкция (ЧБ, горизонтальный)"
            orientation="horizontal"
          />
        )}
        {selectedInstruction && selectedInstruction.orientation === 'horizontal' && selectedInstruction.type === 'sepia' && horizontalSvgDataSepia && (
          <GridInstructions
            idList={horizontalIdList}
            svgData={horizontalSvgDataSepia}
            title="Инструкция (Сепия, горизонтальный)"
            orientation="horizontal"
          />
        )}
      </main>

      <footer className={styles.footer}>
        <p>© 2025 Картина по пикселям. Все права защищены.</p>
      </footer>
    </div>
  );
}

export default App;
