// Active Medication Section — Cards + Prescription popup (matches provided screenshots)
import React, { useMemo, useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector } from '../../store';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../config/theme';
import FlutterSvgIcon, { type FlutterSvgIconName } from '../common/FlutterSvgIcon';

type PeriodKey = 'Morning' | 'Afternoon' | 'Evening';

const PERIODS: Array<{
    key: PeriodKey;
    timeRange: string;
    dotColor: string;
}> = [
        { key: 'Morning', timeRange: '8am–9am', dotColor: Colors.error },
        { key: 'Afternoon', timeRange: '12pm–1pm', dotColor: Colors.info },
        { key: 'Evening', timeRange: '8pm–9pm', dotColor: Colors.warning },
    ];

const PERIOD_ICONS: Record<PeriodKey, FlutterSvgIconName[]> = {
    Morning: ['medicine', 'injection', 'medicalPrescription'],
    Afternoon: ['medicine', 'injection', 'medicalPrescription'],
    Evening: ['medicine', 'injection', 'medicalPrescription'],
};

const normalizePeriod = (value?: string): PeriodKey | null => {
    const v = String(value || '').trim().toLowerCase();
    if (!v) return null;

    if (v.includes('breakfast') || v.includes('morning')) return 'Morning';
    if (v.includes('lunch') || v.includes('afternoon')) return 'Afternoon';
    if (v.includes('dinner') || v.includes('evening') || v.includes('night')) return 'Evening';

    return null;
};

const getMedicationMeta = (med: any): { left?: string; right?: string } => {
    const left =
        med?.instructions ||
        med?.instruction ||
        med?.directions ||
        med?.timing ||
        med?.when ||
        '';

    const right =
        med?.dosage ||
        med?.dose ||
        med?.quantity ||
        med?.qty ||
        '';

    return {
        left: String(left || '').trim() || undefined,
        right: String(right || '').trim() || undefined,
    };
};

export default function ActiveMedicationSection() {
    const { activeMedications } = useAppSelector((state) => state.medications);
    const [selectedPeriod, setSelectedPeriod] = useState<PeriodKey>('Morning');
    const [modalVisible, setModalVisible] = useState(false);

    const grouped = useMemo(() => {
        const initial: Record<PeriodKey, any[]> = { Morning: [], Afternoon: [], Evening: [] };
        (activeMedications || []).forEach((med: any) => {
            const period = normalizePeriod(med?.timeOfDay ?? med?.frequency) || 'Morning';
            initial[period].push(med);
        });
        return initial;
    }, [activeMedications]);

    const openModal = (period: PeriodKey) => {
        setSelectedPeriod(period);
        setModalVisible(true);
    };

    if (!activeMedications || activeMedications.length === 0) return null;

    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Medications</Text>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.cardsRow}>
                {PERIODS.map((p) => {
                    const icons = PERIOD_ICONS[p.key];

                    return (
                        <TouchableOpacity
                            key={p.key}
                            style={styles.periodCard}
                            onPress={() => openModal(p.key)}
                            activeOpacity={0.8}>
                            <Text style={styles.periodTitle}>{p.key}</Text>

                            <View style={styles.iconsRow}>
                                {icons.map((iconName, idx) => (
                                    <View key={`${p.key}-icon-${idx}`} style={styles.iconCircle}>
                                        <FlutterSvgIcon name={iconName} size={16} color={Colors.white} />
                                    </View>
                                ))}
                            </View>

                            <View style={styles.periodFooter}>
                                <Text style={styles.timeText}>{p.timeRange}</Text>
                                <View style={[styles.dot, { backgroundColor: p.dotColor }]} />
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            <Modal
                visible={modalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setModalVisible(false)}>
                <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback>
                            <View style={styles.modalCard}>
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>Prescription</Text>
                                    <TouchableOpacity
                                        onPress={() => setModalVisible(false)}
                                        hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                                        style={styles.closeBtn}
                                        activeOpacity={0.7}>
                                        <Ionicons name="close" size={22} color={Colors.muted} />
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.modalDivider} />

                                <Text style={styles.modalPeriod}>{selectedPeriod}</Text>

                                <ScrollView
                                    showsVerticalScrollIndicator={false}
                                    contentContainerStyle={styles.modalList}>
                                    {(grouped[selectedPeriod] || []).map((med: any, idx: number) => {
                                        const meta = getMedicationMeta(med);
                                        const iconName = PERIOD_ICONS[selectedPeriod][idx % PERIOD_ICONS[selectedPeriod].length];

                                        return (
                                            <View key={`${med?.id ?? 'med'}-${idx}`} style={styles.medRow}>
                                                <View style={styles.leftIconCircle}>
                                                    <FlutterSvgIcon name={iconName} size={16} color={Colors.white} />
                                                </View>
                                                <View style={styles.medText}>
                                                    <Text style={styles.medName}>{med?.name || 'Medicine name'}</Text>
                                                    {(meta.left || meta.right) ? (
                                                        <View style={styles.metaRow}>
                                                            {meta.left ? <Text style={styles.metaText}>{meta.left}</Text> : null}
                                                            {meta.right ? <Text style={styles.metaText}>{meta.right}</Text> : null}
                                                        </View>
                                                    ) : null}
                                                </View>
                                            </View>
                                        );
                                    })}

                                    {(grouped[selectedPeriod] || []).length === 0 ? (
                                        <View style={styles.emptyState}>
                                            <Text style={styles.emptyText}>No medicines found.</Text>
                                        </View>
                                    ) : null}
                                </ScrollView>
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

    cardsRow: {
        gap: 12,
        paddingRight: 10,
    },
    periodCard: {
        width: 130,
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.xl,
        padding: 10,
        borderWidth: 1,
        borderColor: Colors.borderLight,
        ...Shadows.xs,
        minHeight: 118,
    },
    periodTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.heading,
    },
    iconsRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 12,
        marginBottom: 12,
    },
    iconCircle: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: Colors.primaryBlue,
        justifyContent: 'center',
        alignItems: 'center',
    },
    periodFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 'auto',
    },
    timeText: {
        ...Typography.caption,
        color: Colors.muted,
        fontWeight: '600',
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },

    modalOverlay: {
        flex: 1,
        backgroundColor: Colors.overlayLight,
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.xl,
    },
    modalCard: {
        width: '100%',
        maxWidth: 420,
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.xl,
        overflow: 'hidden',
        ...Shadows.lg,
        maxHeight: '75%',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.lg,
        paddingBottom: Spacing.md,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: Colors.primaryDark,
    },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.borderLight,
        ...Shadows.xs,
    },
    modalDivider: {
        height: 1,
        backgroundColor: Colors.divider,
    },
    modalPeriod: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.heading,
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.lg,
        paddingBottom: Spacing.sm,
    },
    modalList: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.lg,
    },

    medRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        paddingVertical: Spacing.md,
    },
    leftIconCircle: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: Colors.primaryDark,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 2,
    },
    medText: {
        flex: 1,
    },
    medName: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.heading,
        marginBottom: 4,
    },
    metaRow: {
        flexDirection: 'row',
        gap: 14,
        flexWrap: 'wrap',
    },
    metaText: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.muted,
    },
    emptyState: {
        paddingVertical: Spacing.xl,
        alignItems: 'center',
    },
    emptyText: {
        ...Typography.caption,
        color: Colors.muted,
        fontWeight: '600',
    },
});
