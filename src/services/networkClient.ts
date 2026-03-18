// Network Client — equivalent to Flutter's network_client.dart
// Singleton Axios instance with interceptors, token injection, and error handling

import axios, {
    AxiosInstance,
    AxiosResponse,
    AxiosError,
    InternalAxiosRequestConfig,
} from 'axios';
import { ENV } from '../config/env';
import { API_URLS, NETWORK } from '../config/constants';
import { tokenHelper } from './tokenHelper';
import { navigationService } from './navigationService';

// ─── Response Model — equivalent to Flutter's ResponseModel ─────────
export interface ApiResponse<T = any> {
    isSuccess: boolean;
    data: T | null;
    statusCode: number | null;
    statusMessage: string | null;
    rawData: Record<string, any> | null;
}

// ─── Request Methods ────────────────────────────────────────────────
export type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

class NetworkClient {
    private static instance: NetworkClient;
    private client: AxiosInstance;

    private constructor() {
        this.client = axios.create({
            baseURL: ENV.API_BASE_URL,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        this.setupInterceptors();
    }

    private isPublicAuthEndpoint(url?: string): boolean {
        if (!url) {
            return false;
        }

        return (
            url.includes(API_URLS.SEND_OTP) ||
            url.includes(API_URLS.VERIFY_OTP)
        );
    }

    static getInstance(): NetworkClient {
        if (!NetworkClient.instance) {
            NetworkClient.instance = new NetworkClient();
        }
        return NetworkClient.instance;
    }

    // ─── Interceptors ──────────────────────────────────────────────
    private setupInterceptors(): void {
        // Request interceptor — inject auth token
        this.client.interceptors.request.use(
            async (config: InternalAxiosRequestConfig) => {
                if (!this.isPublicAuthEndpoint(config.url)) {
                    const token = await tokenHelper.getAccessToken();

                    if (token) {
                        config.headers['Content-Type'] = 'application/json';
                        config.headers['Authorization'] = `Bearer ${token}`;
                    }
                }

                return config;
            },
            (error: AxiosError) => {
                return Promise.reject(error);
            },
        );

        // Response interceptor — log responses
        this.client.interceptors.response.use(
            (response: AxiosResponse) => {
                return response;
            },
            (error: AxiosError) => {
                return Promise.reject(error);
            },
        );
    }

    private extractErrorMessage(errorData: any): string | null {
        if (!errorData) return null;
        if (typeof errorData === 'string') return errorData;

        const nestedData = errorData?.data;
        if (typeof nestedData === 'string' && nestedData.trim()) {
            return nestedData;
        }
        if (typeof nestedData?.message === 'string' && nestedData.message.trim()) {
            return nestedData.message;
        }
        if (typeof nestedData?.error === 'string' && nestedData.error.trim()) {
            return nestedData.error;
        }

        if (typeof errorData?.message === 'string' && errorData.message.trim()) {
            return errorData.message;
        }
        if (typeof errorData?.error === 'string' && errorData.error.trim()) {
            return errorData.error;
        }
        if (typeof errorData?.statusMessage === 'string' && errorData.statusMessage.trim()) {
            return errorData.statusMessage;
        }
        if (typeof errorData?.detail === 'string' && errorData.detail.trim()) {
            return errorData.detail;
        }
        if (Array.isArray(errorData?.errors) && errorData.errors.length > 0) {
            const firstError = errorData.errors[0];
            if (typeof firstError === 'string') return firstError;
            if (typeof firstError?.message === 'string') return firstError.message;
        }

        return null;
    }

    // ─── Main Request Method ──────────────────────────────────────
    async makeRequest<T>({
        method,
        url,
        data,
        createData,
        parseAsResponseModel = true,
    }: {
        method: RequestMethod;
        url: string;
        data?: any;
        createData: (json: any) => T;
        parseAsResponseModel?: boolean;
    }): Promise<ApiResponse<T>> {
        try {
            // 1. Make request
            let response: AxiosResponse;

            switch (method) {
                case 'GET':
                    response = await this.client.get(url);
                    break;
                case 'POST':
                    response = await this.client.post(url, data);
                    break;
                case 'PUT':
                    response = await this.client.put(url, data);
                    break;
                case 'DELETE':
                    response = await this.client.delete(url, { data });
                    break;
            }

            // 3. Handle success
            if (
                response.status === NETWORK.API_SUCCESS ||
                response.status === NETWORK.API_SUCCESS_2
            ) {
                const responseData = response.data;

                if (!parseAsResponseModel) {
                    return {
                        isSuccess: true,
                        data: createData(responseData),
                        statusCode: response.status,
                        statusMessage: response.statusText,
                        rawData: responseData,
                    };
                }

                const dataField =
                    responseData && responseData[NETWORK.KEYS.DATA] !== undefined
                        ? responseData[NETWORK.KEYS.DATA]
                        : responseData;

                return {
                    isSuccess: true,
                    data: createData(dataField),
                    statusCode: response.status,
                    statusMessage: response.statusText,
                    rawData: responseData,
                };
            }

            // 4. Handle unauthorized
            if (response.status === NETWORK.UNAUTHORIZED) {
                await this.handleSessionExpire();
                return {
                    isSuccess: false,
                    data: null,
                    statusCode: response.status,
                    statusMessage: 'Session expired',
                    rawData: response.data,
                };
            }

            // 5. Handle other errors
            return {
                isSuccess: false,
                data: null,
                statusCode: response.status,
                statusMessage: response.statusText || 'Unknown error',
                rawData: response.data,
            };
        } catch (error) {
            const axiosError = error as AxiosError<any>;
            const responseStatus = axiosError.response?.status ?? null;
            const responseData = axiosError.response?.data ?? null;
            const backendMessage = this.extractErrorMessage(responseData);

            if (axiosError.response?.status === 401) {
                await this.handleSessionExpire();
                return {
                    isSuccess: false,
                    data: null,
                    statusCode: 401,
                    statusMessage: 'Session expired',
                    rawData: axiosError.response?.data,
                };
            }

            if (axiosError.response?.status === 400) {
                const msg =
                    backendMessage ||
                    'Appointment slot is already booked, please select a different time.';
                return {
                    isSuccess: false,
                    data: null,
                    statusCode: 400,
                    statusMessage: msg,
                    rawData: axiosError.response?.data,
                };
            }

            if (axiosError.response?.status === 404) {
                const msg =
                    backendMessage ||
                    'Mobile number not found. Please try again.';
                return {
                    isSuccess: false,
                    data: null,
                    statusCode: 404,
                    statusMessage: msg,
                    rawData: axiosError.response?.data,
                };
            }

            // Network error
            if (!axiosError.response) {
                return {
                    isSuccess: false,
                    data: null,
                    statusCode: NETWORK.CODE_NETWORK_ERROR,
                    statusMessage: 'No internet connection',
                    rawData: null,
                };
            }

            return {
                isSuccess: false,
                data: null,
                statusCode: NETWORK.INTERNAL_SERVER_ERROR,
                statusMessage:
                    backendMessage ||
                    `Request failed (${method} ${url}) with status code ${responseStatus ?? 500}`,
                rawData: axiosError.response?.data,
            };
        }
    }

    // ─── Session Expiry Handler ───────────────────────────────────
    private async handleSessionExpire(): Promise<void> {
        await tokenHelper.clearAllData();
        navigationService.showSessionExpiredAlert();
    }

    // ─── Convenience Methods ──────────────────────────────────────
    async get<T>(
        url: string,
        createData: (json: any) => T,
    ): Promise<ApiResponse<T>> {
        return this.makeRequest({ method: 'GET', url, createData });
    }

    async post<T>(
        url: string,
        data: any,
        createData: (json: any) => T,
    ): Promise<ApiResponse<T>> {
        return this.makeRequest({ method: 'POST', url, data, createData });
    }

    async put<T>(
        url: string,
        data: any,
        createData: (json: any) => T,
    ): Promise<ApiResponse<T>> {
        return this.makeRequest({ method: 'PUT', url, data, createData });
    }

    async del<T>(
        url: string,
        data: any,
        createData: (json: any) => T,
    ): Promise<ApiResponse<T>> {
        return this.makeRequest({ method: 'DELETE', url, data, createData });
    }
}

export const networkClient = NetworkClient.getInstance();
