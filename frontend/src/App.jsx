import React, { useState, useCallback } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import { useMediaQuery } from "usehooks-ts";
import { config } from "./config.js";

import AdminPanel from "./components/AdminPanel/AdminPanel";
import AccessCode from "./components/AccessCode/AccessCode";
import { MainApp } from './components/MainApp/index.jsx';

function App() {
  // Состояние для проверки кода доступа
  const [isAccessGranted, setIsAccessGranted] = useState(false);

  // Горизонтальный холст
  const [horizontalPreviewImage, setHorizontalPreviewImage] = useState(null);
  const [horizontalIdList, setHorizontalIdList] = useState([]);
  const [horizontalCurrentColor, setHorizontalCurrentColor] = useState(null);
  const [horizontalSvgData, setHorizontalSvgData] = useState(null);
  const [horizontalSvgDataBW, setHorizontalSvgDataBW] = useState(null);
  const [horizontalSvgDataSepia, setHorizontalSvgDataSepia] = useState(null);
  const [horizontalColorCount, setHorizontalColorCount] = useState(0);
  
  // Превью для ЧБ и сепии в оригинальной ориентации
  const [previewBW, setPreviewBW] = useState(null);
  const [previewSepia, setPreviewSepia] = useState(null);

  const [showCrop, setShowCrop] = useState(false);
  const [cropImage, setCropImage] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [croppingFor, setCroppingFor] = useState(null);
  const [orientation, setOrientation] = useState("vertical"); // vertical/horizontal

  // Делаю одно:
  const [selectedInstruction, setSelectedInstruction] = useState(null); // { type: 'bw'|'sepia', orientation: 'vertical'|'horizontal' }
  const [showDemo, setShowDemo] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [userUploadedImages, setUserUploadedImages] = useState(false);
  const isPhone = useMediaQuery("(max-width: 400px)");

  const [previewImage, setPreviewImage] = useState(null);

  // Crop image to square using react-easy-crop
  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const getCroppedImg = useCallback((imageSrc, cropPixels, callback) => {
    const img = new window.Image();
    img.onload = function () {
      const canvas = document.createElement("canvas");
      canvas.width = cropPixels.width;
      canvas.height = cropPixels.height;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(
        img,
        cropPixels.x,
        cropPixels.y,
        cropPixels.width,
        cropPixels.height,
        0,
        0,
        cropPixels.width,
        cropPixels.height
      );

      canvas.toBlob((blob) => {
        if (blob) {
          callback(blob, canvas.toDataURL("image/jpeg"));
        } else {
          console.error("Failed to create blob");
          alert("Не удалось обработать изображение.");
        }
      }, "image/jpeg");
    };
    img.onerror = function () {
      console.error("Failed to load image");
      alert("Не удалось прочитать изображение.");
    };
    img.src = imageSrc;
  }, []);

  // Функция для создания повернутого изображения для сервера
  const getRotatedImg = useCallback((imageSrc, cropPixels, callback) => {
    const img = new window.Image();
    img.onload = function () {
      const canvas = document.createElement("canvas");
      canvas.width = cropPixels.height; // Меняем местами размеры
      canvas.height = cropPixels.width;

      const ctx = canvas.getContext("2d");
      // Поворачиваем на 90 градусов влево
      ctx.translate(0, cropPixels.width);
      ctx.rotate(-Math.PI / 2);
      ctx.drawImage(
        img,
        cropPixels.x,
        cropPixels.y,
        cropPixels.width,
        cropPixels.height,
        0,
        0,
        cropPixels.width,
        cropPixels.height
      );

      canvas.toBlob((blob) => {
        if (blob) {
          callback(blob);
        } else {
          console.error("Failed to create rotated blob");
          alert("Не удалось обработать изображение.");
        }
      }, "image/jpeg");
    };
    img.onerror = function () {
      console.error("Failed to load image");
      alert("Не удалось прочитать изображение.");
    };
    img.src = imageSrc;
  }, []);

  // Функция для создания превью ЧБ и сепии в оригинальной ориентации
  const createPreviewImages = useCallback(async (originalBlob) => {
    try {
      const formData = new FormData();
      formData.append("image", originalBlob, "preview.jpg");
      
      // Генерируем превью ЧБ в оригинальной ориентации
      const respBW = await axios.post(
        `${config.apiUrl}/api/convert-pixels-bw`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setPreviewBW(respBW.data.svg);
      
      // Генерируем превью сепии в оригинальной ориентации
      const respSepia = await axios.post(
        `${config.apiUrl}/api/convert-pixels-sepia`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setPreviewSepia(respSepia.data.svg);
    } catch (error) {
      console.error("Error creating preview images:", error);
    }
  }, []);

  const handleUploadImageFile = useCallback((event) => {
    const file = event.target.files[0];
    if (file) {
      setCroppingFor("user"); // универсальный режим
      setOrientation("vertical"); // по умолчанию вертикально
      setCropImage(URL.createObjectURL(file));
      setShowCrop(true);
      setUserUploadedImages(true);
    }
  }, []);

  const handleOrientationChange = useCallback((value) => {
    setOrientation(value);
  }, []);

  const handleCropConfirm = useCallback(async () => {
    if (!cropImage || !croppedAreaPixels) return;
    
    if (orientation === "vertical") {
      // Для вертикальных изображений создаем два разных изображения
      getCroppedImg(
        cropImage,
        croppedAreaPixels,
        async (originalBlob, previewUrl) => {
          // Создаем превью в оригинальной ориентации
          await createPreviewImages(originalBlob);
          
          // Создаем повернутое изображение для сервера
          getRotatedImg(
            cropImage,
            croppedAreaPixels,
            async (rotatedBlob) => {
              setShowCrop(false);
              setCropImage(null);
              setCrop({ x: 0, y: 0 });
              setZoom(1);
              setShowDemo(true);
              setPreviewImage(previewUrl); // Оригинальное изображение для превью
              
              try {
                const formData = new FormData();
                formData.append("image", rotatedBlob, "cropped.jpg"); // Повернутое изображение для сервера
                // Генерируем только горизонтальный холст с повернутым изображением
                const respHorizontalBW = await axios.post(
                  `${config.apiUrl}/api/convert-pixels-horizontal-bw`,
                  formData,
                  { headers: { "Content-Type": "multipart/form-data" } }
                );
                setHorizontalSvgDataBW(respHorizontalBW.data.svg);
                setHorizontalIdList(respHorizontalBW.data.palette);
                const respHorizontalSepia = await axios.post(
                  `${config.apiUrl}/api/convert-pixels-horizontal-sepia`,
                  formData,
                  { headers: { "Content-Type": "multipart/form-data" } }
                );
                setHorizontalSvgDataSepia(respHorizontalSepia.data.svg);
              } catch (error) {
                console.error("Error processing image:", error);
                console.error("Error response:", error.response?.data);
                console.error("Error status:", error.response?.status);
              }
              setCroppingFor(null);
            }
          );
        }
      );
    } else {
      // Для горизонтальных изображений используем обычную логику
      getCroppedImg(
        cropImage,
        croppedAreaPixels,
        async (croppedBlob, previewUrl) => {
          // Создаем превью в оригинальной ориентации
          await createPreviewImages(croppedBlob);
          
          setShowCrop(false);
          setCropImage(null);
          setCrop({ x: 0, y: 0 });
          setZoom(1);
          setShowDemo(true);
          setPreviewImage(previewUrl);
          
          try {
            const formData = new FormData();
            formData.append("image", croppedBlob, "cropped.jpg");
            const respBW = await axios.post(
              `${config.apiUrl}/api/convert-pixels-horizontal-bw`,
              formData,
              { headers: { "Content-Type": "multipart/form-data" } }
            );
            setHorizontalSvgDataBW(respBW.data.svg);
            setHorizontalIdList(respBW.data.palette);
            const respSepia = await axios.post(
              `${config.apiUrl}/api/convert-pixels-horizontal-sepia`,
              formData,
              { headers: { "Content-Type": "multipart/form-data" } }
            );
            setHorizontalSvgDataSepia(respSepia.data.svg);
          } catch (error) {
            console.error("Error processing horizontal image:", error);
            console.error("Error response:", error.response?.data);
            console.error("Error status:", error.response?.status);
          }
          setCroppingFor(null);
        }
      );
    }
  }, [cropImage, croppedAreaPixels, orientation, getRotatedImg, createPreviewImages]);

  const handleCropCancel = useCallback(() => {
    setShowCrop(false);
    setCropImage(null);
    setCroppingFor(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  }, []);

  const handleCodeVerified = useCallback(() => {
    setIsAccessGranted(true);
    setShowInstructions(false);
  }, []);

  const handleBackToGeneration = useCallback(() => {
    setShowInstructions(false);
  }, []);

  const handleDemoGeneration = useCallback(async () => {
    setShowDemo(true);
    setSelectedInstruction(null);
    // Используем демо-изображение из public
    const demoImageUrl = "/flower.jpg";
    setPreviewImage(demoImageUrl); // Оригинальное изображение для превью

    try {
      // Загружаем демо-изображение как blob
      const response = await fetch(demoImageUrl);
      const blob = await response.blob();

      // Создаем превью в оригинальной ориентации
      await createPreviewImages(blob);

      const formData = new FormData();
      formData.append("image", blob, "demo.jpg");

      // Генерируем только горизонтальные данные
      const respHorizontalBW = await axios.post(
        `${config.apiUrl}/api/convert-pixels-horizontal-bw`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setHorizontalSvgDataBW(respHorizontalBW.data.svg);
      setHorizontalIdList(respHorizontalBW.data.palette);

      const respHorizontalSepia = await axios.post(
        `${config.apiUrl}/api/convert-pixels-horizontal-sepia`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setHorizontalSvgDataSepia(respHorizontalSepia.data.svg);
    } catch (error) {
      console.error("Error processing demo image:", error);
    }
  }, [createPreviewImages]);

  const handleGetInstructions = useCallback(() => {
    if (!isAccessGranted) {
      setShowInstructions(true);
    }
  }, [isAccessGranted]);

  return (
    <Routes>
      <Route path="/admin" element={<AdminPanel />} />
      <Route
        path="/"
        element={
          showInstructions ? (
            <AccessCode onCodeVerified={handleCodeVerified} onBackToGeneration={handleBackToGeneration} />
          ) : (
            <MainApp
              previewImage={previewImage}
              horizontalSvgDataBW={horizontalSvgDataBW}
              horizontalSvgDataSepia={horizontalSvgDataSepia}
              previewBW={previewBW}
              previewSepia={previewSepia}
              showCrop={showCrop}
              cropImage={cropImage}
              crop={crop}
              zoom={zoom}
              croppingFor={croppingFor}
              selectedInstruction={selectedInstruction}
              horizontalIdList={horizontalIdList}
              isPhone={isPhone}
              handleUploadImageFile={handleUploadImageFile}
              handleOrientationChange={handleOrientationChange}
              handleCropCancel={handleCropCancel}
              handleCropConfirm={handleCropConfirm}
              onCropComplete={onCropComplete}
              setSelectedInstruction={setSelectedInstruction}
              setCrop={setCrop}
              setZoom={setZoom}
              showDemo={showDemo}
              handleDemoGeneration={handleDemoGeneration}
              handleGetInstructions={handleGetInstructions}
              isAccessGranted={isAccessGranted}
              userUploadedImages={userUploadedImages}
              horizontalSvgData={horizontalSvgData}
              horizontalCurrentColor={horizontalCurrentColor}
              horizontalColorCount={horizontalColorCount}
              setHorizontalColorCount={setHorizontalColorCount}
              orientation={orientation}
            />
          )
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
