import React, { useEffect, useRef, useState } from 'react';
import styles from './MultiCanvas.module.css';

const MultiCanvas = ({
  fName,
  setIdList,
  idList,
  currentColor,
  setColorCount,
  loading,
  setLoading,
  svgData
}) => {
  const svgRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isSelecting, setIsSelecting] = useState(false);
  const [selection, setSelection] = useState({ start: { x: 0, y: 0 }, end: { x: 0, y: 0 } });
  const selectionRef = useRef(null);

  useEffect(() => {
    if (svgData && svgRef.current) {
      try {
        // Модифицируем SVG для улучшения отображения цифр
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgData, 'image/svg+xml');
        
        // Находим все текстовые элементы
        const textElements = svgDoc.querySelectorAll('text');
        textElements.forEach(text => {
          // Устанавливаем стили для текста
          text.setAttribute('font-family', 'Arial, sans-serif');
          text.setAttribute('font-weight', '400');
          text.setAttribute('font-size', '6px');
          text.setAttribute('fill', '#000000');
          text.setAttribute('stroke', 'none');
          text.setAttribute('paint-order', 'stroke');
          text.setAttribute('dominant-baseline', 'middle');
          text.setAttribute('text-anchor', 'middle');
          
          // Добавляем атрибуты для предотвращения выделения
          text.setAttribute('user-select', 'none');
          text.setAttribute('pointer-events', 'none');
          text.setAttribute('style', 'user-select: none; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none;');
          text.setAttribute('unselectable', 'on');
          text.setAttribute('onselectstart', 'return false;');
          text.setAttribute('onmousedown', 'return false;');
        });

        // Добавляем стили для всего SVG
        const svgElement = svgDoc.documentElement;
        svgElement.setAttribute('style', 'user-select: none; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none;');

        // Преобразуем обратно в строку
        const serializer = new XMLSerializer();
        const modifiedSvg = serializer.serializeToString(svgDoc);
        
        svgRef.current.innerHTML = modifiedSvg;
      } catch (error) {
        console.error('Error processing SVG:', error);
        // В случае ошибки используем оригинальный SVG
        svgRef.current.innerHTML = svgData;
      }
    }
  }, [svgData]);

  useEffect(() => {
    if (svgRef.current) {
      const elements = svgRef.current.querySelectorAll('g');
      elements.forEach(g => {
        g.addEventListener('click', handleElementClick);
      });

      return () => {
        elements.forEach(g => {
          g.removeEventListener('click', handleElementClick);
        });
      };
    }
  }, [svgData, currentColor]);

  const handleElementClick = (event) => {
    if (currentColor) {
      const g = event.currentTarget;
      const id = g.getAttribute('id');
      g.setAttribute('fill', `rgb(${currentColor[0]}, ${currentColor[1]}, ${currentColor[2]})`);
      updateColorCount(id);
    }
  };

  const updateColorCount = (id) => {
    const color = idList.find(item => item.shapes.includes(id))?.color;
    if (color) {
      setColorCount(prev => {
        const newCount = { ...prev };
        const colorKey = color.join(',');
        newCount[colorKey] = (newCount[colorKey] || 0) + 1;
        return newCount;
      });
    }
  };

  const handleClearAll = () => {
    const elements = document.querySelectorAll('.svg-element svg');
    elements.forEach(el => {
      const elements = el.querySelectorAll('g');
      elements.forEach(g => {
        g.setAttribute('fill', 'white');
      });
    });
  };

  const handleFillAll = () => {
    const elements = document.querySelectorAll('.svg-element svg');
    elements.forEach(el => {
      const elements = el.querySelectorAll('g');
      elements.forEach(g => {
        const id = g.getAttribute('id');
        const color = idList.find(item => item.shapes.includes(id))?.color;
        if (color) {
          g.setAttribute('fill', `rgb(${color[0]}, ${color[1]}, ${color[2]})`);
        }
      });
    });
  };

  const handleMouseDown = (e) => {
    if (e.button === 0) { // Левая кнопка мыши
      if (e.altKey) { // Alt + левая кнопка для выделения области
        setIsSelecting(true);
        const rect = e.currentTarget.getBoundingClientRect();
        const startX = e.clientX - rect.left;
        const startY = e.clientY - rect.top;
        setSelection({
          start: { x: startX, y: startY },
          end: { x: startX, y: startY }
        });
      } else { // Обычное перетаскивание
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
      }
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    } else if (isSelecting) {
      const rect = e.currentTarget.getBoundingClientRect();
      setSelection(prev => ({
        ...prev,
        end: {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        }
      }));
    }
  };

  const handleMouseUp = (e) => {
    if (isSelecting) {
      const rect = e.currentTarget.getBoundingClientRect();
      const endX = e.clientX - rect.left;
      const endY = e.clientY - rect.top;
      
      // Вычисляем размеры выделенной области
      const width = Math.abs(endX - selection.start.x);
      const height = Math.abs(endY - selection.start.y);
      
      if (width > 10 && height > 10) { // Минимальный размер выделения
        // Вычисляем новый масштаб, чтобы выделенная область поместилась в видимую область
        const containerWidth = rect.width;
        const containerHeight = rect.height;
        const scaleX = containerWidth / width;
        const scaleY = containerHeight / height;
        const newScale = Math.min(scaleX, scaleY) * 0.9; // 0.9 для небольшого отступа
        
        // Вычисляем новую позицию для центрирования выделенной области
        const centerX = (selection.start.x + endX) / 2;
        const centerY = (selection.start.y + endY) / 2;
        const newX = containerWidth / 2 - centerX * newScale;
        const newY = containerHeight / 2 - centerY * newScale;
        
        setScale(newScale);
        setPosition({ x: newX, y: newY });
      }
    }
    setIsDragging(false);
    setIsSelecting(false);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Блокируем масштабирование
    return false;
  };

  const handleDoubleClick = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  return (
    <div className={styles.container}>
      <div className={styles.controls}>
        <button onClick={handleClearAll} className={styles.button}>
          Очистить все
        </button>
        <button onClick={handleFillAll} className={styles.button}>
          Заполнить все
        </button>
        <button onClick={handleDoubleClick} className={styles.button}>
          Сбросить масштаб
        </button>
        <div className={styles.hint}>
          Alt + левая кнопка мыши для выделения области
        </div>
      </div>
      
      <div className={styles.section}>
        <div 
          className={styles.wrapper}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          style={{
            cursor: isDragging ? 'grabbing' : (isSelecting ? 'crosshair' : 'grab')
          }}
        >
          <div 
            className="svg-element" 
            ref={svgRef}
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transformOrigin: '0 0',
              transition: isDragging || isSelecting ? 'none' : 'transform 0.1s'
            }}
          ></div>
          {isSelecting && (
            <div
              ref={selectionRef}
              className={styles.selectionBox}
              style={{
                left: Math.min(selection.start.x, selection.end.x),
                top: Math.min(selection.start.y, selection.end.y),
                width: Math.abs(selection.end.x - selection.start.x),
                height: Math.abs(selection.end.y - selection.start.y)
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default MultiCanvas; 