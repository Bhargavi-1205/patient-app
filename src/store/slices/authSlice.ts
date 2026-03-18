// Auth Slice — equivalent to Flutter's sendotp_bloc.dart + verify_otp_bloc.dart
// Manages authentication flow: phone → OTP → token storage

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { networkClient } from '../../services/networkClient';
import { tokenHelper } from '../../services/tokenHelper';
import { API_URLS } from '../../config/constants';

// ─── Types ──────────────────────────────────────────────────────
interface AuthState {
    // Phone step
    phoneNumber: string;
    sendOtpLoading: boolean;
    sendOtpError: string | null;
    otpSent: boolean;

    // OTP verification step
    verifyOtpLoading: boolean;
    verifyOtpError: string | null;
    isAuthenticated: boolean;

    // Session
    isCheckingAuth: boolean;
}

const initialState: AuthState = {
    phoneNumber: '',
    sendOtpLoading: false,
    sendOtpError: null,
    otpSent: false,

    verifyOtpLoading: false,
    verifyOtpError: null,
    isAuthenticated: false,

    isCheckingAuth: true,
};

// ─── Async Thunks ───────────────────────────────────────────────

// Check initial auth state
export const checkAuth = createAsyncThunk('auth/checkAuth', async () => {
    const isValid = await tokenHelper.checkTokenValidity();
    return isValid;
});

// Send OTP
export const sendOtp = createAsyncThunk(
    'auth/sendOtp',
    async (phoneNumber: string, { rejectWithValue }) => {
        const response = await networkClient.post(
            API_URLS.SEND_OTP,
            { mobile: phoneNumber },
            (json: any) => json,
        );

        if (!response.isSuccess) {
            return rejectWithValue(response.statusMessage || 'Failed to send OTP');
        }

        return { phoneNumber, data: response.data };
    },
);

// Verify OTP
export const verifyOtp = createAsyncThunk(
    'auth/verifyOtp',
    async (
        { phoneNumber, otp }: { phoneNumber: string; otp: string },
        { rejectWithValue },
    ) => {
        const response = await networkClient.post(
            API_URLS.VERIFY_OTP,
            { mobile: phoneNumber, otp },
            (json: any) => json,
        );

        if (!response.isSuccess) {
            return rejectWithValue(response.statusMessage || 'OTP verification failed');
        }

        const rawData = response.rawData;
        const res = rawData?.res;
        const tokenData = res?.token;
        const patientId = res?.primary_patient?._id;

        // Save tokens
        if (tokenData?.access && tokenData?.refresh) {
            await tokenHelper.saveTokens(tokenData.access, tokenData.refresh);
        } else {
            return rejectWithValue('Invalid token data received from server');
        }

        // Save patient info
        if (patientId) {
            await tokenHelper.savePatientInfo(
                patientId,
                res?.primary_patient?.file_key || '',
            );
        } else {
            return rejectWithValue('Patient information not found in response');
        }

        // Save mobile
        await tokenHelper.saveMobile(phoneNumber);

        return res;
    },
);

// Logout
export const logout = createAsyncThunk('auth/logout', async () => {
    await tokenHelper.clearAllData();
});

// ─── Slice ──────────────────────────────────────────────────────
const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setPhoneNumber(state, action) {
            state.phoneNumber = action.payload;
        },
        resetOtpState(state) {
            state.sendOtpError = null;
            state.verifyOtpError = null;
            state.otpSent = false;
        },
        clearErrors(state) {
            state.sendOtpError = null;
            state.verifyOtpError = null;
        },
    },
    extraReducers: (builder) => {
        // Check Auth
        builder
            .addCase(checkAuth.pending, (state) => {
                state.isCheckingAuth = true;
            })
            .addCase(checkAuth.fulfilled, (state, action) => {
                state.isCheckingAuth = false;
                state.isAuthenticated = action.payload;
            })
            .addCase(checkAuth.rejected, (state) => {
                state.isCheckingAuth = false;
                state.isAuthenticated = false;
            });

        // Send OTP
        builder
            .addCase(sendOtp.pending, (state) => {
                state.sendOtpLoading = true;
                state.sendOtpError = null;
            })
            .addCase(sendOtp.fulfilled, (state, action) => {
                state.sendOtpLoading = false;
                state.otpSent = true;
                state.phoneNumber = action.payload.phoneNumber;
            })
            .addCase(sendOtp.rejected, (state, action) => {
                state.sendOtpLoading = false;
                state.sendOtpError = action.payload as string;
            });

        // Verify OTP
        builder
            .addCase(verifyOtp.pending, (state) => {
                state.verifyOtpLoading = true;
                state.verifyOtpError = null;
            })
            .addCase(verifyOtp.fulfilled, (state) => {
                state.verifyOtpLoading = false;
                state.isAuthenticated = true;
            })
            .addCase(verifyOtp.rejected, (state, action) => {
                state.verifyOtpLoading = false;
                state.verifyOtpError = action.payload as string;
            });

        // Logout
        builder.addCase(logout.fulfilled, (state) => {
            state.isAuthenticated = false;
            state.phoneNumber = '';
            state.otpSent = false;
        });
    },
});

export const { setPhoneNumber, resetOtpState, clearErrors } = authSlice.actions;
export default authSlice.reducer;
