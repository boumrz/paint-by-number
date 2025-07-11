import { Carousel } from 'antd';
import { useMediaQuery } from 'usehooks-ts';
import "antd/dist/reset.css";
import { InstructionSlide } from './InstructionSlide';

// Компонент инструкции для квадратов с каруселью
export const GridInstructions = ({ idList, svgData, title, orientation = 'vertical' }) => {
    const isPhone = useMediaQuery('(max-width: 400px)');
  
    // Параметры сетки в зависимости от ориентации
    const gridCols = orientation === 'horizontal' ? 16 : 8;
    const gridRows = orientation === 'horizontal' ? 8 : 16;
    const total = gridCols * gridRows;
    
    // Создаем массив слайдов для карусели с обработкой ошибок
    const carouselSlides = Array.from({ length: 5 }, (_, index) => {
      console.log('12312312321');
      const squareNumber = index + 1;
      try {
        return (
          <InstructionSlide 
            key={squareNumber}
            idList={idList} 
            orientation={orientation} 
            svgData={svgData} 
            squareNumber={squareNumber} 
            isPhone={isPhone} 
          />
        );
      } catch (error) {
        console.error(`Ошибка при создании слайда ${squareNumber}:`, error);
        // Возвращаем простой слайд в случае ошибки
        return (
          <div key={squareNumber} style={{
            padding: '1rem',
            background: '#fff2f0',
            borderRadius: '8px',
            color: 'black',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            border: '1px solid #ffccc7',
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
              Ошибка загрузки
            </div>
          </div>
        );
      }
    });

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '40px' }}>
        <h3 style={{ padding: '1rem', marginBottom: '1rem', marginTop: 0, color: '#333' }}>{title}</h3>
        
        <div style={{ 
          width: '100%',
          maxWidth: isPhone ? '100%' : '400px',
          margin: '0 auto'
        }}>
          <Carousel
            dots={{ position: 'bottom' }}
            infinite={false}
            slidesToShow={1}
            slidesToScroll={1}
            autoplay={false}
            arrows={true}
            responsive={[
              {
                breakpoint: 768,
                settings: {
                  slidesToShow: 1,
                  slidesToScroll: 1
                }
              }
            ]}
            style={{
              background: '#fff',
              borderRadius: '8px',
              padding: '1rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
          >
            {carouselSlides}
          </Carousel>
        </div>
      </div>
    );
  };