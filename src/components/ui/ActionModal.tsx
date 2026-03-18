import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TouchableWithoutFeedback,
    Animated,
    Dimensions,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../config/theme';
import FlutterSvgIcon from '../common/FlutterSvgIcon';

interface ActionOption {
    label: string;
    icon: any;
    onPress: () => void;
    isDanger?: boolean;
    color?: string;
}

interface ActionModalProps {
    visible: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    options: ActionOption[];
}

export default function ActionModal({
    visible,
    onClose,
    title,
    subtitle,
    options,
}: ActionModalProps) {
    const [animation] = React.useState(new Animated.Value(0));

    React.useEffect(() => {
        if (visible) {
            Animated.spring(animation, {
                toValue: 1,
                useNativeDriver: true,
                friction: 8,
                tension: 40,
            }).start();
        } else {
            Animated.timing(animation, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start();
        }
    }, [visible]);

    const translateY = animation.interpolate({
        inputRange: [0, 1],
        outputRange: [Dimensions.get('window').height, 0],
    });

    const opacity = animation.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
    });

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={onClose}>
            <View style={styles.overlay}>
                <TouchableWithoutFeedback onPress={onClose}>
                    <Animated.View style={[styles.backdrop, { opacity }]} />
                </TouchableWithoutFeedback>

                <Animated.View style={[styles.content, { transform: [{ translateY }] }]}>
                    <View style={styles.handle} />

                    <View style={styles.header}>
                        <Text style={styles.title}>{title}</Text>
                        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
                    </View>

                    <View style={styles.optionsContainer}>
                        {options.map((option, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.option,
                                    index === options.length - 1 && styles.lastOption,
                                ]}
                                activeOpacity={0.7}
                                onPress={() => {
                                    onClose();
                                    option.onPress();
                                }}>
                                <View
                                    style={[
                                        styles.iconCircle,
                                        { backgroundColor: (option.color || Colors.primaryBlue) + '15' },
                                    ]}>
                                    <FlutterSvgIcon
                                        name={option.icon}
                                        size={20}
                                        color={option.color || (option.isDanger ? Colors.error : Colors.primaryBlue)}
                                    />
                                </View>
                                <Text
                                    style={[
                                        styles.optionLabel,
                                        option.isDanger && { color: Colors.error },
                                    ]}>
                                    {option.label}
                                </Text>
                                <FlutterSvgIcon name="forward" size={16} color={Colors.border} />
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity
                        style={styles.cancelButton}
                        activeOpacity={0.7}
                        onPress={onClose}>
                        <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    content: {
        backgroundColor: Colors.white,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingBottom: 40,
        paddingHorizontal: Spacing.xl,
        ...Shadows.lg,
    },
    handle: {
        width: 40,
        height: 5,
        backgroundColor: Colors.border,
        borderRadius: 3,
        alignSelf: 'center',
        marginTop: 12,
        marginBottom: 24,
    },
    header: {
        marginBottom: 24,
    },
    title: {
        ...Typography.headlineSmall,
        textAlign: 'center',
        marginBottom: 4,
    },
    subtitle: {
        ...Typography.bodyMedium,
        color: Colors.muted,
        textAlign: 'center',
    },
    optionsContainer: {
        backgroundColor: Colors.surfaceSecondary,
        borderRadius: BorderRadius.xl,
        overflow: 'hidden',
        marginBottom: 20,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.divider,
    },
    lastOption: {
        borderBottomWidth: 0,
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    optionLabel: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: Colors.heading,
    },
    cancelButton: {
        paddingVertical: 16,
        borderRadius: BorderRadius.xl,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
        alignItems: 'center',
    },
    cancelText: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.heading,
    },
});
