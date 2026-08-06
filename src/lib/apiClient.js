import axios from 'axios';

// Create a centralized axios instance
export const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// Response interceptor for unified error handling
apiClient.interceptors.response.use(
  (response) => {
    // Return data directly if successful
    return response.data;
  },
  (error) => {
    // Format error message
    const customError = new Error();
    customError.status = error.response?.status || 500;
    
    if (error.response?.data?.error) {
      customError.message = error.response.data.error;
      customError.details = error.response.data.details;
    } else if (error.message) {
      customError.message = error.message;
    } else {
      customError.message = 'An unexpected error occurred.';
    }

    // You could also hook into Zustand here to show a global error toast
    console.error('[API Client Error]', customError);
    return Promise.reject(customError);
  }
);
