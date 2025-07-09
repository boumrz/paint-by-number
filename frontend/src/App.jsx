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

  // Второй холст
  const [secondPreviewImage, setSecondPreviewImage] = useState(null);
  const [secondIdList, setSecondIdList] = useState([]);
  const [secondCurrentColor, setSecondCurrentColor] = useState(null);
  const [secondSvgData, setSecondSvgData] = useState(null);
  const [secondSvgDataBW, setSecondSvgDataBW] = useState(null);
  const [secondSvgDataSepia, setSecondSvgDataSepia] = useState(null);

  // Третий холст (Horizontal)
  const [horizontalPreviewImage, setHorizontalPreviewImage] = useState(null);
  const [horizontalIdList, setHorizontalIdList] = useState([]);
  const [horizontalCurrentColor, setHorizontalCurrentColor] = useState(null);
  const [horizontalSvgData, setHorizontalSvgData] = useState(null);
  const [horizontalSvgDataBW, setHorizontalSvgDataBW] = useState(null);
  const [horizontalSvgDataSepia, setHorizontalSvgDataSepia] = useState(null);

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
    getCroppedImg(
      cropImage,
      croppedAreaPixels,
      async (croppedBlob, previewUrl) => {
        setShowCrop(false);
        setCropImage(null);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setShowDemo(true);
        setPreviewImage(previewUrl);
        if (orientation === "vertical") {
          setHorizontalSvgData(null);
          try {
            const formData = new FormData();
            formData.append("image", croppedBlob, "cropped.jpg");
            const respBW = await axios.post(
              `${config.apiUrl}/api/convert-pixels-bw`,
              formData,
              { headers: { "Content-Type": "multipart/form-data" } }
            );
            setSecondSvgDataBW(respBW.data.svg);
            const respSepia = await axios.post(
              `${config.apiUrl}/api/convert-pixels-sepia`,
              formData,
              { headers: { "Content-Type": "multipart/form-data" } }
            );
            setSecondSvgDataSepia(respSepia.data.svg);
          } catch (error) {
            console.error("Error processing image:", error);
            console.error("Error response:", error.response?.data);
            console.error("Error status:", error.response?.status);
          }
        } else if (orientation === "horizontal") {
          setSecondSvgData(null);
          try {
            const formData = new FormData();
            formData.append("image", croppedBlob, "cropped.jpg");
            const respBW = await axios.post(
              `${config.apiUrl}/api/convert-pixels-horizontal-bw`,
              formData,
              { headers: { "Content-Type": "multipart/form-data" } }
            );
            setHorizontalSvgDataBW(respBW.data.svg);
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
        }
        setCroppingFor(null);
      }
    );
  }, [cropImage, croppedAreaPixels, orientation]);

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
    setPreviewImage(demoImageUrl);

    try {
      // Загружаем демо-изображение как blob
      const response = await fetch(demoImageUrl);
      const blob = await response.blob();

      const formData = new FormData();
      formData.append("image", blob, "demo.jpg");

      // Генерируем только чб и сепия
      const respBW = await axios.post(
        `${config.apiUrl}/api/convert-pixels-bw`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setSecondSvgDataBW(respBW.data.svg);

      const respSepia = await axios.post(
        `${config.apiUrl}/api/convert-pixels-sepia`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setSecondSvgDataSepia(respSepia.data.svg);
    } catch (error) {
      console.error("Error processing demo image:", error);
    }
  }, []);

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
              secondSvgDataBW={secondSvgDataBW}
              secondSvgDataSepia={secondSvgDataSepia}
              horizontalSvgDataBW={horizontalSvgDataBW}
              horizontalSvgDataSepia={horizontalSvgDataSepia}
              showCrop={showCrop}
              cropImage={cropImage}
              crop={crop}
              zoom={zoom}
              croppingFor={croppingFor}
              selectedInstruction={selectedInstruction}
              secondIdList={secondIdList}
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
              secondSvgData={secondSvgData}
              secondCurrentColor={secondCurrentColor}
              horizontalSvgData={horizontalSvgData}
              horizontalCurrentColor={horizontalCurrentColor}
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
