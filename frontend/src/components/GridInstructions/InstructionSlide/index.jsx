import { memo, useMemo } from 'react';
import { getSquareSvg } from '../utils/getSquareSvg';
import { getSquareColors } from '../utils/getSquareColors';
import { jsPDF } from "jspdf";
import { svg2pdf } from "svg2pdf.js";
import s from './InstructionSlide.module.css';

// Функция для получения описания позиции сектора
function getSectorPosition(sectorNumber, gridCols, gridRows) {
  const row = Math.floor((sectorNumber - 1) / gridCols);
  const col = (sectorNumber - 1) % gridCols;
  
  // Используем простые числовые обозначения для совместимости
  return `row ${row + 1}, col ${col + 1}`;
}

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

    // Используем встроенные шрифты с поддержкой кириллицы
    // jsPDF имеет встроенную поддержку для некоторых шрифтов

    console.log(`Начинаем экспорт ${total} секторов (по 2 на страницу)...`);

    // Экспортируем секторы по два на страницу
    for (let sectorNumber = 1; sectorNumber <= total; sectorNumber += 2) {
      const progress = Math.round((sectorNumber / total) * 100);
      console.log(`Обрабатываем секторы ${sectorNumber}-${Math.min(sectorNumber + 1, total)}/${total} (${progress}%)`);
      
      // Добавляем новую страницу (кроме первой)
      if (sectorNumber > 1) {
        pdf.addPage();
      }

      // Добавляем заголовок страницы
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      const pageTitle = sectorNumber + 1 <= total 
        ? `Sectors ${sectorNumber} and ${sectorNumber + 1}`
        : `Sector ${sectorNumber}`;
      pdf.text(pageTitle, pageWidth / 2, 30, { align: 'center' });

      // Добавляем подзаголовок с информацией о сетке
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const gridInfo = `${gridCols}×${gridRows} grid, ${orientation === 'horizontal' ? 'horizontal' : 'vertical'} orientation`;
      pdf.text(gridInfo, pageWidth / 2, 45, { align: 'center' });

      // Добавляем инструкцию по использованию
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      const instruction = 'Each sector contains detailed coloring instructions';
      pdf.text(instruction, pageWidth / 2, 55, { align: 'center' });

      // Добавляем разделительную линию между секторами
      if (sectorNumber + 1 <= total) {
        pdf.setDrawColor(200, 200, 200);
        pdf.setLineWidth(1);
        pdf.line(pageWidth / 2, 60, pageWidth / 2, pageHeight - 40);
      }

      // Обрабатываем первый сектор на странице
      const svgContent1 = getSquareSvg(sectorNumber, orientation, idList, svgData);
      if (svgContent1) {
        const tempDiv1 = document.createElement("div");
        tempDiv1.innerHTML = svgContent1;
        document.body.appendChild(tempDiv1);
        const svgElement1 = tempDiv1.querySelector("svg");

                 if (svgElement1) {
           // Конвертируем первый SVG в PDF (левая половина страницы)
           await svg2pdf(svgElement1, pdf, {
             x: 30,
             y: 70, // Немного ниже из-за дополнительного текста
             width: (pageWidth - 80) / 2, // Половина ширины с отступами
             height: pageHeight - 160, // Оставляем место для номера сектора
           });
           
           // Добавляем номер сектора под изображением
           pdf.setFontSize(12);
           pdf.setFont('helvetica', 'bold');
           const sector1Info = `Sector ${sectorNumber} (${getSectorPosition(sectorNumber, gridCols, gridRows)})`;
           pdf.text(sector1Info, 30 + (pageWidth - 80) / 4, pageHeight - 60, { align: 'center' });
         }
         document.body.removeChild(tempDiv1);
       }

      // Обрабатываем второй сектор на странице (если он существует)
      if (sectorNumber + 1 <= total) {
        const svgContent2 = getSquareSvg(sectorNumber + 1, orientation, idList, svgData);
        if (svgContent2) {
          const tempDiv2 = document.createElement("div");
          tempDiv2.innerHTML = svgContent2;
          document.body.appendChild(tempDiv2);
          const svgElement2 = tempDiv2.querySelector("svg");

                     if (svgElement2) {
             // Конвертируем второй SVG в PDF (правая половина страницы)
             await svg2pdf(svgElement2, pdf, {
               x: pageWidth / 2 + 10, // Правая половина с небольшим отступом
               y: 70, // Немного ниже из-за дополнительного текста
               width: (pageWidth - 80) / 2,
               height: pageHeight - 160, // Оставляем место для номера сектора
             });
             
             // Добавляем номер сектора под изображением
             pdf.setFontSize(12);
             pdf.setFont('helvetica', 'bold');
             const sector2Info = `Sector ${sectorNumber + 1} (${getSectorPosition(sectorNumber + 1, gridCols, gridRows)})`;
             pdf.text(sector2Info, pageWidth / 2 + 10 + (pageWidth - 80) / 4, pageHeight - 60, { align: 'center' });
           }
           document.body.removeChild(tempDiv2);
        }
      }

      // Небольшая задержка для предотвращения зависания браузера
      if (sectorNumber + 2 <= total) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }

    // Добавляем информационную страницу в конце
    pdf.addPage();
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Usage Instructions', pageWidth / 2, 50, { align: 'center' });
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    const instructions = [
      '1. Each sector contains detailed coloring instructions',
      '2. Numbers in sectors correspond to color numbers in palette',
      '3. Color sectors in order or selectively',
      '4. Use specified colors for best results',
      '5. Use magnifying glass for small details if needed'
    ];
    
    instructions.forEach((instruction, index) => {
      pdf.text(instruction, 50, 100 + index * 25);
    });

    // Сохраняем PDF
    const totalPages = Math.ceil(total / 2) + 1; // +1 для информационной страницы
    const filename = `paint-by-number-sectors-${orientation}-${total}-${totalPages}pages.pdf`;
    pdf.save(filename);
    console.log(`Экспорт всех ${total} секторов завершен! Файл сохранен как: ${filename} (${totalPages} страниц)`);
  } catch (error) {
    console.error('Ошибка при экспорте всех секторов:', error);
    alert('Ошибка при создании PDF файла со всеми секторами');
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