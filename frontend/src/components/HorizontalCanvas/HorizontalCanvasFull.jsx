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

  // PDF export handler
  const handleExportPDF = async () => {
    const section = document.querySelector(`.${styles.section}`);

    console.log({offsetWidth: section.offsetWidth, offsetHeight: section.offsetHeight});
    
    if (!section) return;
    const canvas = await html2canvas(section, { scale: 2 });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: [3000, 3000],
    });
    pdf.addImage(imgData, 'PNG', 0, 0, 3000, 3000);
    pdf.save('canvas-section.pdf');
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
        <button onClick={handleExportPDF} className={styles.button}>
          Скачать PDF
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