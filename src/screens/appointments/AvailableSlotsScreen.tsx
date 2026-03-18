// Available Slots Screen — Modern Premium Design
// Horizontal date picker + segmented time slots (Morning/Afternoon/Evening)

import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Platform,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../config/theme';
import FlutterSvgIcon from '../../components/common/FlutterSvgIcon';
import GradientButton from '../../components/ui/GradientButton';

export default function AvailableSlotsScreen({ route, navigation }: any) {
    const { doctorId, date: initialDate } = route.params || {};
    const [selectedDate, setSelectedDate] = useState(initialDate || '');
    const [selectedSlot, setSelectedSlot] = useState('');

    // Generate next 14 days
    const dates = useMemo(() => {
        const result: Date[] = [];
        for (let i = 0; i < 14; i++) {
            const d = new Date();
            d.setDate(d.getDate() + i);
            result.push(d);
        }
        return result;
    }, []);

    // Time slots
    const morningSlots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30'];
    const afternoonSlots = ['12:00', '12:30', '02:00', '02:30', '03:00', '03:30'];
    const eveningSlots = ['04:00', '04:30', '05:00', '05:30', '06:00'];

    const renderSlotGroup = (title: string, icon: string, slots: string[]) => (
        <View style={styles.slotGroup}>
            <View style={styles.slotGroupHeader}>
                <View style={[styles.titleIcon, { backgroundColor: Colors.primaryUltraLight }]}>
                    <FlutterSvgIcon name={icon as any} size={18} color={Colors.primaryBlue} />
                </View>
                <Text style={styles.slotGroupTitle}>{title}</Text>
            </View>
            <View style={styles.slotsRow}>
                {slots.map((slot) => {
                    const isSelected = selectedSlot === slot;
                    return (
                        <TouchableOpacity
                            key={slot}
                            style={[
                                styles.slotChip,
                                isSelected && styles.slotChipSelected,
                            ]}
                            onPress={() => setSelectedSlot(slot)}
                            activeOpacity={0.7}>
                            <Text
                                style={[
                                    styles.slotText,
                                    isSelected && styles.slotTextSelected,
                                ]}>
                                {slot}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Available Slots</Text>
                    <Text style={styles.headerSubtitle}>Pick a preferred date & time</Text>
                </View>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}>

                {/* Section Title */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Select Date</Text>
                    <Text style={styles.sectionMeta}>{dates.length} days available</Text>
                </View>

                {/* Date Row */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.dateRow}>
                    {dates.map((d) => {
                        const key = d.toISOString().split('T')[0];
                        const isSelected = selectedDate === key;
                        const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
                        const dayNum = d.getDate();
                        const month = d.toLocaleDateString('en-US', { month: 'short' });

                        return (
                            <TouchableOpacity
                                key={key}
                                style={[styles.dateCard, isSelected && styles.dateCardSelected]}
                                onPress={() => setSelectedDate(key)}
                                activeOpacity={0.7}>
                                <Text
                                    style={[styles.dateDayName, isSelected && styles.dateTextSelected]}>
                                    {dayName}
                                </Text>
                                <Text
                                    style={[styles.dateDayNum, isSelected && styles.dateTextSelected]}>
                                    {dayNum}
                                </Text>
                                <Text
                                    style={[styles.dateMonth, isSelected && styles.dateTextSelected]}>
                                    {month}
                                </Text>
                                {isSelected && <View style={styles.activeIndicator} />}
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                {/* Slots Section Title */}
                <View style={[styles.sectionHeader, { marginTop: Spacing.xl }]}>
                    <Text style={styles.sectionTitle}>Select Time</Text>
                    <View style={styles.timeBadge}>
                        <FlutterSvgIcon name="time" size={14} color={Colors.primaryBlue} />
                        <Text style={styles.timeBadgeText}>IST</Text>
                    </View>
                </View>

                {/* Time Slots */}
                {renderSlotGroup('Morning', 'time', morningSlots)}
                {renderSlotGroup('Afternoon', 'time', afternoonSlots)}
                {renderSlotGroup('Evening', 'star', eveningSlots)}

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Bottom Confirm Button */}
            <View style={styles.bottomBar}>
                <GradientButton
                    title={selectedSlot && selectedDate ? `Confirm Slot — ${selectedSlot}` : 'Select Date & Time'}
                    onPress={() => navigation.goBack()}
                    disabled={!selectedSlot || !selectedDate}
                    icon={<FlutterSvgIcon name="verified" size={20} color={Colors.white} />}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: Platform.OS === 'ios' ? 56 : 40,
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.md,
        backgroundColor: Colors.surface,
        gap: 12,
    },

    headerTitle: {
        ...Typography.headlineMedium,
    },
    headerSubtitle: {
        fontSize: 13,
        color: Colors.muted,
        marginTop: 2,
    },
    scrollView: {
        flex: 1
    },
    content: {
        paddingTop: Spacing.lg
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.xl,
        marginBottom: Spacing.md,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: Colors.heading,
    },
    sectionMeta: {
        fontSize: 12,
        color: Colors.muted,
    },
    dateRow: {
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.sm,
        gap: 12
    },
    dateCard: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.xl,
        padding: Spacing.md,
        alignItems: 'center',
        minWidth: 70,
        height: 100,
        justifyContent: 'center',
        ...Shadows.sm,
        position: 'relative',
    },
    dateCardSelected: {
        backgroundColor: Colors.primaryBlue,
        ...Shadows.glow,
    },
    activeIndicator: {
        position: 'absolute',
        bottom: 6,
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.white,
    },
    dateDayName: {
        fontSize: 12,
        color: Colors.muted,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    dateDayNum: {
        fontSize: 24,
        fontWeight: '800',
        color: Colors.heading,
        marginVertical: 4
    },
    dateMonth: {
        fontSize: 12,
        color: Colors.muted,
        fontWeight: '600'
    },
    dateTextSelected: {
        color: Colors.white
    },

    timeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.primaryUltraLight,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: BorderRadius.round,
    },
    timeBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: Colors.primaryBlue,
    },

    slotGroup: {
        paddingHorizontal: Spacing.xl,
        marginBottom: Spacing.xl
    },
    slotGroupHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: Spacing.md,
    },
    titleIcon: {
        width: 32,
        height: 32,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    slotGroupTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.heading,
    },
    slotsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    slotChip: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 1.5,
        borderColor: Colors.border,
        minWidth: '22%',
        alignItems: 'center',
        ...Shadows.xs,
    },
    slotChipSelected: {
        backgroundColor: Colors.primaryUltraLight,
        borderColor: Colors.primaryBlue,
    },
    slotText: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.paragraph,
    },
    slotTextSelected: {
        color: Colors.primaryBlue,
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: Spacing.xl,
        paddingBottom: Platform.OS === 'ios' ? 34 : 20,
        backgroundColor: Colors.surface,
        borderTopWidth: 1,
        borderTopColor: Colors.divider,
        ...Shadows.lg,
    },
});
