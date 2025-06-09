import React, { useState } from 'react';
import Canvas from './Canvas';
import './MultiCanvas.css';

const paperSizes = [
  { name: 'A1', width: 841, height: 594 },
  { name: 'A2', width: 594, height: 420 },
  { name: 'A3', width: 420, height: 297 },
  { name: 'A4', width: 297, height: 210 }
];

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
  const [currentSizeIndex, setCurrentSizeIndex] = useState(0);

  const handlePrevSize = () => {
    setCurrentSizeIndex((prev) => (prev > 0 ? prev - 1 : paperSizes.length - 1));
  };

  const handleNextSize = () => {
    setCurrentSizeIndex((prev) => (prev < paperSizes.length - 1 ? prev + 1 : 0));
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

  return (
    <div className="multi-canvas-container">
      <div className="canvas-controls">
        <button onClick={handleClearAll} className="control-button">
          Очистить все
        </button>
        <button onClick={handleFillAll} className="control-button">
          Заполнить все
        </button>
      </div>

      <div className="carousel-container">
        <button onClick={handlePrevSize} className="carousel-button prev">
          ←
        </button>
        
        <div className="canvas-section">
          <h3>Размер {paperSizes[currentSizeIndex].name}</h3>
          <div className="canvas-wrapper" style={{
            width: `${paperSizes[currentSizeIndex].width}px`,
            height: `${paperSizes[currentSizeIndex].height}px`,
            maxWidth: '100%',
            maxHeight: '100%'
          }}>
            <Canvas
              fName={fName}
              setIdList={setIdList}
              idList={idList}
              currentColor={currentColor}
              setColorCount={setColorCount}
              loading={loading}
              setLoading={setLoading}
              dimensions={paperSizes[currentSizeIndex]}
              svgData={svgData}
              key={currentSizeIndex}
            />
          </div>
        </div>

        <button onClick={handleNextSize} className="carousel-button next">
          →
        </button>
      </div>
    </div>
  );
};

export default MultiCanvas; 