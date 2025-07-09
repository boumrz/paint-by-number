import { memo } from 'react';

// Новый компонент для отрисовки сектора через div-элементы
export const SquareDivGrid = memo(({ squareNumber, svgData, orientation }) => {
    const gridCols = orientation === 'horizontal' ? 16 : 8;
    const gridRows = orientation === 'horizontal' ? 8 : 16;
    const canvasWidth = orientation === 'horizontal' ? 1000 : 800;
    const canvasHeight = orientation === 'horizontal' ? 800 : 1000;
    const cellWidth = canvasWidth / gridCols;
    const cellHeight = canvasHeight / gridRows;
    const row = Math.floor((squareNumber - 1) / gridCols);
    const col = (squareNumber - 1) % gridCols;
    const squareX = col * cellWidth;
    const squareY = row * cellHeight;
    // Парсим SVG
    const parser = new window.DOMParser();
    const svgDoc = parser.parseFromString(svgData, 'image/svg+xml');
    const svgElement = svgDoc.documentElement;
    // Определяем pixel-based ли холст
    const isPixelCanvas = svgData.includes('data-color') && svgData.includes('data-number');
    let rects = [];
    if (isPixelCanvas) {
      rects = Array.from(svgElement.querySelectorAll('rect[data-color]'))
        .map(rect => {
          const x = parseFloat(rect.getAttribute('x')) - squareX;
          const y = parseFloat(rect.getAttribute('y')) - squareY;
          const width = parseFloat(rect.getAttribute('width'));
          const height = parseFloat(rect.getAttribute('height'));
          const dataColor = rect.getAttribute('data-color');
          const dataNumber = rect.getAttribute('data-number');
          // Проверяем, что прямоугольник попадает в сектор
          if (x + width > 0 && y + height > 0 && x < cellWidth && y < cellHeight) {
            return { x, y, width, height, dataColor, dataNumber };
          }
          return null;
        })
        .filter(Boolean);
    }
    // Масштаб для увеличения пикселей
    const scale = 30 / 6.25; // 6.25 - исходный размер пикселя, 30 - желаемый размер
    return (
      <div style={{
        position: 'relative',
        width: cellWidth * scale,
        height: cellHeight * scale,
        background: '#fff',
        display: 'block',
        boxSizing: 'border-box',
        border: '1px solid #eee',
        transform: 'scale(1)',
        transformOrigin: 'top left',
      }}>
        {rects.map((r, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: r.x * scale,
              top: r.y * scale,
              width: r.width * scale,
              height: r.height * scale,
              background: r.dataColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 600,
              fontSize: Math.max(12, Math.min(r.width, r.height) * scale / 1.5),
              color: '#fff',
              border: '1px solid #eee',
              boxSizing: 'border-box',
              userSelect: 'none',
            }}
          >
            {r.dataNumber}
          </div>
        ))}
      </div>
    );
  });

  SquareDivGrid.displayName = 'SquareDivGrid';