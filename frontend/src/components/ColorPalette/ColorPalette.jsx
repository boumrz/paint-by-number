import React from 'react';
import styles from './ColorPalette.module.css';

export const ColorPalette = ({ colors, currentColor, onColorSelect, colorCount }) => {
  const handleColorClick = (color) => {
    onColorSelect(color);
  };

  return (
    <div className={styles.palette}>
      <h4 className={styles.title}>Палитра цветов</h4>
      <div className={styles.colorsGrid}>
        {colors.map((item, index) => {
          const rgbColor = `rgb(${item.color[0]}, ${item.color[1]}, ${item.color[2]})`;
          const isSelected = currentColor && 
            currentColor[0] === item.color[0] && 
            currentColor[1] === item.color[1] && 
            currentColor[2] === item.color[2];

          return (
            <div 
              key={index}
              className={`${styles.colorItem} ${isSelected ? styles.selected : ''}`}
              onClick={() => handleColorClick(item.color)}
            >
              <div 
                className={styles.colorPreview}
                style={{ backgroundColor: rgbColor }}
              />
              <div className={styles.colorInfo}>
                <span className={styles.colorNumber}>{item.number || (index + 1)}</span>
                <span className={styles.colorCount}>
                  {colorCount[item.color.join(',')] || (item.shapes ? item.shapes.length : (item.count || 1))} шт.
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}; 