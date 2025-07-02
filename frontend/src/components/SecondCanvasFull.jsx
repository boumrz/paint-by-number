import React, { useEffect, useState } from 'react';
import styles from './MultiCanvas.module.css';
import useCanvas from '../hooks/useCanvas';
import cn from 'clsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const SecondCanvasFull = ({
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

  // Генерация сетки 8x16 (100x62.5 px каждый) с шахматной заливкой
  const generateGrid = () => {
    const gridCols = 8;
    const gridRows = 16;
    const cellWidth = 800 / gridCols;
    const cellHeight = 1000 / gridRows;
    const pxPerCellX = 10;
    const pxPerCellY = 10;
    const pxWidth = cellWidth / pxPerCellX;
    const pxHeight = cellHeight / pxPerCellY;
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
              border: '1px solid #333',
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
                    left: i * pxWidth + pxWidth / 2 - 4,
                    top: -2,
                    fontSize: 7,
                    color: '#888',
                    pointerEvents: 'none',
                    fontWeight: 600,
                    zIndex: 2,
                    userSelect: 'none',
                  }}
                >
                  {i + 1}
                </span>
              )
            ))}
            {/* Нумерация по вертикали (1-10) в первом столбце */}
            {Array.from({ length: pxPerCellY }).map((_, j) => (
              <span
                key={`v-${j}`}
                style={{
                  position: 'absolute',
                  left: 2,
                  top: j * pxHeight + pxHeight / 2 - 7,
                  fontSize: 7,
                  color: '#888',
                  pointerEvents: 'none',
                  fontWeight: 600,
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
    if (!section) return;
    const canvas = await html2canvas(section, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: [section.offsetWidth, section.offsetHeight],
    });
    pdf.addImage(imgData, 'PNG', 0, 0, section.offsetWidth, section.offsetHeight);
    pdf.save('canvas-section.pdf');
  };

  return (
    <div className={styles.container}>
      <h1>Холст</h1>
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
            cursor: isDragging ? 'grabbing' : (isSelecting ? 'crosshair' : 'grab')
          }}
        >
          <div
            className="svg-container"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transformOrigin: '0 0',
              transition: isDragging || isSelecting ? 'none' : 'transform 0.1s',
              width: '100%',
              height: '100%',
              position: 'relative'
            }}
          >
            <div
              className={cn(styles['svg-element'], styles['second-canvas'])}
              ref={svgRef}
            />
            {/* Слой с сеткой 8x16 */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '800px',
                height: '1000px',
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

export default SecondCanvasFull; 