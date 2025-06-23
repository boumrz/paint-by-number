import React, { useState, useEffect } from 'react';
import styles from './App.module.css';
import FirstCanvas from './components/FirstCanvas';
import SecondCanvasFull from './components/SecondCanvasFull';
import axios from 'axios';
import Cropper from 'react-easy-crop';
import Modal from 'react-modal';

// Компонент инструкции для квадратов 10x10
const GridInstructions = ({ idList, svgData, title }) => {
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [showColorModal, setShowColorModal] = useState(false);

  const generateInstructionGrid = () => {
    const gridSize = 10;
    const cellSize = 60; // Увеличенный размер для инструкции
    const cells = [];
    
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const number = row * gridSize + col + 1;
        const x = col * cellSize;
        const y = row * cellSize;
        
        cells.push(
          <div
            key={number}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: cellSize,
              height: cellSize,
              border: '2px solid #000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#000',
              backgroundColor: '#f0f0f0',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#e0e0e0';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#f0f0f0';
            }}
            onClick={() => {
              setSelectedSquare(number);
              setShowColorModal(true);
            }}
            title={`Квадрат ${number} - кликните для просмотра цветов`}
          >
            {number}
          </div>
        );
      }
    }
    
    return cells;
  };

  // Извлечение цветов для конкретного квадрата
  const getSquareColors = (squareNumber) => {
    if (!svgData || !idList) {
      return [];
    }

    try {
      // Проверяем доступность DOMParser
      if (typeof DOMParser === 'undefined') {
        console.warn('DOMParser не доступен');
        return [];
      }
      
      // Создаем временный DOM элемент для парсинга SVG
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgData, 'image/svg+xml');
      
      // Проверяем на ошибки парсинга
      const parserError = svgDoc.querySelector('parsererror');
      if (parserError) {
        console.warn('Ошибка парсинга SVG:', parserError.textContent);
        return [];
      }
      
      const svgElement = svgDoc.documentElement;
      if (!svgElement) {
        console.warn('SVG элемент не найден');
        return [];
      }
      
      // Рассчитываем границы квадрата (90x90 пикселей)
      const squareSize = 90;
      const gridSize = 10;
      const row = Math.floor((squareNumber - 1) / gridSize);
      const col = (squareNumber - 1) % gridSize;
      const squareX = col * squareSize;
      const squareY = row * squareSize;
            
      // Проверяем тип холста по структуре данных
      const isPixelCanvas = svgData.includes('data-color') && svgData.includes('data-number');
      
      const colors = new Map();
      
      if (isPixelCanvas) {
        // Для pixel-based холста (второй холст)
        const rects = svgElement.querySelectorAll('rect[data-color]');
        
        rects.forEach((rect, index) => {
          const x = parseFloat(rect.getAttribute('x'));
          const y = parseFloat(rect.getAttribute('y'));
          const width = parseFloat(rect.getAttribute('width'));
          const height = parseFloat(rect.getAttribute('height'));
          
          // Проверяем, находится ли элемент в пределах квадрата
          if (x >= squareX && y >= squareY && 
              x + width <= squareX + squareSize && 
              y + height <= squareY + squareSize) {
            
            const dataColor = rect.getAttribute('data-color');
            if (dataColor) {
              // Извлекаем RGB значения из строки "rgb(r,g,b)"
              const rgbMatch = dataColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
              if (rgbMatch) {
                const r = parseInt(rgbMatch[1]);
                const g = parseInt(rgbMatch[2]);
                const b = parseInt(rgbMatch[3]);
                const colorKey = `${r},${g},${b}`;
                
                if (!colors.has(colorKey)) {
                  colors.set(colorKey, {
                    color: [r, g, b],
                    count: 0,
                    elements: []
                  });
                }
                colors.get(colorKey).count++;
                colors.get(colorKey).elements.push(`rect-${index}`);
              }
            }
          }
        });
      } else {
        // Для shape-based холста (первый холст)
        const elements = svgElement.querySelectorAll('g[id], rect[id], path[id], circle[id], ellipse[id], polygon[id]');
        
        elements.forEach((element, index) => {
          const id = element.getAttribute('id');
          if (id) {
            const colorItem = idList.find(item => {
              return item.shapes && item.shapes.includes(id);
            });
            
            if (colorItem && colorItem.color) {              
              const colorKey = colorItem.color.join(',');
              if (!colors.has(colorKey)) {
                colors.set(colorKey, {
                  color: colorItem.color,
                  count: 0,
                  elements: []
                });
              }
              colors.get(colorKey).count++;
              colors.get(colorKey).elements.push(id);
            }
          }
        });
      }
      
      const result = Array.from(colors.values());

      return result;
      
    } catch (error) {
      console.error('Ошибка при извлечении цветов квадрата:', error);
      return [];
    }
  };

  // Извлечение SVG фрагмента для конкретного квадрата
  const getSquareSvg = (squareNumber) => {
    if (!svgData) return null;

    try {
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgData, 'image/svg+xml');
      const svgElement = svgDoc.documentElement;
      
      if (!svgElement) return null;
      
      // Рассчитываем границы квадрата (90x90 пикселей)
      const squareSize = 90;
      const gridSize = 10;
      const row = Math.floor((squareNumber - 1) / gridSize);
      const col = (squareNumber - 1) % gridSize;
      const squareX = col * squareSize;
      const squareY = row * squareSize;
            
      // Проверяем тип холста
      const isPixelCanvas = svgData.includes('data-color') && svgData.includes('data-number');
      
      if (isPixelCanvas) {
        // Для pixel-based холста
        const rects = svgElement.querySelectorAll('rect[data-color]');
        const squareElements = [];
        
        rects.forEach((rect, index) => {
          const x = parseFloat(rect.getAttribute('x'));
          const y = parseFloat(rect.getAttribute('y'));
          const width = parseFloat(rect.getAttribute('width'));
          const height = parseFloat(rect.getAttribute('height'));
          const dataColor = rect.getAttribute('data-color');
          
          // Более точная проверка границ
          const elementRight = x + width;
          const elementBottom = y + height;
          const squareRight = squareX + squareSize;
          const squareBottom = squareY + squareSize;
          
          // Проверяем, пересекается ли элемент с квадратом
          const inSquare = x < squareRight && elementRight > squareX && 
                          y < squareBottom && elementBottom > squareY;
          
          if (inSquare) {            
            // Создаем копию элемента с относительными координатами
            const newRect = rect.cloneNode(true);
            newRect.setAttribute('x', x - squareX);
            newRect.setAttribute('y', y - squareY);
            
            // Устанавливаем правильный fill из data-color
            if (dataColor) {
              newRect.setAttribute('fill', dataColor);
            }
            
            squareElements.push(newRect.outerHTML);
          }
        });
                
        // Создаем SVG для квадрата
        const result = `<svg width="90" height="90" xmlns="http://www.w3.org/2000/svg" style="border: 2px solid #333;">
          ${squareElements.join('')}
        </svg>`;
        
        return result;
        
      } else {
        // Для shape-based холста
        const elements = svgElement.querySelectorAll('g[id], rect[id], path[id], circle[id], ellipse[id], polygon[id]');
        const squareElements = [];
        
        elements.forEach((element, index) => {
          const id = element.getAttribute('id');
          if (id) {
            // Находим цвет для этого элемента
            const colorItem = idList.find(item => item.shapes && item.shapes.includes(id));
            if (colorItem && colorItem.color) {              
              // Создаем копию элемента с правильным цветом
              const newElement = element.cloneNode(true);
              const fillColor = `rgb(${colorItem.color[0]}, ${colorItem.color[1]}, ${colorItem.color[2]})`;
              newElement.setAttribute('fill', fillColor);
              
              squareElements.push(newElement.outerHTML);
            }
          }
        });
                
        // Создаем SVG для квадрата
        const result = `<svg width="90" height="90" xmlns="http://www.w3.org/2000/svg" style="border: 2px solid #333;">
          ${squareElements.join('')}
        </svg>`;
        
        return result;
      }
      
    } catch (error) {
      console.error('Ошибка при создании SVG квадрата:', error);
      return null;
    }
  };

  const handleCloseModal = () => {
    setShowColorModal(false);
    setSelectedSquare(null);
  };

  return (
    <div style={{ 
      marginTop: '2rem', 
      padding: '1rem', 
      backgroundColor: '#fff', 
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <h3 style={{ marginBottom: '1rem', color: '#333' }}>{title}</h3>
      <div style={{ 
        position: 'relative', 
        width: '600px', 
        height: '600px', 
        margin: '0 auto',
        border: '3px solid #333',
        backgroundColor: '#fff'
      }}>
        {generateInstructionGrid()}
      </div>

      {/* Модальное окно с цветами квадрата */}
      {showColorModal && selectedSquare && (
        <Modal
          isOpen={showColorModal}
          onRequestClose={handleCloseModal}
          ariaHideApp={false}
          style={{
            overlay: { zIndex: 1000, background: 'rgba(0,0,0,0.7)' },
            content: { 
              maxWidth: 400, 
              margin: 'auto',
              height: 'auto', 
              padding: '20px',
              borderRadius: '8px'
            }
          }}
        >
          <div>
            <h3 style={{ marginBottom: '1rem', color: '#333', textAlign: 'center' }}>
              Квадрат {selectedSquare}
            </h3>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              marginBottom: '1rem',
              backgroundColor: '#f8f9fa',
              padding: '20px',
              borderRadius: '8px'
            }}>
              <div 
                dangerouslySetInnerHTML={{ 
                  __html: getSquareSvg(selectedSquare) || '<div style="text-align: center; color: #666;">Квадрат пуст</div>' 
                }}
                style={{
                  transform: 'scale(2)', // Увеличиваем в 2 раза для лучшей видимости
                  transformOrigin: 'top left'
                }}
              />
            </div>
            <div style={{ 
              marginTop: '1rem', 
              padding: '1rem', 
              backgroundColor: '#f8f9fa', 
              borderRadius: '4px',
              fontSize: '14px',
              lineHeight: '1.5'
            }}>
              <h4 style={{ marginBottom: '0.5rem', color: '#333' }}>Инструкция:</h4>
              <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                <li>Это увеличенный вид квадрата {selectedSquare}</li>
                <li>Закрашивайте области соответствующими цветами</li>
                <li>Используйте палитру справа от основного холста</li>
              </ul>
            </div>
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <button
                onClick={handleCloseModal}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Закрыть
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

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

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
            {fName && windowWidth >= 1010 && (
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
            {secondFName && windowWidth >= 1010 && (
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

        {/* Инструкции по закрашиванию */}
        {svgData && (
          <GridInstructions 
            idList={idList} 
            svgData={svgData} 
            title="Инструкция для первого холста"
          />
        )}
        {secondSvgData && (
          <GridInstructions 
            idList={secondIdList} 
            svgData={secondSvgData} 
            title="Инструкция для второго холста"
          />
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
