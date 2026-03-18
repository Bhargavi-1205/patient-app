// Notifications Slice — equivalent to Flutter's notifications_bloc.dart
// Handles SSE-based real-time notifications with mark-read and clear-all

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
    notificationService,
    SSENotification,
} from '../../services/notificationService';
import { tokenHelper } from '../../services/tokenHelper';

// ─── Types ──────────────────────────────────────────────────────
export interface AppNotification {
    id: string;
    message: string;
    read: boolean;
    payload: Record<string, any>;
}

export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting';

interface NotificationsState {
    notifications: AppNotification[];
    unreadCount: number;
    connectionStatus: ConnectionStatus;
    error: string | null;
}

const initialState: NotificationsState = {
    notifications: [],
    unreadCount: 0,
    connectionStatus: 'disconnected',
    error: null,
};

// ─── Async Thunks ───────────────────────────────────────────────

/**
 * Start listening for SSE notifications.
 * Retrieves mobile from storage and connects.
 */
export const startListeningNotifications = createAsyncThunk(
    'notifications/startListening',
    async (_, { dispatch }) => {
        const mobile = await tokenHelper.getMobile();
        if (!mobile) {
            throw new Error('No mobile number found');
        }

        dispatch(setConnectionStatus('connecting'));

        // Set up notification listener
        notificationService.setNotificationListener((sseNotif: SSENotification) => {
            dispatch(receiveNotification(sseNotif));
        });

        // Set up connection status listener
        notificationService.setConnectionListener((connected: boolean) => {
            dispatch(setConnectionStatus(connected ? 'connected' : 'disconnected'));
        });

        // Connect to SSE
        await notificationService.connect(mobile);
        return mobile;
    },
);

/**
 * Mark all notifications as read via API
 */
export const markAllAsRead = createAsyncThunk(
    'notifications/markAllAsRead',
    async (_, { dispatch }) => {
        const mobile = await tokenHelper.getMobile();
        if (!mobile) return false;

        const success = await notificationService.markAllAsRead(mobile);
        return success;
    },
);

/**
 * Clear all notifications via API
 */
export const clearAllNotifications = createAsyncThunk(
    'notifications/clearAll',
    async (_, { dispatch }) => {
        const mobile = await tokenHelper.getMobile();
        if (!mobile) return false;

        // Clear UI immediately
        dispatch(clearNotificationsLocal());

        // Call API in background
        const success = await notificationService.clearAll(mobile);
        return success;
    },
);

/**
 * Manual reconnect
 */
export const reconnectNotifications = createAsyncThunk(
    'notifications/reconnect',
    async (_, { dispatch }) => {
        dispatch(setConnectionStatus('connecting'));
        await notificationService.reconnect();
    },
);

// ─── Slice ──────────────────────────────────────────────────────
const notificationsSlice = createSlice({
    name: 'notifications',
    initialState,
    reducers: {
        receiveNotification(state, action: PayloadAction<SSENotification>) {
            const sseNotif = action.payload;

            // Check for duplicates
            const isDuplicate = state.notifications.some(
                (n) => n.id === sseNotif.notificationId,
            );
            if (isDuplicate) return;

            // Add to top of list
            const notification: AppNotification = {
                id: sseNotif.notificationId,
                message:
                    sseNotif.payload?.message || 'New update received',
                read: sseNotif.read,
                payload: sseNotif.payload,
            };
            state.notifications.unshift(notification);

            // Recalculate unread count
            state.unreadCount = state.notifications.filter((n) => !n.read).length;
        },

        setConnectionStatus(state, action: PayloadAction<ConnectionStatus>) {
            state.connectionStatus = action.payload;
        },

        clearNotificationsLocal(state) {
            state.notifications = [];
            state.unreadCount = 0;
        },

        resetUnreadCount(state) {
            state.unreadCount = 0;
        },
    },
    extraReducers: (builder) => {
        // Start Listening
        builder
            .addCase(startListeningNotifications.fulfilled, (state) => {
                state.connectionStatus = 'connected';
                state.error = null;
            })
            .addCase(startListeningNotifications.rejected, (state, action) => {
                state.connectionStatus = 'disconnected';
                state.error = action.error.message || 'Failed to connect';
            });

        // Mark All As Read
        builder.addCase(markAllAsRead.fulfilled, (state, action) => {
            if (action.payload) {
                state.notifications.forEach((n) => {
                    n.read = true;
                });
                state.unreadCount = 0;
            }
        });
    },
});

export const {
    receiveNotification,
    setConnectionStatus,
    clearNotificationsLocal,
    resetUnreadCount,
} = notificationsSlice.actions;
export default notificationsSlice.reducer;
