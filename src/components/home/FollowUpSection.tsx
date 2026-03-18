// Follow-Up Appointments Section — Premium Card Design
// Doctor avatar, name, specialization, date badge, patient name, action buttons
// Call Clinic opens a modal with phone number(s) to dial
import React, { useCallback, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Linking,
    Modal,
    TouchableWithoutFeedback,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector } from '../../store';
import { FollowUp } from '../../store/slices/consultationsSlice';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../config/theme';
import { FLUTTER_PLACEHOLDER_IMAGES } from '../../config/flutterAssets';
import { ROUTES } from '../../config/constants';

interface Props {
    navigation: any;
}

const formatFollowUpDate = (dateStr: string): string => {
    if (!dateStr) return '';
    const parsed = Date.parse(dateStr);
    if (!Number.isNaN(parsed)) {
        const d = new Date(parsed);
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        return `${dd}-${mm}-${yyyy}`;
    }
    return dateStr;
};

/** Parse phone string — may contain multiple numbers separated by , / ; or spaces */
const parsePhoneNumbers = (phone: string): string[] => {
    if (!phone) return [];
    return phone
        .split(/[,;/|]+/)
        .map((p) => p.trim())
        .filter((p) => p.length >= 6); // ignore fragments
};

const formatPhoneDisplay = (phone: string): string => {
    // Clean up but keep + prefix for international
    const cleaned = phone.replace(/[^0-9+\-\s()]/g, '').trim();
    return cleaned || phone;
};

export default function FollowUpSection({ navigation }: Props) {
    const { followUps } = useAppSelector((state) => state.consultations);
    const { clinics } = useAppSelector((state) => state.clinics);
    const [phoneModalVisible, setPhoneModalVisible] = useState(false);
    const [phoneNumbers, setPhoneNumbers] = useState<string[]>([]);
    const [selectedClinicName, setSelectedClinicName] = useState('');

    /** Resolve clinic phone: first from follow-up data, then from clinics store */
    const resolveClinicPhone = useCallback(
        (item: FollowUp): string => {
            // 1. Direct phone from follow-up
            if (item.clinicPhone) return item.clinicPhone;

            // Helper: extract phone from raw clinic object (API field names vary)
            const getClinicPhone = (c: any): string =>
                c?.phone || c?.mobile || c?.contact ||
                c?.contact_number || c?.clinic_phone || c?.clinic_mobile ||
                c?.clinicPhone || c?.clinicMobile || c?.clinic_contact ||
                c?.clinic_contact_number || c?.phone_number ||
                c?.front_desk_contacts || c?.clinic_front_desk_contacts ||
                c?.frontDeskContact || c?.clinicFrontDeskContact || '';

            // Helper: get name from raw clinic object
            const getClinicName = (c: any): string =>
                String(c?.name || c?.clinicName || c?.clinic_name || '').trim().toLowerCase();

            // 2. Match clinic by ID
            if (item.clinicId) {
                const byId = clinics.find(
                    (c: any) => c.id === item.clinicId || c._id === item.clinicId,
                );
                const phone = getClinicPhone(byId);
                if (phone) return phone;
            }

            // 3. Exact match clinic by name
            if (item.clinicName) {
                const normalized = item.clinicName.trim().toLowerCase();
                const byName = clinics.find(
                    (c: any) => getClinicName(c) === normalized,
                );
                const phone = getClinicPhone(byName);
                if (phone) return phone;

                // 4. Partial match — clinic name contains or is contained in follow-up clinic name
                const partial = clinics.find(
                    (c: any) => {
                        const cn = getClinicName(c);
                        return cn && (cn.includes(normalized) || normalized.includes(cn));
                    },
                );
                const partialPhone = getClinicPhone(partial);
                if (partialPhone) return partialPhone;
            }

            // 5. Last resort — if only one clinic exists, use its phone
            if (clinics.length === 1) {
                const phone = getClinicPhone(clinics[0]);
                if (phone) return phone;
            }

            return '';
        },
        [clinics],
    );

    const handleCallClinic = useCallback((phone: string, clinicName: string) => {
        const numbers = parsePhoneNumbers(phone);

        if (numbers.length === 0) {
            setPhoneNumbers([]);
            setSelectedClinicName(clinicName || 'Clinic');
            setPhoneModalVisible(true);
            return;
        }

        if (numbers.length === 1) {
            Linking.openURL(`tel:${numbers[0]}`);
            return;
        }

        // Multiple numbers — show picker modal
        setPhoneNumbers(numbers);
        setSelectedClinicName(clinicName || 'Clinic');
        setPhoneModalVisible(true);
    }, []);

    const handleDialNumber = useCallback((number: string) => {
        setPhoneModalVisible(false);
        setTimeout(() => {
            Linking.openURL(`tel:${number}`);
        }, 300);
    }, []);

    const handleBookAppointment = useCallback(
        (item: FollowUp) => {
            navigation.navigate(ROUTES.BOOKING_FLOW, {
                consultationId: item.doctorId || item.consultationId,
                doctorName: item.doctorName,
                doctorId: item.doctorId,
                clinicId: item.clinicId,
                reasonToVisit: 'Follow-up Consultation',
            });
        },
        [navigation],
    );

    if (followUps.length === 0) return null;

    return (
        <View style={styles.section}>
            {/* Section Header */}
            <Text style={styles.sectionTitle}>Follow-up Appointments</Text>

            {followUps.map((item, index) => (
                <View
                    key={`${item?.id ?? 'followup'}-${index}`}
                    style={styles.card}>
                    {/* Left accent line */}
                    <View style={styles.accentLine} />

                    <View style={styles.cardInner}>
                        {/* Top Row: Avatar + Info */}
                        <View style={styles.topRow}>
                            {/* Doctor Avatar */}
                            <View style={styles.avatarContainer}>
                                {item.doctorPhotoUrl ? (
                                    <Image
                                        source={{ uri: item.doctorPhotoUrl }}
                                        style={styles.avatar}
                                    />
                                ) : (
                                    <Image
                                        source={FLUTTER_PLACEHOLDER_IMAGES.thumbnail}
                                        style={styles.avatar}
                                    />
                                )}
                            </View>

                            {/* Doctor Info */}
                            <View style={styles.infoContainer}>
                                <Text style={styles.doctorName} numberOfLines={1}>
                                    {item.doctorName}
                                </Text>

                                {item.specialization ? (
                                    <Text style={styles.specialization} numberOfLines={2}>
                                        {item.specialization}
                                    </Text>
                                ) : null}

                                {/* Date Badge */}
                                {item.scheduledDate ? (
                                    <View style={styles.dateBadge}>
                                        <Text style={styles.dateBadgeText}>
                                            Date: {formatFollowUpDate(item.scheduledDate)}
                                        </Text>
                                    </View>
                                ) : null}

                                {/* Patient Name */}
                                {item.patientName ? (
                                    <Text style={styles.patientText} numberOfLines={1}>
                                        Patient: {item.patientName}
                                    </Text>
                                ) : null}
                            </View>
                        </View>

                        {/* Divider */}
                        <View style={styles.divider} />

                        {/* Action Buttons */}
                        <View style={styles.actionsRow}>
                            <TouchableOpacity
                                style={styles.callBtn}
                                activeOpacity={0.7}
                                onPress={() => handleCallClinic(resolveClinicPhone(item), item.clinicName)}>
                                <Ionicons name="call-outline" size={14} color={Colors.primaryBlue} />
                                <Text style={styles.callBtnText}>Call Clinic</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.bookBtn}
                                activeOpacity={0.7}
                                onPress={() => handleBookAppointment(item)}>
                                <Ionicons name="calendar-outline" size={14} color={Colors.white} />
                                <Text style={styles.bookBtnText}>Book Appointment</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            ))}

            {/* ─── Phone Number Modal ─────────────────────────── */}
            <Modal
                visible={phoneModalVisible}
                transparent
                animationType="fade"
                statusBarTranslucent
                onRequestClose={() => setPhoneModalVisible(false)}>
                <TouchableWithoutFeedback onPress={() => setPhoneModalVisible(false)}>
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback>
                            <View style={styles.modalContainer}>
                                {/* Modal Header */}
                                <View style={styles.modalHeader}>
                                    <View style={styles.modalIconCircle}>
                                        <Ionicons name="call" size={22} color={Colors.primaryBlue} />
                                    </View>
                                    <View style={styles.modalHeaderText}>
                                        <Text style={styles.modalTitle}>
                                            {selectedClinicName || 'Clinic'}
                                        </Text>
                                        <Text style={styles.modalSubtitle}>
                                            {phoneNumbers.length > 0
                                                ? 'Tap a number to call'
                                                : 'No phone number available'}
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.modalCloseBtn}
                                        onPress={() => setPhoneModalVisible(false)}>
                                        <Ionicons name="close" size={20} color={Colors.muted} />
                                    </TouchableOpacity>
                                </View>

                                {/* Divider */}
                                <View style={styles.modalDivider} />

                                {/* Phone Numbers List */}
                                {phoneNumbers.length > 0 ? (
                                    <View style={styles.phoneList}>
                                        {phoneNumbers.map((number, idx) => (
                                            <TouchableOpacity
                                                key={`phone-${idx}`}
                                                style={[
                                                    styles.phoneItem,
                                                    idx < phoneNumbers.length - 1 && styles.phoneItemBorder,
                                                ]}
                                                activeOpacity={0.6}
                                                onPress={() => handleDialNumber(number)}>
                                                <View style={styles.phoneIconBg}>
                                                    <Ionicons name="call" size={16} color={Colors.white} />
                                                </View>
                                                <View style={styles.phoneInfo}>
                                                    <Text style={styles.phoneNumber}>
                                                        {formatPhoneDisplay(number)}
                                                    </Text>
                                                    <Text style={styles.phoneLabel}>
                                                        {phoneNumbers.length > 1
                                                            ? `Phone ${idx + 1}`
                                                            : 'Phone'}
                                                    </Text>
                                                </View>
                                                <Ionicons
                                                    name="chevron-forward"
                                                    size={18}
                                                    color={Colors.muted}
                                                />
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                ) : (
                                    <View style={styles.noPhoneContainer}>
                                        <Ionicons name="alert-circle-outline" size={40} color={Colors.muted} />
                                        <Text style={styles.noPhoneText}>
                                            No phone number is available for this clinic.
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    section: {
        marginBottom: Spacing.xxl,
    },
    sectionTitle: {
        ...Typography.headlineSmall,
        fontSize: 17,
        marginBottom: Spacing.md,
    },

    // ─── Card ───────────────────────────────────────────
    card: {
        flexDirection: 'row',
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.xxl,
        marginBottom: Spacing.md,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Colors.borderLight,
        ...Shadows.sm,
    },
    accentLine: {
        width: 4,
        alignSelf: 'stretch',
        backgroundColor: Colors.primaryBlue,
    },
    cardInner: {
        flex: 1,
        padding: Spacing.lg,
    },

    // ─── Top Row ────────────────────────────────────────
    topRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
    },
    avatarContainer: {
        width: 46,
        height: 46,
        borderRadius: 23,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: Colors.primaryUltraLight,
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    infoContainer: {
        flex: 1,
        minWidth: 0,
    },
    doctorName: {
        fontSize: 15,
        fontWeight: '800',
        color: Colors.heading,
        marginBottom: 4,
    },
    specialization: {
        fontSize: 12,
        color: Colors.body,
        lineHeight: 17,
        marginBottom: 6,
    },
    dateBadge: {
        alignSelf: 'flex-start',
        backgroundColor: '#FFF0E5',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FFD0A8',
        marginBottom: 4,
    },
    dateBadgeText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#E67E22',
    },
    patientText: {
        fontSize: 12,
        color: Colors.muted,
        fontWeight: '600',
    },

    // ─── Divider ────────────────────────────────────────
    divider: {
        height: 1,
        backgroundColor: Colors.border,
        marginVertical: 10,
    },

    // ─── Actions ────────────────────────────────────────
    actionsRow: {
        flexDirection: 'row',
        gap: 8,
    },
    callBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        minHeight: 42,
        paddingVertical: 10,
        borderRadius: BorderRadius.lg,
        borderWidth: 1.5,
        borderColor: Colors.primaryBlue,
        backgroundColor: Colors.primaryUltraLight,
    },
    callBtnText: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.primaryBlue,
    },
    bookBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        minHeight: 42,
        paddingVertical: 10,
        borderRadius: BorderRadius.lg,
        backgroundColor: Colors.primaryBlue,
    },
    bookBtnText: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.white,
    },

    // ─── Modal ──────────────────────────────────────────
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
    },
    modalContainer: {
        width: '100%',
        backgroundColor: Colors.white,
        borderRadius: 20,
        overflow: 'hidden',
        ...Shadows.elevated,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 18,
        gap: 12,
    },
    modalIconCircle: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: Colors.primaryUltraLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalHeaderText: {
        flex: 1,
    },
    modalTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: Colors.heading,
    },
    modalSubtitle: {
        fontSize: 12,
        color: Colors.muted,
        marginTop: 2,
    },
    modalCloseBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.surfaceSecondary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalDivider: {
        height: 1,
        backgroundColor: Colors.border,
    },
    phoneList: {
        paddingVertical: 6,
    },
    phoneItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 18,
        paddingVertical: 14,
        gap: 14,
    },
    phoneItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    phoneIconBg: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center',
    },
    phoneInfo: {
        flex: 1,
    },
    phoneNumber: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.heading,
        letterSpacing: 0.5,
    },
    phoneLabel: {
        fontSize: 11,
        color: Colors.muted,
        marginTop: 2,
    },
    noPhoneContainer: {
        alignItems: 'center',
        paddingVertical: 30,
        paddingHorizontal: 20,
        gap: 10,
    },
    noPhoneText: {
        fontSize: 14,
        color: Colors.muted,
        textAlign: 'center',
        lineHeight: 20,
    },
});
