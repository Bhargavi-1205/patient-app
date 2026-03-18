// Glassmorphism Card — a premium frosted-glass style card component
import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { Colors, BorderRadius, Shadows, Spacing, AnimationDuration } from '../../config/theme';

interface GlassCardProps {
    children: React.ReactNode;
    style?: ViewStyle;
    variant?: 'glass' | 'solid' | 'bordered' | 'elevated';
    padding?: 'none' | 'sm' | 'md' | 'lg';
    animated?: boolean;
    delay?: number;
}

export default function GlassCard({
    children,
    style,
    variant = 'solid',
    padding = 'lg',
    animated = false,
    delay = 0,
}: GlassCardProps) {
    const opacityAnim = useRef(new Animated.Value(animated ? 0 : 1)).current;
    const translateAnim = useRef(new Animated.Value(animated ? 20 : 0)).current;

    useEffect(() => {
        if (animated) {
            const timer = setTimeout(() => {
                Animated.parallel([
                    Animated.timing(opacityAnim, {
                        toValue: 1,
                        duration: AnimationDuration.entrance,
                        useNativeDriver: true,
                    }),
                    Animated.spring(translateAnim, {
                        toValue: 0,
                        useNativeDriver: true,
                        friction: 8,
                        tension: 60,
                    }),
                ]).start();
            }, delay);
            return () => clearTimeout(timer);
        }
    }, [animated, delay]);

    const paddingMap = {
        none: 0,
        sm: Spacing.sm,
        md: Spacing.md,
        lg: Spacing.lg,
    };

    const getVariantStyle = (): ViewStyle => {
        switch (variant) {
            case 'glass':
                return {
                    backgroundColor: Colors.glass,
                    borderWidth: 1,
                    borderColor: Colors.glassBorder,
                    ...Shadows.md,
                };
            case 'solid':
                return {
                    backgroundColor: Colors.surface,
                    ...Shadows.md,
                };
            case 'bordered':
                return {
                    backgroundColor: Colors.surface,
                    borderWidth: 1,
                    borderColor: Colors.border,
                };
            case 'elevated':
                return {
                    backgroundColor: Colors.surface,
                    ...Shadows.elevated,
                };
        }
    };

    return (
        <Animated.View
            style={[
                styles.card,
                getVariantStyle(),
                { padding: paddingMap[padding] },
                animated && {
                    opacity: opacityAnim,
                    transform: [{ translateY: translateAnim }],
                },
                style,
            ]}>
            {children}
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: BorderRadius.xl,
        overflow: 'hidden',
        borderCurve: 'continuous',
    },
});
