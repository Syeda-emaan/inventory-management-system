import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

api.interceptors.response.use(
  (res) => res,
  (err) => {
    err.userMessage = err.response?.data?.message || err.message;
    err.details = err.response?.data?.details;
    return Promise.reject(err);
  }
);

export const fileUrl = (path) => (path ? `${import.meta.env.VITE_FILE_URL}/${path}` : null);
export default api;