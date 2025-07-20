import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { Button, Card, Carousel, Tooltip } from "antd";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMediaQuery } from "usehooks-ts";

import { InstructionSlide } from "./InstructionSlide";

export const GridInstructions = ({
    idList,
    setExportStatus,
    isExporting,
    setIsExporting,
    setExportProgress,
    svgData,
    title,
    orientation = "vertical",
}) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [loadedSlides, setLoadedSlides] = useState(new Set([0, 1, 2]));
    const [forceUpdate, setForceUpdate] = useState(0);
    const mainCarouselRef = useRef(null);
    const navigationRef = useRef(null);
    const isPhone = useMediaQuery("(max-width: 600px)");

    const gridCols = orientation === "horizontal" ? 16 : 8;
    const gridRows = orientation === "horizontal" ? 8 : 16;
    const total = gridCols * gridRows;

    useEffect(() => {
        if (navigationRef.current) {
            const currentElement = navigationRef.current.querySelector(
                `[data-slide="${currentSlide}"]`
            );
            if (currentElement) {
                currentElement.scrollIntoView({
                    behavior: "smooth",
                    block: "nearest",
                    inline: "center",
                });
            }
        }
    }, [currentSlide]);

    const handleSlideChange = (current) => {
        setCurrentSlide(current);
        const newLoadedSlides = new Set(loadedSlides);
        for (
            let i = Math.max(0, current - 2);
            i <= Math.min(total - 1, current + 2);
            i++
        ) {
            newLoadedSlides.add(i);
        }
        setLoadedSlides(newLoadedSlides);
    };

    const handleNumberClick = (slideIndex) => {
        setCurrentSlide(slideIndex);
        setTimeout(() => {
            if (mainCarouselRef.current) {
                try {
                    if (mainCarouselRef.current.goTo) {
                        mainCarouselRef.current.goTo(slideIndex);
                    }
                } catch (error) {
                    setForceUpdate((prev) => prev + 1);
                }
            }
        }, 100);
    };

    const createSlide = (index) => {
        if (!loadedSlides.has(index)) {
            return (
                <div
                    key={index}
                    style={{
                        padding: "1rem",
                        background: "#f5f5f5",
                        borderRadius: "8px",
                        color: "black",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                        border: "1px solid #e0e0e0",
                        boxSizing: "border-box",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        height: "100%",
                        minHeight: isPhone ? "300px" : "400px",
                    }}
                >
                    <div style={{ color: "#666", textAlign: "center", marginBottom: "1rem" }}>
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
                <div
                    key={squareNumber}
                    style={{
                        padding: "1rem",
                        background: "#fff2f0",
                        borderRadius: "8px",
                        color: "black",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                        border: "1px solid #ffccc7",
                        boxSizing: "border-box",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        height: "100%",
                        minHeight: isPhone ? "300px" : "400px",
                    }}
                >
                    <div style={{ fontWeight: "bold", marginBottom: 8, fontSize: "1.2rem", textAlign: "center" }}>
                        Сектор {squareNumber}
                    </div>
                    <div style={{ color: "#666", textAlign: "center" }}>
                        Ошибка загрузки
                    </div>
                </div>
            );
        }
    };

    const navigationNumbers = useMemo(() => {
        return Array.from({ length: total }, (_, index) => {
            const isCurrent = index === currentSlide;
            return (
                <Tooltip title={`Сектор ${index + 1}`} key={index}>
                    <Button
                        type={isCurrent ? "primary" : "default"}
                        shape="circle"
                        size={isPhone ? "small" : "middle"}
                        style={{
                            background: isCurrent ? "#1890ff" : "#f0f0f0",
                            color: isCurrent ? "#fff" : "#333",
                            border: isCurrent ? "1.5px solid #1890ff" : "1px solid #d9d9d9",
                            fontWeight: isCurrent ? 700 : 400,
                            boxShadow: isCurrent ? "0 2px 8px rgba(24,144,255,0.12)" : undefined,
                            marginRight: 4,
                            marginBottom: 4,
                            transition: "all 0.2s",
                        }}
                        onClick={() => handleNumberClick(index)}
                        data-slide={index}
                    >
                        {index + 1}
                    </Button>
                </Tooltip>
            );
        });
    }, [total, currentSlide, isPhone]);

    const carouselSlides = useMemo(() => {
        return Array.from({ length: total }, (_, index) => createSlide(index));
    }, [total, loadedSlides, idList, svgData, orientation, isPhone]);

    // Drag-to-scroll/swipe logic
    const navDragState = useRef({ isDown: false, startX: 0, scrollLeft: 0 });

    const handleNavMouseDown = (e) => {
        navDragState.current.isDown = true;
        navDragState.current.startX = e.pageX - navigationRef.current.offsetLeft;
        navDragState.current.scrollLeft = navigationRef.current.scrollLeft;
        navigationRef.current.style.cursor = 'grabbing';
    };
    const handleNavMouseLeave = () => {
        navDragState.current.isDown = false;
        navigationRef.current.style.cursor = '';
    };
    const handleNavMouseUp = () => {
        navDragState.current.isDown = false;
        navigationRef.current.style.cursor = '';
    };
    const handleNavMouseMove = (e) => {
        if (!navDragState.current.isDown) return;
        e.preventDefault();
        const x = e.pageX - navigationRef.current.offsetLeft;
        const walk = (x - navDragState.current.startX) * 1.2; // scroll speed
        navigationRef.current.scrollLeft = navDragState.current.scrollLeft - walk;
    };
    // Touch events
    const handleNavTouchStart = (e) => {
        navDragState.current.isDown = true;
        navDragState.current.startX = e.touches[0].pageX - navigationRef.current.offsetLeft;
        navDragState.current.scrollLeft = navigationRef.current.scrollLeft;
    };
    const handleNavTouchEnd = () => {
        navDragState.current.isDown = false;
    };
    const handleNavTouchMove = (e) => {
        if (!navDragState.current.isDown) return;
        const x = e.touches[0].pageX - navigationRef.current.offsetLeft;
        const walk = (x - navDragState.current.startX) * 1.2;
        navigationRef.current.scrollLeft = navDragState.current.scrollLeft - walk;
    };

    // Кастомные стрелки для Carousel
    const goToPrev = () => {
        if (mainCarouselRef.current && mainCarouselRef.current.prev) mainCarouselRef.current.prev();
    };
    const goToNext = () => {
        if (mainCarouselRef.current && mainCarouselRef.current.next) mainCarouselRef.current.next();
    };

    return (
        <Card
            style={{
                width: "100%",
                maxWidth: isPhone ? "100%" : 440,
                borderRadius: 16,
                boxShadow: "0 4px 24px rgba(102,126,234,0.10)",
                background: "#fff",
                border: "none",
                padding: isPhone ? 8 : 24,
                position: 'relative',
            }}
            bodyStyle={{ padding: 0 }}
        >
            <div style={{ position: 'relative', width: '100%' }}>
                <Button
                    shape="circle"
                    icon={<LeftOutlined />}
                    size={isPhone ? 'small' : 'middle'}
                    onClick={goToPrev}
                    style={{
                        position: 'absolute',
                        left: -18,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        zIndex: 2,
                        background: '#fff',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                        border: '1px solid #d9d9d9',
                        color: '#1890ff',
                        opacity: currentSlide === 0 ? 0.4 : 1,
                        pointerEvents: currentSlide === 0 ? 'none' : 'auto',
                    }}
                    tabIndex={-1}
                />
                <Carousel
                    key={`main-carousel-${forceUpdate}`}
                    ref={mainCarouselRef}
                    dots={{ position: "bottom" }}
                    infinite={false}
                    slidesToShow={1}
                    slidesToScroll={1}
                    autoplay={false}
                    arrows={false}
                    afterChange={handleSlideChange}
                    style={{
                        background: "#fff",
                        borderRadius: 12,
                        padding: isPhone ? 0 : 16,
                        minHeight: isPhone ? 320 : 420,
                    }}
                >
                    {carouselSlides}
                </Carousel>
                <Button
                    shape="circle"
                    icon={<RightOutlined />}
                    size={isPhone ? 'small' : 'middle'}
                    onClick={goToNext}
                    style={{
                        position: 'absolute',
                        right: -18,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        zIndex: 2,
                        background: '#fff',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                        border: '1px solid #d9d9d9',
                        color: '#1890ff',
                        opacity: currentSlide === total - 1 ? 0.4 : 1,
                        pointerEvents: currentSlide === total - 1 ? 'none' : 'auto',
                    }}
                    tabIndex={-1}
                />
            </div>
            <div
                ref={navigationRef}
                style={{
                    marginTop: 20,
                    width: "100%",
                    overflowX: "auto",
                    overflowY: "hidden",
                    whiteSpace: "nowrap",
                    padding: isPhone ? 4 : 8,
                    display: 'flex',
                    gap: isPhone ? 2 : 4,
                    borderRadius: 12,
                    background: '#fff',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
                    alignItems: 'center',
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#d9d9d9 #f0f0f0',
                    cursor: navDragState.current.isDown ? 'grabbing' : 'grab',
                }}
                onMouseDown={handleNavMouseDown}
                onMouseLeave={handleNavMouseLeave}
                onMouseUp={handleNavMouseUp}
                onMouseMove={handleNavMouseMove}
                onTouchStart={handleNavTouchStart}
                onTouchEnd={handleNavTouchEnd}
                onTouchMove={handleNavTouchMove}
            >
                {navigationNumbers}
            </div>
        </Card>
    );
};
