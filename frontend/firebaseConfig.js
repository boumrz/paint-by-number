// Local development configuration
const getApiUrl = () => {
  // Если мы в браузере
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // Если мы на localhost, используем localhost для API
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5000/api';
    }
    
    // Если мы на IP-адресе (с телефона), используем тот же IP для API
    return `http://${hostname}:5000/api`;
  }
  
  // Fallback для серверного рендеринга
  return 'http://localhost:5000/api';
};

const config = {
  apiUrl: getApiUrl()
};

export default config;
