// Connectivity Service — equivalent to Flutter's networking bloc + global_banner_controller
// Monitors network state and exposes reactive connectivity status

import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { store } from '../store';
import {
    setConnected,
    setDisconnected,
    showBanner,
} from '../store/slices/networkSlice';

class ConnectivityService {
    private unsubscribe: (() => void) | null = null;

    // ─── Start Monitoring ─────────────────────────────────────────
    startMonitoring(): void {
        this.unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
            if (state.isConnected) {
                store.dispatch(setConnected());
            } else if (state.isConnected === false) {
                store.dispatch(setDisconnected());
            }
        });
    }

    // ─── Stop Monitoring ──────────────────────────────────────────
    stopMonitoring(): void {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
    }

    // ─── Check Current State ──────────────────────────────────────
    async isConnected(): Promise<boolean> {
        const state = await NetInfo.fetch();
        return state.isConnected ?? false;
    }

    // ─── Show Banner ──────────────────────────────────────────────
    showNoInternetBanner(): void {
        store.dispatch(showBanner());
        store.dispatch(setDisconnected());
    }
}

export const connectivityService = new ConnectivityService();
