import React from 'react';
import styles from './MultiCanvas.module.css';
import useCanvas from '../hooks/useCanvas';
import { ColorPalette } from './ColorPalette';

const SecondCanvasFull = ({
  svgData,
  idList,
  currentColor,
  setColorCount,
  colorCount,
  setCurrentColor
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

  const handleClearAll = () => {
    const elements = document.querySelectorAll('.svg-element.second-canvas svg');
    elements.forEach(el => {
      const elements = el.querySelectorAll('g');
      elements.forEach(g => {
        g.setAttribute('fill', 'white');
      });
    });
  };

  const handleFillAll = () => {
    const elements = document.querySelectorAll('.svg-element.second-canvas svg');
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
          onDoubleClick={handleDoubleClick}
          style={{
            cursor: isDragging ? 'grabbing' : (isSelecting ? 'crosshair' : 'grab')
          }}
        >
          <div
            className="svg-element second-canvas"
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
      {idList && idList.length > 0 && (
        <ColorPalette
          colors={idList}
          currentColor={currentColor}
          onColorSelect={setCurrentColor}
          colorCount={colorCount}
        />
      )}
    </div>
  );
};

export default SecondCanvasFull; 