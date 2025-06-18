import { useEffect, useRef } from 'react';

const useSvgData = (svgData, svgRef) => {
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
};

export default useSvgData; 