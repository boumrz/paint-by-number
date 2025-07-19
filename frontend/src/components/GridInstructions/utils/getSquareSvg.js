// Извлечение SVG фрагмента для конкретного квадрата
export const getSquareSvg = (squareNumber, orientation, idList, svgData ) => {
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