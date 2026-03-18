// Appointment History Screen — Matching user screenshot
import React, { useState, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    RefreshControl,
    Platform,
    Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchAppointmentHistory } from '../../store/slices/appointmentsSlice';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../config/theme';
import { ROUTES } from '../../config/constants';
import FlutterSvgIcon from '../../components/common/FlutterSvgIcon';

export default function AppointmentHistoryScreen({ navigation }: any) {
    const dispatch = useAppDispatch();
    const insets = useSafeAreaInsets();
    const { history, loading } = useAppSelector((state) => state.appointments);
    const [refreshing, setRefreshing] = useState(false);

    const consultedHistory = useMemo(
        () =>
            history.filter((item: any) => {
                const status = String(item?.status || '').trim().toLowerCase();
                return status === 'consulted' && !!item?.consultationPdfLink;
            }),
        [history],
    );

    useFocusEffect(
        useCallback(() => {
            dispatch(fetchAppointmentHistory());
        }, [dispatch]),
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await dispatch(fetchAppointmentHistory());
        setRefreshing(false);
    };

    const handleViewPrescription = useCallback((appointment: any) => {
        const pdfUrl = appointment?.consultationPdfLink;
        if (!pdfUrl) {
            Alert.alert('Prescription Unavailable', 'No prescription PDF found for this appointment.');
            return;
        }

        navigation.navigate(ROUTES.PDF_VIEWER, {
            consultationId: appointment?.consultationId || appointment?.id,
            pdfUrl,
            clinicId: appointment?.clinicId,
            patientId: appointment?.patientId,
            fileKey: appointment?.fileKey,
            prescription: {
                doctorName: appointment?.doctorName || 'N/A',
            },
        });
    }, [navigation]);

    const renderItem = ({ item }: { item: any }) => {
        const status = (item.status || '').toLowerCase();
        let statusColor = '#9E9E9E'; // default gray
        let displayStatus = item.status || 'Unknown';

        if (status === 'cancelled') {
            statusColor = '#F44336'; // Red
            displayStatus = 'Cancelled';
        } else if (status === 'scheduled') {
            statusColor = '#FF9800'; // Orange/Yellow
            displayStatus = 'Scheduled';
        } else if (status === 'consulted') {
            statusColor = '#4CAF50'; // Green
            displayStatus = 'Consulted';
        }

        const showPrescriptionButton = status === 'consulted' && !!item.consultationPdfLink;

        return (
            <View style={styles.card}>
                <View style={styles.cardTopRow}>
                    <View style={styles.titleBlock}>
                        <Text style={[styles.value, styles.nameValue]} numberOfLines={1}>
                            {item.patientName || 'N/A'}
                        </Text>
                        <Text style={styles.doctorLine} numberOfLines={1}>
                            {item.doctorName || 'N/A'}
                        </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: `${statusColor}18` }]}>
                        <Text style={[styles.statusText, { color: statusColor }]}>{displayStatus}</Text>
                    </View>
                </View>

                <View style={styles.detailGrid}>
                    <View style={styles.detailItem}>
                        <Text style={styles.label}>Clinic</Text>
                        <Text style={styles.value}>{item.clinicName || 'N/A'}</Text>
                    </View>
                    <View style={styles.detailItem}>
                        <Text style={styles.label}>Reason</Text>
                        <Text style={styles.value}>{item.reasonToVisit || 'Consultation'}</Text>
                    </View>
                </View>

                <View style={[styles.cardRow, showPrescriptionButton ? styles.appointmentRowWithButton : { marginBottom: 0 }]}>
                    <Text style={styles.label}>Appointment</Text>
                    <Text style={styles.value}>
                        {item.date ? item.date : ''}
                        {item.date && item.time ? ', ' : ''}
                        {item.time ? item.time : ''}
                    </Text>
                </View>

                {showPrescriptionButton && (
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={styles.prescriptionButton}
                            onPress={() => handleViewPrescription(item)}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.prescriptionButtonText}>View Prescription</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {/* Header aligned with Patient Details style */}
            <View style={styles.header}>
                <View style={styles.headerBase} />
                <View style={styles.headerOverlay} />
                <View style={[styles.decorCircle, styles.dc1]} />
                <View style={[styles.decorCircle, styles.dc2]} />

                <View style={styles.headerContent}>
                    <View style={styles.headerRow}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => navigation.goBack()}
                            activeOpacity={0.7}>
                            <Ionicons name="chevron-back" size={22} color={Colors.white} />
                        </TouchableOpacity>
                        <View style={[styles.headerTitleBlock, { paddingTop: Math.max(insets.top, Platform.OS === 'ios' ? 10 : 8) }]}>
                            <Text style={styles.headerTitle}>Appointment History</Text>
                            <Text style={styles.headerSubtitle}>Past appointments</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.curveWrapper}>
                    <View style={styles.curve} />
                </View>
            </View>

            {loading && history.length === 0 ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={Colors.primaryBlue} />
                </View>
            ) : (
                <FlatList
                    data={consultedHistory}
                    keyExtractor={(item, index) => `${item?.id ?? 'history'}-${index}`}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={[Colors.primaryBlue]}
                            tintColor={Colors.primaryBlue}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <View style={styles.emptyIconCircle}>
                                <FlutterSvgIcon name="calendar" size={40} color={Colors.muted} />
                            </View>
                            <Text style={styles.emptyTitle}>No consulted appointments</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },

    header: {
        height: 178,
        position: 'relative',
        overflow: 'hidden',
    },
    headerBase: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: Colors.primaryBlue,
    },
    headerOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(59, 130, 246, 0.4)',
    },
    decorCircle: {
        position: 'absolute',
        width: 130,
        height: 130,
        borderRadius: 65,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
    },
    dc1: { top: -40, right: -30 },
    dc2: { bottom: -50, left: -20 },
    headerContent: {
        paddingHorizontal: Spacing.xl,
        zIndex: 1,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: Platform.OS === 'ios' ? 0 : 8,
    },
    backButton: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.18)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    headerTitleBlock: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: Colors.white,
    },
    headerSubtitle: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.7)',
        marginTop: 2,
    },
    curveWrapper: {
        position: 'absolute',
        bottom: -1,
        left: 0,
        right: 0,
        height: 30,
    },
    curve: {
        width: '100%',
        height: 50,
        backgroundColor: Colors.background,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
    },
    list: {
        padding: Spacing.xl,
        paddingBottom: 100,
    },
    card: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
        marginBottom: Spacing.md,
        ...Shadows.sm,
        borderWidth: 1,
        borderColor: Colors.borderLight,
    },
    cardTopRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: Spacing.md,
        marginBottom: Spacing.md,
    },
    titleBlock: {
        flex: 1,
        minWidth: 0,
    },
    doctorLine: {
        fontSize: 13,
        color: Colors.primaryBlue,
        fontWeight: '600',
        marginTop: 4,
    },
    statusBadge: {
        borderRadius: BorderRadius.round,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '800',
    },
    detailGrid: {
        gap: Spacing.md,
        marginBottom: Spacing.md,
    },
    detailItem: {
        backgroundColor: Colors.surfaceSecondary,
        borderRadius: BorderRadius.lg,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    cardRow: {
        gap: 4,
    },
    appointmentRowWithButton: {
        marginBottom: 16,
    },
    label: {
        fontSize: 12,
        color: Colors.paragraph,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.4,
    },
    nameLabel: {
        color: Colors.body,
        fontWeight: '700',
    },
    value: {
        fontSize: 14,
        color: Colors.body,
        fontWeight: '500',
        flexShrink: 1,
    },
    nameValue: {
        color: Colors.body,
        fontWeight: '700',
    },
    buttonContainer: {
        alignItems: 'flex-end',
        marginTop: 4,
    },
    prescriptionButton: {
        backgroundColor: '#1A2F4D',
        paddingVertical: 10,
        paddingHorizontal: 18,
        borderRadius: BorderRadius.lg,
    },
    prescriptionButtonText: {
        color: Colors.white,
        fontSize: 14,
        fontWeight: '700',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 60,
        paddingHorizontal: 40,
    },
    emptyIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.surfaceSecondary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyTitle: {
        ...Typography.headlineSmall,
    },
});
