// Patient List Screen — Modern Premium Design
import React, { useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Platform,
    StatusBar,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchAllPatients, setCurrentPatient } from '../../store/slices/patientSlice';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../config/theme';
import { ROUTES } from '../../config/constants';
import FlutterSvgIcon from '../../components/common/FlutterSvgIcon';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PatientListScreen({ navigation }: any) {
    const dispatch = useAppDispatch();
    const insets = useSafeAreaInsets();
    const { patients, loading, currentPatient } = useAppSelector((state) => state.patient);

    useEffect(() => {
        if (patients.length === 0) {
            dispatch(fetchAllPatients());
        }
    }, [dispatch, patients.length]);

    const handlePatientSelect = (patient: any) => {
        dispatch(setCurrentPatient(patient));
        navigation.navigate(ROUTES.EDIT_PROFILE);
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    // Color palette for avatars
    const avatarColors = ['#4A90E2', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4'];

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.primaryBlue} />

            {/* Premium Header */}
            <View style={styles.header}>
                <View style={styles.headerBase} />
                <View style={styles.headerOverlay} />
                <View style={[styles.decorCircle, styles.dc1]} />
                <View style={[styles.decorCircle, styles.dc2]} />

                <View style={styles.headerContent}>
                    <View style={[styles.headerRow, { paddingTop: Math.max(insets.top, Platform.OS === 'ios' ? 10 : 8) }]}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => navigation.goBack()}
                            activeOpacity={0.7}>
                            <Ionicons name="chevron-back" size={22} color={Colors.white} />
                        </TouchableOpacity>
                        <View style={styles.headerTitleBlock}>
                            <Text style={styles.headerTitle}>Patient Details</Text>
                            <Text style={styles.headerSubtitle}>Manage family members</Text>
                        </View>
                    </View>
                </View>

                {/* Bottom Curve */}
                <View style={styles.curveWrapper}>
                    <View style={styles.curve} />
                </View>
            </View>

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={Colors.primaryBlue} />
                    <Text style={styles.loadingText}>Loading patients...</Text>
                </View>
            ) : (
                <FlatList
                    data={patients}
                    keyExtractor={(item, index) => `${item?.id ?? 'patient'}-${index}`}
                    renderItem={({ item, index }) => {
                        const isActive = currentPatient?.id === item.id;
                        const avatarColor = avatarColors[index % avatarColors.length];

                        return (
                            <TouchableOpacity
                                style={[styles.patientCard, isActive && styles.activeCard]}
                                activeOpacity={0.7}
                                onPress={() => handlePatientSelect(item)}>
                                <View style={[styles.avatarCircle, { backgroundColor: avatarColor + '15' }]}>
                                    <Text style={[styles.avatarText, { color: avatarColor }]}>
                                        {getInitials(item.name || '?')}
                                    </Text>
                                </View>
                                <View style={styles.patientInfo}>
                                    <View style={styles.nameRow}>
                                        <Text style={styles.patientName}>{item.name}</Text>
                                        {isActive && (
                                            <View style={styles.activeBadge}>
                                                <Text style={styles.activeText}>Active</Text>
                                            </View>
                                        )}
                                    </View>
                                    <Text style={styles.patientMeta}>
                                        {item.gender} • {item.age ? `${item.age} years` : 'Age N/A'}
                                    </Text>

                                </View>
                            </TouchableOpacity>
                        );
                    }}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <View style={styles.emptyIconCircle}>
                                <FlutterSvgIcon name="user" size={40} color={Colors.muted} />
                            </View>
                            <Text style={styles.emptyTitle}>No patients found</Text>
                            <Text style={styles.emptySubtext}>
                                Add family members to manage their health
                            </Text>
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

    // ─── Header ─────────────────────────────────────────
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

    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    loadingText: {
        ...Typography.bodySmall,
        color: Colors.muted,
    },
    list: {
        padding: Spacing.xl,
        paddingBottom: 100,
    },
    patientCard: {
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
    activeCard: {
        borderWidth: 1.5,
        borderColor: Colors.primaryBlue + '40',
        backgroundColor: Colors.primaryUltraLight,
    },
    avatarCircle: {
        width: 50,
        height: 50,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    avatarText: {
        fontSize: 18,
        fontWeight: '700',
    },
    patientInfo: {
        flex: 1,
        minWidth: 0,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 6,
    },
    patientName: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.heading,
        flexShrink: 1,
    },
    activeBadge: {
        backgroundColor: Colors.success + '20',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: BorderRadius.round,
    },
    activeText: {
        fontSize: 10,
        fontWeight: '700',
        color: Colors.success,
    },
    patientMeta: {
        fontSize: 12,
        color: Colors.primaryBlue,
        fontWeight: '600',
    },
    phoneRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    patientPhone: {
        fontSize: 12,
        color: Colors.muted,
    },

    // Empty
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
        marginBottom: Spacing.lg,
    },
    emptyTitle: {
        ...Typography.headlineSmall,
        marginBottom: 8,
    },
    emptySubtext: {
        ...Typography.bodyMedium,
        textAlign: 'center',
        color: Colors.muted,
    },
});
