import React, { useEffect, useState } from 'react';
import styles from './HorizontalCanvas.module.css';
import useCanvas from '../../hooks/useCanvas';
import cn from 'clsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const HorizontalCanvasFull = ({
  svgData,
  idList,
  currentColor,
  setColorCount,
}) => {
  const {
    svgRef,
    scale,
    position,
    isDragging,
    isSelecting,
    selection,
    selectionRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    handleDoubleClick
  } = useCanvas(svgData, currentColor, idList, setColorCount);

  const [isFilled, setIsFilled] = useState(false);

  const handleFillAll = () => {
    if (svgRef.current) {
      const rects = svgRef.current.querySelectorAll('rect[data-color]');
      rects.forEach(rect => {
        const dataColor = rect.getAttribute('data-color');
        if (dataColor) {
          rect.setAttribute('fill', dataColor);
        }
      });
      // Скрыть номера
      const digitRects = svgRef.current.querySelectorAll('rect[data-digit-label="1"]');
      digitRects.forEach(rect => {
        rect.style.display = 'none';
      });
    }
    setIsFilled(true);
    // Скрыть сетку (grid)
    const gridLayer = document.querySelector('.svg-container + div');
    if (gridLayer) gridLayer.style.display = 'none';
  };

  const handleClearAll = () => {
    if (svgRef.current) {
      const rects = svgRef.current.querySelectorAll('rect[data-color]');
      rects.forEach(rect => {
        rect.setAttribute('fill', 'white');
      });
      // Показать номера
      const digitRects = svgRef.current.querySelectorAll('rect[data-digit-label="1"]');
      digitRects.forEach(rect => {
        rect.style.display = '';
      });
    }
    setIsFilled(false);
    // Показать сетку (grid)
    const gridLayer = document.querySelector('.svg-container + div');
    if (gridLayer) gridLayer.style.display = '';
  };

  // Генерация сетки 16x8 (160x128 px каждый) с шахматной заливкой
  const generateGrid = () => {
    const gridCols = 16; // большие зоны по ширине
    const gridRows = 8; // большие зоны по высоте
    const cellWidth = 1000 / gridCols; // 62.5
    const cellHeight = 800 / gridRows; // 100
    const pxPerCellX = 10; // маленьких клеток в зоне по ширине
    const pxPerCellY = 16; // маленьких клеток в зоне по высоте
    const pxWidth = cellWidth / pxPerCellX; // 6.25
    const pxHeight = cellHeight / pxPerCellY; // 6.25
    const cells = [];
    for (let row = 0; row < gridRows; row++) {
      for (let col = 0; col < gridCols; col++) {
        const number = row * gridCols + col + 1;
        const x = col * cellWidth;
        const y = row * cellHeight;
        // Шахматная заливка: если (row + col) % 2 === 0 — светло-серый с прозрачностью, иначе прозрачный
        const bg = isFilled ? 'transparent' : ((row + col) % 2 === 0 ? 'rgba(243,243,243,0.5)' : 'rgba(255,255,255,0.0)');
        cells.push(
          <div
            key={number}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: cellWidth,
              height: cellHeight,
              boxSizing: 'border-box',
              borderRight: col < gridCols - 1 ? '1px solid #333' : 'none',
              borderBottom: row < gridRows - 1 ? '1px solid #333' : 'none',
              borderLeft: col === 0 ? '1px solid #333' : 'none',
              borderTop: row === 0 ? '1px solid #333' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 7,
              fontWeight: 'bold',
              color: '#333',
              backgroundColor: bg,
              pointerEvents: 'none'
            }}
          >
            {/* Нумерация по горизонтали (1-10) в первой строке */}
            {Array.from({ length: pxPerCellX }).map((_, i) => (
              i === 0 ? null : (
                <span
                  key={`h-${i}`}
                  style={{
                    position: 'absolute',
                    left: i * pxWidth + pxWidth / 2 - ((i + 1) < 10 ? 1 : 2),
                    top: (i + 1) < 10 ? -2 : -2,
                    fontSize: 4,
                    color: '#888',
                    pointerEvents: 'none',
                    fontWeight: 500,
                    zIndex: 2,
                    userSelect: 'none',
                  }}
                >
                  {i + 1}
                </span>
              )
            ))}
            {/* Нумерация по вертикали (1-16) в первом столбце */}
            {Array.from({ length: pxPerCellY }).map((_, j) => (
              <span
                key={`v-${j}`}
                style={{
                  position: 'absolute',
                  left: (j + 1) < 10 ? 2 : 1,
                  top: j * pxHeight + pxHeight / 2 - ((j + 1) < 10 ? 5 : 5),
                  fontSize: 4,
                  color: '#888',
                  pointerEvents: 'none',
                  fontWeight: 500,
                  zIndex: 2,
                  userSelect: 'none',
                }}
              >
                {j + 1}
              </span>
            ))}
          </div>
        );
      }
    }
    return cells;
  };

  // Генерация SVG-сетки и номеров для экспорта
  function generateSvgGridAndNumbers() {
    const gridCols = 16;
    const gridRows = 8;
    const cellWidth = 1000 / gridCols;
    const cellHeight = 800 / gridRows;
    let gridSvg = '';
    // Вертикальные линии
    for (let i = 0; i <= gridCols; i++) {
      const x = i * cellWidth;
      gridSvg += `<line x1="${x}" y1="0" x2="${x}" y2="800" stroke="#333" stroke-width="1" />`;
    }
    // Горизонтальные линии
    for (let j = 0; j <= gridRows; j++) {
      const y = j * cellHeight;
      gridSvg += `<line x1="0" y1="${y}" x2="1000" y2="${y}" stroke="#333" stroke-width="1" />`;
    }
    // Номера по горизонтали (в первой строке)
    for (let i = 0; i < gridCols; i++) {
      const x = i * cellWidth + cellWidth / 2;
      gridSvg += `<text x="${x}" y="18" font-size="16" fill="#888" text-anchor="middle" font-family="Arial">${i + 1}</text>`;
    }
    // Номера по вертикали (в первом столбце)
    for (let j = 0; j < gridRows; j++) {
      const y = j * cellHeight + cellHeight / 2 + 6;
      gridSvg += `<text x="18" y="${y}" font-size="16" fill="#888" text-anchor="middle" font-family="Arial">${j + 1}</text>`;
    }
    return gridSvg;
  }

  // Генерация SVG-нумерации по горизонтали и вертикали для экспорта
  function generateSvgAxisNumbers() {
    const gridCols = 16;
    const gridRows = 8;
    const cellWidth = 1000 / gridCols;
    const cellHeight = 800 / gridRows;
    const pxPerCellX = 10;
    const pxPerCellY = 16;
    const pxWidth = cellWidth / pxPerCellX;
    const pxHeight = cellHeight / pxPerCellY;
    let axisSvg = '';
    // Разлиновка по зонам (тонкие линии)
    for (let i = 0; i <= gridCols; i++) {
      const x = i * cellWidth;
      axisSvg += `<line x1="${x}" y1="0" x2="${x}" y2="800" stroke="#222" stroke-width="1.1" />`;
    }
    for (let j = 0; j <= gridRows; j++) {
      const y = j * cellHeight;
      axisSvg += `<line x1="0" y1="${y}" x2="1000" y2="${y}" stroke="#222" stroke-width="1.1" />`;
    }
    for (let row = 0; row < gridRows; row++) {
      const y0 = row * cellHeight;
      for (let col = 0; col < gridCols; col++) {
        const x0 = col * cellWidth;
        // Горизонтальная нумерация (2-10) сверху каждой зоны
        for (let i = 2; i <= pxPerCellX; i++) {
          let x = x0 + i * pxWidth + pxWidth / 2 - ((i + 1) < 10 ? 1 : 2);
          let y = y0 - 2;
          // Сдвиг на одну клетку левее и ниже
          x -= pxWidth;
          y += pxHeight;
          // Дополнительно сдвигаем на 1/4 клетки вправо
          x += pxWidth / 4;
          axisSvg += `<text x="${x}" y="${y}" font-size="4" fill="#888" font-weight="500" text-anchor="middle" font-family="Arial" style="user-select:none;pointer-events:none;">${i}</text>`;
        }
        // Вертикальная нумерация (1-16) слева каждой зоны
        for (let j = 1; j <= pxPerCellY; j++) {
          let x = x0 + ((j + 1) < 10 ? 2 : 1) + pxWidth / 4;
          if (String(j).startsWith('9')) {
            x += pxWidth / 5;
          }
          const y = y0 + j * pxHeight + pxHeight / 2 - ((j + 1) < 10 ? 5 : 5);
          axisSvg += `<text x="${x}" y="${y}" font-size="4" fill="#888" font-weight="500" text-anchor="middle" font-family="Arial" style="user-select:none;pointer-events:none;">${j}</text>`;
        }
      }
    }
    return axisSvg;
  }

  // Новый обработчик для экспорта SVG с сеткой и номерами
  const handleExportSVG = () => {
    if (!svgRef.current) return;
    // Получаем текущее содержимое SVG-контейнера
    let svgInner = svgRef.current.innerHTML;
    // Парсим innerHTML как SVG-документ
    const parser = new window.DOMParser();
    const doc = parser.parseFromString(svgInner, 'image/svg+xml');
    // Меняем fill у всех rect[data-color] в шахматном порядке
    const rects = doc.querySelectorAll('rect[data-color]');
    const gridCols = 16;
    const gridRows = 8;
    const cellWidth = 1000 / gridCols;
    const cellHeight = 800 / gridRows;
    const pxPerCellX = 10;
    const pxPerCellY = 16;
    const pxWidth = cellWidth / pxPerCellX;
    const pxHeight = cellHeight / pxPerCellY;
    rects.forEach(rect => {
      const x = parseFloat(rect.getAttribute('x'));
      const y = parseFloat(rect.getAttribute('y'));
      // вычисляем row/col крупной зоны
      const col = Math.floor(x / cellWidth);
      const row = Math.floor(y / cellHeight);
      const fill = (row + col) % 2 === 0 ? '#fff' : '#DCDCDC';
      rect.setAttribute('fill', fill);
    });
    // Собираем <rect> для номеров поверх клеток (без текста, просто закрашенная клетка)
    let texts = '';
    const digitRects = doc.querySelectorAll('rect[data-digit-label="1"]');
    digitRects.forEach(rect => {
      const x = parseFloat(rect.getAttribute('x'));
      const y = parseFloat(rect.getAttribute('y'));
      const width = parseFloat(rect.getAttribute('width'));
      const height = parseFloat(rect.getAttribute('height'));
      const col = Math.floor(x / cellWidth);
      const row = Math.floor(y / cellHeight);
      const isWhite = (row + col) % 2 === 0;
      const fillWidth = Math.max(0, width - 1);
      const fillHeight = Math.max(0, height - 1);
      const fill = isWhite ? '#D3D3D3' : '#fff';
      texts += `<rect x="${x + 0.5}" y="${y + 0.5}" width="${fillWidth}" height="${fillHeight}" fill="${fill}" />`;
      // Удаляем rect-номер из SVG
      rect.parentNode.removeChild(rect);
    });
    // Сериализуем обратно
    const serializer = new window.XMLSerializer();
    const modifiedSvg = serializer.serializeToString(doc.documentElement);
    // Добавляем SVG-нумерацию по осям
    const axisSvg = generateSvgAxisNumbers();
    // Оборачиваем в SVG с нужными атрибутами и добавляем закрашенные клетки
    const finalSvg = `<?xml version="1.0" standalone="no"?>\n<svg width="1000" height="800" viewBox="0 0 1000 800" xmlns="http://www.w3.org/2000/svg">${modifiedSvg}${texts}${axisSvg}</svg>`;
    const blob = new Blob([finalSvg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'canvas-section.svg';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
  };

  return (
    <div className={styles.container}>
      <h1>Горизонтальный холст</h1>
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
        <button onClick={handleExportSVG} className={styles.button}>
          Скачать SVG
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
          onDoubleClick={handleDoubleClick}
          style={{
            cursor: isDragging ? 'grabbing' : (isSelecting ? 'crosshair' : 'grab'),
            width: '1000px',
            height: '800px',
          }}
        >
          <div
            className="svg-container"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transformOrigin: '0 0',
              transition: isDragging || isSelecting ? 'none' : 'transform 0.1s',
              width: '1000px',
              height: '800px',
              position: 'relative'
            }}
          >
            <div
              className={cn(styles['svg-element'], styles['horizontal-canvas'])}
              ref={svgRef}
            />
            {/* Слой с сеткой 16x8 */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '1000px',
                height: '800px',
                pointerEvents: 'none'
              }}
            >
              {generateGrid()}
            </div>
          </div>
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

export default HorizontalCanvasFull; 