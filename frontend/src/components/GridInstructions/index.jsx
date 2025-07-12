import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Carousel, Progress } from 'antd';
import { useMediaQuery } from 'usehooks-ts';
import "antd/dist/reset.css";
import { InstructionSlide } from './InstructionSlide';
import './GridInstructions.module.css';

// Компонент инструкции для квадратов с каруселью
export const GridInstructions = ({ idList, svgData, title, orientation = 'vertical' }) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [loadedSlides, setLoadedSlides] = useState(new Set([0, 1, 2]));
    const [forceUpdate, setForceUpdate] = useState(0);
    const mainCarouselRef = useRef(null);
    const navigationRef = useRef(null);
    const isPhone = useMediaQuery('(max-width: 400px)');
  
    // Параметры сетки в зависимости от ориентации
    const gridCols = orientation === 'horizontal' ? 16 : 8;
    const gridRows = orientation === 'horizontal' ? 8 : 16;
    const total = gridCols * gridRows;
    
    // Отслеживаем инициализацию карусели
    useEffect(() => {
      if (mainCarouselRef.current) {
        console.log('Карусель инициализирована:', mainCarouselRef.current);
        console.log('Доступные методы:', Object.getOwnPropertyNames(mainCarouselRef.current));
      }
    }, [mainCarouselRef.current]);

    // Автоматическая прокрутка к текущему элементу
    useEffect(() => {
      if (navigationRef.current) {
        const currentElement = navigationRef.current.querySelector(`[data-slide="${currentSlide}"]`);
        if (currentElement) {
          currentElement.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'center'
          });
        }
      }
    }, [currentSlide]);
    
    // Обработчик изменения слайда
    const handleSlideChange = (current) => {
      setCurrentSlide(current);
      
      // Загружаем соседние слайды
      const newLoadedSlides = new Set(loadedSlides);
      for (let i = Math.max(0, current - 2); i <= Math.min(total - 1, current + 2); i++) {
        newLoadedSlides.add(i);
      }
      setLoadedSlides(newLoadedSlides);
    };

    // Обработчик клика по номеру слайда
    const handleNumberClick = (slideIndex) => {
      console.log('Клик по номеру:', slideIndex + 1);
      
      // Сначала обновляем состояние
      setCurrentSlide(slideIndex);
      
      // Затем пытаемся переключить карусель с небольшой задержкой
      setTimeout(() => {
        if (mainCarouselRef.current) {
          console.log('Переключение на слайд:', slideIndex);
          try {
            // Пробуем разные способы управления каруселью
            if (mainCarouselRef.current.goTo) {
              mainCarouselRef.current.goTo(slideIndex);
            } else if (mainCarouselRef.current.slickGoTo) {
              mainCarouselRef.current.slickGoTo(slideIndex);
            } else {
              console.log('Метод goTo не найден, используем внутренний API');
              // Попробуем получить доступ к внутренним методам
              const carouselElement = mainCarouselRef.current;
              if (carouselElement && carouselElement.slick) {
                carouselElement.slick.slickGoTo(slideIndex);
              }
            }
          } catch (error) {
            console.error('Ошибка при переключении слайда:', error);
            // Если не удалось программно переключить, принудительно обновляем
            setForceUpdate(prev => prev + 1);
          }
        } else {
          console.log('Ref карусели не найден');
        }
      }, 100);
    };

    // Создаем слайд только если он загружен
    const createSlide = (index) => {
      if (!loadedSlides.has(index)) {
        return (
          <div key={index} style={{
            padding: '1rem',
            background: '#f5f5f5',
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
            <div style={{ color: '#666', textAlign: 'center', marginBottom: '1rem' }}>
              Загрузка сектора {index + 1}...
            </div>
          </div>
        );
      }

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
    };

    // Создаем горизонтальную навигацию с номерами
    const navigationNumbers = useMemo(() => {
      return Array.from({ length: total }, (_, index) => {
        const slideIndex = index;
        const isCurrent = slideIndex === currentSlide;
        const isLoaded = loadedSlides.has(slideIndex);
        
        return (
          <div
            key={slideIndex}
            data-slide={slideIndex}
            onClick={() => handleNumberClick(slideIndex)}
            style={{
              padding: '0.25rem 0.5rem',
              background: isCurrent ? '#1890ff' : (isLoaded ? '#f0f0f0' : '#e0e0e0'),
              color: isCurrent ? 'white' : '#333',
              borderRadius: '2px',
              textAlign: 'center',
              cursor: 'pointer',
              fontSize: '0.625rem',
              fontWeight: isCurrent ? 'bold' : 'normal',
              border: isCurrent ? '1px solid #1890ff' : '1px solid #d9d9d9',
              transition: 'all 0.2s ease',
              minHeight: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              userSelect: 'none',
              position: 'relative',
              flexShrink: 0,
              marginRight: '0.125rem'
            }}
            onMouseEnter={(e) => {
              if (!isCurrent) {
                e.target.style.background = isLoaded ? '#d9d9d9' : '#ccc';
                e.target.style.transform = 'scale(1.1)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isCurrent) {
                e.target.style.background = isLoaded ? '#f0f0f0' : '#e0e0e0';
                e.target.style.transform = 'scale(1)';
              }
            }}
          >
            {slideIndex + 1}
            {isCurrent && (
              <div style={{
                position: 'absolute',
                top: '-1px',
                right: '-1px',
                width: '4px',
                height: '4px',
                background: '#52c41a',
                borderRadius: '50%',
                border: '1px solid white'
              }} />
            )}
          </div>
        );
      });
    }, [total, currentSlide, loadedSlides]);

    // Создаем массив слайдов с ленивой загрузкой
    const carouselSlides = useMemo(() => {
      return Array.from({ length: total }, (_, index) => createSlide(index));
    }, [total, loadedSlides, idList, svgData, orientation, isPhone]);

    // Вычисляем прогресс загрузки
    const loadingProgress = Math.round((loadedSlides.size / total) * 100);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '40px' }}>
        <h3 style={{ padding: '1rem', marginBottom: '1rem', marginTop: 0, color: '#333' }}>{title}</h3>
        
        {/* Индикатор прогресса загрузки */}
        {loadingProgress < 100 && (
          <div style={{ 
            width: '100%', 
            maxWidth: isPhone ? '100%' : '400px', 
            margin: '0 auto 1rem auto',
            padding: '0.5rem',
            background: '#f0f8ff',
            borderRadius: '4px',
            border: '1px solid #d6e4ff'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem', color: '#666' }}>Загрузка инструкций...</span>
              <span style={{ fontSize: '0.875rem', color: '#1890ff' }}>{loadingProgress}%</span>
            </div>
            <Progress 
              percent={loadingProgress} 
              size="small" 
              strokeColor="#1890ff"
              showInfo={false}
            />
          </div>
        )}
        
        {/* Счетчик текущего слайда */}
        <div style={{ 
          width: '100%',
          maxWidth: isPhone ? '100%' : '400px',
          margin: '0 auto 0.5rem auto',
          textAlign: 'center'
        }}>
          <span style={{ 
            fontSize: '0.875rem', 
            color: '#666',
            background: '#f0f0f0',
            padding: '0.25rem 0.75rem',
            borderRadius: '12px',
            border: '1px solid #d9d9d9'
          }}>
            Сектор {currentSlide + 1} из {total}
          </span>
        </div>

        <div style={{ 
          width: '100%',
          maxWidth: isPhone ? '100%' : '400px',
          margin: '0 auto 1rem auto'
        }}>
          <Carousel
            key={`main-carousel-${forceUpdate}`}
            ref={mainCarouselRef}
            dots={{ position: 'bottom' }}
            infinite={false}
            slidesToShow={1}
            slidesToScroll={1}
            autoplay={false}
            arrows={true}
            // prevArrow={<button className="slick-prev" aria-label="Previous">‹</button>}
            // nextArrow={<button className="slick-next" aria-label="Next">›</button>}
            afterChange={handleSlideChange}
            responsive={[
              {
                breakpoint: 768,
                settings: {
                  slidesToShow: 1,
                  slidesToScroll: 1,
                  arrows: true
                }
              }
            ]}
            style={{
              background: '#fff',
              borderRadius: '8px',
              padding: '1rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              position: 'relative'
            }}
          >
            {carouselSlides}
          </Carousel>
        </div>

        {/* Горизонтальная навигация с номерами */}
        <div style={{ 
          width: '100%',
          maxWidth: isPhone ? '100%' : '800px',
          margin: '0 auto'
        }}>
          <div style={{ 
            marginBottom: '0.5rem', 
            textAlign: 'center',
            fontSize: '0.875rem',
            color: '#666'
          }}>
            Быстрая навигация по секторам
          </div>
          <div 
            ref={navigationRef}
            style={{
              background: '#fff',
              borderRadius: '8px',
              padding: '0.5rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              overflowX: 'auto',
              overflowY: 'hidden',
              whiteSpace: 'nowrap',
              scrollbarWidth: 'thin',
              scrollbarColor: '#d9d9d9 #f0f0f0'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              minWidth: 'max-content',
              padding: '0.25rem'
            }}>
              {navigationNumbers}
            </div>
          </div>
        </div>
      </div>
    );
  };