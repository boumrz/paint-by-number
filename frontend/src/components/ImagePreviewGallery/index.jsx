import React from 'react';
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

/**
 * @param {object} props
 * @param {string} props.original - URL оригинального изображения
 * @param {string} props.pixelBW - dataURL/svg чб генерации
 * @param {string} props.pixelSepia - dataURL/svg сепия генерации
 * @param {'vertical'|'horizontal'} props.orientation - ориентация (для размеров)
 */
export function ImagePreviewGallery({ original, pixelBW, pixelSepia, orientation = 'vertical' }) {
  // Размеры превью (одинаковые для всех)
  const width = orientation === 'horizontal' ? 300 : 240;
  const height = orientation === 'horizontal' ? 192 : 300;

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
    return (
      <div
        className={styles.svgWrap}
        style={{ width, height, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <div
          style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          dangerouslySetInnerHTML={{ __html: svgToShow }}
        />
      </div>
    );
  };

  return (
    <div className={styles.gallery}>
      <div className={styles.item}>
        <div className={styles.label}>Оригинал</div>
        {original ? (
          <img src={original} alt="Оригинал" width={width} height={height} className={styles.img} />
        ) : (
          <div className={styles.empty}>Нет изображения</div>
        )}
      </div>
      <div className={styles.item}>
        <div className={styles.label}>Чёрно-белая</div>
        <button className={styles.previewButton} type="button" onClick={() => console.log('bw')}>
          {renderSvgPreview(pixelBW, 'ЧБ', true)}
        </button>
      </div>
      <div className={styles.item}>
        <div className={styles.label}>Сепия</div>
        <button className={styles.previewButton} type="button" onClick={() => console.log('sepia')}>
          {renderSvgPreview(pixelSepia, 'Сепия', true)}
        </button>
      </div>
    </div>
  );
} 