import { memo, useMemo } from 'react';
import { getSquareSvg } from '../utils/getSquareSvg';
import { getSquareColors } from '../utils/getSquareColors';
import { jsPDF } from "jspdf";
import { svg2pdf } from "svg2pdf.js";
import s from './InstructionSlide.module.css';

async function exportSvgToPdf(svgContent) {
  try {
    // 1. Создаем PDF-документ с помощью jsPDF
    const pdf = new jsPDF('p', 'pt', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // 2. Создаем временный SVG в DOM
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = svgContent;
    document.body.appendChild(tempDiv);
    const svgElement = tempDiv.querySelector("svg");

    if (!svgElement) {
      throw new Error('SVG элемент не найден');
    }

    // 3. Конвертируем SVG в PDF
    await svg2pdf(svgElement, pdf, {
      x: 50,
      y: 50,
      width: pageWidth - 100, // Оставляем отступы по 50pt с каждой стороны
    });

    // 4. Удаляем временный элемент
    document.body.removeChild(tempDiv);

    // 5. Сохраняем PDF
    pdf.save("output.pdf");
  } catch (error) {
    console.error('Ошибка при экспорте PDF:', error);
    alert('Ошибка при создании PDF файла');
  }
}

export const InstructionSlide = memo(({ orientation, svgData, idList, squareNumber, isPhone }) => {  
  const slideData = useMemo(() => {
    try {
      const colors = getSquareColors(squareNumber, svgData, idList, orientation);
      const svgContent = getSquareSvg(squareNumber, orientation, idList, svgData);
      return { colors, svgContent };
    } catch (error) {
      console.error(`Ошибка при вычислении данных слайда ${squareNumber}:`, error);
      return { colors: [], svgContent: null };
    }
  }, [squareNumber, svgData, idList, orientation]);

  try {
    const { colors, svgContent } = slideData;
    
    return (
      <div
        key={squareNumber}
        className={s.wrapper}
        style={{
          minHeight: isPhone ? '300px' : '400px'
        }}
      >
        <div className={s.sector}>
          <button onClick={() => exportSvgToPdf(svgContent)}>Экспорт</button>
          Сектор {squareNumber}
        </div>
        <div className={s.slide}>
          <div
            dangerouslySetInnerHTML={{ __html: svgContent || '<div style="text-align: center; color: #666; display: flex; align-items: center; justify-content: center; height: 100%;">Сектор пуст</div>' }}
            style={{ width: '100%', height: '100%', minHeight: 0, minWidth: 0, display: 'block' }}
          />
        </div>
      </div>
    );
  } catch (error) {
    return (
      <div style={{
        padding: '1rem',
        background: '#f8f9fa',
        borderRadius: '8px',
        color: 'black',
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
        border: '1px solid #e0e0e0',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        minHeight: isPhone ? '300px' : '400px'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: 8, fontSize: '1.2rem', textAlign: 'center' }}>
          Сектор {squareNumber}
        </div>
        <div style={{ color: '#666', textAlign: 'center' }}>
          Ошибка загрузки сектора
        </div>
      </div>
    );
  }
});