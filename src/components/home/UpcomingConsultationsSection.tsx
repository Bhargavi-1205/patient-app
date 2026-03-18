import React from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { cancelAppointment } from "../../store/slices/appointmentsSlice";
import { useAppDispatch, useAppSelector } from "../../store";
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from "../../config/theme";
import FlutterSvgIcon from "../common/FlutterSvgIcon";
import ActionModal from "../ui/ActionModal";
import { ROUTES } from "../../config/constants";

interface Props {
  navigation: any;
}

type UpcomingConsultation = {
  id: string;
  doctorId: string;
  doctorName: string;
  patientName?: string;
  visitingPatientName?: string;
  doctorSpecialization?: string;
  date: string;
  time?: string;
  status?: string;
  clinicId?: string;
  patientId?: string;
  consultationId?: string;
  [key: string]: any;
};

const formatConsultationDate = (dateValue?: string): string => {
  if (!dateValue) {
    return "Consultation date pending";
  }

  const yyyyMmDdMatch = dateValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (yyyyMmDdMatch) {
    const [, year, month, day] = yyyyMmDdMatch;
    const parsed = new Date(Number(year), Number(month) - 1, Number(day));
    return parsed.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  const ddMmYyyyMatch = dateValue.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (ddMmYyyyMatch) {
    const [, day, month, year] = ddMmYyyyMatch;
    const parsed = new Date(Number(year), Number(month) - 1, Number(day));
    return parsed.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  const parsedValue = Date.parse(dateValue);
  if (!Number.isNaN(parsedValue)) {
    return new Date(parsedValue).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  return dateValue;
};

const getPatientName = (appointment: UpcomingConsultation): string =>
  appointment.patientName || appointment.visitingPatientName || "Patient";

const getDoctorName = (appointment: UpcomingConsultation): string => {
  const doctorName = (appointment.doctorName || "").trim();
  if (!doctorName) {
    return "Doctor information pending";
  }

  if (doctorName.toLowerCase().startsWith("dr.")) {
    return doctorName;
  }

  return `Dr. ${doctorName}`;
};

const formatConsultationTime = (timeValue?: string): string => {
  if (!timeValue) {
    return "";
  }

  const trimmedTime = timeValue.trim();
  if (!trimmedTime) {
    return "";
  }

  const amPmMatch = trimmedTime.match(
    /^(\d{1,2}):(\d{2})(?::\d{2})?\s*([AaPp][Mm])$/,
  );
  if (amPmMatch) {
    const [, hourPart, minutePart, suffixPart] = amPmMatch;
    const normalizedHour = Number(hourPart);
    if (Number.isFinite(normalizedHour) && normalizedHour >= 0 && normalizedHour <= 23) {
      const hour12 = normalizedHour % 12 || 12;
      return `${hour12}:${minutePart} ${suffixPart.toUpperCase()}`;
    }
  }

  const hhMmSsMatch = trimmedTime.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (hhMmSsMatch) {
    const [, hourPart, minutePart] = hhMmSsMatch;
    const hour24 = Number(hourPart);
    if (Number.isFinite(hour24) && hour24 >= 0 && hour24 <= 23) {
      const suffix = hour24 >= 12 ? "PM" : "AM";
      const hour12 = hour24 % 12 || 12;
      return `${hour12}:${minutePart} ${suffix}`;
    }
  }

  const parsedTime = Date.parse(`1970-01-01T${trimmedTime}`);
  if (!Number.isNaN(parsedTime)) {
    return new Date(parsedTime).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  return trimmedTime;
};

const formatConsultationDateLabel = (
  appointment: UpcomingConsultation,
): string => {
  const dateLabel = formatConsultationDate(appointment.date);
  const timeLabel = formatConsultationTime(appointment.time);

  if (!timeLabel) {
    return `Consultation Date: ${dateLabel}`;
  }

  return `${dateLabel}, ${timeLabel}`;
};

export default function UpcomingConsultationsSection({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const { upcoming, loading } = useAppSelector((state) => state.appointments);
  const [selectedAppointment, setSelectedAppointment] =
    React.useState<UpcomingConsultation | null>(null);
  const [showManageModal, setShowManageModal] = React.useState(false);
  const [showCancelConfirmModal, setShowCancelConfirmModal] =
    React.useState(false);

  const activeConsultations = React.useMemo(
    () =>
      (upcoming as UpcomingConsultation[]).filter((appointment) => {
        const status = appointment.status?.toLowerCase();
        return status !== "cancelled" && status !== "canceled";
      }),
    [upcoming],
  );

  const handleOpenManageModal = (appointment: UpcomingConsultation) => {
    setSelectedAppointment(appointment);
    setShowManageModal(true);
  };

  const handleCloseManageModal = () => {
    setShowManageModal(false);
  };

  const handleOpenCancelConfirm = () => {
    setShowManageModal(false);
    setTimeout(() => setShowCancelConfirmModal(true), 150);
  };

  const handleCancelConfirmModalClose = () => {
    setShowCancelConfirmModal(false);
  };

  const handleCancelAppointment = () => {
    if (!selectedAppointment) {
      setShowCancelConfirmModal(false);
      return;
    }

    const clinicId =
      selectedAppointment.clinicId || selectedAppointment.clinic_id || "";
    const doctorId =
      selectedAppointment.doctorId || selectedAppointment.doctor_id || "";
    const appointmentId =
      selectedAppointment.id || selectedAppointment.consultationId || "";

    if (!clinicId || !doctorId || !appointmentId) {
      Alert.alert(
        "Unable to cancel",
        "Missing appointment details. Please refresh and try again.",
      );
      setShowCancelConfirmModal(false);
      setSelectedAppointment(null);
      return;
    }

    dispatch(
      cancelAppointment({
        clinicId,
        doctorId,
        appointmentId,
      }),
    );
    setShowCancelConfirmModal(false);
    setSelectedAppointment(null);
  };

  const handleRescheduleAppointment = () => {
    if (!selectedAppointment) {
      return;
    }

    navigation.navigate(ROUTES.BOOKING_FLOW, {
      appointmentId: selectedAppointment.id,
      consultationId:
        selectedAppointment.consultationId || selectedAppointment.id,
      doctorName: selectedAppointment.doctorName,
      doctorId: selectedAppointment.doctorId,
      clinicId: selectedAppointment.clinicId,
      patientId: selectedAppointment.patientId,
      reasonToVisit: "Reschedule",
    });
  };

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.titleRow}>
          <View style={styles.titleDot} />
          <Text style={styles.sectionTitle}>Upcoming Consultation</Text>
        </View>
        {activeConsultations.length > 1 ? (
          <Text style={styles.countText}>
            {activeConsultations.length} appointments
          </Text>
        ) : null}
      </View>

      {loading ? (
        <View style={styles.loadingCard}>
          <ActivityIndicator size="small" color={Colors.primaryBlue} />
          <Text style={styles.loadingText}>Loading appointments...</Text>
        </View>
      ) : activeConsultations.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cardsContainer}
        >
          {activeConsultations.map((appointment) => (
            <TouchableOpacity
              key={appointment.id}
              activeOpacity={0.85}
              style={styles.appointmentCard}
              onPress={() => handleOpenManageModal(appointment)}
            >
              <View style={styles.cardTopRow}>
                <View style={styles.iconWrap}>
                  <FlutterSvgIcon
                    name="doctorMale"
                    size={20}
                    color={Colors.white}
                  />
                </View>
                <View style={styles.cardTopInfo}>
                  <Text style={styles.doctorName} numberOfLines={1}>
                    {getPatientName(appointment)}
                  </Text>
                  <View style={styles.dateTimeRow}>
                    {/* <FlutterSvgIcon name="calendar" size={12} color="white" /> */}
                    <Text style={styles.dateTimeText} numberOfLines={1}>
                      {formatConsultationDateLabel(appointment)}
                    </Text>
                  </View>
                </View>
              </View>

              <Text style={styles.specializationText} numberOfLines={1}>
                {getDoctorName(appointment)}
              </Text>
              <Text style={styles.typeText}>Consultation</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIconCircle}>
            <FlutterSvgIcon
              name="calendar"
              size={26}
              color={Colors.primaryBlue}
            />
          </View>
          <Text style={styles.emptyTitle}>No upcoming consultation</Text>
          <Text style={styles.emptyText}>
            Book an appointment with your doctor
          </Text>
        </View>
      )}

      <ActionModal
        visible={showManageModal}
        onClose={handleCloseManageModal}
        title="Manage Appointment"
        subtitle="Please choose an action for your appointment"
        options={[
          {
            label: "Reschedule Appointment",
            icon: "calendar",
            onPress: handleRescheduleAppointment,
            color: Colors.warning,
          },
          {
            label: "Cancel Appointment",
            icon: "false",
            onPress: handleOpenCancelConfirm,
            color: Colors.error,
            isDanger: true,
          },
        ]}
      />

      <ActionModal
        visible={showCancelConfirmModal}
        onClose={handleCancelConfirmModalClose}
        title="Confirm Cancellation"
        subtitle="Are you sure you want to cancel this appointment?"
        options={[
          {
            label: "Yes, Cancel Appointment",
            icon: "false",
            onPress: handleCancelAppointment,
            color: Colors.error,
            isDanger: true,
          },
          {
            label: "Keep Appointment",
            icon: "calendar",
            onPress: () => {
              setShowCancelConfirmModal(false);
              setShowManageModal(true);
            },
            color: Colors.primaryBlue,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: Spacing.xxl,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  titleDot: {
    width: 4,
    height: 20,
    borderRadius: 2,
    backgroundColor: Colors.primaryBlue,
  },
  sectionTitle: {
    ...Typography.headlineSmall,
    fontSize: 17,
  },
  countText: {
    ...Typography.bodySmall,
    color: Colors.muted,
    fontWeight: "600",
  },
  cardsContainer: {
    gap: 10,
    paddingRight: 4,
  },
  appointmentCard: {
    width: 258,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.primaryBlue,
    padding: Spacing.md,
    ...Shadows.md,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  cardTopInfo: {
    flex: 1,
    gap: 4,
  },
  doctorName: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
  dateTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dateTimeText: {
    color: "#D9ECFF",
    fontSize: 11,
    fontWeight: "600",
    flex: 1,
  },
  specializationText: {
    color: "#EAF4FF",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 10,
  },
  typeText: {
    color: "#B9DAFF",
    fontSize: 11,
    marginTop: 2,
    fontWeight: "500",
  },
  loadingCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxl,
    alignItems: "center",
    gap: 10,
    ...Shadows.sm,
  },
  loadingText: {
    ...Typography.bodySmall,
    color: Colors.muted,
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxl,
    alignItems: "center",
    ...Shadows.sm,
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.primaryUltraLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.heading,
    marginBottom: 4,
  },
  emptyText: {
    ...Typography.bodySmall,
    color: Colors.muted,
    textAlign: "center",
  },
});
