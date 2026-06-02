import axiosInstance from "./axiosInstance";

export interface ApiResponse<T = any> {
    statusCode: number;
    data: T;
    message: string;
}

export const authApi = {
    login: (data: any): Promise<ApiResponse<any>> => {
        return axiosInstance.post('/auth/login', data);
    },

    register: (data: any): Promise<ApiResponse<boolean>> => {
        return axiosInstance.post('/auth/register', data);
    },

    getInfo: (): Promise<ApiResponse<any>> => {
        return axiosInstance.get('/auth/get-info');
    },

    refreshToken: (): Promise<ApiResponse<any>> => {
        return axiosInstance.post('/auth/refresh-token');
    },
    
    logout: (): Promise<ApiResponse<any>> => {
        return axiosInstance.post('/auth/logout');
    },
}