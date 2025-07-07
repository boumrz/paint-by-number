// Динамическое определение API URL
const getApiUrl = () => {
  // Если мы в браузере
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    const port = window.location.port;

    // Если мы на localhost, используем localhost для API
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://localhost:5000";
    }

    // Если мы на IP-адресе (с телефона), используем тот же IP для API
    return `https://${hostname}:5000`;
  }

  // Fallback для серверного рендеринга
  return "http://localhost:5000";
};

export const config = {
  apiUrl: getApiUrl(),
};
