// Navigation Service — equivalent to Flutter's navigation_service.dart
// Provides imperative navigation from non-component code (services, Redux thunks)

import {
    CommonActions,
    NavigationContainerRef,
    StackActions,
} from '@react-navigation/native';
import { createRef } from 'react';
import { Alert } from 'react-native';
import { ROUTES } from '../config/constants';

class NavigationService {
    navigationRef = createRef<NavigationContainerRef<any>>();

    // ─── Navigate Forward ──────────────────────────────────────────
    navigateTo(routeName: string, params?: object): void {
        (this.navigationRef.current as any)?.navigate(routeName, params);
    }

    // ─── Push (always adds to stack) ──────────────────────────────
    push(routeName: string, params?: object): void {
        this.navigationRef.current?.dispatch(
            StackActions.push(routeName, params),
        );
    }

    // ─── Replace Current Screen ───────────────────────────────────
    replace(routeName: string, params?: object): void {
        this.navigationRef.current?.dispatch(
            StackActions.replace(routeName, params),
        );
    }

    // ─── Reset Stack (clear all and navigate) ─────────────────────
    resetToRoute(routeName: string, params?: object): void {
        this.navigationRef.current?.dispatch(
            CommonActions.reset({
                index: 0,
                routes: [{ name: routeName, params }],
            }),
        );
    }

    // ─── Go Back ──────────────────────────────────────────────────
    goBack(): void {
        if (this.navigationRef.current?.canGoBack()) {
            this.navigationRef.current?.goBack();
        }
    }

    // ─── Pop to Top ───────────────────────────────────────────────
    popToTop(): void {
        this.navigationRef.current?.dispatch(StackActions.popToTop());
    }

    // ─── Session Expired Dialog ───────────────────────────────────
    showSessionExpiredAlert(): void {
        Alert.alert(
            'Session Expired',
            'Your session has expired. Please login again.',
            [
                {
                    text: 'OK',
                    onPress: () => {
                        this.resetToRoute(ROUTES.PHONE_NUMBER);
                    },
                },
            ],
            { cancelable: false },
        );
    }

    // ─── Get Current Route ────────────────────────────────────────
    getCurrentRoute(): string | undefined {
        return this.navigationRef.current?.getCurrentRoute()?.name;
    }
}

export const navigationService = new NavigationService();
