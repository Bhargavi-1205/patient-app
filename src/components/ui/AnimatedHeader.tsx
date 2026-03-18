// Animated Header — curved gradient-style header with pattern overlay
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Spacing } from '../../config/theme';

interface AnimatedHeaderProps {
    children: React.ReactNode;
    height?: number;
    backgroundColor?: string;
    style?: ViewStyle;
}

export default function AnimatedHeader({
    children,
    height = 220,
    backgroundColor = Colors.primaryBlue,
    style,
}: AnimatedHeaderProps) {
    return (
        <View style={[styles.container, { height }, style]}>
            {/* Base gradient simulation via layers */}
            <View style={[styles.baseLayer, { backgroundColor }]} />
            <View style={[styles.overlayLayer, { backgroundColor: 'rgba(38, 160, 252, 0.38)' }]} />
            <View style={styles.overlayTint} />

            {/* Decorative circles */}
            <View style={[styles.circle, styles.circleTopRight]} />
            <View style={[styles.circle, styles.circleBottomLeft]} />
            <View style={[styles.circleSmall, styles.circleSmallRight]} />

            {/* Bottom curve */}
            <View style={styles.curveWrapper}>
                <View style={styles.curve} />
            </View>

            {/* Content */}
            <View style={styles.content}>
                {children}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        overflow: 'hidden',
    },
    baseLayer: {
        ...StyleSheet.absoluteFillObject,
    },
    overlayLayer: {
        ...StyleSheet.absoluteFillObject,
    },
    overlayTint: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 184, 169, 0.16)',
    },
    circle: {
        position: 'absolute',
        width: 220,
        height: 220,
        borderRadius: 110,
        backgroundColor: 'rgba(255, 255, 255, 0.10)',
    },
    circleTopRight: {
        top: -70,
        right: -46,
    },
    circleBottomLeft: {
        bottom: -90,
        left: -70,
    },
    circleSmall: {
        position: 'absolute',
        width: 92,
        height: 92,
        borderRadius: 46,
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
    },
    circleSmallRight: {
        top: 56,
        right: 88,
    },
    curveWrapper: {
        position: 'absolute',
        bottom: -1,
        left: 0,
        right: 0,
        height: 30,
        overflow: 'hidden',
    },
    curve: {
        width: '100%',
        height: 60,
        backgroundColor: Colors.background,
        borderTopLeftRadius: 34,
        borderTopRightRadius: 34,
    },
    content: {
        flex: 1,
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.lg,
        zIndex: 1,
    },
});
