// Home Screen — Modern Premium Design
// Main dashboard with greeting, doctor search, sections, and animated drawer
import React, { useEffect, useCallback, useMemo, useState, useRef } from 'react';
import {
    View,
    Text,
    ScrollView,
    RefreshControl,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    Animated,
    Dimensions,
    Modal,
    TouchableWithoutFeedback,
    Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Rect, Stop } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchUpcomingAppointments } from '../../store/slices/appointmentsSlice';
import { fetchDoctors } from '../../store/slices/doctorsSlice';
import { fetchClinics } from '../../store/slices/clinicsSlice';
import { fetchActiveMedications } from '../../store/slices/medicationsSlice';
import { fetchFollowUps } from '../../store/slices/consultationsSlice';
import { startListeningNotifications } from '../../store/slices/notificationsSlice';
import { fetchPatientDetails } from '../../store/slices/patientSlice';
import { Colors, Typography, Spacing, BorderRadius, Shadows, Screen } from '../../config/theme';
import { ROUTES } from '../../config/constants';
import FlutterSvgIcon from '../../components/common/FlutterSvgIcon';
import { setSelectedLocation } from '../../store/slices/locationSlice';
import { tokenHelper } from '../../services/tokenHelper';

// ─── Sub-components ─────────────────────────────────────────────
import UpcomingConsultationsSection from '../../components/home/UpcomingConsultationsSection';
import FollowUpSection from '../../components/home/FollowUpSection';
import ActiveMedicationSection from '../../components/home/ActiveMedicationSection';
import ClinicsSection from '../../components/home/ClinicsSection';
import AppDrawer from '../../components/common/AppDrawer';

const DRAWER_WIDTH = Dimensions.get('window').width * 0.78;

type ThingsToDoItem = {
    title: string;
    iconName: keyof typeof MaterialCommunityIcons.glyphMap;
    gradientStart: string;
    gradientEnd: string;
};

const THINGS_TO_DO_ITEMS: ThingsToDoItem[] = [
    {
        title: '3000 ML\nWater per day',
        iconName: 'cup-water',
        gradientStart: '#6795FF',
        gradientEnd: '#3E5999',
    },
    {
        title: '7\nHours sleep',
        iconName: 'sleep',
        gradientStart: '#62D497',
        gradientEnd: '#336E4E',
    },
    {
        title: '1\nHours Run',
        iconName: 'run-fast',
        gradientStart: '#B67EFF',
        gradientEnd: '#6D4C99',
    },
    {
        title: '30 Min\nYoga',
        iconName: 'meditation',
        gradientStart: '#FFE67B',
        gradientEnd: '#998A4A',
    },
    {
        title: 'Eat\nHealthy',
        iconName: 'food-apple',
        gradientStart: '#3CA55C',
        gradientEnd: '#B5AC49',
    },
];

function extractAddressParts(address: string): string {
    const parts = address
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    if (parts.length < 5) {
        return address;
    }
    return [...parts.slice(0, 2), ...parts.slice(parts.length - 3)].join(', ');
}

export default function HomeScreen({ navigation, route }: any) {
    const dispatch = useAppDispatch();
    const insets = useSafeAreaInsets();
    const { upcoming, loading: appointmentsLoading } = useAppSelector(
        (state) => state.appointments,
    );
    const { currentPatient } = useAppSelector((state) => state.patient);
    const { selectedLocation } = useAppSelector((state) => state.location);
    const { unreadCount } = useAppSelector((state) => state.notifications);
    const [refreshing, setRefreshing] = React.useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);

    // Animations
    const drawerAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
    const overlayAnim = useRef(new Animated.Value(0)).current;
    const headerFade = useRef(new Animated.Value(0)).current;
    const contentFade = useRef(new Animated.Value(0)).current;
    const contentSlide = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        // Entrance animations
        Animated.timing(headerFade, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }).start();

        setTimeout(() => {
            Animated.parallel([
                Animated.timing(contentFade, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.spring(contentSlide, {
                    toValue: 0,
                    useNativeDriver: true,
                    friction: 8,
                }),
            ]).start();
        }, 200);
    }, []);

    const openDrawer = () => {
        setDrawerOpen(true);
        Animated.parallel([
            Animated.spring(drawerAnim, { toValue: 0, useNativeDriver: true, friction: 8 }),
            Animated.timing(overlayAnim, { toValue: 0.5, duration: 250, useNativeDriver: true }),
        ]).start();
    };

    const closeDrawer = () => {
        Animated.parallel([
            Animated.spring(drawerAnim, { toValue: -DRAWER_WIDTH, useNativeDriver: true, friction: 8 }),
            Animated.timing(overlayAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        ]).start(() => setDrawerOpen(false));
    };

    const loadData = useCallback(() => {
        dispatch(fetchUpcomingAppointments());
        dispatch(fetchDoctors());
        dispatch(fetchClinics());
        dispatch(fetchActiveMedications());
        dispatch(fetchFollowUps());
        dispatch(fetchPatientDetails());
        dispatch(startListeningNotifications());
    }, [dispatch]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData]),
    );

    useEffect(() => {
        if (selectedLocation) {
            return;
        }

        let isCancelled = false;
        (async () => {
            const persistedLocation = await tokenHelper.getSelectedLocation();
            if (!isCancelled && persistedLocation) {
                dispatch(setSelectedLocation(persistedLocation));
            }
        })();

        return () => {
            isCancelled = true;
        };
    }, [dispatch, selectedLocation]);

    useEffect(() => {
        const routeSelectedLocation = route?.params?.selectedLocation;
        if (
            routeSelectedLocation &&
            typeof routeSelectedLocation.latitude === 'number' &&
            typeof routeSelectedLocation.longitude === 'number'
        ) {
            dispatch(
                setSelectedLocation({
                    latitude: routeSelectedLocation.latitude,
                    longitude: routeSelectedLocation.longitude,
                    address: routeSelectedLocation.address,
                }),
            );
        }
    }, [
        dispatch,
        route?.params?.selectedLocation?.latitude,
        route?.params?.selectedLocation?.longitude,
        route?.params?.selectedLocation?.address,
    ]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        loadData();
        setTimeout(() => setRefreshing(false), 1500);
    }, [loadData]);

    // Get greeting based on time
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    const firstName = currentPatient?.name?.split(' ')[0] || 'there';

    const locationLabel = useMemo(() => {
        if (!selectedLocation) {
            return 'Set location';
        }
        if (selectedLocation.address) {
            return extractAddressParts(selectedLocation.address);
        }
        return 'Select location';
    }, [selectedLocation]);

    const handleLocationPress = useCallback(() => {
        navigation.navigate(ROUTES.MAP, {
            initialLocation: selectedLocation || undefined,
            returnTo: ROUTES.MAIN_TABS,
            returnParams: {
                screen: ROUTES.HOME,
            },
        });
    }, [navigation, selectedLocation]);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.primaryBlue} />

            {/* ─── Header ────────────────────────────────────── */}
            <Animated.View
                style={[
                    styles.header,
                    {
                        opacity: headerFade,
                        paddingTop: Math.max(insets.top, Platform.OS === 'ios' ? 12 : 10),
                    },
                ]}>
                <View style={styles.headerBase} />
                <View style={styles.headerOverlay} />

                {/* Bottom curve */}
                <View style={styles.curveWrapper}>
                    <View style={styles.curve} />
                </View>

                {/* Header content */}
                <View style={styles.headerContent}>
                    {/* Top bar */}
                    <View style={styles.topBar}>
                        <TouchableOpacity
                            style={styles.menuButton}
                            onPress={openDrawer}
                            activeOpacity={0.7}>
                            <FlutterSvgIcon name="menu" size={18} color={Colors.white} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.topBarCenter}
                            onPress={handleLocationPress}
                            activeOpacity={0.8}>
                            <View style={styles.locationPill}>
                                <FlutterSvgIcon name="room" size={16} color={Colors.white} />
                                <Text
                                    style={styles.locationText}
                                    numberOfLines={1}
                                    ellipsizeMode="tail">
                                    {locationLabel}
                                </Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.notifButton}
                            onPress={() => navigation.navigate(ROUTES.NOTIFICATIONS)}
                            activeOpacity={0.7}>
                            <FlutterSvgIcon name="bell" width={22} height={22} color={Colors.white} />
                            {unreadCount > 0 && (
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Greeting */}
                    <View style={styles.greetingSection}>
                        <Text style={styles.greeting}>{getGreeting()},</Text>
                        <Text style={styles.userName}>{firstName} 👋</Text>
                    </View>

                    {/* Search Bar */}
                    <TouchableOpacity
                        style={styles.searchBar}
                        activeOpacity={0.9}
                        onPress={() => navigation.navigate(ROUTES.APPOINTMENT_BOOKING)}>
                        <FlutterSvgIcon name="search" size={18} color={Colors.primaryBlue} />
                        <Text style={styles.searchText}>Find your doctor...</Text>
                        <View style={styles.searchDivider} />
                        <FlutterSvgIcon name="filter" size={18} color={Colors.muted} />
                    </TouchableOpacity>
                </View>
            </Animated.View>

            {/* ─── Scrollable Content ────────────────────────── */}
            <Animated.View
                style={[
                    styles.scrollContainer,
                    {
                        opacity: contentFade,
                        transform: [{ translateY: contentSlide }],
                    },
                ]}>
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={[Colors.primaryBlue]}
                            tintColor={Colors.primaryBlue}
                            progressViewOffset={10}
                        />
                    }>
                    {/* Upcoming Consultations */}
                    <UpcomingConsultationsSection navigation={navigation} />

                    {/* Follow Ups */}
                    <FollowUpSection navigation={navigation} />

                    {/* Clinics */}
                    <ClinicsSection navigation={navigation} />

                    {/* Active Medications */}
                    <ActiveMedicationSection />

                    {/* Things To Do */}
                    <View style={styles.thingsSection}>
                        <Text style={styles.sectionTitle}>Things To Do</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.thingsList}>
                            {THINGS_TO_DO_ITEMS.map((item, index) => (
                                <View key={`todo-${index}`} style={styles.todoCard}>
                                    {/* Gradient Background */}
                                    <View style={styles.todoGradientBg}>
                                        <Svg
                                            width="100%"
                                            height="100%"
                                            viewBox="0 0 130 150"
                                            preserveAspectRatio="none">
                                            <Defs>
                                                <SvgLinearGradient
                                                    id={`things-grad-${index}`}
                                                    x1="0%"
                                                    y1="0%"
                                                    x2="100%"
                                                    y2="100%">
                                                    <Stop offset="0%" stopColor={item.gradientStart} />
                                                    <Stop offset="100%" stopColor={item.gradientEnd} />
                                                </SvgLinearGradient>
                                            </Defs>
                                            <Rect
                                                x="0"
                                                y="0"
                                                width="130"
                                                height="150"
                                                fill={`url(#things-grad-${index})`}
                                                rx="18"
                                                ry="18"
                                            />
                                        </Svg>
                                    </View>

                                    {/* Content on top */}
                                    <View style={styles.todoContent}>
                                        <View style={styles.todoIconCircle}>
                                            <MaterialCommunityIcons
                                                name={item.iconName}
                                                size={32}
                                                color={Colors.white}
                                            />
                                        </View>
                                        <Text style={styles.todoTitle}>{item.title}</Text>
                                    </View>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                </ScrollView>
            </Animated.View>

            {/* ─── Drawer Overlay ─────────────────────────────── */}
            <Modal
                visible={drawerOpen}
                transparent
                animationType="none"
                statusBarTranslucent
                onRequestClose={closeDrawer}>
                <View style={styles.drawerModalRoot}>
                    <TouchableWithoutFeedback onPress={closeDrawer}>
                        <Animated.View
                            style={[
                                styles.drawerOverlay,
                                { opacity: overlayAnim },
                            ]}
                        />
                    </TouchableWithoutFeedback>
                    <Animated.View
                        style={[
                            styles.drawerContainer,
                            { transform: [{ translateX: drawerAnim }] },
                        ]}>
                        <AppDrawer navigation={navigation} onClose={closeDrawer} />
                    </Animated.View>
                </View>
            </Modal>
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
        height: 308,
        position: 'relative',
        overflow: 'hidden',
    },
    headerBase: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: Colors.primaryBlue,
    },
    headerOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(38, 160, 252, 0.30)',
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
        height: 56,
        backgroundColor: Colors.background,
        borderTopLeftRadius: 36,
        borderTopRightRadius: 36,
    },
    headerContent: {
        flex: 1,
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.md,
        paddingBottom: Spacing.md,
        zIndex: 1,
    },

    // ─── Top Bar ────────────────────────────────────────
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    menuButton: {
        width: 42,
        height: 42,
        borderRadius: 13,
        backgroundColor: 'rgba(255, 255, 255, 0.19)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.22)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    topBarCenter: {
        flex: 1,
        alignItems: 'center',
        marginHorizontal: 8,
        minWidth: 0,
    },
    locationPill: {
        maxWidth: '100%',
        minHeight: 40,
        borderRadius: 20,
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.19)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.24)',
    },
    locationText: {
        flexShrink: 1,
        color: Colors.white,
        fontSize: 13,
        fontWeight: '600',
    },
    notifButton: {
        width: 42,
        height: 42,
        borderRadius: 13,
        backgroundColor: 'rgba(255, 255, 255, 0.19)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.22)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    badge: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: Colors.error,
        borderRadius: 999,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
        borderWidth: 2,
        borderColor: Colors.primaryBlue,
    },
    badgeText: {
        color: Colors.white,
        fontSize: 9,
        fontWeight: '800',
    },

    // ─── Greeting ───────────────────────────────────────
    greetingSection: {
        marginTop: 24,
    },
    greeting: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.86)',
        fontWeight: '500',
    },
    userName: {
        fontSize: 27,
        fontWeight: '800',
        color: Colors.white,
        marginTop: 2,
    },

    // ─── Search Bar ─────────────────────────────────────
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.xxl,
        minHeight: 56,
        paddingHorizontal: 18,
        marginTop: 20,
        gap: 10,
        borderWidth: 1,
        borderColor: '#E8EEF5',
        ...Shadows.elevated,
    },
    searchText: {
        flex: 1,
        fontSize: 14,
        color: Colors.muted,
        fontWeight: '500',
    },
    searchDivider: {
        width: 1,
        height: 24,
        backgroundColor: Colors.border,
    },

    // ─── Scroll ─────────────────────────────────────────
    scrollContainer: {
        flex: 1,
        marginTop: -22,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.xl,
        paddingBottom: 120,
    },

    // ─── Things To Do ───────────────────────────────────
    thingsSection: {
        marginBottom: Spacing.xxl,
    },
    sectionTitle: {
        ...Typography.headlineSmall,
        marginBottom: Spacing.md,
    },
    thingsList: {
        gap: 12,
        paddingRight: 10,
    },
    todoCard: {
        width: 130,
        height: 150,
        borderRadius: 20,
        overflow: 'hidden',
        ...Shadows.md,
    },
    todoGradientBg: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 0,
    },
    todoContent: {
        flex: 1,
        zIndex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 12,
    },
    todoIconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255, 255, 255, 0.24)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    todoTitle: {
        textAlign: 'center',
        color: Colors.white,
        fontSize: 13,
        fontWeight: '600',
        lineHeight: 17,
    },

    // ─── Drawer ─────────────────────────────────────────
    drawerModalRoot: {
        flex: 1,
    },
    drawerOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#000',
    },
    drawerContainer: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        width: DRAWER_WIDTH,
        zIndex: 2,
    },
});
