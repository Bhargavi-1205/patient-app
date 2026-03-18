// Token Helper — equivalent to Flutter's token_helper.dart
// Manages JWT tokens, patient info, and session state

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';
import { STORAGE_KEYS } from '../config/constants';

interface JWTPayload {
    exp: number;
    iat: number;
    sub: string;
    [key: string]: any;
}

interface PersistedLocation {
    latitude: number;
    longitude: number;
    address?: string;
}

class TokenHelper {
    // ─── Token Validity Check ───────────────────────────────────────
    async checkTokenValidity(): Promise<boolean> {
        try {
            // 1. Check for fresh install
            const firstRunCompleted = await AsyncStorage.getItem(
                STORAGE_KEYS.FIRST_RUN,
            );
            if (firstRunCompleted === null) {
                await this.clearAllData();
                await AsyncStorage.setItem(STORAGE_KEYS.FIRST_RUN, 'false');
                return false;
            }

            // 2. Check token validity
            const accessToken = await this.getAccessToken();

            if (!accessToken) {
                return false;
            }

            if (!this.isValidJWTFormat(accessToken)) {
                await this.clearAllData();
                return false;
            }

            if (this.isTokenExpired(accessToken)) {
                await this.clearAllData();
                return false;
            }

            return true;
        } catch {
            await this.clearAllData();
            return false;
        }
    }

    // ─── JWT Validation ─────────────────────────────────────────────
    private isValidJWTFormat(token: string): boolean {
        try {
            const parts = token.split('.');
            if (parts.length !== 3) return false;
            jwtDecode<JWTPayload>(token);
            return true;
        } catch {
            return false;
        }
    }

    private isTokenExpired(token: string): boolean {
        try {
            const decoded = jwtDecode<JWTPayload>(token);
            const currentTime = Date.now() / 1000;
            return decoded.exp < currentTime;
        } catch {
            return true;
        }
    }

    // ─── Token Storage (Secure - expo-secure-store) ─────────────────
    async saveTokens(accessToken: string, refreshToken: string): Promise<void> {
        if (!this.isValidJWTFormat(accessToken)) {
            throw new Error('Invalid access token format');
        }

        // Mark first run as completed
        await AsyncStorage.setItem(STORAGE_KEYS.FIRST_RUN, 'true');

        // Save tokens in secure storage.
        await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
        await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    }

    async getAccessToken(): Promise<string | null> {
        try {
            return await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
        } catch {
            return null;
        }
    }

    async getRefreshToken(): Promise<string | null> {
        try {
            return await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
        } catch {
            return null;
        }
    }

    // ─── Patient Info (AsyncStorage) ────────────────────────────────
    async savePatientInfo(patientId: string, fileKey: string): Promise<void> {
        await AsyncStorage.setItem(STORAGE_KEYS.PATIENT_ID, patientId);
        await AsyncStorage.setItem(STORAGE_KEYS.FILE_KEY, fileKey);
    }

    async getPatientId(): Promise<string | null> {
        return AsyncStorage.getItem(STORAGE_KEYS.PATIENT_ID);
    }

    async getFileKey(): Promise<string | null> {
        return AsyncStorage.getItem(STORAGE_KEYS.FILE_KEY);
    }

    async saveMobile(mobile: string): Promise<void> {
        await AsyncStorage.setItem(STORAGE_KEYS.MOBILE, mobile);
    }

    async getMobile(): Promise<string | null> {
        return AsyncStorage.getItem(STORAGE_KEYS.MOBILE);
    }

    // ─── Selected Location (AsyncStorage) ───────────────────────────
    async saveSelectedLocation(location: PersistedLocation): Promise<void> {
        await AsyncStorage.setItem(
            STORAGE_KEYS.SELECTED_LOCATION,
            JSON.stringify(location),
        );
    }

    async getSelectedLocation(): Promise<PersistedLocation | null> {
        try {
            const rawValue = await AsyncStorage.getItem(STORAGE_KEYS.SELECTED_LOCATION);
            if (!rawValue) {
                return null;
            }

            const parsedValue = JSON.parse(rawValue) as {
                latitude?: number;
                longitude?: number;
                address?: string;
                name?: string;
            };

            if (
                typeof parsedValue.latitude !== 'number' ||
                typeof parsedValue.longitude !== 'number'
            ) {
                return null;
            }

            // Backward compatibility with older payload where `name` was used.
            const normalizedAddress =
                typeof parsedValue.address === 'string'
                    ? parsedValue.address
                    : typeof parsedValue.name === 'string'
                        ? parsedValue.name
                        : undefined;

            return {
                latitude: parsedValue.latitude,
                longitude: parsedValue.longitude,
                address: normalizedAddress,
            };
        } catch {
            return null;
        }
    }

    async clearSelectedLocation(): Promise<void> {
        await AsyncStorage.removeItem(STORAGE_KEYS.SELECTED_LOCATION);
    }

    // ─── Clear All Data (Logout) ────────────────────────────────────
    async clearAllData(): Promise<void> {
        try {
            // 1. Clear AsyncStorage items individually
            await AsyncStorage.removeItem(STORAGE_KEYS.PATIENT_ID);
            await AsyncStorage.removeItem(STORAGE_KEYS.FILE_KEY);
            await AsyncStorage.removeItem(STORAGE_KEYS.MOBILE);
            await AsyncStorage.removeItem(STORAGE_KEYS.SELECTED_LOCATION);

            // 2. Clear secure tokens
            await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
            await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
        } catch {
            // Silently handle cleanup errors
        }
    }

    // ─── Auth Headers ──────────────────────────────────────────────
    async getAuthHeaders(): Promise<Record<string, string>> {
        const token = await this.getAccessToken();
        return {
            'Content-Type': 'application/json',
            Authorization: token ? `Bearer ${token}` : '',
        };
    }
}

export const tokenHelper = new TokenHelper();
