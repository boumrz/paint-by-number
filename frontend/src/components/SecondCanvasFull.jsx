import React from 'react';
import styles from './MultiCanvas.module.css';
import useCanvas from '../hooks/useCanvas';
import { ColorPalette } from './ColorPalette';
import cn from 'clsx';

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
    const elements = document.querySelectorAll('.MultiCanvas_svg-element.MultiCanvas_second-canvas svg');
    elements.forEach(el => {
      const rects = el.querySelectorAll('rect');
      rects.forEach(rect => {
        rect.setAttribute('fill', 'white');
      });
    });
  };

  const handleFillAll = () => {
    const elements = document.querySelectorAll('.MultiCanvas_svg-element.MultiCanvas_second-canvas svg');

    console.log('elements', elements);

    elements.forEach(el => {
      const rects = el.querySelectorAll('rect');
      rects.forEach(rect => {
        const dataColor = rect.getAttribute('data-color');
      
        if (dataColor) {
          rect.setAttribute('fill', dataColor);
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