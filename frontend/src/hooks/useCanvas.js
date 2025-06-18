import { useEffect, useRef, useState } from 'react';

const useCanvas = (svgData, currentColor, idList, setColorCount) => {
  const svgRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selection, setSelection] = useState({ start: { x: 0, y: 0 }, end: { x: 0, y: 0 } });
  const selectionRef = useRef(null);

  useEffect(() => {
    if (svgData && svgRef.current) {
      try {
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgData, 'image/svg+xml');
        
        const textElements = svgDoc.querySelectorAll('text');
        textElements.forEach(text => {
          text.setAttribute('font-family', 'Arial, sans-serif');
          text.setAttribute('font-weight', '400');
          text.setAttribute('font-size', '6px');
          text.setAttribute('fill', '#000000');
          text.setAttribute('stroke', 'none');
          text.setAttribute('paint-order', 'stroke');
          text.setAttribute('dominant-baseline', 'middle');
          text.setAttribute('text-anchor', 'middle');
          text.setAttribute('user-select', 'none');
          text.setAttribute('pointer-events', 'none');
          text.setAttribute('style', 'user-select: none; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; pointer-events: none;');
          text.setAttribute('unselectable', 'on');
          text.setAttribute('onselectstart', 'return false;');
          text.setAttribute('onmousedown', 'return false;');
        });

        const svgElement = svgDoc.documentElement;
        svgElement.setAttribute('style', 'user-select: none; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none;');

        const serializer = new XMLSerializer();
        const modifiedSvg = serializer.serializeToString(svgDoc);
        
        svgRef.current.innerHTML = modifiedSvg;
      } catch (error) {
        console.error('Error processing SVG:', error);
        svgRef.current.innerHTML = svgData;
      }
    }
  }, [svgData]);

  useEffect(() => {
    if (svgRef.current) {
      const elements = svgRef.current.querySelectorAll('g');
      elements.forEach(g => {
        g.addEventListener('click', handleElementClick);
      });

      return () => {
        elements.forEach(g => {
          g.removeEventListener('click', handleElementClick);
        });
      };
    }
  }, [svgData, currentColor]);

  const handleElementClick = (event) => {
    if (currentColor) {
      const g = event.currentTarget;
      g.setAttribute('fill', `rgb(${currentColor[0]}, ${currentColor[1]}, ${currentColor[2]})`);
      updateColorCount(g.getAttribute('id'));
    }
  };

  const updateColorCount = (id) => {
    const color = idList.find(item => item.shapes.includes(id))?.color;
    if (color) {
      setColorCount(prev => {
        const newCount = { ...prev };
        const colorKey = color.join(',');
        newCount[colorKey] = (newCount[colorKey] || 0) + 1;
        return newCount;
      });
    }
  };

  const handleMouseDown = (e) => {
    if (e.button === 0) {
      if (e.altKey) {
        setIsSelecting(true);
        const rect = e.currentTarget.getBoundingClientRect();
        const startX = e.clientX - rect.left;
        const startY = e.clientY - rect.top;
        setSelection({
          start: { x: startX, y: startY },
          end: { x: startX, y: startY }
        });
      } else {
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
      }
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    } else if (isSelecting) {
      const rect = e.currentTarget.getBoundingClientRect();
      setSelection(prev => ({
        ...prev,
        end: {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        }
      }));
    }
  };

  const handleMouseUp = (e) => {
    if (isSelecting) {
      const rect = e.currentTarget.getBoundingClientRect();
      const endX = e.clientX - rect.left;
      const endY = e.clientY - rect.top;
      
      const width = Math.abs(endX - selection.start.x);
      const height = Math.abs(endY - selection.start.y);
      
      if (width > 10 && height > 10) {
        const containerWidth = rect.width;
        const containerHeight = rect.height;
        const scaleX = containerWidth / width;
        const scaleY = containerHeight / height;
        const newScale = Math.min(scaleX, scaleY) * 0.9;
        
        const centerX = (selection.start.x + endX) / 2;
        const centerY = (selection.start.y + endY) / 2;
        const newX = containerWidth / 2 - centerX * newScale;
        const newY = containerHeight / 2 - centerY * newScale;
        
        setScale(newScale);
        setPosition({ x: newX, y: newY });
      }
    }
    setIsDragging(false);
    setIsSelecting(false);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  };

  const handleDoubleClick = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  return {
    svgRef,
    scale,
    position,
    isDragging,
    isSelecting,
    selection,
    selectionRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    handleDoubleClick
  };
};

export default useCanvas; 