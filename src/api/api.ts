import axiosInstance from "./axiosInstance";

export interface ApiResponse<T = any> {
    statusCode: number;
    data: T;
    message: string;
}

export class RegisterInput {
    email!: string;
    password!: string;
    fullName!: string;
}

export class LoginInput {
    email!: string;
    password!: string;
}

export const authApi = {
    login: (data: LoginInput): Promise<ApiResponse<any>> => {
        return axiosInstance.post('/auth/login', data);
    },

    register: (data: RegisterInput): Promise<ApiResponse<any>> => {
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