export const getSquareColors = (squareNumber, svgData, idList, orientation) => {
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