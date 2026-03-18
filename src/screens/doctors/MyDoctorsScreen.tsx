// My Doctors Screen — Shows only doctors the user has consulted
// Pulls data from consultations and deduplicates by doctor
import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  RefreshControl,
  Platform,
  StatusBar,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppDispatch, useAppSelector } from "../../store";
import {
  fetchRecentConsultations,
  Consultation,
} from "../../store/slices/consultationsSlice";
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from "../../config/theme";
import { ROUTES } from "../../config/constants";
import { FLUTTER_PLACEHOLDER_IMAGES } from "../../config/flutterAssets";
import FlutterSvgIcon from "../../components/common/FlutterSvgIcon";

interface ConsultedDoctor {
  doctorId: string;
  doctorName: string;
  specialization: string;
  qualification: string;
  clinicId: string;
  clinicName: string;
  lastVisitedDate: string;
  photoUrl: string;
}

interface MyDoctorsScreenProps {
  navigation: any;
  showBackButton?: boolean;
  showCount?: boolean;
}

const normalizeSearchValue = (value: string): string =>
  value
    .toLowerCase()
    .replace(/dr\./g, "dr")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const formatDate = (dateStr: string): string => {
  if (!dateStr) return "";
  const parsed = Date.parse(dateStr);
  if (!Number.isNaN(parsed)) {
    const d = new Date(parsed);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  }
  return dateStr;
};

export default function MyDoctorsScreen({
  navigation,
  showBackButton = true,
  showCount = true,
}: MyDoctorsScreenProps) {
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const { recent, loading } = useAppSelector((state) => state.consultations);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (recent.length === 0) {
      dispatch(fetchRecentConsultations());
    }
  }, [dispatch, recent.length]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(fetchRecentConsultations());
    setRefreshing(false);
  }, [dispatch]);

  // Extract unique doctors from consultations
  const consultedDoctors = useMemo((): ConsultedDoctor[] => {
    const doctorMap = new Map<string, ConsultedDoctor>();

    // Sort by date descending so the latest consultation comes first
    const sorted = [...recent].sort((a, b) => {
      const da = Date.parse(a.date) || 0;
      const db = Date.parse(b.date) || 0;
      return db - da;
    });

    for (const c of sorted) {
      const key = c.doctorId?.trim() || c.doctorName?.trim().toLowerCase();
      if (!key || doctorMap.has(key)) continue;

      doctorMap.set(key, {
        doctorId: c.doctorId,
        doctorName: c.doctorName,
        specialization: c.specialization || "",
        qualification: c.doctorQualification || "",
        clinicId: c.clinicId || "",
        clinicName: c.clinicName || "",
        lastVisitedDate: c.date || "",
        photoUrl: c.doctorPhotoUrl || "",
      });
    }

    return Array.from(doctorMap.values());
  }, [recent]);

  // Filter by search
  const filteredDoctors = useMemo(() => {
    const q = normalizeSearchValue(searchQuery);
    if (!q) return consultedDoctors;

    return consultedDoctors.filter((doctor) => {
      const searchableText = normalizeSearchValue(
        [
          doctor.doctorName,
          `Dr ${doctor.doctorName}`,
          doctor.specialization,
          doctor.qualification,
          doctor.clinicName,
          formatDate(doctor.lastVisitedDate),
        ]
          .filter(Boolean)
          .join(" "),
      );

      return searchableText.includes(q);
    });
  }, [searchQuery, consultedDoctors]);

  const clearSearch = useCallback(() => setSearchQuery(""), []);

  const handleDoctorPress = useCallback(
    (doctor: ConsultedDoctor) => {
      navigation.navigate(ROUTES.BOOKING_FLOW, {
        consultationId: doctor.doctorId,
        doctorName: doctor.doctorName,
        doctorId: doctor.doctorId,
        clinicId: doctor.clinicId,
        reasonToVisit: "Follow-up Consultation",
      });
    },
    [navigation],
  );

  const renderDoctorCard = useCallback(
    ({ item }: { item: ConsultedDoctor }) => (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.75}
        onPress={() => handleDoctorPress(item)}
      >
        {/* Left accent */}
        <View style={styles.accentLine} />

        <View style={styles.cardInner}>
          <View style={styles.cardRow}>
            {/* Doctor Photo */}
            <View style={styles.avatarContainer}>
              {item.photoUrl ? (
                <Image source={{ uri: item.photoUrl }} style={styles.avatar} />
              ) : (
                <Image
                  source={FLUTTER_PLACEHOLDER_IMAGES.thumbnail}
                  style={styles.avatar}
                />
              )}
            </View>

            {/* Doctor Info */}
            <View style={styles.infoContainer}>
              <View style={styles.nameRow}>
                <Text style={styles.doctorName} numberOfLines={1}>
                  Dr. {item.doctorName}
                </Text>
                {item.qualification ? (
                  <Text style={styles.qualification} numberOfLines={1}>
                    {" "}
                    {item.qualification}
                  </Text>
                ) : null}
              </View>

              {item.specialization ? (
                <Text style={styles.specialization} numberOfLines={2}>
                  {item.specialization}
                </Text>
              ) : null}

              {item.clinicName ? (
                <Text style={styles.clinicText} numberOfLines={1}>
                  Clinic: {item.clinicName}
                </Text>
              ) : null}

              {item.lastVisitedDate ? (
                <Text style={styles.lastVisited} numberOfLines={1}>
                  Last Visited On: {formatDate(item.lastVisitedDate)}
                </Text>
              ) : null}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    ),
    [handleDoctorPress],
  );

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={Colors.primaryBlue}
      />

      <View style={styles.headerWrapper}>
        <View style={styles.header}>
          <View style={styles.headerBase} />
          <View style={styles.headerOverlay} />
          <View style={[styles.decorCircle, styles.dc1]} />
          <View style={[styles.decorCircle, styles.dc2]} />

          <View style={styles.headerContent}>
            <View
              style={[
                styles.topBar,
                !showBackButton && styles.topBarCentered,
                { paddingTop: Math.max(insets.top, Platform.OS === "ios" ? 10 : 8) },
              ]}
            >
              {showBackButton ? (
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => navigation.goBack()}
                  activeOpacity={0.7}
                >
                  <Ionicons name="chevron-back" size={22} color={Colors.white} />
                </TouchableOpacity>
              ) : null}
              <Text style={styles.headerTitle}>Consulted Doctors</Text>
            </View>

            <View style={styles.bannerRow}>
              <View style={styles.bannerTextBlock}>
                <Text style={styles.bannerLine}>Your Health,</Text>
                <Text style={styles.bannerLine}>One Click Away:</Text>
                <Text style={styles.bannerLineB}>Book Doctors Online</Text>
              </View>
              <Image
                source={FLUTTER_PLACEHOLDER_IMAGES.twoDoctors}
                style={styles.bannerImage}
              />
            </View>
          </View>

          <View style={styles.curveWrapper}>
            <View style={styles.curve} />
          </View>
        </View>

        <View style={styles.searchOuter}>
          <View style={styles.searchContainer}>
            <FlutterSvgIcon name="search" size={18} color={Colors.muted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search Doctors"
              placeholderTextColor={Colors.placeholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={clearSearch}>
                <View style={styles.clearBtn}>
                  <Ionicons name="close" size={12} color={Colors.white} />
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Consulted Doctors</Text>
          {showCount ? (
            <Text style={styles.sectionCount}>{filteredDoctors.length}</Text>
          ) : null}
        </View>
      </View>

      {loading && recent.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primaryBlue} />
          <Text style={styles.loadingText}>Loading your doctors...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredDoctors}
          keyExtractor={(item) => item.doctorId || item.doctorName}
          renderItem={renderDoctorCard}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primaryBlue]}
              tintColor={Colors.primaryBlue}
              progressViewOffset={200}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <FlutterSvgIcon
                  name="stethoscope"
                  size={40}
                  color={Colors.muted}
                />
              </View>
              <Text style={styles.emptyTitle}>No consulted doctors</Text>
              <Text style={styles.emptySubtext}>
                {searchQuery
                  ? "Try a different search"
                  : "Your consulted doctors will appear here after your first appointment"}
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
  headerWrapper: {},
  header: {
    height: 268,
    position: "relative",
    overflow: "hidden",
  },
  headerBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.primaryBlue,
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#3EA8FF",
    opacity: 0.3,
  },
  decorCircle: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  dc1: { width: 180, height: 180, top: -30, right: -40 },
  dc2: { width: 120, height: 120, bottom: 20, left: -30 },

  headerContent: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
    zIndex: 1,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 18,
  },
  topBarCentered: {
    justifyContent: "center",
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.white,
  },
  bannerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  bannerTextBlock: {
    flex: 1,
    paddingBottom: Spacing.lg,
  },
  bannerLine: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(255,255,255,0.9)",
    lineHeight: 20,
  },
  bannerLineB: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.white,
    lineHeight: 22,
  },
  bannerImage: {
    width: 138,
    height: 100,
    resizeMode: "contain",
  },

  curveWrapper: {
    position: "absolute",
    bottom: -1,
    left: 0,
    right: 0,
    height: 30,
  },
  curve: {
    width: "100%",
    height: 50,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },

  // ─── Search ─────────────────────────────────────────
  searchOuter: {
    paddingHorizontal: Spacing.xl,
    marginTop: -16,
    marginBottom: Spacing.lg,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: 14,
    minHeight: 54,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.md,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.heading,
    fontWeight: "400",
  },
  clearBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.muted,
    justifyContent: "center",
    alignItems: "center",
  },

  // ─── Section ────────────────────────────────────────
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.heading,
  },
  sectionCount: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.primaryBlue,
    backgroundColor: Colors.primaryUltraLight,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    overflow: "hidden",
  },

  // ─── Doctor Card ────────────────────────────────────
  card: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.md,
    marginHorizontal: Spacing.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.sm,
  },
  accentLine: {
    width: 4,
    alignSelf: "stretch",
    backgroundColor: Colors.primaryBlue,
  },
  cardInner: {
    flex: 1,
    padding: Spacing.lg,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  avatarContainer: {},
    avatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: Colors.surfaceSecondary,
    },
  avatarPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.primaryUltraLight,
  },
  avatarInitial: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.primaryBlue,
  },
  infoContainer: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "baseline",
    flexWrap: "wrap",
    marginBottom: 3,
  },
  doctorName: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.heading,
  },
  qualification: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.primaryBlue,
    flexShrink: 1,
  },
  specialization: {
    fontSize: 13,
    color: Colors.body,
    marginBottom: 3,
    lineHeight: 18,
  },
  clinicText: {
    fontSize: 12,
    color: Colors.muted,
    marginBottom: 2,
  },
  lastVisited: {
    fontSize: 12,
    color: Colors.muted,
  },

  // ─── States ─────────────────────────────────────────
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    ...Typography.bodySmall,
    color: Colors.muted,
  },
  list: {
    paddingBottom: 120,
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 60,
    paddingHorizontal: 40,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surfaceSecondary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.heading,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.muted,
    textAlign: "center",
    lineHeight: 20,
  },
});
