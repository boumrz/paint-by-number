import { memo, useMemo } from 'react';
import { getSquareSvg } from '../utils/getSquareSvg';
import { getSquareColors } from '../utils/getSquareColors';
import { jsPDF } from "jspdf";
import { svg2pdf } from "svg2pdf.js";
import s from './InstructionSlide.module.css';

// Функция для экспорта всех секторов в PDF
export async function exportAllSectorsToPdf(svgData, idList, orientation) {
  try {
    // Параметры сетки в зависимости от ориентации
    const gridCols = orientation === 'horizontal' ? 16 : 8;
    const gridRows = orientation === 'horizontal' ? 8 : 16;
    const total = gridCols * gridRows;

    // Создаем PDF-документ
    const pdf = new jsPDF('p', 'pt', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    console.log(`Начинаем экспорт ${total} секторов...`);

    // Экспортируем каждый сектор на отдельную страницу
    for (let sectorNumber = 1; sectorNumber <= total; sectorNumber++) {
      const progress = Math.round((sectorNumber / total) * 100);
      console.log(`Обрабатываем сектор ${sectorNumber}/${total} (${progress}%)`);
      
      // Обновляем заголовок страницы с прогрессом
      if (sectorNumber === 1) {
        console.log('Создаем первую страницу...');
      } else {
        console.log(`Добавляем страницу ${sectorNumber}...`);
      }
      
      // Получаем SVG контент для сектора
      const svgContent = getSquareSvg(sectorNumber, orientation, idList, svgData);
      
      if (!svgContent) {
        console.warn(`SVG контент не найден для сектора ${sectorNumber}`);
        continue;
      }

      // Добавляем новую страницу (кроме первой)
      if (sectorNumber > 1) {
        pdf.addPage();
      }

      // Создаем временный SVG в DOM
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = svgContent;
      document.body.appendChild(tempDiv);
      const svgElement = tempDiv.querySelector("svg");

      if (!svgElement) {
        console.warn(`SVG элемент не найден для сектора ${sectorNumber}`);
        document.body.removeChild(tempDiv);
        continue;
      }

      // Добавляем заголовок страницы
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Сектор ${sectorNumber}`, pageWidth / 2, 30, { align: 'center' });

      // Добавляем подзаголовок с информацией о сетке
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const gridInfo = `${gridCols}×${gridRows} сетка, ${orientation === 'horizontal' ? 'горизонтальная' : 'вертикальная'} ориентация`;
      pdf.text(gridInfo, pageWidth / 2, 45, { align: 'center' });

      // Конвертируем SVG в PDF
      await svg2pdf(svgElement, pdf, {
        x: 50,
        y: 60, // Немного ниже из-за заголовков
        width: pageWidth - 100,
        height: pageHeight - 120, // Учитываем место для заголовков
      });

      // Удаляем временный элемент
      document.body.removeChild(tempDiv);
      
      // Небольшая задержка для предотвращения зависания браузера
      if (sectorNumber < total) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }

    // Сохраняем PDF
    const filename = `paint-by-number-sectors-${orientation}-${total}.pdf`;
    pdf.save(filename);
    console.log(`Экспорт всех ${total} секторов завершен! Файл сохранен как: ${filename}`);
  } catch (error) {
    console.error('Ошибка при экспорте всех секторов:', error);
    alert('Ошибка при создании PDF файла со всеми секторами');
  }
}

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
      height: pageHeight - 100,
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