import React, { useState, useEffect, useRef } from 'react';
import './Canvas.css';
import { LoadingOverlay } from './Loading';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

const minLoadingTime = 800;

const Canvas = ({
  fName,
  setIdList,
  idList,
  currentColor,
  setColorCount,
  loading,
  setLoading,
  dimensions,
  svgData
}) => {
  const [svgString, setSvgString] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState({ x: 0, y: 0 });
  const [selectionEnd, setSelectionEnd] = useState({ x: 0, y: 0 });
  const [showSelection, setShowSelection] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const transformComponentRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (svgData) {
      setSvgString(svgData);
    }
  }, [svgData]);

  const handleItemClick = (id, color) => {
    console.log('Click handler - Color:', color);
    const element = document.getElementById(id);
    if (element) {
      const currentFill = element.getAttribute('fill');
      
      if (currentFill === 'lightpink' && 
          currentColor && 
          color[0] === currentColor[0] && 
          color[1] === currentColor[1] && 
          color[2] === currentColor[2]) {
        const rgbColor = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
        element.setAttribute("fill", rgbColor);
        setColorCount((prevCount) => ({
          ...prevCount,
          [color]: (prevCount[color] || 0) - 1,
        }));
      }
    }
  };

  const fillColors = () => {
    const filledCount = {};
    idList.forEach(({ color, shapes }) => {
      filledCount[color] = 0;
      shapes.forEach((id) => {
        const element = document.getElementById(id);
        if (element) {
          const rgbColor = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
          element.setAttribute("fill", rgbColor);
        }
      });
    });
    setColorCount(filledCount);
  };

  const clearColors = () => {
    const counts = {};
    idList.forEach(({ color, shapes }) => {
      counts[color] = shapes.length;
      shapes.forEach((id) => {
        const element = document.getElementById(id);
        if (element) {
          element.setAttribute("fill", "white");
        }
      });
    });
    setColorCount(counts);
  };

  const updatePathStrokes = (currentColor) => {
    if (!currentColor) {
      console.log('No current color selected');
      return;
    }
    
    idList.forEach(({ color, shapes }) => {
      const isCurrentColor = 
        color[0] === currentColor[0] && 
        color[1] === currentColor[1] && 
        color[2] === currentColor[2];

      shapes.forEach((id) => {
        const element = document.getElementById(id);
        if (element) {
          const currentFill = element.getAttribute('fill');
          const isFilled = currentFill !== 'white' && currentFill !== 'lightpink';
          
          if (!isFilled) {
            const newFill = isCurrentColor ? `rgb(${color[0]}, ${color[1]}, ${color[2]})` : 'white';
            element.setAttribute('fill', newFill);
          }
        }
      });
    });
  };

  useEffect(() => {
    updatePathStrokes(currentColor);
  }, [currentColor]);

  useEffect(() => {
    const clickHandlers = new Map();

    idList.forEach(({ color, shapes }) => {
      shapes.forEach((id) => {
        const element = document.getElementById(id);
        if (element) {
          const handler = () => handleItemClick(id, color);
          element.addEventListener("click", handler);
          clickHandlers.set(id, handler);
        }
      });
    });

    return () => {
      clickHandlers.forEach((handler, id) => {
        const element = document.getElementById(id);
        if (element) {
          element.removeEventListener("click", handler);
        }
      });
    };
  }, [idList]);

  const handleMouseDown = (e) => {
    if (e.button === 0 && !isZoomed) {
      e.stopPropagation();
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setIsSelecting(true);
      setSelectionStart({ x, y });
      setSelectionEnd({ x, y });
      setShowSelection(true);
    }
  };

  const handleMouseMove = (e) => {
    if (isSelecting && !isZoomed) {
      e.stopPropagation();
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setSelectionEnd({ x, y });
    }
  };

  const handleMouseUp = () => {
    if (isSelecting && !isZoomed) {
      setIsSelecting(false);
      
      if (transformComponentRef.current && containerRef.current) {
        const { setTransform } = transformComponentRef.current;
        if (setTransform) {
          const containerRect = containerRef.current.getBoundingClientRect();
          const containerWidth = containerRect.width;
          const containerHeight = containerRect.height;

          const selectionWidth = Math.abs(selectionEnd.x - selectionStart.x);
          const selectionHeight = Math.abs(selectionEnd.y - selectionStart.y);
          const selectionCenterX = (selectionStart.x + selectionEnd.x) / 2;
          const selectionCenterY = (selectionStart.y + selectionEnd.y) / 2;

          const scaleX = containerWidth / selectionWidth;
          const scaleY = containerHeight / selectionHeight;
          const scale = Math.min(2, Math.max(0.5, Math.min(scaleX, scaleY) * 0.8));

          const newX = (containerWidth / 2) - (selectionCenterX * scale);
          const newY = (containerHeight / 2) - (selectionCenterY * scale);

          setTransform(newX, newY, scale);
          setIsZoomed(true);
        }
      }
    }
  };

  const handleResetSelection = () => {
    setShowSelection(false);
    setSelectionStart({ x: 0, y: 0 });
    setSelectionEnd({ x: 0, y: 0 });
    setIsZoomed(false);
    if (transformComponentRef.current) {
      const { setTransform } = transformComponentRef.current;
      if (setTransform) {
        setTransform(0, 0, 1);
      }
    }
  };

  return (
    <div className="canvas-wrapper">
      <div className="canvas-controls">
        <button onClick={handleResetSelection} className="control-button">
          Сбросить выделение
        </button>
      </div>
      
      {loading && <LoadingOverlay loadingStr={"Генерация картины по номерам..."} />}
      
      {!loading && (
        <div className="canvas-container" ref={containerRef}>
          <TransformWrapper
            initialScale={1}
            initialPositionX={0}
            initialPositionY={0}
            minScale={0.5}
            maxScale={2}
            centerOnInit={true}
            panning={!isSelecting}
            wheel={{ disabled: true }}
            doubleClick={{ disabled: true }}
            zoomAnimation={{ disabled: true }}
          >
            {({ setTransform }) => {
              transformComponentRef.current = { setTransform };
              
              return (
                <TransformComponent>
                  {errorMsg ? (
                    <div className="error-message">{errorMsg}</div>
                  ) : (
                    <div 
                      className={`svg-container ${isZoomed ? 'zoomed' : ''}`}
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                    >
                      {showSelection && !isZoomed && (
                        <div
                          className="selection-box"
                          style={{
                            left: Math.min(selectionStart.x, selectionEnd.x),
                            top: Math.min(selectionStart.y, selectionEnd.y),
                            width: Math.abs(selectionEnd.x - selectionStart.x),
                            height: Math.abs(selectionEnd.y - selectionStart.y),
                          }}
                        />
                      )}
                      <div 
                        dangerouslySetInnerHTML={{ __html: svgString }} 
                        className="svg-element"
                        style={{ width: '100%', height: '100%' }}
                      />
                    </div>
                  )}
                </TransformComponent>
              );
            }}
          </TransformWrapper>
        </div>
      )}
    </div>
  );
};

export default Canvas;
