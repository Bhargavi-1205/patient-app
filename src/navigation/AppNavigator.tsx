// Navigation Setup — equivalent to Flutter's route_utils.dart + main_navigation_screen.dart
// Defines the full navigation stack with auth guard

import React from 'react';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { navigationService } from '../services/navigationService';
import { ROUTES } from '../config/constants';
import { Colors } from '../config/theme';
import FlutterSvgIcon from '../components/common/FlutterSvgIcon';

// ─── Screens ────────────────────────────────────────────────────
import PhoneNumberScreen from '../screens/auth/PhoneNumberScreen';
import VerifyOTPScreen from '../screens/auth/VerifyOTPScreen';
import LocationPickerScreen from '../screens/location/LocationPickerScreen';
import HomeScreen from '../screens/home/HomeScreen';
import ConsultationScreen from '../screens/consultation/ConsultationScreen';
import AppointmentBookingScreen from '../screens/appointments/AppointmentBookingScreen';
import AvailableSlotsScreen from '../screens/appointments/AvailableSlotsScreen';
import DoctorDetailsScreen from '../screens/doctors/DoctorDetailsScreen';
import ClinicDoctorsScreen from '../screens/doctors/ClinicDoctorsScreen';
import ClinicListScreen from '../screens/clinics/ClinicListScreen';
import PrescriptionsScreen from '../screens/prescriptions/PrescriptionsScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import AppointmentHistoryScreen from '../screens/appointments/AppointmentHistoryScreen';
import PatientListScreen from '../screens/profile/PatientListScreen';
import BookingFlowScreen from '../screens/appointments/BookingFlowScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import MyDoctorsScreen from '../screens/doctors/MyDoctorsScreen';
import PDFViewerScreen from '../screens/prescriptions/PDFViewerScreen';

// ─── Icons ──────────────────────────────────────────────────────

// ─── Type Definitions ───────────────────────────────────────────
export type RootStackParamList = {
    [ROUTES.PHONE_NUMBER]: undefined;
    [ROUTES.VERIFY_OTP]: { phoneNumber: string };
    [ROUTES.MAP]: {
        initialLocation?: { latitude: number; longitude: number; address?: string };
        returnTo?: string;
        returnParams?: Record<string, any>;
    } | undefined;
    [ROUTES.MAIN_TABS]: {
        selectedLocation?: { latitude: number; longitude: number; address?: string };
    } | undefined;
    [ROUTES.APPOINTMENT_BOOKING]: { doctorId?: string; clinicId?: string };
    [ROUTES.AVAILABLE_SLOTS]: { doctorId: string; date: string };
    [ROUTES.DOCTOR_DETAILS]: { doctorId: string };
    [ROUTES.CLINIC_DOCTORS]: { clinicId: string; clinicName: string };
    [ROUTES.CLINIC_LIST]: undefined;
    [ROUTES.PRESCRIPTIONS]: undefined;
    [ROUTES.PDF_VIEWER]: {
        consultationId?: string;
        pdfUrl?: string;
        clinicId?: string;
        patientId?: string;
        fileKey?: string;
        prescription?: {
            doctorName?: string;
        };
    };
    [ROUTES.EDIT_PROFILE]: undefined;
    [ROUTES.APPOINTMENT_HISTORY]: undefined;
    [ROUTES.PATIENT_LIST]: undefined;
    [ROUTES.UPDATE_PATIENT]: { patientId: string };
    [ROUTES.BOOKING_FLOW]: {
        consultationId?: string;
        appointmentId?: string;
        doctorName: string;
        reasonToVisit?: string;
        doctorId?: string;
        clinicId?: string;
        patientId?: string;
        preselectedDate?: string;
    };
    [ROUTES.NOTIFICATIONS]: undefined;
    [ROUTES.MY_DOCTORS]: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

// ─── Bottom Tabs (Home, Consultation) ────────────────────────────
function MainTabs() {
    const insets = useSafeAreaInsets();
    const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 6 : 0);

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: Colors.primaryBlue,
                tabBarInactiveTintColor: Colors.muted,
                tabBarHideOnKeyboard: true,
                tabBarStyle: {
                    backgroundColor: Colors.white,
                    borderTopWidth: 0,
                    paddingBottom: bottomInset + 6,
                    paddingTop: 10,
                    height: 68 + bottomInset,
                    borderTopLeftRadius: 26,
                    borderTopRightRadius: 26,
                    marginHorizontal: 10,
                    marginBottom: 8,
                    shadowColor: '#123B66',
                    shadowOffset: { width: 0, height: -5 },
                    shadowOpacity: 0.12,
                    shadowRadius: 14,
                    elevation: 14,
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '700',
                    marginTop: 2,
                },
                tabBarIconStyle: {
                    marginTop: 3,
                },
            }}>
            <Tab.Screen
                name={ROUTES.HOME}
                component={HomeScreen}
                options={{
                    tabBarLabel: 'Home',
                    tabBarIcon: ({ color, size }) => (
                        <FlutterSvgIcon name="tabHome" size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name={ROUTES.CONSULTATION}
                component={ConsultationScreen}
                options={{
                    tabBarLabel: 'Consultation',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="calendar-outline" size={size} color={color} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
}

// ─── Root Navigator ─────────────────────────────────────────────
interface AppNavigatorProps {
    isAuthenticated: boolean;
}

export default function AppNavigator({ isAuthenticated }: AppNavigatorProps) {
    return (
        <NavigationContainer ref={navigationService.navigationRef}>
            <Stack.Navigator
                initialRouteName={
                    isAuthenticated ? ROUTES.MAIN_TABS : ROUTES.PHONE_NUMBER
                }
                screenOptions={{
                    headerShown: false,
                    animation: 'slide_from_right',
                    gestureEnabled: Platform.OS === 'ios', // Enable swipe-back on iOS
                }}>
                {/* Auth Screens */}
                <Stack.Screen
                    name={ROUTES.PHONE_NUMBER}
                    component={PhoneNumberScreen}
                />
                <Stack.Screen
                    name={ROUTES.VERIFY_OTP}
                    component={VerifyOTPScreen}
                />
                <Stack.Screen
                    name={ROUTES.MAP}
                    component={LocationPickerScreen}
                />

                {/* Main App */}
                <Stack.Screen name={ROUTES.MAIN_TABS} component={MainTabs} />

                {/* Feature Screens */}
                <Stack.Screen
                    name={ROUTES.APPOINTMENT_BOOKING}
                    component={AppointmentBookingScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name={ROUTES.AVAILABLE_SLOTS}
                    component={AvailableSlotsScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name={ROUTES.DOCTOR_DETAILS}
                    component={DoctorDetailsScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name={ROUTES.CLINIC_DOCTORS}
                    component={ClinicDoctorsScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name={ROUTES.CLINIC_LIST}
                    component={ClinicListScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name={ROUTES.PRESCRIPTIONS}
                    component={PrescriptionsScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name={ROUTES.EDIT_PROFILE}
                    component={EditProfileScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name={ROUTES.APPOINTMENT_HISTORY}
                    component={AppointmentHistoryScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name={ROUTES.PATIENT_LIST}
                    component={PatientListScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name={ROUTES.BOOKING_FLOW}
                    component={BookingFlowScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name={ROUTES.NOTIFICATIONS}
                    component={NotificationsScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name={ROUTES.MY_DOCTORS}
                    component={MyDoctorsScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name={ROUTES.PDF_VIEWER}
                    component={PDFViewerScreen}
                    options={{ headerShown: false }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
