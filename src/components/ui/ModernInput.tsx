// Modern Input — text input with floating label, focus animation, and icons
import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    TextInput,
    Text,
    StyleSheet,
    Animated,
    ViewStyle,
    TextInputProps,
    TouchableOpacity,
} from 'react-native';
import { Colors, BorderRadius, Spacing, Typography, AnimationDuration } from '../../config/theme';

interface ModernInputProps extends Omit<TextInputProps, 'style'> {
    label?: string;
    error?: string;
    hint?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    onRightIconPress?: () => void;
    containerStyle?: ViewStyle;
    variant?: 'outlined' | 'filled' | 'underline';
    size?: 'sm' | 'md' | 'lg';
}

export default function ModernInput({
    label,
    error,
    hint,
    leftIcon,
    rightIcon,
    onRightIconPress,
    containerStyle,
    variant = 'filled',
    size = 'lg',
    value,
    onFocus,
    onBlur,
    ...textInputProps
}: ModernInputProps) {
    const [isFocused, setIsFocused] = useState(false);
    const borderAnim = useRef(new Animated.Value(0)).current;
    const labelAnim = useRef(new Animated.Value(value ? 1 : 0)).current;

    useEffect(() => {
        Animated.timing(borderAnim, {
            toValue: isFocused ? 1 : 0,
            duration: AnimationDuration.fast,
            useNativeDriver: false,
        }).start();
    }, [isFocused]);

    useEffect(() => {
        if (label) {
            Animated.timing(labelAnim, {
                toValue: isFocused || (value && value.length > 0) ? 1 : 0,
                duration: AnimationDuration.fast,
                useNativeDriver: false,
            }).start();
        }
    }, [isFocused, value, label]);

    const handleFocus = (e: any) => {
        setIsFocused(true);
        onFocus?.(e);
    };

    const handleBlur = (e: any) => {
        setIsFocused(false);
        onBlur?.(e);
    };

    const borderColor = borderAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [
            error ? Colors.error : Colors.border,
            error ? Colors.error : Colors.primaryBlue,
        ],
    });

    const sizeMap = {
        sm: { height: 44, fontSize: 14, paddingH: 12 },
        md: { height: 50, fontSize: 15, paddingH: 14 },
        lg: { height: 56, fontSize: 16, paddingH: 16 },
    };

    const s = sizeMap[size];

    const getContainerStyle = (): ViewStyle => {
        switch (variant) {
            case 'filled':
                return {
                    backgroundColor: isFocused ? Colors.white : Colors.surfaceSecondary,
                    borderRadius: BorderRadius.xl,
                    borderWidth: 1.5,
                };
            case 'outlined':
                return {
                    backgroundColor: Colors.white,
                    borderRadius: BorderRadius.xl,
                    borderWidth: 1.5,
                };
            case 'underline':
                return {
                    backgroundColor: 'transparent',
                    borderRadius: 0,
                    borderBottomWidth: 2,
                    borderWidth: 0,
                };
        }
    };

    return (
        <View style={[styles.wrapper, containerStyle]}>
            <Animated.View
                style={[
                    styles.inputContainer,
                    getContainerStyle(),
                    { height: s.height, borderColor },
                ]}>
                {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
                <TextInput
                    style={[
                        styles.input,
                        {
                            fontSize: s.fontSize,
                            paddingHorizontal: s.paddingH,
                        },
                        leftIcon ? { paddingLeft: 0 } : null,
                        rightIcon ? { paddingRight: 0 } : null,
                    ]}
                    value={value}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    placeholderTextColor={Colors.placeholder}
                    selectionColor={Colors.primaryBlue}
                    {...textInputProps}
                />
                {rightIcon && (
                    <TouchableOpacity
                        style={styles.rightIcon}
                        onPress={onRightIconPress}
                        disabled={!onRightIconPress}>
                        {rightIcon}
                    </TouchableOpacity>
                )}
            </Animated.View>

            {/* Error / Hint */}
            {error ? (
                <Text style={styles.errorText}>{error}</Text>
            ) : hint ? (
                <Text style={styles.hintText}>{hint}</Text>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        marginBottom: Spacing.lg,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        overflow: 'hidden',
        ...{
            shadowColor: '#123B66',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 2,
        },
    },
    input: {
        flex: 1,
        color: Colors.heading,
        fontWeight: '500',
    },
    leftIcon: {
        paddingLeft: 14,
        paddingRight: 4,
    },
    rightIcon: {
        paddingRight: 14,
        paddingLeft: 4,
    },
    errorText: {
        marginTop: 6,
        fontSize: 12,
        color: Colors.error,
        fontWeight: '500',
        paddingLeft: 4,
    },
    hintText: {
        marginTop: 6,
        fontSize: 12,
        color: Colors.muted,
        paddingLeft: 4,
    },
});
