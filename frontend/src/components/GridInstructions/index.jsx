import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Carousel, Progress } from 'antd';
import { useMediaQuery } from 'usehooks-ts';
import "antd/dist/reset.css";
import { InstructionSlide } from './InstructionSlide';

// Компонент инструкции для квадратов с каруселью
export const GridInstructions = ({ idList, svgData, title, orientation = 'vertical' }) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [loadedSlides, setLoadedSlides] = useState(new Set([0, 1, 2]));
    const isPhone = useMediaQuery('(max-width: 400px)');
  
    // Параметры сетки в зависимости от ориентации
    const gridCols = orientation === 'horizontal' ? 16 : 8;
    const gridRows = orientation === 'horizontal' ? 8 : 16;
    const total = gridCols * gridRows;
    
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
            <Progress 
              type="circle" 
              percent={Math.random() * 100} 
              size="small"
              strokeColor="#1890ff"
            />
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
        console.error(`Ошибка при создании слайда ${squareNumber}:`, error);
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

    // Создаем массив слайдов с ленивой загрузкой
    const carouselSlides = useMemo(() => {
      console.log('Создание слайдов карусели');
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
            beforeChange={handleSlideChange}
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