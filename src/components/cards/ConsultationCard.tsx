// Consultation Card — Modern Premium Design
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../config/theme';
import { ROUTES } from '../../config/constants';
import FlutterSvgIcon from '../common/FlutterSvgIcon';
import { FLUTTER_PLACEHOLDER_IMAGES } from '../../config/flutterAssets';
import ActionModal from '../ui/ActionModal';
import { cancelAppointment } from '../../store/slices/appointmentsSlice';
import { useAppDispatch } from '../../store';

interface ConsultationCardProps {
    consultation: {
        id: string;
        doctorId: string;
        doctorName: string;
        specialization?: string;
        date: string;
        diagnosis?: string;
        status: string;
        clinicId?: string;
        patientId?: string;
        [key: string]: any;
    };
    navigation: any;
    onPress?: (consultation: ConsultationCardProps['consultation']) => void;
    showLastVisitedLabel?: boolean;
}

const getStatusConfig = (status: string) => {
    switch (status?.toLowerCase()) {
        case 'completed':
            return { color: '#10B981', bg: '#ECFDF5', icon: 'verified' };
        case 'upcoming':
            return { color: '#4A90E2', bg: '#EFF6FF', icon: 'calendar' };
        case 'cancelled':
            return { color: '#EF4444', bg: '#FEF2F2', icon: 'false' };
        case 'in_progress':
            return { color: '#F59E0B', bg: '#FFFBEB', icon: 'time' };
        default:
            return { color: '#64748B', bg: '#F1F5F9', icon: 'more' };
    }
};

const formatVisitDate = (dateValue?: string) => {
    if (!dateValue) return 'N/A';
    const parsed = Date.parse(dateValue);
    if (!Number.isNaN(parsed)) {
        return new Date(parsed).toLocaleDateString('en-GB');
    }

    const monthDayYear = dateValue.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
    if (monthDayYear) {
        const [, month, day, year] = monthDayYear;
        return `${day.padStart(2, '0')}-${month.padStart(2, '0')}-${year}`;
    }

    return dateValue;
};

export default function ConsultationCard({
    consultation,
    navigation,
    onPress,
    showLastVisitedLabel = false,
}: ConsultationCardProps) {
    const dispatch = useAppDispatch();
    const [showActions, setShowActions] = React.useState(false);
    const statusConfig = getStatusConfig(consultation.status);

    const isUpcoming = consultation.status?.toLowerCase() === 'upcoming';

    const handlePress = () => {
        if (onPress) {
            onPress(consultation);
            return;
        }

        if (isUpcoming) {
            setShowActions(true);
        } else if (consultation.status?.toLowerCase() === 'completed') {
            // Navigate to PDF viewer for completed consultations
            navigation.navigate(ROUTES.PDF_VIEWER, {
                consultationId: consultation.consultationId || consultation.id,
                pdfUrl: consultation.consultationPdfLink,
                clinicId: consultation.clinicId,
                patientId: consultation.patientId,
                fileKey: consultation.fileKey,
                prescription: {
                    doctorName: consultation.doctorName || 'N/A',
                },
            });
        }
        // Cancelled or other statuses: do nothing
    };

    const handleCancel = () => {
        Alert.alert(
            'Cancel Appointment',
            'Are you sure you want to cancel this appointment?',
            [
                { text: 'No', style: 'cancel' },
                {
                    text: 'Yes, Cancel',
                    style: 'destructive',
                    onPress: () => {
                        const clinicId = consultation.clinicId || consultation.clinic_id || '';
                        const doctorId = consultation.doctorId || consultation.doctor_id || '';
                        const appointmentId = consultation.id || consultation.consultationId || '';

                        if (!clinicId || !doctorId || !appointmentId) {
                            Alert.alert(
                                'Unable to cancel',
                                'Missing appointment details. Please refresh and try again.',
                            );
                            return;
                        }

                        dispatch(
                            cancelAppointment({
                                clinicId,
                                doctorId,
                                appointmentId,
                            }),
                        );
                    },
                },
            ],
        );
    };

    const handleReschedule = () => {
        // Navigate to BookingFlowScreen with reschedule intent (matches Flutter)
        navigation.navigate(ROUTES.BOOKING_FLOW, {
            appointmentId: consultation.id,
            consultationId: consultation.id,
            doctorName: consultation.doctorName,
            doctorId: consultation.doctorId,
            clinicId: consultation.clinicId,
            patientId: consultation.patientId,
            reasonToVisit: 'Reschedule',
        });
    };

    const modalOptions = [
        {
            label: 'Reschedule',
            icon: 'calendar',
            onPress: handleReschedule,
            color: Colors.warning,
        },
        {
            label: 'Cancel Appointment',
            icon: 'false',
            onPress: handleCancel,
            isDanger: true,
            color: Colors.error,
        },
    ];

    return (
        <>
            <TouchableOpacity
                style={styles.card}
                activeOpacity={0.75}
                onPress={handlePress}>
                {/* Left accent line */}
                <View style={[styles.accentLine, { backgroundColor: statusConfig.color }]} />

                <View style={styles.cardInner}>
                    {/* Top section */}
                    <View style={styles.topRow}>
                        {/* Doctor avatar */}
                        <View style={styles.avatarContainer}>
                            <Image
                                source={FLUTTER_PLACEHOLDER_IMAGES.thumbnail}
                                style={styles.avatar}
                            />
                        </View>

                        <View style={styles.infoSection}>
                            <Text style={styles.doctorName} numberOfLines={1}>
                                {consultation.doctorName}
                            </Text>
                            {consultation.specialization && (
                                <Text style={styles.specialization}>{consultation.specialization}</Text>
                            )}
                        </View>

                        {/* Status badge */}
                        <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
                            <FlutterSvgIcon name={statusConfig.icon as any} size={12} color={statusConfig.color} />
                            <Text style={[styles.statusText, { color: statusConfig.color }]}>
                                {consultation.status}
                            </Text>
                        </View>
                    </View>

                    {/* Divider */}
                    <View style={styles.divider} />

                    {/* Bottom section */}
                    <View style={styles.bottomRow}>
                        <View style={[styles.metaItem, showLastVisitedLabel && styles.metaItemWide]}>
                            <FlutterSvgIcon name="calendar" size={14} color={Colors.muted} />
                            <Text
                                style={[
                                    styles.metaText,
                                    showLastVisitedLabel && styles.lastVisitedText,
                                ]}>
                                {showLastVisitedLabel
                                    ? `Last Visited On: ${formatVisitDate(consultation.date)}`
                                    : consultation.date}
                            </Text>
                        </View>

                        {!showLastVisitedLabel && consultation.diagnosis && (
                            <View style={styles.metaItem}>
                                <FlutterSvgIcon name="reports" size={14} color={Colors.muted} />
                                <Text style={styles.metaText} numberOfLines={1}>
                                    {consultation.diagnosis}
                                </Text>
                            </View>
                        )}

                        {!showLastVisitedLabel && (
                            <FlutterSvgIcon name="forward" size={20} color={Colors.border} />
                        )}
                    </View>
                </View>
            </TouchableOpacity>

            <ActionModal
                visible={showActions}
                onClose={() => setShowActions(false)}
                title="Manage Appointment"
                subtitle="Choose an action for your upcoming consultation"
                options={modalOptions}
            />
        </>
    );
}

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.xl,
        marginBottom: Spacing.md,
        marginHorizontal: Spacing.xl,
        overflow: 'hidden',
        ...Shadows.sm,
    },
    accentLine: {
        width: 4,
        alignSelf: 'stretch',
    },
    cardInner: {
        flex: 1,
        padding: Spacing.lg,
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        width: 44,
        height: 44,
        borderRadius: 14,
        overflow: 'hidden',
        marginRight: 12,
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    infoSection: {
        flex: 1,
        marginRight: 8,
    },
    doctorName: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.heading,
        marginBottom: 2,
    },
    specialization: {
        fontSize: 12,
        color: Colors.primaryBlue,
        fontWeight: '500',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: BorderRadius.round,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    divider: {
        height: 1,
        backgroundColor: Colors.divider,
        marginVertical: Spacing.md,
    },
    bottomRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    metaItemWide: {
        flex: 1,
    },
    metaText: {
        fontSize: 12,
        color: Colors.muted,
        fontWeight: '500',
        maxWidth: 110,
    },
    lastVisitedText: {
        maxWidth: undefined,
        flex: 1,
    },
});
