import React from 'react';
import './ColorPalette.css';

export const ColorPalette = ({ colors, currentColor, onColorSelect, colorCount }) => {
  const handleColorClick = (color) => {
    onColorSelect(color);
  };

  return (
    <div className="color-palette">
      <h4>Палитра цветов</h4>
      <div className="colors-grid">
        {colors.map((item, index) => {
          if (index === 0) return null;
          const rgbColor = `rgb(${item.color[0]}, ${item.color[1]}, ${item.color[2]})`;
          const isSelected = currentColor && 
            currentColor[0] === item.color[0] && 
            currentColor[1] === item.color[1] && 
            currentColor[2] === item.color[2];

          return (
            <div 
              key={index}
              className={`color-item ${isSelected ? 'selected' : ''}`}
              onClick={() => handleColorClick(item.color)}
            >
              <div 
                className="color-preview"
                style={{ backgroundColor: rgbColor }}
              />
              <div className="color-info">
                <span className="color-number">{index}</span>
                <span className="color-count">
                  {colorCount[item.color] || item.shapes.length} шт.
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}; 