import React, { useState } from 'react';
import styles from './App.module.css';
import FirstCanvas from './components/FirstCanvas';
import SecondCanvasFull from './components/SecondCanvasFull';
import axios from 'axios';
import Cropper from 'react-easy-crop';
import Modal from 'react-modal';

function App() {
  // Первый холст
  const [fName, setFName] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [idList, setIdList] = useState([]);
  const [currentColor, setCurrentColor] = useState(null);
  const [colorCount, setColorCount] = useState({});
  const [loading, setLoading] = useState(false);
  const [svgData, setSvgData] = useState(null);

  // Второй холст
  const [secondFName, setSecondFName] = useState(null);
  const [secondPreviewImage, setSecondPreviewImage] = useState(null);
  const [secondIdList, setSecondIdList] = useState([]);
  const [secondCurrentColor, setSecondCurrentColor] = useState(null);
  const [secondColorCount, setSecondColorCount] = useState({});
  const [secondSvgData, setSecondSvgData] = useState(null);

  const MAX_FILE_SIZE_MB = 5;
  const MAX_IMAGE_DIMENSION = 2000;

  const [showCrop, setShowCrop] = useState(false);
  const [cropImage, setCropImage] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [croppingFor, setCroppingFor] = useState(null); // 'first' | 'second'

  const checkImageFile = (file, callback) => {
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      alert(`Размер файла превышает ${MAX_FILE_SIZE_MB} МБ. Пожалуйста, выберите файл меньшего размера.`);
      return false;
    }
    const img = new window.Image();
    img.onload = function () {
      if (img.width > MAX_IMAGE_DIMENSION || img.height > MAX_IMAGE_DIMENSION) {
        alert(`Изображение слишком большое. Максимальный размер: ${MAX_IMAGE_DIMENSION}x${MAX_IMAGE_DIMENSION} пикселей.`);
        return;
      }
      callback();
    };
    img.onerror = function () {
      alert('Не удалось прочитать изображение.');
    };
    img.src = URL.createObjectURL(file);
    return true;
  };

  // Crop image to square using react-easy-crop
  const onCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const getCroppedImg = (imageSrc, cropPixels, callback) => {
    const img = new window.Image();
    img.onload = function () {
      const canvas = document.createElement('canvas');
      canvas.width = cropPixels.width;
      canvas.height = cropPixels.height;
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
      canvas.toBlob((blob) => {
        if (blob) {
          callback(blob, canvas.toDataURL('image/jpeg'));
        } else {
          alert('Не удалось обработать изображение.');
        }
      }, 'image/jpeg');
    };
    img.onerror = function () {
      alert('Не удалось прочитать изображение.');
    };
    img.src = imageSrc;
  };

  const handleImageFile = (event) => {
    const file = event.target.files[0];
    if (file) {
      setCroppingFor('first');
      setCropImage(URL.createObjectURL(file));
      setShowCrop(true);
    }
  };

  const handleSecondImageFile = (event) => {
    const file = event.target.files[0];
    if (file) {
      setCroppingFor('second');
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
      if (croppingFor === 'first') {
        setFName(previewUrl);
        setPreviewImage(previewUrl);
        setLoading(true);
        try {
          const formData = new FormData();
          formData.append('image', croppedBlob, 'cropped.jpg');
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
      } else if (croppingFor === 'second') {
        setSecondFName(previewUrl);
        setSecondPreviewImage(previewUrl);
        setLoading(true);
        try {
          const formData = new FormData();
          formData.append('image', croppedBlob, 'cropped.jpg');
          const response = await axios.post('http://localhost:5000/api/convert-pixels', formData, {
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

        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', flexDirection: 'column' }}>
          <div style={{ flex: 1, minWidth: 400 }}>
            {previewImage && (
              <section className={styles.previewSection}>
                <h3>Исходное изображение</h3>
                <div className={styles.previewContainer}>
                  <img src={previewImage} alt="Preview" className={styles.previewImage} />
                </div>
              </section>
            )}
            {fName && (
              <FirstCanvas
                svgData={svgData}
                idList={idList}
                currentColor={currentColor}
                setColorCount={setColorCount}
                colorCount={colorCount}
                setCurrentColor={setCurrentColor}
              />
            )}
          </div>
          <div style={{ flex: 1, minWidth: 400 }}>
            {secondPreviewImage && (
              <section className={styles.previewSection}>
                <h3>Исходное изображение для второго холста</h3>
                <div className={styles.previewContainer}>
                  <img src={secondPreviewImage} alt="Second Preview" className={styles.previewImage} />
                </div>
              </section>
            )}
            {secondFName && (
              <SecondCanvasFull
                svgData={secondSvgData}
                idList={secondIdList}
                currentColor={secondCurrentColor}
                setColorCount={setSecondColorCount}
                colorCount={secondColorCount}
                setCurrentColor={setSecondCurrentColor}
              />
            )}
          </div>
        </div>

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

        <Modal
          isOpen={showCrop}
          onRequestClose={handleCropCancel}
          ariaHideApp={false}
          style={{
            overlay: { zIndex: 1000, background: 'rgba(0,0,0,0.7)' },
            content: { maxWidth: 600, margin: 'auto', height: 600, padding: 0 }
          }}
        >
          <div style={{ position: 'relative', width: 500, height: 500, background: '#222' }}>
            {cropImage && (
              <Cropper
                image={cropImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
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
      </main>

      <footer className={styles.footer}>
        <p>© 2024 Paint By Number. Все права защищены.</p>
      </footer>
    </div>
  );
}

export default App;
