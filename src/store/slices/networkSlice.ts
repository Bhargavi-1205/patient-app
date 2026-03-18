// Network Slice — equivalent to Flutter's networking_bloc.dart
// Manages connectivity state and banner visibility

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type ConnectivityStatus = 'connected' | 'disconnected' | 'unknown';

interface NetworkState {
    status: ConnectivityStatus;
    showBanner: boolean;
}

const initialState: NetworkState = {
    status: 'unknown',
    showBanner: false,
};

const networkSlice = createSlice({
    name: 'network',
    initialState,
    reducers: {
        setConnected(state) {
            state.status = 'connected';
            state.showBanner = false;
        },
        setDisconnected(state) {
            state.status = 'disconnected';
            // We no longer automatically show the banner here.
            // It will be shown if a network request actually fails.
        },
        showBanner(state) {
            state.showBanner = true;
        },
        hideBanner(state) {
            state.showBanner = false;
        },
    },
});

export const { setConnected, setDisconnected, showBanner, hideBanner } =
    networkSlice.actions;
export default networkSlice.reducer;
