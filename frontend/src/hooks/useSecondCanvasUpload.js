import axios from 'axios';
import { useState } from 'react';

import { config } from '../config.js';

const useSecondCanvasUpload = (setLoading) => {
    const [fName, setFName] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [idList, setIdList] = useState([]);
    const [svgData, setSvgData] = useState(null);

    const handleFileUpload = async (file) => {
        if (file) {
            const url = URL.createObjectURL(file);
            setFName(url);
            setPreviewImage(url);
            setLoading(true);

            try {
                const formData = new FormData();
                formData.append('image', file);

                const response = await axios.post(`${config.apiUrl}/api/convert`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    },
                    timeout: 30000
                });

                if (response.data.palette && response.data.svg) {
                    setIdList(response.data.palette);
                    setSvgData(response.data.svg);
                } else {
                    throw new Error('Invalid server response format');
                }
            } catch (error) {
                if (error.code === 'ECONNABORTED') {
                    alert('Ошибка: превышено время ожидания ответа от сервера (30 секунд). Попробуйте позже.');
                }
                console.error('Error processing image:', error);
            } finally {
                setLoading(false);
            }
        }
    };

    return {
        fName,
        previewImage,
        idList,
        svgData,
        handleFileUpload
    };
};

export default useSecondCanvasUpload; 