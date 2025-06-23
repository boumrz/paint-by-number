import React, { useState } from 'react';
import Modal from 'react-modal';
import { useMediaQuery } from 'usehooks-ts';
import { FixedSizeList as List } from 'react-window';

// Компонент инструкции для квадратов 10x10
export const GridInstructions = ({ idList, svgData, title }) => {
    console.log('idList', idList);
    const [selectedSquare, setSelectedSquare] = useState(null);
    const [showColorModal, setShowColorModal] = useState(false);

    const isTablet = useMediaQuery('(max-width: 1010px)');
  
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
              <div>
                {number}
              </div>
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
  
    if (isTablet) {
      // Мобильный/адаптивный режим: выводим все квадраты и их цвета в столбик через виртуальный список
      const Row = ({ index, style }) => {
        const number = index + 1;
        const colors = getSquareColors(number);
        return (
          <div key={number} style={{
            ...style,
            marginBottom: '1.5rem',
            padding: '1rem',
            background: '#f8f9fa',
            borderRadius: '8px',
            color: 'black',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            border: '1px solid #e0e0e0',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: 8 }}>Квадрат {number}</div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12, justifyContent: 'center' }}>
              <div
                dangerouslySetInnerHTML={{ __html: getSquareSvg(number) || '<div style="text-align: center; color: #666;">Квадрат пуст</div>' }}
                style={{ margin: '0 auto', background: '#fff', borderRadius: 8 }}
              />
            </div>
          </div>
        );
      };
      return (
        <div>
          <h3 style={{ marginBottom: '1rem', color: '#333' }}>{title}</h3>
          <List
            height={window.innerHeight - 120}
            itemCount={100}
            itemSize={300}
            overscanCount={8}
            width={'100%'}
            style={{ maxWidth: 420, margin: '0 auto' }}
          >
            {Row}
          </List>
        </div>
      );
    }
    // Десктоп: прежняя логика
    return (
      <div>
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