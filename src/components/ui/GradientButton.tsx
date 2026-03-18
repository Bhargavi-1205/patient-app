// Premium Gradient Button — animated CTA button with gradient background simulation
import React, { useRef } from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    Animated,
    ActivityIndicator,
    View,
    ViewStyle,
    TextStyle,
} from 'react-native';
import { Colors, Shadows, BorderRadius, Typography } from '../../config/theme';

interface GradientButtonProps {
    title: string;
    onPress: () => void;
    loading?: boolean;
    disabled?: boolean;
    variant?: 'primary' | 'secondary' | 'outline' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    icon?: React.ReactNode;
    style?: ViewStyle;
    textStyle?: TextStyle;
    fullWidth?: boolean;
}

export default function GradientButton({
    title,
    onPress,
    loading = false,
    disabled = false,
    variant = 'primary',
    size = 'lg',
    icon,
    style,
    textStyle,
    fullWidth = true,
}: GradientButtonProps) {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.97,
            useNativeDriver: true,
            friction: 8,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            friction: 6,
        }).start();
    };

    const isDisabled = disabled || loading;

    const sizeStyles = {
        sm: { height: 40, paddingHorizontal: 20, borderRadius: BorderRadius.lg },
        md: { height: 48, paddingHorizontal: 28, borderRadius: BorderRadius.xl },
        lg: { height: 56, paddingHorizontal: 32, borderRadius: BorderRadius.xxxl },
    };

    const getButtonStyle = () => {
        const base = sizeStyles[size];
        switch (variant) {
            case 'primary':
                return {
                    ...base,
                    backgroundColor: isDisabled ? Colors.disabled : Colors.primaryBlue,
                    ...(!isDisabled ? Shadows.glow : {}),
                };
            case 'secondary':
                return {
                    ...base,
                    backgroundColor: isDisabled ? Colors.surfaceSecondary : Colors.primaryUltraLight,
                };
            case 'outline':
                return {
                    ...base,
                    backgroundColor: 'transparent',
                    borderWidth: 1.5,
                    borderColor: isDisabled ? Colors.disabled : Colors.primaryBlue,
                };
            case 'danger':
                return {
                    ...base,
                    backgroundColor: isDisabled ? Colors.disabled : Colors.error,
                };
        }
    };

    const getTextColor = () => {
        switch (variant) {
            case 'primary':
            case 'danger':
                return Colors.white;
            case 'secondary':
                return Colors.primaryBlue;
            case 'outline':
                return isDisabled ? Colors.disabled : Colors.primaryBlue;
        }
    };

    return (
        <Animated.View
            style={[
                { transform: [{ scale: scaleAnim }] },
                fullWidth && { width: '100%' },
            ]}>
            <TouchableOpacity
                style={[
                    styles.button,
                    getButtonStyle(),
                    fullWidth && { width: '100%' },
                    style,
                ]}
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={isDisabled}
                activeOpacity={0.9}>
                {(variant === 'primary' || variant === 'danger') && !isDisabled ? (
                    <>
                        <View style={styles.topGlow} />
                        <View style={styles.bottomTint} />
                    </>
                ) : null}
                {loading ? (
                    <ActivityIndicator color={getTextColor()} size="small" />
                ) : (
                    <View style={styles.content}>
                        {icon && <View style={styles.iconWrapper}>{icon}</View>}
                        <Text
                            style={[
                                size === 'sm' ? Typography.buttonSmall : Typography.button,
                                { color: getTextColor() },
                                textStyle,
                            ]}>
                            {title}
                        </Text>
                    </View>
                )}
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.18)',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    iconWrapper: {
        marginRight: 4,
    },
    topGlow: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '55%',
        backgroundColor: 'rgba(255,255,255,0.16)',
    },
    bottomTint: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: '50%',
        backgroundColor: 'rgba(0,0,0,0.07)',
    },
});
