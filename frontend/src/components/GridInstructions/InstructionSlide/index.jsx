import { memo, useMemo } from 'react';

// Извлечение SVG фрагмента для конкретного квадрата
const getSquareSvg = (squareNumber, orientation, idList, svgData ) => {
  if (!svgData) return null;

  try {
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgData, 'image/svg+xml');
    const svgElement = svgDoc.documentElement;
    const canvasWidth = orientation === 'horizontal' ? 1000 : 800;
    const canvasHeight = orientation === 'horizontal' ? 800 : 1000;
    const gridCols = orientation === 'horizontal' ? 16 : 8;
    const gridRows = orientation === 'horizontal' ? 8 : 16;
    const cellWidth = canvasWidth / gridCols;
    const cellHeight = canvasHeight / gridRows;    
    
    if (!svgElement) return null;
    
    // Рассчитываем границы квадрата
    const row = Math.floor((squareNumber - 1) / gridCols);
    const col = (squareNumber - 1) % gridCols;
    const squareX = col * cellWidth;
    const squareY = row * cellHeight;
          
    // Проверяем тип холста
    const isPixelCanvas = svgData.includes('data-color') && svgData.includes('data-number');
    
    if (isPixelCanvas) {
      // Для pixel-based холста
      const rects = svgElement.querySelectorAll('rect[data-color]');
      const squareElements = [];
      const textElements = [];
      rects.forEach((rect, index) => {
        const x = parseFloat(rect.getAttribute('x'));
        const y = parseFloat(rect.getAttribute('y'));
        const width = parseFloat(rect.getAttribute('width'));
        const height = parseFloat(rect.getAttribute('height'));
        const dataColor = rect.getAttribute('data-color');
        const dataNumber = rect.getAttribute('data-number');
        // Более точная проверка границ
        const elementRight = x + width;
        const elementBottom = y + height;
        const squareRight = squareX + cellWidth;
        const squareBottom = squareY + cellHeight;
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
          // Добавляем текст с номером цвета по центру прямоугольника
          if (dataNumber) {
            const textX = x - squareX + width / 2;
            const textY = y - squareY + height / 2 + 2; // +2 для вертикального центрирования
            textElements.push(`<text x="${textX}" y="${textY}" font-size="3.5" font-family="Arial, sans-serif" fill="#222" stroke="#fff" stroke-width="0.1" text-anchor="middle" dominant-baseline="middle">${dataNumber}</text>`);
          }
        }
      });
      // Создаем SVG для квадрата
      const result = `<svg width="${cellWidth}px" height="${cellHeight}px" viewBox="0 0 ${cellWidth} ${cellHeight}" xmlns="http://www.w3.org/2000/svg" style="display: block; width: 100%; height: 100%;">
        ${squareElements.join('')}
        ${textElements.join('')}
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
      const result = `<svg width="${cellWidth}px" height="${cellHeight}px" viewBox="0 0 ${cellWidth} ${cellHeight}" xmlns="http://www.w3.org/2000/svg" style="display: block; width: 100%; height: 100%;">
        ${squareElements.join('')}
      </svg>`;
      
      return result;
    }
    
  } catch (error) {
    console.error('Ошибка при создании SVG квадрата:', error);
    return null;
  }
};

const getSquareColors = (squareNumber, svgData, idList, orientation) => {
  const gridCols = orientation === 'horizontal' ? 16 : 8;
  const gridRows = orientation === 'horizontal' ? 8 : 16;
  const canvasWidth = orientation === 'horizontal' ? 1000 : 800;
  const canvasHeight = orientation === 'horizontal' ? 800 : 1000;
  const cellWidth = canvasWidth / gridCols;
  const cellHeight = canvasHeight / gridRows;    

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
    
    // Рассчитываем границы квадрата
    const row = Math.floor((squareNumber - 1) / gridCols);
    const col = (squareNumber - 1) % gridCols;
    const squareX = col * cellWidth;
    const squareY = row * cellHeight;
          
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
            x + width <= squareX + cellWidth && 
            y + height <= squareY + cellHeight) {
          
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

export const InstructionSlide = memo(({ orientation, svgData, idList, squareNumber, isPhone }) => {  
  // Кэшируем тяжелые вычисления
  const slideData = useMemo(() => {
    try {
      const colors = getSquareColors(squareNumber, svgData, idList, orientation);
      const svgContent = getSquareSvg(squareNumber, orientation, idList, svgData);
      return { colors, svgContent };
    } catch (error) {
      console.error(`Ошибка при вычислении данных слайда ${squareNumber}:`, error);
      return { colors: [], svgContent: null };
    }
  }, [squareNumber, svgData, idList, orientation]);

  try {
    const { colors, svgContent } = slideData;
    
    return (
      <div key={squareNumber} style={{
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
        height: '100%',
        minHeight: isPhone ? '300px' : '400px'
      }}>
        <div style={{ 
          fontWeight: 'bold', 
          marginBottom: 8, 
          fontSize: '1.2rem',
          textAlign: 'center'
        }}>
          Сектор {squareNumber}
        </div>
        <div style={{ 
          flex: 1, 
          width: '100%', 
          height: '100%', 
          minHeight: 0, 
          minWidth: 0, 
          marginBottom: 0, 
          background: '#fff', 
          borderRadius: 8, 
          display: 'flex', 
          alignItems: 'stretch', 
          justifyContent: 'stretch',
          border: '1px solid #ddd'
        }}>
          <div
            dangerouslySetInnerHTML={{ __html: svgContent || '<div style="text-align: center; color: #666; display: flex; align-items: center; justify-content: center; height: 100%;">Сектор пуст</div>' }}
            style={{ width: '100%', height: '100%', minHeight: 0, minWidth: 0, display: 'block' }}
          />
        </div>
      </div>
    );
  } catch (error) {
    console.error(`Ошибка в слайде ${squareNumber}:`, error);
    return (
      <div style={{
        padding: '1rem',
        background: '#f8f9fa',
        borderRadius: '8px',
        color: 'black',
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
        border: '1px solid #e0e0e0',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        minHeight: isPhone ? '300px' : '400px'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: 8, fontSize: '1.2rem', textAlign: 'center' }}>
          Сектор {squareNumber}
        </div>
        <div style={{ color: '#666', textAlign: 'center' }}>
          Ошибка загрузки сектора
        </div>
      </div>
    );
  }
});