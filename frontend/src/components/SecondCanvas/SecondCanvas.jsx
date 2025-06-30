import React from 'react';
import styles from './SecondCanvas.module.css';
import useCanvas from '../../hooks/useCanvas';

const SecondCanvas = ({
  svgData,
  currentColor,
  idList,
  setColorCount
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

  // Определяем класс курсора
  let wrapperCursorClass = styles.grab;
  if (isDragging) wrapperCursorClass = styles.grabbing;
  else if (isSelecting) wrapperCursorClass = styles.crosshair;

  // Определяем класс transition
  const svgTransitionClass = (isDragging || isSelecting) ? styles.noTransition : styles.transformed;

  return (
    <div className={styles.section}>
      <div 
        className={`${styles.wrapper} ${wrapperCursorClass}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onDoubleClick={handleDoubleClick}
      >
        <div 
          className={`svg-element ${svgTransitionClass}`}
          ref={svgRef}
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: '0 0'
          }}
        ></div>
        {isSelecting && (
          <div
            ref={selectionRef}
            className={`${styles.selectionBox} ${styles.dynamic}`}
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
  );
};

export default SecondCanvas; 