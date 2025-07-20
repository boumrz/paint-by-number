import { Modal } from "antd";
import axios from "axios";
import { useCallback, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useMediaQuery } from 'usehooks-ts';

import AccessCode from "./components/AccessCode/AccessCode";
import AdminPanel from "./components/AdminPanel/AdminPanel";
import { MainApp } from "./components/MainApp/index.jsx";
import { config } from "./config.js";

function App() {
    const [isAccessGranted, setIsAccessGranted] = useState(false);

    const [horizontalIdList, setHorizontalIdList] = useState([]);
    const [horizontalCurrentColor, setHorizontalCurrentColor] = useState(null);
    const [horizontalSvgData, setHorizontalSvgData] = useState(null);
    const [horizontalSvgDataBW, setHorizontalSvgDataBW] = useState(null);
    const [horizontalSvgDataSepia, setHorizontalSvgDataSepia] = useState(null);
    const [horizontalColorCount, setHorizontalColorCount] = useState(0);

    const [previewBW, setPreviewBW] = useState(null);
    const [previewSepia, setPreviewSepia] = useState(null);

    const [showCrop, setShowCrop] = useState(false);
    const [cropImage, setCropImage] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [croppingFor, setCroppingFor] = useState(null);
    const [orientation, setOrientation] = useState("vertical");

    const [selectedInstruction, setSelectedInstruction] = useState(null);
    const [showDemo, setShowDemo] = useState(true);
    const [showInstructions, setShowInstructions] = useState(false);
    const [userUploadedImages, setUserUploadedImages] = useState(false);
    const [isUserImageUploaded, setIsUserImageUploaded] = useState(false);
    const [isInstructionGenerated, setIsInstructionGenerated] = useState(false);

    const [previewImage, setPreviewImage] = useState(null);
    const [isCropping, setIsCropping] = useState(false);

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

    const getRotatedImg = useCallback((imageSrc, cropPixels, callback) => {
        const img = new window.Image();
        img.onload = function () {
            const canvas = document.createElement("canvas");
            canvas.width = cropPixels.height;
            canvas.height = cropPixels.width;

            const ctx = canvas.getContext("2d");

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

    const createPreviewImages = useCallback(
        async (originalBlob) => {
            try {
                const formData = new FormData();
                formData.append("image", originalBlob, "preview.jpg");

                if (orientation === "vertical") {
                    const respBW = await axios.post(
                        `${config.apiUrl}/api/convert-pixels-bw`,
                        formData,
                        {
                            headers: { "Content-Type": "multipart/form-data" },
                            timeout: 30000,
                        }
                    );
                    setPreviewBW(respBW.data.svg);

                    const respSepia = await axios.post(
                        `${config.apiUrl}/api/convert-pixels-sepia`,
                        formData,
                        {
                            headers: { "Content-Type": "multipart/form-data" },
                            timeout: 30000,
                        }
                    );
                    setPreviewSepia(respSepia.data.svg);
                } else {
                    const respBW = await axios.post(
                        `${config.apiUrl}/api/convert-pixels-horizontal-bw`,
                        formData,
                        {
                            headers: { "Content-Type": "multipart/form-data" },
                            timeout: 30000,
                        }
                    );
                    setPreviewBW(respBW.data.svg);

                    const respSepia = await axios.post(
                        `${config.apiUrl}/api/convert-pixels-horizontal-sepia`,
                        formData,
                        {
                            headers: { "Content-Type": "multipart/form-data" },
                            timeout: 30000,
                        }
                    );
                    setPreviewSepia(respSepia.data.svg);
                }
            } catch (error) {
                if (error.code === "ECONNABORTED") {
                    alert(
                        "Ошибка: превышено время ожидания ответа от сервера (30 секунд). Попробуйте позже."
                    );
                }
                console.error("Error creating preview images:", error);
            }
        },
        [orientation]
    );

    const handleUploadImageFile = useCallback((event) => {
        const file = event.target.files[0];
        if (file) {
            setCroppingFor("user");
            setOrientation("vertical");
            setCropImage(URL.createObjectURL(file));
            setShowCrop(true);
            setUserUploadedImages(true);
            setIsInstructionGenerated(false);
        }
    }, []);

    const handleOrientationChange = useCallback((value) => {
        setOrientation(value);
    }, []);

    const handleCropConfirm = useCallback(async () => {
        if (!cropImage || !croppedAreaPixels) return;
        setIsCropping(true);
        try {
            if (orientation === "vertical") {
                getCroppedImg(
                    cropImage,
                    croppedAreaPixels,
                    async (originalBlob, previewUrl) => {
                        try {
                            await createPreviewImages(originalBlob);

                            getRotatedImg(
                                cropImage,
                                croppedAreaPixels,
                                async (rotatedBlob) => {
                                    setShowCrop(false);
                                    setIsUserImageUploaded(true);
                                    setCropImage(null);
                                    setCrop({ x: 0, y: 0 });
                                    setZoom(1);
                                    setShowDemo(true);
                                    setPreviewImage(previewUrl);
                                    try {
                                        const formData = new FormData();
                                        formData.append("image", rotatedBlob, "cropped.jpg");

                                        const respHorizontalBW = await axios.post(
                                            `${config.apiUrl}/api/convert-pixels-horizontal-bw`,
                                            formData,
                                            {
                                                headers: { "Content-Type": "multipart/form-data" },
                                                timeout: 30000,
                                            }
                                        );
                                        setHorizontalSvgDataBW(respHorizontalBW.data.svg);
                                        setHorizontalIdList(respHorizontalBW.data.palette);
                                        const respHorizontalSepia = await axios.post(
                                            `${config.apiUrl}/api/convert-pixels-horizontal-sepia`,
                                            formData,
                                            {
                                                headers: { "Content-Type": "multipart/form-data" },
                                                timeout: 30000,
                                            }
                                        );
                                        setHorizontalSvgDataSepia(respHorizontalSepia.data.svg);
                                    } catch (error) {
                                        if (error.code === "ECONNABORTED") {
                                            alert(
                                                "Ошибка: превышено время ожидания ответа от сервера (30 секунд). Попробуйте позже."
                                            );
                                        }
                                        console.error("Error processing image:", error);
                                        console.error("Error response:", error.response?.data);
                                        console.error("Error status:", error.response?.status);
                                    }
                                    setCroppingFor(null);
                                    setIsCropping(false);
                                }
                            );
                        } catch (error) {
                            setIsCropping(false);
                            throw error;
                        }
                    }
                );
            } else {
                getCroppedImg(
                    cropImage,
                    croppedAreaPixels,
                    async (croppedBlob, previewUrl) => {
                        try {
                            await createPreviewImages(croppedBlob);
                            setShowCrop(false);
                            setIsUserImageUploaded(true);
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
                                    {
                                        headers: { "Content-Type": "multipart/form-data" },
                                        timeout: 30000,
                                    }
                                );
                                setHorizontalSvgDataBW(respBW.data.svg);
                                setHorizontalIdList(respBW.data.palette);
                                const respSepia = await axios.post(
                                    `${config.apiUrl}/api/convert-pixels-horizontal-sepia`,
                                    formData,
                                    {
                                        headers: { "Content-Type": "multipart/form-data" },
                                        timeout: 30000,
                                    }
                                );
                                setHorizontalSvgDataSepia(respSepia.data.svg);
                            } catch (error) {
                                if (error.code === "ECONNABORTED") {
                                    alert(
                                        "Ошибка: превышено время ожидания ответа от сервера (30 секунд). Попробуйте позже."
                                    );
                                }
                                console.error("Error processing horizontal image:", error);
                                console.error("Error response:", error.response?.data);
                                console.error("Error status:", error.response?.status);
                            }
                            setCroppingFor(null);
                            setIsCropping(false);
                        } catch (error) {
                            setIsCropping(false);
                            throw error;
                        }
                    }
                );
            }
        } catch (error) {
            setIsCropping(false);
            throw error;
        }
    }, [
        cropImage,
        croppedAreaPixels,
        orientation,
        getRotatedImg,
        createPreviewImages,
    ]);

    const handleCropCancel = useCallback(() => {
        setShowCrop(false);
        setCropImage(null);
        setCroppingFor(null);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
    }, []);

    const handleCodeVerified = useCallback((mode) => {
        setIsAccessGranted(true);
        setShowInstructions(false);

        setSelectedInstruction({ type: mode, orientation: "horizontal" });
        setIsInstructionGenerated(true);
    }, []);

    const handleBackToGeneration = useCallback(() => {
        setShowInstructions(false);
        setIsInstructionGenerated(false);
    }, []);

    const handleDemoGeneration = useCallback(async () => {
        setShowDemo(true);
        setSelectedInstruction(null);
        setIsUserImageUploaded(false);
        setIsInstructionGenerated(false);

        const demoImageUrl = "/flower.jpg";
        setPreviewImage(demoImageUrl);

        try {
            const response = await fetch(demoImageUrl);
            const blob = await response.blob();

            await createPreviewImages(blob);

            const formData = new FormData();
            formData.append("image", blob, "demo.jpg");

            const respHorizontalBW = await axios.post(
                `${config.apiUrl}/api/convert-pixels-horizontal-bw`,
                formData,
                { headers: { "Content-Type": "multipart/form-data" }, timeout: 30000 }
            );
            setHorizontalSvgDataBW(respHorizontalBW.data.svg);
            setHorizontalIdList(respHorizontalBW.data.palette);

            const respHorizontalSepia = await axios.post(
                `${config.apiUrl}/api/convert-pixels-horizontal-sepia`,
                formData,
                { headers: { "Content-Type": "multipart/form-data" }, timeout: 30000 }
            );
            setHorizontalSvgDataSepia(respHorizontalSepia.data.svg);
        } catch (error) {
            if (error.code === "ECONNABORTED") {
                alert(
                    "Ошибка: превышено время ожидания ответа от сервера (30 секунд). Попробуйте позже."
                );
            }
            console.error("Error processing demo image:", error);
        }
    }, [createPreviewImages]);

    const handleGetInstructions = useCallback(() => {
        if (!isAccessGranted) {
            setShowInstructions(true);
        }
    }, [isAccessGranted]);

    const isPhone = useMediaQuery('(max-width: 600px)');

    return (
        <>
            <Routes>
                <Route path="/admin" element={<AdminPanel />} />
                <Route
                    path="/"
                    element={
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
                            isCropping={isCropping}
                            isUserImageUploaded={isUserImageUploaded}
                            isInstructionGenerated={isInstructionGenerated}
                        />
                    }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <Modal
                open={showInstructions}
                onCancel={handleBackToGeneration}
                footer={null}
                centered
                width={isPhone ? '100vw' : 600}
                bodyStyle={{
                    padding: isPhone ? '0.5rem' : 0,
                    borderRadius: isPhone ? 8 : 16,
                    overflow: "hidden",
                    background: "#fff",
                    boxShadow: "none",
                }}
                style={{ borderRadius: isPhone ? 8 : 16, boxShadow: "none", maxWidth: isPhone ? '100vw' : 600, width: isPhone ? '100vw' : 600 }}
                maskStyle={{ background: "rgba(0,0,0,0.7)" }}
                destroyOnClose
            >
                <AccessCode onCodeVerified={handleCodeVerified} />
            </Modal>
        </>
    );
}

export default App;
