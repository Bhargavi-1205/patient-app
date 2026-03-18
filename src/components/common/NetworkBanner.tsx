// Network Banner — Modern overlay for connectivity status
import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { useAppSelector } from '../../store';
import { Colors, Spacing, BorderRadius, Shadows } from '../../config/theme';
import FlutterSvgIcon from './FlutterSvgIcon';

export default function NetworkBanner() {
    const { showBanner } = useAppSelector((state) => state.network);
    const translateY = useRef(new Animated.Value(-100)).current;

    const show = showBanner;

    useEffect(() => {
        Animated.spring(translateY, {
            toValue: show ? 0 : -100,
            useNativeDriver: true,
            friction: 8,
        }).start();
    }, [show]);


    return (
        <Animated.View
            style={[
                styles.container,
                { transform: [{ translateY }] },
            ]}>
            <View style={styles.banner}>
                <View style={styles.iconCircle}>
                    <FlutterSvgIcon name="false" size={18} color="#EF4444" />
                </View>
                <View style={styles.textContainer}>
                    <Text style={styles.title}>No Internet Connection</Text>
                    <Text style={styles.subtitle}>Check your connection and try again</Text>
                </View>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 50 : 30,
        left: Spacing.lg,
        right: Spacing.lg,
        zIndex: 999,
    },
    banner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF5F5',
        borderRadius: BorderRadius.xxl,
        padding: 15,
        borderWidth: 1,
        borderColor: '#FBD3D3',
        ...Shadows.elevated,
    },
    iconCircle: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: '#FFE9E9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: 14,
        fontWeight: '700',
        color: '#AF1A1A',
    },
    subtitle: {
        fontSize: 12,
        color: '#D13A3A',
        marginTop: 1,
    },
});
