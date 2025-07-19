import cn from 'clsx';
import { useState } from 'react';

import useCanvas from '../../hooks/useCanvas';
import styles from './HorizontalCanvas.module.css';

const HorizontalCanvasFull = ({
    svgData,
    idList,
    currentColor,
    setColorCount,
}) => {
    const {
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
    } = useCanvas(svgData, currentColor, idList, setColorCount);

    const [isFilled, setIsFilled] = useState(false);

    const handleFillAll = () => {
        if (svgRef.current) {
            const rects = svgRef.current.querySelectorAll('rect[data-color]');
            rects.forEach(rect => {
                const dataColor = rect.getAttribute('data-color');
                if (dataColor) {
                    rect.setAttribute('fill', dataColor);
                }
            });

            const digitRects = svgRef.current.querySelectorAll('rect[data-digit-label="1"]');
            digitRects.forEach(rect => {
                rect.style.display = 'none';
            });
        }
        setIsFilled(true);

        const gridLayer = document.querySelector('.svg-container + div');
        if (gridLayer) gridLayer.style.display = 'none';
    };

    const handleClearAll = () => {
        if (svgRef.current) {
            const rects = svgRef.current.querySelectorAll('rect[data-color]');
            rects.forEach(rect => {
                rect.setAttribute('fill', 'white');
            });
            // Показать номера
            const digitRects = svgRef.current.querySelectorAll('rect[data-digit-label="1"]');
            digitRects.forEach(rect => {
                rect.style.display = '';
            });
        }
        setIsFilled(false);
        // Показать сетку (grid)
        const gridLayer = document.querySelector('.svg-container + div');
        if (gridLayer) gridLayer.style.display = '';
    };

    const generateGrid = () => {
        const gridCols = 16;
        const gridRows = 8;
        const cellWidth = 1000 / gridCols;
        const cellHeight = 800 / gridRows;
        const pxPerCellX = 10;
        const pxPerCellY = 16;
        const pxWidth = cellWidth / pxPerCellX;
        const pxHeight = cellHeight / pxPerCellY;
        const cells = [];
        for (let row = 0; row < gridRows; row++) {
            for (let col = 0; col < gridCols; col++) {
                const number = row * gridCols + col + 1;
                const x = col * cellWidth;
                const y = row * cellHeight;

                const bg = isFilled ? 'transparent' : ((row + col) % 2 === 0 ? 'rgba(243,243,243,0.5)' : 'rgba(255,255,255,0.0)');
                cells.push(
                    <div
                        key={number}
                        style={{
                            position: 'absolute',
                            left: x,
                            top: y,
                            width: cellWidth,
                            height: cellHeight,
                            boxSizing: 'border-box',
                            borderRight: col < gridCols - 1 ? '1px solid #333' : 'none',
                            borderBottom: row < gridRows - 1 ? '1px solid #333' : 'none',
                            borderLeft: col === 0 ? '1px solid #333' : 'none',
                            borderTop: row === 0 ? '1px solid #333' : 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 7,
                            fontWeight: 'bold',
                            color: '#333',
                            backgroundColor: bg,
                            pointerEvents: 'none'
                        }}
                    >
                        {Array.from({ length: pxPerCellX }).map((_, i) => (
                            i === 0 ? null : (
                                <span
                                    key={`h-${i}`}
                                    style={{
                                        position: 'absolute',
                                        left: i * pxWidth + pxWidth / 2 - ((i + 1) < 10 ? 1 : 2),
                                        top: (i + 1) < 10 ? -2 : -2,
                                        fontSize: 4,
                                        color: '#888',
                                        pointerEvents: 'none',
                                        fontWeight: 500,
                                        zIndex: 2,
                                        userSelect: 'none',
                                    }}
                                >
                                    {i + 1}
                                </span>
                            )
                        ))}
                        {Array.from({ length: pxPerCellY }).map((_, j) => (
                            <span
                                key={`v-${j}`}
                                style={{
                                    position: 'absolute',
                                    left: (j + 1) < 10 ? 2 : 1,
                                    top: j * pxHeight + pxHeight / 2 - ((j + 1) < 10 ? 5 : 5),
                                    fontSize: 4,
                                    color: '#888',
                                    pointerEvents: 'none',
                                    fontWeight: 500,
                                    zIndex: 2,
                                    userSelect: 'none',
                                }}
                            >
                                {j + 1}
                            </span>
                        ))}
                    </div>
                );
            }
        }
        return cells;
    };

    function generateSvgAxisNumbers() {
        const gridCols = 16;
        const gridRows = 8;
        const cellWidth = 1000 / gridCols;
        const cellHeight = 800 / gridRows;
        const pxPerCellX = 10;
        const pxPerCellY = 16;
        const pxWidth = cellWidth / pxPerCellX;
        const pxHeight = cellHeight / pxPerCellY;
        let axisSvg = '';
        // Разлиновка по зонам (тонкие линии)
        for (let i = 0; i <= gridCols; i++) {
            const x = i * cellWidth;
            axisSvg += `<line x1="${x}" y1="0" x2="${x}" y2="800" stroke="#222" stroke-width="1.1" />`;
        }
        for (let j = 0; j <= gridRows; j++) {
            const y = j * cellHeight;
            axisSvg += `<line x1="0" y1="${y}" x2="1000" y2="${y}" stroke="#222" stroke-width="1.1" />`;
        }
        for (let row = 0; row < gridRows; row++) {
            const y0 = row * cellHeight;
            for (let col = 0; col < gridCols; col++) {
                const x0 = col * cellWidth;

                for (let i = 2; i <= pxPerCellX; i++) {
                    let x = x0 + i * pxWidth + pxWidth / 2 - ((i + 1) < 10 ? 1 : 2);
                    let y = y0 - 2;

                    x -= pxWidth;
                    y += pxHeight;

                    x += pxWidth / 4;
                    axisSvg += `<text x="${x}" y="${y}" font-size="4" fill="#888" font-weight="500" text-anchor="middle" font-family="Arial" style="user-select:none;pointer-events:none;">${i}</text>`;
                }

                for (let j = 1; j <= pxPerCellY; j++) {
                    let x = x0 + ((j + 1) < 10 ? 2 : 1) + pxWidth / 4;
                    if (String(j).startsWith('9')) {
                        x += pxWidth / 5;
                    }
                    const y = y0 + j * pxHeight + pxHeight / 2 - ((j + 1) < 10 ? 5 : 5);
                    axisSvg += `<text x="${x}" y="${y}" font-size="4" fill="#888" font-weight="500" text-anchor="middle" font-family="Arial" style="user-select:none;pointer-events:none;">${j}</text>`;
                }
            }
        }
        return axisSvg;
    }

    const handleExportSVG = () => {
        if (!svgRef.current) return;

        let svgInner = svgRef.current.innerHTML;
 
        const parser = new window.DOMParser();
        const doc = parser.parseFromString(svgInner, 'image/svg+xml');
        const rects = doc.querySelectorAll('rect[data-color]');
        const gridCols = 16;
        const gridRows = 8;
        const cellWidth = 1000 / gridCols;
        const cellHeight = 800 / gridRows;

        rects.forEach(rect => {
            const x = parseFloat(rect.getAttribute('x'));
            const y = parseFloat(rect.getAttribute('y'));

            const col = Math.floor(x / cellWidth);
            const row = Math.floor(y / cellHeight);
            const fill = (row + col) % 2 === 0 ? '#fff' : '#DCDCDC';
            rect.setAttribute('fill', fill);
        });

        let texts = '';
        const digitRects = doc.querySelectorAll('rect[data-digit-label="1"]');
        digitRects.forEach(rect => {
            const x = parseFloat(rect.getAttribute('x'));
            const y = parseFloat(rect.getAttribute('y'));
            const width = parseFloat(rect.getAttribute('width'));
            const height = parseFloat(rect.getAttribute('height'));
            const col = Math.floor(x / cellWidth);
            const row = Math.floor(y / cellHeight);
            const isWhite = (row + col) % 2 === 0;
            const fillWidth = Math.max(0, width - 1);
            const fillHeight = Math.max(0, height - 1);
            const fill = isWhite ? '#D3D3D3' : '#fff';
            texts += `<rect x="${x + 0.5}" y="${y + 0.5}" width="${fillWidth}" height="${fillHeight}" fill="${fill}" />`;

            rect.parentNode.removeChild(rect);
        });

        const serializer = new window.XMLSerializer();
        const modifiedSvg = serializer.serializeToString(doc.documentElement);

        const axisSvg = generateSvgAxisNumbers();

        const finalSvg = `<?xml version="1.0" standalone="no"?>\n<svg width="1000" height="800" viewBox="0 0 1000 800" xmlns="http://www.w3.org/2000/svg">${modifiedSvg}${texts}${axisSvg}</svg>`;
        const blob = new Blob([finalSvg], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'canvas-section.svg';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 0);
    };

    return (
        <div className={styles.container}>
            <h1>Горизонтальный холст</h1>
            <div className={styles.controls}>
                <button onClick={handleClearAll} className={styles.button}>
                    Очистить все
                </button>
                <button onClick={handleFillAll} className={styles.button}>
                    Заполнить все
                </button>
                <button onClick={handleDoubleClick} className={styles.button}>
                    Сбросить масштаб
                </button>
                <button onClick={handleExportSVG} className={styles.button}>
                    Скачать SVG
                </button>
                <div className={styles.hint}>
                    Alt + левая кнопка мыши для выделения области
                </div>
            </div>
            <div className={styles.section}>
                <div
                    className={styles.wrapper}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onWheel={handleWheel}
                    onDoubleClick={handleDoubleClick}
                    style={{
                        cursor: isDragging ? 'grabbing' : (isSelecting ? 'crosshair' : 'grab'),
                        width: '1000px',
                        height: '800px',
                    }}
                >
                    <div
                        className="svg-container"
                        style={{
                            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                            transformOrigin: '0 0',
                            transition: isDragging || isSelecting ? 'none' : 'transform 0.1s',
                            width: '1000px',
                            height: '800px',
                            position: 'relative'
                        }}
                    >
                        <div
                            className={cn(styles['svg-element'], styles['horizontal-canvas'])}
                            ref={svgRef}
                        />
                        <div
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '1000px',
                                height: '800px',
                                pointerEvents: 'none'
                            }}
                        >
                            {generateGrid()}
                        </div>
                    </div>
                    {isSelecting && (
                        <div
                            ref={selectionRef}
                            className={styles.selectionBox}
                            style={{
                                left: Math.min(selection.start.x, selection.end.x),
                                top: Math.min(selection.start.y, selection.end.y),
                                width: Math.abs(selection.end.x - selection.start.x),
                                height: Math.abs(selection.end.y - selection.start.y)
                            }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default HorizontalCanvasFull; 