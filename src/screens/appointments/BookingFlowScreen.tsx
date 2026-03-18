import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Platform,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../../store';
import {
    bookAppointment,
    cancelAppointment,
    fetchAppointmentHistory,
    fetchUpcomingAppointments,
    resetBookingState,
    rescheduleAppointment,
} from '../../store/slices/appointmentsSlice';
import { fetchAllPatients, Patient } from '../../store/slices/patientSlice';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../config/theme';
import { ROUTES } from '../../config/constants';
import FlutterSvgIcon from '../../components/common/FlutterSvgIcon';
import GradientButton from '../../components/ui/GradientButton';

const SLOT_OPTIONS = {
    morning: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30'],
    afternoon: ['12:00', '12:30', '14:00', '14:30', '15:00', '15:30'],
    evening: ['16:00', '16:30', '17:00', '17:30', '18:00'],
} as const;

const SLOT_LABELS: Record<keyof typeof SLOT_OPTIONS, string> = {
    morning: 'Morning',
    afternoon: 'Afternoon',
    evening: 'Evening',
};

const MAX_MONTH_OFFSET = 12;

type SlotPeriod = keyof typeof SLOT_OPTIONS;

const pad2 = (value: number) => String(value).padStart(2, '0');

const formatDateKey = (date: Date) =>
    `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

const parseDateKeyToLocalDate = (dateKey: string): Date | null => {
    const match = dateKey.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return null;
    const [, year, month, day] = match;
    const parsed = new Date(Number(year), Number(month) - 1, Number(day));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getInitialDate = (incomingDate?: string | Date) => {
    if (incomingDate instanceof Date) return formatDateKey(incomingDate);
    if (typeof incomingDate === 'string' && incomingDate.trim().length > 0) {
        const fromKey = parseDateKeyToLocalDate(incomingDate);
        if (fromKey) return formatDateKey(fromKey);
        const parsed = Date.parse(incomingDate);
        if (!Number.isNaN(parsed)) return formatDateKey(new Date(parsed));
        return incomingDate;
    }
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return formatDateKey(tomorrow);
};

const toUnixTimestamp = (dateKey: string, slot: string): number | null => {
    const date = parseDateKeyToLocalDate(dateKey);
    if (!date) return null;

    const timeMatch = slot.trim().match(/^(\d{1,2}):(\d{2})$/);
    if (!timeMatch) return null;

    const hour = Number(timeMatch[1]);
    const minute = Number(timeMatch[2]);
    if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;

    date.setHours(hour, minute, 0, 0);
    return Math.floor(date.getTime() / 1000);
};

export default function BookingFlowScreen({ route, navigation }: any) {
    const {
        doctorName = 'Doctor',
        doctorId,
        consultationId,
        appointmentId,
        clinicId = '',
        patientId = '',
        reasonToVisit = 'Consultation',
        preselectedDate,
    } = route.params || {};

    const isRescheduleIntent = String(reasonToVisit).toLowerCase() === 'reschedule';

    const shouldPreselectPatient =
        String(reasonToVisit).toLowerCase().includes('follow') || isRescheduleIntent;

    const resolvedDoctorId = doctorId || consultationId || '';

    const dispatch = useAppDispatch();
    const { bookingLoading, bookingSuccess, bookingError, bookingErrorMeta } = useAppSelector((state) => state.appointments);
    const {
        patients,
        loading: patientsLoading,
        error: patientsError,
    } = useAppSelector((state) => state.patient);

    const [selectedDate, setSelectedDate] = useState<string>(getInitialDate(preselectedDate));
    const [selectedSlot, setSelectedSlot] = useState<string>('');
    const [selectedPatientId, setSelectedPatientId] = useState<string>(
        shouldPreselectPatient ? (patientId || '') : '',
    );
    const [monthOffset, setMonthOffset] = useState(0);
    const [slotPeriod, setSlotPeriod] = useState<SlotPeriod>('morning');
    const [isDuplicateRescheduleFlow, setIsDuplicateRescheduleFlow] = useState(false);

    const monthAnchor = useMemo(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
    }, [monthOffset]);

    const monthLabel = useMemo(
        () => monthAnchor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        [monthAnchor],
    );

    const selectedDateLabel = useMemo(() => {
        const localDate = parseDateKeyToLocalDate(selectedDate);
        if (!localDate) return selectedDate;
        return localDate.toLocaleDateString('en-US', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
        });
    }, [selectedDate]);

    const selectedPatient = useMemo(
        () => patients.find((patient) => patient.id === selectedPatientId),
        [patients, selectedPatientId],
    );

    const contextualBookingError = useMemo(() => {
        if (!bookingError) return '';

        const patientLabel = selectedPatient?.name || 'the selected patient';
        const doctorLabel = doctorName || 'the selected doctor';
        const localDate = parseDateKeyToLocalDate(selectedDate);
        const formattedDate = localDate
            ? `${pad2(localDate.getDate())}-${pad2(localDate.getMonth() + 1)}-${localDate.getFullYear()}`
            : selectedDate;

        const lowerError = bookingError.toLowerCase();
        const hasExistingAppointmentPayload = Boolean(
            bookingErrorMeta?.data?._id ||
            bookingErrorMeta?.data?.consultation_id ||
            bookingErrorMeta?._id ||
            bookingErrorMeta?.consultation_id,
        );

        if (lowerError.includes('slot is already booked')) {
            return 'Appointment slot is already booked, please select a different date or time.';
        }

        if (
            hasExistingAppointmentPayload &&
            (lowerError.includes('already exists') ||
            lowerError.includes('already booked') ||
            lowerError.includes('duplicate')
        )) {
            return `Appointment already exists for ${patientLabel} with Dr. ${doctorLabel} on ${formattedDate}.`;
        }

        return `${bookingError} Patient: ${patientLabel}. Doctor: Dr. ${doctorLabel}.`;
    }, [bookingError, bookingErrorMeta, doctorName, selectedDate, selectedPatient]);

    const duplicateBookingMessage = useMemo(() => {
        if (!bookingError) return '';

        const lowerError = bookingError.toLowerCase();
        const hasExistingAppointmentPayload = Boolean(
            bookingErrorMeta?.data?._id ||
            bookingErrorMeta?.data?.consultation_id ||
            bookingErrorMeta?._id ||
            bookingErrorMeta?.consultation_id,
        );
        const isDuplicateError =
            hasExistingAppointmentPayload &&
            (
                lowerError.includes('already exists') ||
                lowerError.includes('already booked') ||
                lowerError.includes('duplicate')
            );

        if (!isDuplicateError) return '';

        const patientLabel = selectedPatient?.name || 'the selected patient';
        const doctorLabel = doctorName || 'the selected doctor';
        const localDate = parseDateKeyToLocalDate(selectedDate);
        const formattedDate = localDate
            ? `${pad2(localDate.getDate())}-${pad2(localDate.getMonth() + 1)}-${localDate.getFullYear()}`
            : selectedDate;

        const [hourString = '0', minuteString = '00'] = (selectedSlot || '').split(':');
        const hour24 = Number(hourString);
        const minute = minuteString.padStart(2, '0');
        const period = hour24 >= 12 ? 'PM' : 'AM';
        const hour12 = hour24 % 12 || 12;
        const formattedTime = selectedSlot ? `${hour12}:${minute} ${period}` : '';

        return `An appointment already exists for ${patientLabel} with Dr. ${doctorLabel} on ${formattedDate}${formattedTime ? ` at ${formattedTime}` : ''}.`;
    }, [bookingError, bookingErrorMeta, doctorName, selectedDate, selectedPatient, selectedSlot]);

    const handleDuplicateReschedule = useCallback(() => {
        const existingAppointment =
            bookingErrorMeta?.data ||
            bookingErrorMeta ||
            null;
        const existingAppointmentId =
            existingAppointment?._id ||
            existingAppointment?.consultation_id ||
            '';
        const existingClinicId =
            existingAppointment?.clinic_id ||
            clinicId;
        const existingDoctorId =
            existingAppointment?.doctor_id ||
            resolvedDoctorId;
        const existingTimestamp = Number(existingAppointment?.apt_timestamp || 0);
        const requestedTimestamp = toUnixTimestamp(selectedDate, selectedSlot);

        if (!existingAppointmentId || !selectedPatientId) {
            setIsDuplicateRescheduleFlow(false);
            dispatch(resetBookingState());
            return;
        }

        if (requestedTimestamp && existingTimestamp === requestedTimestamp) {
            setIsDuplicateRescheduleFlow(true);
            dispatch(fetchUpcomingAppointments());
            dispatch(fetchAppointmentHistory());
            dispatch(resetBookingState());

            Alert.alert(
                'Success',
                'Appointment rescheduled successfully.',
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            setIsDuplicateRescheduleFlow(false);
                            navigation.reset({
                                index: 0,
                                routes: [{ name: ROUTES.MAIN_TABS }],
                            });
                        },
                    },
                ],
                { cancelable: false },
            );
            return;
        }

        const runDuplicateReschedule = async () => {
            try {
                setIsDuplicateRescheduleFlow(true);
                dispatch(resetBookingState());

                await dispatch(
                    cancelAppointment({
                        clinicId: existingClinicId,
                        doctorId: existingDoctorId,
                        appointmentId: existingAppointmentId,
                    }),
                ).unwrap();

                await dispatch(
                    bookAppointment({
                        doctorId: resolvedDoctorId,
                        clinicId,
                        date: selectedDate,
                        time: selectedSlot,
                        patientId: selectedPatientId,
                        reasonToVisit,
                        appointmentDate: toUnixTimestamp(selectedDate, selectedSlot) || undefined,
                    }),
                ).unwrap();
            } catch (error: any) {
                setIsDuplicateRescheduleFlow(false);
                Alert.alert(
                    'Unable to Reschedule',
                    String(error?.message || error || 'Please try a different slot.'),
                );
            }
        };

        runDuplicateReschedule();
    }, [
        bookingErrorMeta,
        clinicId,
        dispatch,
        navigation,
        reasonToVisit,
        resolvedDoctorId,
        selectedDate,
        selectedPatientId,
        selectedSlot,
    ]);

    const handleDuplicateCancel = useCallback(() => {
        const existingAppointment =
            bookingErrorMeta?.data ||
            bookingErrorMeta ||
            null;
        const existingAppointmentId =
            existingAppointment?._id ||
            existingAppointment?.consultation_id ||
            '';
        const existingClinicId =
            existingAppointment?.clinic_id ||
            clinicId;
        const existingDoctorId =
            existingAppointment?.doctor_id ||
            resolvedDoctorId;

        if (!existingAppointmentId) {
            dispatch(resetBookingState());
            return;
        }

        const runDuplicateCancel = async () => {
            try {
                dispatch(resetBookingState());

                await dispatch(
                    cancelAppointment({
                        clinicId: existingClinicId,
                        doctorId: existingDoctorId,
                        appointmentId: existingAppointmentId,
                    }),
                ).unwrap();

                dispatch(fetchUpcomingAppointments());
                dispatch(fetchAppointmentHistory());

                Alert.alert('Success', 'Appointment cancelled successfully.');
            } catch (error: any) {
                Alert.alert(
                    'Unable to Cancel',
                    String(error?.message || error || 'Please try again.'),
                );
            }
        };

        runDuplicateCancel();
    }, [bookingErrorMeta, clinicId, dispatch, resolvedDoctorId]);

    useEffect(() => {
        if (!duplicateBookingMessage) return;

        Alert.alert(
            '',
            duplicateBookingMessage,
            [
                {
                    text: 'Reschedule',
                    onPress: handleDuplicateReschedule,
                },
                {
                    text: 'Cancel',
                    style: 'cancel',
                    onPress: handleDuplicateCancel,
                },
            ],
            { cancelable: true },
        );
    }, [dispatch, duplicateBookingMessage, handleDuplicateCancel, handleDuplicateReschedule]);

    const monthDateOptions = useMemo(() => {
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const currentYear = monthAnchor.getFullYear();
        const currentMonth = monthAnchor.getMonth();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const dates: Date[] = [];

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentYear, currentMonth, day);
            if (date >= todayStart) {
                dates.push(date);
            }
        }

        return dates;
    }, [monthAnchor]);

    const activeSlots = SLOT_OPTIONS[slotPeriod];

    useEffect(() => {
        if (!bookingSuccess) return;
        Alert.alert(
            'Success',
            (isRescheduleIntent || isDuplicateRescheduleFlow)
                ? 'Appointment rescheduled successfully.'
                : 'Appointment booked successfully.',
            [
                {
                    text: 'OK',
                    onPress: () => {
                        dispatch(fetchUpcomingAppointments());
                        dispatch(fetchAppointmentHistory());
                        setIsDuplicateRescheduleFlow(false);
                        dispatch(resetBookingState());
                        if (isRescheduleIntent || isDuplicateRescheduleFlow) {
                            navigation.reset({
                                index: 0,
                                routes: [{ name: ROUTES.MAIN_TABS }],
                            });
                            return;
                        }

                        navigation.navigate(ROUTES.APPOINTMENT_HISTORY);
                    },
                },
            ],
            { cancelable: false },
        );
    }, [bookingSuccess, dispatch, isDuplicateRescheduleFlow, isRescheduleIntent, navigation]);

    useFocusEffect(
        useCallback(() => {
            setIsDuplicateRescheduleFlow(false);
            dispatch(resetBookingState());
            dispatch(fetchAllPatients());
        }, [dispatch]),
    );

    useEffect(
        () => () => {
            dispatch(resetBookingState());
        },
        [dispatch],
    );

    useEffect(() => {
        if (!shouldPreselectPatient || !patientId || selectedPatientId) return;
        setSelectedPatientId(patientId);
    }, [patientId, selectedPatientId, shouldPreselectPatient]);

    useEffect(() => {
        if (monthDateOptions.length === 0) return;
        const isSelectedDateInMonth = monthDateOptions.some((date) => formatDateKey(date) === selectedDate);
        if (!isSelectedDateInMonth) {
            setSelectedDate(formatDateKey(monthDateOptions[0]));
        }
    }, [monthDateOptions, selectedDate]);

    const onSelectDate = useCallback((dateKey: string) => {
        setSelectedDate(dateKey);
    }, []);

    const onSelectSlot = useCallback((slot: string) => {
        setSelectedSlot(slot);
    }, []);

    const onSelectPatient = useCallback((id: string) => {
        setSelectedPatientId(id);
    }, []);

    const onSelectSlotPeriod = useCallback((period: SlotPeriod) => {
        setSlotPeriod(period);
    }, []);

    const goToPreviousMonth = useCallback(() => {
        setMonthOffset((prev) => Math.max(0, prev - 1));
    }, []);

    const goToNextMonth = useCallback(() => {
        setMonthOffset((prev) => Math.min(MAX_MONTH_OFFSET, prev + 1));
    }, []);

    const onConfirmBooking = useCallback(() => {
        if (!selectedDate || !selectedSlot || !selectedPatientId) return;

        if (isRescheduleIntent) {
            const resolvedAppointmentId = appointmentId || consultationId || '';
            const timestamp = toUnixTimestamp(selectedDate, selectedSlot);

            if (!resolvedAppointmentId || !timestamp) return;

            dispatch(
                rescheduleAppointment({
                    appointmentId: resolvedAppointmentId,
                    patientId: selectedPatientId,
                    appointmentDate: timestamp,
                }),
            );
            return;
        }

        if (!resolvedDoctorId || !clinicId) return;

        dispatch(
            bookAppointment({
                doctorId: resolvedDoctorId,
                clinicId,
                date: selectedDate,
                time: selectedSlot,
                patientId: selectedPatientId,
                reasonToVisit,
                appointmentDate: toUnixTimestamp(selectedDate, selectedSlot) || undefined,
            }),
        );
    }, [
        appointmentId,
        clinicId,
        consultationId,
        dispatch,
        isRescheduleIntent,
        reasonToVisit,
        resolvedDoctorId,
        selectedDate,
        selectedPatientId,
        selectedSlot,
    ]);

    const renderDateCard = useCallback(
        (date: Date) => {
            const dateKey = formatDateKey(date);
            const isSelected = selectedDate === dateKey;
            const day = date.toLocaleDateString('en-US', { weekday: 'short' });
            const dayNumber = date.getDate();
            const month = date.toLocaleDateString('en-US', { month: 'short' });

            return (
                <TouchableOpacity
                    key={dateKey}
                    style={[styles.dateCard, isSelected && styles.dateCardSelected]}
                    onPress={() => onSelectDate(dateKey)}
                    activeOpacity={0.8}>
                    <Text style={[styles.dateDay, isSelected && styles.dateTextSelected]}>{day}</Text>
                    <Text style={[styles.dateNumber, isSelected && styles.dateTextSelected]}>{dayNumber}</Text>
                    <Text style={[styles.dateMonth, isSelected && styles.dateTextSelected]}>{month}</Text>
                </TouchableOpacity>
            );
        },
        [onSelectDate, selectedDate],
    );

    const renderPatientChip = useCallback(
        (patient: Patient) => {
            const isSelected = selectedPatientId === patient.id;
            const ageLabel = patient.age > 0 ? `, ${patient.age}y` : '';

            return (
                <TouchableOpacity
                    key={patient.id || patient.name}
                    style={[
                        styles.patientChip,
                        isSelected && styles.patientChipSelected,
                    ]}
                    onPress={() => onSelectPatient(patient.id)}
                    activeOpacity={0.8}>
                    <Text
                        style={[
                            styles.patientChipText,
                            isSelected && styles.patientChipTextSelected,
                        ]}>
                        {`${patient.name}${ageLabel}`}
                    </Text>
                </TouchableOpacity>
            );
        },
        [onSelectPatient, selectedPatientId],
    );

    const showPatientSelection = Boolean(selectedDate && selectedSlot);

    const isConfirmDisabled =
        !selectedDate ||
        !selectedSlot ||
        !selectedPatientId ||
        (isRescheduleIntent ? !(appointmentId || consultationId) : (!resolvedDoctorId || !clinicId)) ||
        bookingLoading;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.7}>
                    <FlutterSvgIcon name="back" size={16} color={Colors.heading} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>Book Appointment</Text>
                    <Text style={styles.headerSubtitle} numberOfLines={1}>
                        {doctorName}
                    </Text>
                </View>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}>
                <View style={styles.sectionCard}>
                    <View style={styles.sectionHead}>
                        <Text style={styles.sectionTitle}>Date</Text>
                        <Text style={styles.sectionValue}>{selectedDateLabel}</Text>
                    </View>
                    <View style={styles.monthSwitcher}>
                        <TouchableOpacity
                            style={[
                                styles.monthSwitchBtn,
                                monthOffset === 0 && styles.monthSwitchBtnDisabled,
                            ]}
                            onPress={goToPreviousMonth}
                            disabled={monthOffset === 0}
                            activeOpacity={0.7}>
                            <FlutterSvgIcon
                                name="back"
                                size={14}
                                color={monthOffset === 0 ? Colors.placeholder : Colors.heading}
                            />
                        </TouchableOpacity>
                        <Text style={styles.monthLabel}>{monthLabel}</Text>
                        <TouchableOpacity
                            style={[
                                styles.monthSwitchBtn,
                                monthOffset >= MAX_MONTH_OFFSET && styles.monthSwitchBtnDisabled,
                            ]}
                            onPress={goToNextMonth}
                            disabled={monthOffset >= MAX_MONTH_OFFSET}
                            activeOpacity={0.7}>
                            <FlutterSvgIcon
                                name="forward"
                                size={14}
                                color={monthOffset >= MAX_MONTH_OFFSET ? Colors.placeholder : Colors.heading}
                            />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.dateRow}>
                        {monthDateOptions.map(renderDateCard)}
                    </ScrollView>
                </View>

                <View style={styles.sectionCard}>
                    <View style={styles.sectionHead}>
                        <Text style={styles.sectionTitle}>Slot</Text>
                        <Text style={styles.sectionValue}>
                            {selectedSlot ? selectedSlot : 'Not selected'}
                        </Text>
                    </View>

                    <View style={styles.periodTabs}>
                        {(Object.keys(SLOT_OPTIONS) as SlotPeriod[]).map((period) => {
                            const isActive = slotPeriod === period;
                            return (
                                <TouchableOpacity
                                    key={period}
                                    style={[
                                        styles.periodTab,
                                        isActive && styles.periodTabActive,
                                    ]}
                                    onPress={() => onSelectSlotPeriod(period)}
                                    activeOpacity={0.8}>
                                    <Text
                                        style={[
                                            styles.periodTabText,
                                            isActive && styles.periodTabTextActive,
                                        ]}>
                                        {SLOT_LABELS[period]}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    <View style={styles.slotGrid}>
                        {activeSlots.map((slot) => {
                            const isSelected = selectedSlot === slot;
                            return (
                                <TouchableOpacity
                                    key={slot}
                                    style={[styles.slotChip, isSelected && styles.slotChipSelected]}
                                    onPress={() => onSelectSlot(slot)}
                                    activeOpacity={0.8}>
                                    <Text style={[styles.slotText, isSelected && styles.slotTextSelected]}>
                                        {slot}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {showPatientSelection ? (
                    <View style={styles.sectionCard}>
                        <View style={styles.sectionHead}>
                            <Text style={styles.sectionTitle}>Please select a patient</Text>
                            <Text style={styles.sectionValueSmall}>
                                {selectedPatientId ? 'Selected' : 'Required'}
                            </Text>
                        </View>

                        {patientsLoading ? (
                            <View style={styles.patientLoading}>
                                <ActivityIndicator size="small" color={Colors.primaryBlue} />
                                <Text style={styles.patientLoadingText}>Loading patients...</Text>
                            </View>
                        ) : patients.length > 0 ? (
                            <View style={styles.patientGrid}>
                                {patients.map(renderPatientChip)}
                            </View>
                        ) : (
                            <View style={styles.patientHintBox}>
                                <Text style={styles.patientHintText}>
                                    No patients found. Please add a patient from profile first.
                                </Text>
                            </View>
                        )}

                        {!selectedPatientId && patients.length > 0 ? (
                            <Text style={styles.inlineHint}>Select one patient to enable booking.</Text>
                        ) : null}

                        {!patientsLoading && patients.length === 0 && patientsError ? (
                            <Text style={styles.inlineHint}>{patientsError}</Text>
                        ) : null}
                    </View>
                ) : null}

                {bookingError && !duplicateBookingMessage ? (
                    <View style={styles.errorBox}>
                        <FlutterSvgIcon name="false" size={14} color={Colors.error} />
                        <Text style={styles.errorText}>{contextualBookingError}</Text>
                    </View>
                ) : null}
            </ScrollView>

            <View style={styles.bottomBar}>
                <GradientButton
                    title={bookingLoading ? 'Processing...' : (isRescheduleIntent ? 'Confirm Reschedule' : 'Confirm Appointment')}
                    onPress={onConfirmBooking}
                    disabled={isConfirmDisabled}
                    icon={
                        bookingLoading ? (
                            <ActivityIndicator size="small" color={Colors.white} />
                        ) : (
                            <FlutterSvgIcon name="verified" size={18} color={Colors.white} />
                        )
                    }
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: Platform.OS === 'ios' ? 56 : 40,
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.md,
        backgroundColor: Colors.surface,
    },
    backButton: {
        width: 34,
        height: 34,
        borderRadius: 10,
        backgroundColor: Colors.surfaceSecondary,
        borderWidth: 1,
        borderColor: Colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },

    headerCenter: {
        flex: 1,
        marginLeft: 12,
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
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.md,
        paddingBottom: Spacing.md,
        gap: 10,
    },
    sectionCard: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.xl,
        padding: 12,
        ...Shadows.xs,
    },
    sectionHead: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.heading,
    },
    sectionValue: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.primaryBlue,
    },
    sectionValueSmall: {
        fontSize: 11,
        fontWeight: '700',
        color: Colors.primaryBlue,
    },
    monthSwitcher: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    monthSwitchBtn: {
        width: 30,
        height: 30,
        borderRadius: 9,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.surfaceSecondary,
        borderWidth: 1,
        borderColor: Colors.divider,
    },
    monthSwitchBtnDisabled: {
        opacity: 0.6,
    },
    monthLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.heading,
    },
    dateRow: {
        gap: 8,
    },
    dateCard: {
        width: 62,
        borderRadius: BorderRadius.lg,
        backgroundColor: Colors.surfaceSecondary,
        alignItems: 'center',
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: Colors.divider,
    },
    dateCardSelected: {
        backgroundColor: Colors.primaryBlue,
        borderColor: Colors.primaryBlue,
    },
    dateDay: {
        fontSize: 11,
        color: Colors.muted,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    dateNumber: {
        fontSize: 20,
        color: Colors.heading,
        fontWeight: '800',
        marginVertical: 1,
    },
    dateMonth: {
        fontSize: 11,
        color: Colors.muted,
        fontWeight: '600',
    },
    dateTextSelected: {
        color: Colors.white,
    },
    periodTabs: {
        flexDirection: 'row',
        backgroundColor: Colors.surfaceSecondary,
        borderRadius: BorderRadius.lg,
        padding: 4,
        marginBottom: 10,
        gap: 4,
    },
    periodTab: {
        flex: 1,
        paddingVertical: 7,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
    },
    periodTabActive: {
        backgroundColor: Colors.primaryBlue,
    },
    periodTabText: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.muted,
    },
    periodTabTextActive: {
        color: Colors.white,
    },
    slotGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    slotChip: {
        minWidth: '30%',
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.border,
        backgroundColor: Colors.surfaceSecondary,
        alignItems: 'center',
    },
    slotChipSelected: {
        backgroundColor: Colors.primaryUltraLight,
        borderColor: Colors.primaryBlue,
    },
    slotText: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.paragraph,
    },
    slotTextSelected: {
        color: Colors.primaryBlue,
    },
    patientLoading: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 4,
    },
    patientLoadingText: {
        fontSize: 12,
        color: Colors.muted,
        fontWeight: '500',
    },
    patientGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    patientChip: {
        width: '31%',
        paddingHorizontal: 8,
        paddingVertical: 8,
        marginBottom: 10,
        borderRadius: BorderRadius.round,
        borderWidth: 1,
        borderColor: Colors.primaryBlue,
        backgroundColor: Colors.surface,
        alignItems: 'center',
    },
    patientChipSelected: {
        backgroundColor: Colors.primaryBlue,
    },
    patientChipText: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.primaryBlue,
        textAlign: 'center',
    },
    patientChipTextSelected: {
        color: Colors.white,
    },
    inlineHint: {
        marginTop: 8,
        fontSize: 11,
        color: Colors.muted,
        fontWeight: '600',
    },
    patientHintBox: {
        borderRadius: BorderRadius.lg,
        backgroundColor: Colors.surfaceSecondary,
        paddingHorizontal: 10,
        paddingVertical: 8,
    },
    patientHintText: {
        fontSize: 12,
        color: Colors.muted,
        fontWeight: '600',
    },
    errorBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#FEE2E2',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: BorderRadius.lg,
    },
    errorText: {
        flex: 1,
        color: Colors.error,
        fontSize: 12,
        fontWeight: '600',
    },
    bottomBar: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.sm,
        paddingBottom: Platform.OS === 'ios' ? 32 : 16,
        backgroundColor: Colors.surface,
        borderTopWidth: 1,
        borderTopColor: Colors.divider,
        ...Shadows.sm,
    },
});
