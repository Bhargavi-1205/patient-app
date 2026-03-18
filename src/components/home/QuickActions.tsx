// Quick Actions — Modern home screen quick action buttons
import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../config/theme';
import { ROUTES } from '../../config/constants';
import FlutterSvgIcon from '../common/FlutterSvgIcon';

interface QuickActionsProps {
    navigation: any;
}

type QuickAction = {
    icon: React.ComponentProps<typeof FlutterSvgIcon>['name'];
    label: string;
    route: string;
    color: string;
    bgColor: string;
};

const actions: QuickAction[] = [
    {
        icon: 'calendar',
        label: 'Book\nAppointment',
        route: ROUTES.APPOINTMENT_BOOKING,
        color: '#4A90E2',
        bgColor: '#EFF6FF',
    },
    {
        icon: 'doctorMale',
        label: 'My\nDoctors',
        route: ROUTES.MY_DOCTORS,
        color: '#10B981',
        bgColor: '#ECFDF5',
    },
    {
        icon: 'medical',
        label: 'Prescriptions',
        route: ROUTES.PRESCRIPTIONS,
        color: '#F59E0B',
        bgColor: '#FFFBEB',
    },
    {
        icon: 'reports',
        label: 'History',
        route: ROUTES.APPOINTMENT_HISTORY,
        color: '#8B5CF6',
        bgColor: '#F5F3FF',
    },
];

export default function QuickActions({ navigation }: QuickActionsProps) {
    const scaleAnims = useRef(actions.map(() => new Animated.Value(0))).current;

    useEffect(() => {
        scaleAnims.forEach((anim, index) => {
            setTimeout(() => {
                Animated.spring(anim, {
                    toValue: 1,
                    useNativeDriver: true,
                    friction: 6,
                    tension: 80,
                }).start();
            }, index * 80);
        });
    }, []);

    const handlePress = (index: number, route: string) => {
        // Quick bounce feedback
        Animated.sequence([
            Animated.timing(scaleAnims[index], {
                toValue: 0.9,
                duration: 80,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnims[index], {
                toValue: 1,
                useNativeDriver: true,
                friction: 4,
            }),
        ]).start();
        navigation.navigate(route);
    };

    return (
        <View style={styles.container}>
            {actions.map((action, index) => (
                <Animated.View
                    key={index}
                    style={{
                        transform: [{ scale: scaleAnims[index] }],
                        opacity: scaleAnims[index],
                    }}>
                    <TouchableOpacity
                        style={styles.actionButton}
                        activeOpacity={0.8}
                        onPress={() => handlePress(index, action.route)}>
                        <View style={[styles.iconCircle, { backgroundColor: action.bgColor }]}>
                            <FlutterSvgIcon name={action.icon} size={24} />
                        </View>
                        <Text style={styles.label}>{action.label}</Text>
                    </TouchableOpacity>
                </Animated.View>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: Spacing.xxl,
        paddingHorizontal: 4,
    },
    actionButton: {
        alignItems: 'center',
        width: 72,
    },
    iconCircle: {
        width: 56,
        height: 56,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        ...Shadows.sm,
    },
    label: {
        fontSize: 11,
        textAlign: 'center',
        color: Colors.body,
        fontWeight: '600',
        lineHeight: 15,
    },
});
