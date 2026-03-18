// App Drawer — Modern Premium Side Menu
// Redesigned with cleaner UI, improved sections, and logout pinned to bottom
import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    Image,
    Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../../store';
import { logout } from '../../store/slices/authSlice';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../config/theme';
import { ROUTES } from '../../config/constants';
import { FLUTTER_PLACEHOLDER_IMAGES } from '../../config/flutterAssets';

interface DrawerProps {
    navigation: any;
    onClose: () => void;
}

interface DrawerItem {
    iconName: React.ComponentProps<typeof Ionicons>['name'];
    label: string;
    subtitle?: string;
    route?: string;
    onPress?: () => void;
    color?: string;
    bgColor?: string;
    isDanger?: boolean;
}

export default function AppDrawer({ navigation, onClose }: DrawerProps) {
    const dispatch = useAppDispatch();
    const insets = useSafeAreaInsets();
    const { currentPatient } = useAppSelector((state) => state.patient);
    const topInset = Platform.OS === 'ios' ? insets.top : 0;
    const headerHeight = topInset + 132;

    const handleSignOut = () => {
        Alert.alert(
            'Sign Out',
            'Are you sure you want to sign out?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Sign Out',
                    style: 'destructive',
                    onPress: async () => {
                        await dispatch(logout());
                        navigation.reset({
                            index: 0,
                            routes: [{ name: ROUTES.PHONE_NUMBER }],
                        });
                    },
                },
            ],
        );
    };

    const mainItems: DrawerItem[] = [
        {
            iconName: 'medkit-outline',
            label: 'My Doctors',
            subtitle: 'View consulted doctors',
            route: ROUTES.MY_DOCTORS,
            color: '#4A90E2',
            bgColor: '#EFF6FF',
        },
        {
            iconName: 'people-outline',
            label: 'Patient Details',
            subtitle: 'Manage family members',
            route: ROUTES.PATIENT_LIST,
            color: '#10B981',
            bgColor: '#ECFDF5',
        },
        {
            iconName: 'document-text-outline',
            label: 'Prescriptions',
            subtitle: 'View prescriptions',
            route: ROUTES.PRESCRIPTIONS,
            color: '#F59E0B',
            bgColor: '#FFFBEB',
        },
        {
            iconName: 'time-outline',
            label: 'Appointment History',
            subtitle: 'Past appointments',
            route: ROUTES.APPOINTMENT_HISTORY,
            color: '#8B5CF6',
            bgColor: '#F5F3FF',
        },
    ];

    const otherItems: DrawerItem[] = [
        {
            iconName: 'document-outline',
            label: 'Terms & Condition',
            color: '#64748B',
            bgColor: '#F1F5F9',
        },
        {
            iconName: 'shield-checkmark-outline',
            label: 'Privacy Policy',
            color: '#64748B',
            bgColor: '#F1F5F9',
        },
    ];

    const handleItemPress = (item: DrawerItem) => {
        onClose();
        if (item.onPress) {
            item.onPress();
        } else if (item.route) {
            setTimeout(() => navigation.navigate(item.route!), 300);
        }
    };

    const renderDrawerItem = (item: DrawerItem, index: number) => (
        <TouchableOpacity
            key={index}
            style={styles.drawerItem}
            activeOpacity={0.6}
            onPress={() => handleItemPress(item)}>
            <View style={[styles.itemIconCircle, { backgroundColor: item.bgColor || '#F1F5F9' }]}>
                <Ionicons name={item.iconName} size={20} color={item.color || '#4A90E2'} />
            </View>
            <View style={styles.itemTextContainer}>
                <Text style={styles.itemLabel}>{item.label}</Text>
                {item.subtitle && (
                    <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
                )}
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.placeholder} />
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* Header gradient area */}
            <View
                style={[
                    styles.headerSection,
                    {
                        height: headerHeight,
                        paddingTop: topInset + 18,
                    },
                ]}>
                <View style={styles.headerBase} />
                <View style={styles.headerOverlay} />
                <View style={[styles.headerCircle, styles.hCircle1]} />
                <View style={[styles.headerCircle, styles.hCircle2]} />
                <View style={[styles.headerCircleSmall, styles.hCircle3]} />

                {/* Close button */}
                <TouchableOpacity
                    style={[styles.closeButton, { top: topInset + 8 }]}
                    onPress={onClose}
                    activeOpacity={0.7}>
                    <Ionicons name="close" size={20} color={Colors.white} />
                </TouchableOpacity>

                {/* Profile */}
                <TouchableOpacity
                    style={styles.profileSection}
                    activeOpacity={0.8}
                    onPress={() => {
                        onClose();
                        setTimeout(() => navigation.navigate(ROUTES.EDIT_PROFILE), 300);
                    }}>
                    <View style={styles.avatarContainer}>
                        <Image
                            source={
                                currentPatient?.profileImage
                                    ? { uri: currentPatient.profileImage }
                                    : FLUTTER_PLACEHOLDER_IMAGES.thumbnail
                            }
                            style={styles.avatar}
                        />
                        <View style={styles.onlineDot} />
                    </View>
                    <View style={styles.profileInfo}>
                        <Text style={styles.profileName}>
                            {currentPatient?.name || 'Loading...'}
                        </Text>
                        <View style={styles.editProfileRow}>
                            <Text style={styles.editProfileText}>View Profile</Text>
                            <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.6)" />
                        </View>
                    </View>
                </TouchableOpacity>
            </View>

            {/* Menu Items — Fixed area (no scroll) */}
            <View style={styles.menuContainer}>
                {/* Main Section */}
                <Text style={styles.sectionLabel}>MENU</Text>
                <View style={styles.menuCard}>
                    {mainItems.map((item, index) => (
                        <React.Fragment key={index}>
                            {renderDrawerItem(item, index)}
                            {index < mainItems.length - 1 && <View style={styles.itemDivider} />}
                        </React.Fragment>
                    ))}
                </View>

                {/* Other Section */}
                <Text style={styles.sectionLabel}>OTHER</Text>
                <View style={styles.menuCard}>
                    {otherItems.map((item, index) => (
                        <React.Fragment key={index}>
                            {renderDrawerItem(item, index)}
                            {index < otherItems.length - 1 && <View style={styles.itemDivider} />}
                        </React.Fragment>
                    ))}
                </View>
            </View>

            {/* Sign Out — Pinned to Bottom */}
            <View style={[styles.logoutSection, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
                <View style={styles.logoutDivider} />
                <TouchableOpacity
                    style={styles.signOutButton}
                    activeOpacity={0.7}
                    onPress={handleSignOut}>
                    <View style={styles.signOutIconCircle}>
                        <Ionicons name="log-out-outline" size={18} color={Colors.error} />
                    </View>
                    <Text style={styles.signOutText}>Sign Out</Text>
                </TouchableOpacity>
                <Text style={styles.versionText}>Version 1.0.0</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },

    // ─── Header ─────────────────────────────────────────
    headerSection: {
        position: 'relative',
        overflow: 'hidden',
        justifyContent: 'flex-end',
        paddingBottom: Spacing.lg,
    },
    headerBase: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: Colors.primaryBlue,
    },
    headerOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(102, 126, 234, 0.35)',
    },
    headerCircle: {
        position: 'absolute',
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
    },
    headerCircleSmall: {
        position: 'absolute',
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
    },
    hCircle1: { top: -40, right: -30 },
    hCircle2: { bottom: -50, left: -30 },
    hCircle3: { top: 40, right: 60 },
    closeButton: {
        position: 'absolute',
        right: 16,
        width: 34,
        height: 34,
        borderRadius: 11,
        backgroundColor: 'rgba(255, 255, 255, 0.18)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },

    // ─── Profile ────────────────────────────────────────
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 18,
        borderWidth: 2.5,
        borderColor: 'rgba(255, 255, 255, 0.35)',
    },
    onlineDot: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: Colors.success,
        borderWidth: 2.5,
        borderColor: Colors.primaryBlue,
    },
    profileInfo: {
        flex: 1,
        marginLeft: 14,
    },
    profileName: {
        color: Colors.white,
        fontSize: 18,
        fontWeight: '700',
    },
    editProfileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 3,
        gap: 2,
    },
    editProfileText: {
        color: 'rgba(255,255,255,0.75)',
        fontSize: 13,
        fontWeight: '500',
    },

    // ─── Menu ───────────────────────────────────────────
    menuContainer: {
        flex: 1,
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.xl,
        paddingBottom: Spacing.sm,
        justifyContent: 'flex-start',
    },
    sectionLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: Colors.muted,
        letterSpacing: 1.5,
        marginBottom: 8,
        marginLeft: 4,
    },
    menuCard: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.xl,
        marginBottom: Spacing.md,
        ...Shadows.sm,
    },
    drawerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 11,
        paddingHorizontal: Spacing.lg,
    },
    itemIconCircle: {
        width: 38,
        height: 38,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    itemTextContainer: {
        flex: 1,
    },
    itemLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.heading,
    },
    itemSubtitle: {
        fontSize: 11,
        color: Colors.muted,
        marginTop: 1,
    },
    itemDivider: {
        height: 1,
        backgroundColor: Colors.divider,
        marginHorizontal: Spacing.lg,
    },

    // ─── Logout — Pinned to Bottom ─────────────────────
    logoutSection: {
        paddingHorizontal: Spacing.lg,
        paddingTop: 0,
        backgroundColor: Colors.background,
    },
    logoutDivider: {
        height: 1,
        backgroundColor: Colors.divider,
        marginBottom: 12,
    },
    signOutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: Colors.errorLight,
        borderRadius: BorderRadius.xl,
        gap: 10,
    },
    signOutIconCircle: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: Colors.white,
        justifyContent: 'center',
        alignItems: 'center',
    },
    signOutText: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
        color: Colors.error,
    },
    versionText: {
        fontSize: 11,
        color: Colors.muted,
        textAlign: 'center',
        marginTop: 8,
    },
});
