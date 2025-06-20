import React from 'react';
import styles from './SecondCanvas.module.css';
import useCanvas from '../hooks/useCanvas';

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

  return (
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
  );
};

export default SecondCanvas; 