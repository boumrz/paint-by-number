import { useState } from 'react';
import { config } from '../config.js';

const useFileUpload = (setLoading) => {
  const [svgData, setSvgData] = useState(null);
  const [idList, setIdList] = useState(null);

  const handleFileUpload = async (file) => {
    if (file) {
      setLoading(true);
      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${config.apiUrl}/api/upload`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to upload file');
        }

        const data = await response.json();
        setSvgData(data.svg);
        setIdList(data.idList);
      } catch (error) {
        console.error('Error uploading file:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  return {
    svgData,
    idList,
    handleFileUpload
  };
};

export default useFileUpload; 