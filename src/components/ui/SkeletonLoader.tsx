// Skeleton Loader — shimmer loading placeholder for premium UX
import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { Colors, BorderRadius } from '../../config/theme';

interface SkeletonLoaderProps {
    width?: number | string;
    height?: number;
    borderRadius?: number;
    style?: ViewStyle;
}

export default function SkeletonLoader({
    width = '100%',
    height = 16,
    borderRadius = BorderRadius.md,
    style,
}: SkeletonLoaderProps) {
    const shimmerAnim = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(shimmerAnim, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(shimmerAnim, {
                    toValue: 0.3,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ]),
        );
        animation.start();
        return () => animation.stop();
    }, []);

    return (
        <Animated.View
            style={[
                styles.skeleton,
                {
                    width: width as any,
                    height,
                    borderRadius,
                    opacity: shimmerAnim,
                },
                style,
            ]}
        />
    );
}

// Pre-built skeleton patterns
export function SkeletonCard() {
    return (
        <View style={styles.card}>
            <View style={styles.cardRow}>
                <SkeletonLoader width={48} height={48} borderRadius={24} />
                <View style={styles.cardTextBlock}>
                    <SkeletonLoader width="70%" height={14} />
                    <SkeletonLoader width="50%" height={12} style={{ marginTop: 8 }} />
                </View>
            </View>
            <SkeletonLoader height={12} style={{ marginTop: 16 }} />
            <SkeletonLoader width="80%" height={12} style={{ marginTop: 8 }} />
        </View>
    );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
    return (
        <View>
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonCard key={i} />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    skeleton: {
        backgroundColor: Colors.surfaceSecondary,
    },
    card: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.xl,
        padding: 16,
        marginBottom: 12,
    },
    cardRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardTextBlock: {
        flex: 1,
        marginLeft: 12,
    },
});
