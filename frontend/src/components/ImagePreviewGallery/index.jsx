import React, { memo, useRef, useEffect } from 'react';
import styles from './ImagePreviewGallery.module.css';

/**
 * Заменяет все fill в rect на data-color, чтобы SVG был закрашен.
 */
function fillSvgWithColors(svg) {
  if (!svg) return svg;
  try {
    const parser = new window.DOMParser();
    const doc = parser.parseFromString(svg, 'image/svg+xml');
    const rects = doc.querySelectorAll('rect[data-color]');
    rects.forEach(rect => {
      const color = rect.getAttribute('data-color');
      if (color) rect.setAttribute('fill', color);
    });
    // Удаляем все номера (rect с data-digit-label)
    const digitRects = doc.querySelectorAll('rect[data-digit-label]');
    digitRects.forEach(rect => rect.parentNode.removeChild(rect));
    return doc.documentElement.outerHTML;
  } catch {
    return svg;
  }
}

/**
 * Приводит SVG к нужному виду: viewBox, width/height=100%, preserveAspectRatio.
 * @param {string} svg исходный SVG
 * @param {number} w ширина viewBox
 * @param {number} h высота viewBox
 * @returns {string}
 */
function normalizeSvgForPreview(svg, w, h) {
  if (!svg) return svg;
  try {
    const parser = new window.DOMParser();
    const doc = parser.parseFromString(svg, 'image/svg+xml');
    const svgEl = doc.documentElement;
    svgEl.setAttribute('viewBox', `0 0 ${w} ${h}`);
    svgEl.setAttribute('width', '100%');
    svgEl.setAttribute('height', '100%');
    svgEl.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svgEl.removeAttribute('style');
    svgEl.removeAttribute('x');
    svgEl.removeAttribute('y');
    return svgEl.outerHTML;
  } catch {
    return svg;
  }
}

// Компонент предпросмотра SVG через canvas
function SvgCanvasPreview({ svg, width, height, alt }) {
  const canvasRef = useRef();
  useEffect(() => {
    if (!svg || !canvasRef.current) return;
    const img = new window.Image();
    const svgBlob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(svgBlob);
    img.onload = function () {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
    };
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [svg, width, height]);
  return <canvas ref={canvasRef} width={width} height={height} style={{ width, height, borderRadius: 8, background: '#fafafa' }} aria-label={alt} />;
}

/**
 * @param {object} props
 * @param {string} props.original - URL оригинального изображения
 * @param {string} props.pixelBW - dataURL/svg чб генерации
 * @param {string} props.pixelSepia - dataURL/svg сепия генерации
 * @param {'vertical'|'horizontal'} props.orientation - ориентация (для размеров)
 * @param {function} props.onSelect - функция выбора цвета
 * @param {boolean} props.disabled - заблокировать клики
 */
export const ImagePreviewGallery = memo(({ original, pixelBW, pixelSepia, orientation = 'vertical', onSelect, disabled = false }) => {
  // Размеры превью (одинаковые для всех)
  const width = orientation === 'horizontal' ? 340 : 240;
  const height = orientation === 'horizontal' ? 260 : 300;

  // Вспомогательная функция для SVG превью
  const renderSvgPreview = (svg, alt, fillColors = false) => {
    if (!svg) return <div className={styles.empty}>Нет данных</div>;
    let svgToShow = svg;
    if (fillColors && svg && !svg.startsWith('data:image')) {
      svgToShow = fillSvgWithColors(svg);
    }
    // Определяем viewBox для ориентации
    const boxW = orientation === 'horizontal' ? 1000 : 800;
    const boxH = orientation === 'horizontal' ? 800 : 1000;
    if (svgToShow && !svgToShow.startsWith('data:image')) {
      svgToShow = normalizeSvgForPreview(svgToShow, boxW, boxH);
    }
    if (svgToShow.startsWith('data:image')) {
      return <img src={svgToShow} alt={alt} width={width} height={height} className={styles.img} />;
    }
    // Показываем canvas вместо SVG
    return <SvgCanvasPreview svg={svgToShow} width={width} height={height} alt={alt} />;
  };

  return (
    <div className={styles.gallery + (orientation === 'horizontal' ? ' ' + styles.horizontal : '')}>
      <div className={styles.item}>
        <div className={styles.label}>Исходное фото</div>
        {original ? (
          <img src={original} alt="Исходное фото" width={width} height={height} className={styles.img} />
        ) : (
          <div className={styles.empty}>Нет изображения</div>
        )}
      </div>
      <div className={styles.item}>
        <div className={styles.label}>Чёрно-белая</div>
        {disabled ? (
          <div className={styles.previewButton} style={{ cursor: 'not-allowed', opacity: 0.7 }}>
            {renderSvgPreview(pixelBW, 'ЧБ', true)}
          </div>
        ) : (
          <button className={styles.previewButton} type="button" onClick={() => onSelect('bw')}>
            {renderSvgPreview(pixelBW, 'ЧБ', true)}
          </button>
        )}
      </div>
      <div className={styles.item}>
        <div className={styles.label}>Сепия</div>
        {disabled ? (
          <div className={styles.previewButton} style={{ cursor: 'not-allowed', opacity: 0.7 }}>
            {renderSvgPreview(pixelSepia, 'Сепия', true)}
          </div>
        ) : (
          <button className={styles.previewButton} type="button" onClick={() => onSelect('sepia')}>
            {renderSvgPreview(pixelSepia, 'Сепия', true)}
          </button>
        )}
      </div>
    </div>
  );
});

ImagePreviewGallery.displayName = ImagePreviewGallery;