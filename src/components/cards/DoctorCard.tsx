// Doctor Card — Modern Premium Design
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../config/theme';
import { ROUTES } from '../../config/constants';
import { Doctor } from '../../store/slices/doctorsSlice';
import { FLUTTER_PLACEHOLDER_IMAGES } from '../../config/flutterAssets';
import FlutterSvgIcon from '../common/FlutterSvgIcon';

interface DoctorCardProps {
    doctor: Doctor;
    navigation: any;
    onBookPress?: () => void;
}

export default function DoctorCard({ doctor, navigation, onBookPress }: DoctorCardProps) {
    return (
        <TouchableOpacity
            style={styles.card}
            activeOpacity={0.75}
            onPress={() =>
                navigation.navigate(ROUTES.DOCTOR_DETAILS, { doctorId: doctor.id })
            }>
            {/* Avatar */}
            <View style={styles.avatarContainer}>
                {doctor.profileImage ? (
                    <Image source={{ uri: doctor.profileImage }} style={styles.avatar} />
                ) : (
                    <Image source={FLUTTER_PLACEHOLDER_IMAGES.thumbnail} style={styles.avatar} />
                )}
                {/* Online dot */}
                <View style={styles.onlineDot} />
            </View>

            {/* Content */}
            <View style={styles.content}>
                <Text style={styles.name} numberOfLines={1}>
                    Dr. {doctor.name}
                </Text>
                <View style={styles.qualRow}>
                    <FlutterSvgIcon name="degree" size={12} />
                    <Text style={styles.qualification} numberOfLines={1}>
                        {(doctor.qualification || doctor.specialization || '').toUpperCase()}
                    </Text>
                </View>
                <View style={styles.clinicRow}>
                    <FlutterSvgIcon name="hospital" size={13} color={Colors.muted} />
                    <Text style={styles.clinicName} numberOfLines={1}>
                        {doctor.clinicName}
                    </Text>
                </View>
            </View>

            {/* Book Button */}
            <TouchableOpacity
                style={styles.bookButton}
                onPress={onBookPress}
                activeOpacity={0.7}>
                <Ionicons name="calendar-outline" size={16} color={Colors.white} />
                <Text style={styles.bookText}>Book</Text>
            </TouchableOpacity>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
        marginBottom: Spacing.md,
        alignItems: 'flex-start',
        borderWidth: 1,
        borderColor: Colors.borderLight,
        ...Shadows.sm,
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 14,
    },
    avatar: {
        width: 52,
        height: 52,
        borderRadius: 16,
    },
    onlineDot: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: Colors.success,
        borderWidth: 2,
        borderColor: Colors.surface,
    },
    content: {
        flex: 1,
        minWidth: 0,
        paddingRight: Spacing.sm,
    },
    name: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.heading,
        marginBottom: 3,
    },
    qualRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 3,
    },
    qualification: {
        fontSize: 11,
        color: Colors.primaryBlue,
        fontWeight: '600',
        flexShrink: 1,
    },
    clinicRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    clinicName: {
        fontSize: 12,
        color: Colors.muted,
        flexShrink: 1,
    },
    bookButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
        backgroundColor: Colors.primaryBlue,
        minHeight: 40,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: BorderRadius.lg,
        alignSelf: 'center',
    },
    bookText: {
        color: Colors.white,
        fontSize: 13,
        fontWeight: '600',
    },
});
