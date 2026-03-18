// Doctor Details Screen — Modern Premium Design
// Shows doctor profile with hero header, qualification badges, and schedule CTA

import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Platform,
    StatusBar,
} from 'react-native';
import { useAppSelector } from '../../store';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../config/theme';
import { ROUTES } from '../../config/constants';
import { FLUTTER_PLACEHOLDER_IMAGES } from '../../config/flutterAssets';
import FlutterSvgIcon from '../../components/common/FlutterSvgIcon';
import GradientButton from '../../components/ui/GradientButton';

function capitalizeEachWord(input: string): string {
    if (!input) return input;
    return input
        .split(' ')
        .map((word) => {
            if (!word.trim()) return '';
            return word[0].toUpperCase() + word.substring(1).toLowerCase();
        })
        .join(' ');
}

export default function DoctorDetailsScreen({ route, navigation }: any) {
    const { doctorId } = route.params || {};
    const { doctors } = useAppSelector((state) => state.doctors);
    const doctor = doctors.find((d) => d.id === doctorId);

    if (!doctor) {
        return (
            <View style={styles.centered}>
                <View style={styles.emptyIconCircle}>
                    <FlutterSvgIcon name="user" size={40} color={Colors.muted} />
                </View>
                <Text style={styles.emptyTitle}>Doctor not found</Text>
            </View>
        );
    }

    const qualifications = (doctor.qualification || '')
        .split(',')
        .map((q: string) => q.trim())
        .filter(Boolean);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.primaryBlue} />
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}>
                {/* Hero Header */}
                <View style={styles.heroHeader}>
                    <View style={styles.heroBase} />
                    <View style={styles.heroOverlay} />
                    <View style={[styles.heroCircle, styles.hc1]} />
                    <View style={[styles.heroCircle, styles.hc2]} />

                    <View style={styles.heroTopBar}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => navigation.goBack()}>
                            <FlutterSvgIcon name="back" size={22} color={Colors.white} />
                        </TouchableOpacity>

                        <Text style={styles.heroScreenTitle}>Doctor Profile</Text>

                        <View style={styles.heroRightSpacer} />
                    </View>

                    {/* Doctor avatar */}
                    <View style={styles.avatarSection}>
                        <View style={styles.avatarContainer}>
                            {doctor.profileImage ? (
                                <Image source={{ uri: doctor.profileImage }} style={styles.avatar} />
                            ) : (
                                <Image
                                    source={FLUTTER_PLACEHOLDER_IMAGES.thumbnail}
                                    style={styles.avatar}
                                />
                            )}
                            <View style={styles.onlineIndicator} />
                        </View>
                        <Text style={styles.doctorName}>
                            Dr. {capitalizeEachWord(doctor.name)}
                        </Text>
                        <Text style={styles.specialization}>
                            {doctor.designation || doctor.specialization || 'Specialist'}
                        </Text>
                    </View>
                </View>

                {/* Info Cards */}
                <View style={styles.content}>
                    {/* Stats Row */}
                    {/* <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <View style={[styles.statIcon, { backgroundColor: '#EFF6FF' }]}>
                                <FlutterSvgIcon name="degree" size={18} />
                            </View>
                            <Text style={styles.statValue}>{qualifications.length}+</Text>
                            <Text style={styles.statLabel}>Qualification</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <View style={[styles.statIcon, { backgroundColor: '#F5F3FF' }]}>
                                <FlutterSvgIcon name="user" size={18} color="#8B5CF6" />
                            </View>
                            <Text style={styles.statValue}>500+</Text>
                            <Text style={styles.statLabel}>Patients</Text>
                        </View>
                    </View> */}

                    {/* About Section */}
                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>About</Text>
                        <Text style={styles.description}>
                            {(doctor as any).description?.trim() || 'Experienced medical professional dedicated to providing quality healthcare.'}
                        </Text>
                    </View>

                    {/* Qualifications */}
                    {qualifications.length > 0 && (
                        <View style={styles.sectionCard}>
                            <Text style={styles.sectionTitle}>Qualifications</Text>
                            <View style={styles.qualGrid}>
                                {qualifications.map((q: string, i: number) => (
                                    <View key={i} style={styles.qualBadge}>
                                        <FlutterSvgIcon name="degree" size={14} />
                                        <Text style={styles.qualText}>{q}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Clinic */}
                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>Clinic</Text>
                        <View style={styles.clinicRow}>
                            <View style={styles.clinicIcon}>
                                <FlutterSvgIcon name="hospital" size={22} />
                            </View>
                            <View style={styles.clinicInfo}>
                                <Text style={styles.clinicName}>
                                    {capitalizeEachWord(doctor.clinicName || 'Not specified')}
                                </Text>
                                <Text style={styles.clinicAddress}>
                                    {doctor.clinicAddress || 'Address not available'}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Available Days */}
                    {doctor.availableDays && doctor.availableDays.length > 0 && (
                        <View style={styles.sectionCard}>
                            <Text style={styles.sectionTitle}>Available Days</Text>
                            <View style={styles.daysRow}>
                                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
                                    const isAvailable = doctor.availableDays?.some(
                                        (d: string) => d.toLowerCase().startsWith(day.toLowerCase()),
                                    );
                                    return (
                                        <View
                                            key={day}
                                            style={[
                                                styles.dayChip,
                                                isAvailable && styles.dayChipActive,
                                            ]}>
                                            <Text
                                                style={[
                                                    styles.dayText,
                                                    isAvailable && styles.dayTextActive,
                                                ]}>
                                                {day}
                                            </Text>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Floating CTA */}
            <View style={styles.ctaContainer}>
                <GradientButton
                    title="Schedule Appointment"
                    onPress={() =>
                        navigation.navigate(ROUTES.BOOKING_FLOW, {
                            consultationId: doctor.id,
                            doctorName: doctor.name,
                            doctorId: doctor.id,
                            clinicId: doctor.clinicId,
                        })
                    }
                    icon={<FlutterSvgIcon name="calendar" size={18} color={Colors.white} />}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollContent: {
        paddingBottom: 124,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.xl,
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
        marginBottom: 12,
    },


    // ─── Hero ───────────────────────────────────────────
    heroHeader: {
        height: 312,
        position: 'relative',
        overflow: 'hidden',
    },
    heroBase: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: Colors.primaryBlue,
    },
    heroOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(102, 126, 234, 0.35)',
    },
    heroCircle: {
        position: 'absolute',
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
    },
    hc1: { top: -40, right: -30 },
    hc2: { bottom: -50, left: -40 },
    heroTopBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: Platform.OS === 'ios' ? 58 : 42,
        paddingHorizontal: Spacing.lg,
        zIndex: 1,
    },
    backButton: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.16)',
        justifyContent: 'center',
        alignItems: 'center',
    },

    heroScreenTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.white,
    },
    heroRightSpacer: {
        width: 48,
    },
    avatarSection: {
        alignItems: 'center',
        marginTop: 18,
        zIndex: 1,
        paddingHorizontal: Spacing.xl,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 12,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 24,
        borderWidth: 3,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: Colors.success,
        borderWidth: 2,
        borderColor: Colors.primaryBlue,
    },
    doctorName: {
        fontSize: 22,
        fontWeight: '800',
        color: Colors.white,
        marginBottom: 4,
        textAlign: 'center',
    },
    specialization: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
    },

    // ─── Content ────────────────────────────────────────
    content: {
        marginTop: -22,
        marginHorizontal: Spacing.lg,
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.xxl,
        paddingBottom: Spacing.lg,
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.xxxl,
        borderWidth: 1,
        borderColor: Colors.borderLight,
        ...Shadows.md,
    },

    // Stats
    statsRow: {
        flexDirection: 'row',
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.xxl,
        padding: Spacing.lg,
        marginTop: -20,
        ...Shadows.md,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.heading,
    },
    statLabel: {
        fontSize: 11,
        color: Colors.muted,
        marginTop: 2,
    },
    statDivider: {
        width: 1,
        height: 50,
        backgroundColor: Colors.divider,
        alignSelf: 'center',
    },

    // Sections
    sectionCard: {
        backgroundColor: Colors.surfaceSecondary,
        borderRadius: BorderRadius.xxl,
        padding: Spacing.lg,
        marginTop: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.borderLight,
    },
    sectionTitle: {
        ...Typography.headlineSmall,
        fontSize: 16,
        marginBottom: Spacing.md,
    },
    description: {
        fontSize: 14,
        color: Colors.paragraph,
        lineHeight: 22,
    },

    // Qualifications
    qualGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    qualBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 7,
        backgroundColor: Colors.primaryUltraLight,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.primaryLight + '30',
    },
    qualText: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.primaryBlue,
    },

    // Clinic
    clinicRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    clinicIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: Colors.surfaceSecondary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    clinicInfo: {
        flex: 1,
        minWidth: 0,
    },
    clinicName: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.heading,
        marginBottom: 3,
    },
    clinicAddress: {
        fontSize: 13,
        color: Colors.muted,
    },

    // Days
    daysRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    dayChip: {
        minWidth: 54,
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderRadius: BorderRadius.lg,
        backgroundColor: Colors.surfaceSecondary,
        alignItems: 'center',
    },
    dayChipActive: {
        backgroundColor: Colors.primaryBlue,
    },
    dayText: {
        fontSize: 11,
        fontWeight: '600',
        color: Colors.muted,
    },
    dayTextActive: {
        color: Colors.white,
    },

    // CTA
    ctaContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: Spacing.xl,
        paddingBottom: Platform.OS === 'ios' ? 34 : 20,
        backgroundColor: 'rgba(244, 248, 252, 0.96)',
    },
});
