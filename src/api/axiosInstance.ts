import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { BACKEND_URL } from '../lib/constant';


// Khởi tạo axios instance
const axiosInstance = axios.create({
    baseURL: BACKEND_URL, // Base URL từ tài liệu
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Biến cờ để ngăn chặn gọi refresh token nhiều lần cùng lúc
let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value?: unknown) => void;
    reject: (reason?: unknown) => void;
}> = [];

interface ErrorResponse {
    statusCode?: number;
    status?: string;
    message?: string;
}

const processQueue = (error: unknown, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// Request Interceptor
axiosInstance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // Vì sử dụng Cookie nên không cần set header Authorization thủ công
        return config;
    },
    (error: AxiosError) => {
        return Promise.reject(error);
    }
);

// Response Interceptor
axiosInstance.interceptors.response.use(
    (response) => {
        // Trả về trực tiếp data của response để code API gọn hơn
        return response.data;
    },
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
        const errorData = error.response?.data as ErrorResponse | undefined;
        const isJwtExpired = error.response?.status === 403 && errorData?.message === 'jwt expired';

        if (error.response?.status === 401) {
            localStorage.removeItem('isLoggedIn');
            window.location.href = '/401';
            return Promise.reject(error);
        }

        if (error.response?.status === 404) {
            window.location.href = '/404'; 
            return Promise.reject(error);
        }

        // Chỉ refresh khi backend báo JWT hết hạn; 403 khác là lỗi quyền thật.
        if (error.response?.status === 403 && !isJwtExpired) {
            window.location.href = '/403';
            return Promise.reject(error);
        }

        if (isJwtExpired && !originalRequest._retry) {
            originalRequest._retry = true;

            if (isRefreshing) {
                // Nếu đang refresh, đưa các request khác vào hàng đợi
                return new Promise(function (resolve, reject) {
                    failedQueue.push({ resolve, reject });
                })
                    .then(() => {
                        return axiosInstance(originalRequest);
                    })
                    .catch((err) => {
                        return Promise.reject(err);
                    });
            }

            isRefreshing = true;

            try {
                // Gọi API refresh token (không cần truyền body vì dùng cookie)
                await axios.post(
                    `${BACKEND_URL}/auth/refresh-token`,
                    {},
                    { withCredentials: true }
                );

                processQueue(null);
                // Chạy lại request ban đầu sau khi refresh token thành công
                return axiosInstance(originalRequest);
            } catch (refreshError) {
                console.log("Lỗi refresh token")
                processQueue(refreshError, null);
                // Refresh token cũng hết hạn hoặc lỗi -> Force logout (Vì chỉ có role admin)
                window.location.href = '/403';
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        if (error.response?.status === 403) {
            window.location.href = '/403';
            return Promise.reject(error);
        }

        return Promise.reject(error);

    }
);

export default axiosInstance;
