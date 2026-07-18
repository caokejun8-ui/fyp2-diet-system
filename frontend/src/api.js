import axios from 'axios';

// A single axios instance shared by every page.
// baseURL means you only write '/weight/add' instead of the full
// 'http://localhost:5000/api/weight/add' everywhere.
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// This runs before every request. It grabs the token saved at login
// and attaches it as an Authorization header automatically, so you
// don't have to remember to add it in every single page.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If the backend ever says the token is missing/expired (401/403),
// send the user back to the login page automatically.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
