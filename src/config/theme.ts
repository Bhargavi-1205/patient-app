// ─── Modern Design System ────────────────────────────────────────────
// Premium theme tokens for the Patient App
import { StyleSheet, Dimensions, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── Color Palette ──────────────────────────────────────────────────
export const Colors = {
    // Primary
    primaryBlue: '#3A8DCC',
    primaryDark: '#0B5ED7',
    primaryLight: '#8CC8FF',
    primaryUltraLight: '#EAF4FF',

    // Accent — Teal/Cyan
    accent: '#00B8A9',
    accentLight: '#7DE7DE',
    accentDark: '#008D82',

    // Gradient stops
    gradientStart: '#3A8DCC',
    gradientMid: '#26A0FC',
    gradientEnd: '#00B8A9',

    // Surfaces
    background: '#F4F8FC',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    surfaceSecondary: '#EDF3F9',
    surfaceTertiary: '#DFE9F3',

    // Text
    heading: '#0B1B33',
    body: '#253A55',
    paragraph: '#5A718C',
    muted: '#89A1BD',
    placeholder: '#B8C9DB',

    // Semantic
    success: '#10B981',
    successLight: '#D1FAE5',
    warning: '#F4A000',
    warningLight: '#FFF2CC',
    error: '#E24D4D',
    errorLight: '#FDE4E4',
    info: '#3B82F6',
    infoLight: '#DBEAFE',

    // UI Elements
    white: '#FFFFFF',
    black: '#000000',
    border: '#D8E4F0',
    borderLight: '#EBF2F8',
    divider: '#EAF1F7',
    disabled: '#B9C8D8',
    overlay: 'rgba(11, 27, 51, 0.6)',
    overlayLight: 'rgba(11, 27, 51, 0.3)',

    // Legacy compat
    lightBlue: '#DDEFFF',
    lighterBlue: '#EEF7FF',
    inputFill: '#EDF3F9',
    buttonBlue: '#3A8DCC',
    checkboxActive: '#3A8DCC',
    backgroundAlt: '#EDF3F9',
    cardShadow: 'rgba(25, 53, 86, 0.10)',

    // Glass effect
    glass: 'rgba(255, 255, 255, 0.90)',
    glassBorder: 'rgba(255, 255, 255, 0.55)',
    glassDark: 'rgba(11, 27, 51, 0.06)',
} as const;

// ─── Gradients (for LinearGradient or custom rendering) ─────────────
export const Gradients = {
    primary: ['#3A8DCC', '#26A0FC'],
    primaryFull: ['#3A8DCC', '#26A0FC', '#00B8A9'],
    accent: ['#00B8A9', '#23C9B8'],
    warm: ['#F4A000', '#E24D4D'],
    success: ['#10B981', '#00B8A9'],
    dark: ['#1D3557', '#0B1B33'],
    surface: ['#F4F8FC', '#EAF4FF'],
    hero: ['#3A8DCC', '#26A0FC', '#3AC6E6'],
} as const;

// ─── Typography ─────────────────────────────────────────────────────
export const Typography = StyleSheet.create({
    displayLarge: {
        fontSize: 34,
        fontWeight: '800' as const,
        color: Colors.heading,
        letterSpacing: -0.6,
        lineHeight: 42,
    },
    headlineLarge: {
        fontSize: 24,
        fontWeight: '800' as const,
        color: Colors.heading,
        letterSpacing: -0.3,
        lineHeight: 32,
    },
    headlineMedium: {
        fontSize: 21,
        fontWeight: '700' as const,
        color: Colors.heading,
        letterSpacing: -0.2,
        lineHeight: 29,
    },
    headlineSmall: {
        fontSize: 19,
        fontWeight: '700' as const,
        color: Colors.heading,
        lineHeight: 27,
    },
    bodyLarge: {
        fontSize: 16,
        fontWeight: '500' as const,
        color: Colors.body,
        lineHeight: 24,
    },
    bodyMedium: {
        fontSize: 15,
        fontWeight: '500' as const,
        color: Colors.paragraph,
        lineHeight: 22,
    },
    bodySmall: {
        fontSize: 13,
        fontWeight: '500' as const,
        color: Colors.paragraph,
        lineHeight: 20,
    },
    labelLarge: {
        fontSize: 15,
        fontWeight: '700' as const,
        color: Colors.primaryBlue,
        lineHeight: 22,
    },
    labelMedium: {
        fontSize: 13,
        fontWeight: '700' as const,
        color: Colors.primaryBlue,
        lineHeight: 18,
    },
    caption: {
        fontSize: 12,
        fontWeight: '500' as const,
        color: Colors.muted,
        lineHeight: 16,
    },
    overline: {
        fontSize: 11,
        fontWeight: '700' as const,
        color: Colors.muted,
        letterSpacing: 1,
        textTransform: 'uppercase' as const,
        lineHeight: 16,
    },
    button: {
        fontSize: 16,
        fontWeight: '700' as const,
        color: Colors.white,
        lineHeight: 22,
    },
    buttonSmall: {
        fontSize: 14,
        fontWeight: '700' as const,
        color: Colors.white,
        lineHeight: 20,
    },
});

// ─── Spacing ────────────────────────────────────────────────────────
export const Spacing = {
    xxs: 2,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    xxxxl: 40,
    section: 48,
} as const;

// ─── Border Radius ──────────────────────────────────────────────────
export const BorderRadius = {
    xs: 4,
    sm: 8,
    md: 10,
    lg: 14,
    xl: 18,
    xxl: 24,
    xxxl: 30,
    round: 999,
} as const;

// ─── Shadows ────────────────────────────────────────────────────────
export const Shadows = {
    xs: {
        shadowColor: 'rgb(18, 59, 102)',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 1,
    },
    sm: {
        shadowColor: '#123B66',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 3,
    },
    card: {
        shadowColor: '#1D4C7D',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.10,
        shadowRadius: 10,
        elevation: 4,
    },
    md: {
        shadowColor: '#123B66',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.10,
        shadowRadius: 14,
        elevation: 5,
    },
    elevated: {
        shadowColor: '#123B66',
        shadowOffset: { width: 0, height: 7 },
        shadowOpacity: 0.13,
        shadowRadius: 18,
        elevation: 7,
    },
    lg: {
        shadowColor: '#123B66',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 26,
        elevation: 8,
    },
    glow: {
        shadowColor: Colors.primaryBlue,
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.35,
        shadowRadius: 14,
        elevation: 6,
    },
} as const;

// ─── Animation Durations ────────────────────────────────────────────
export const AnimationDuration = {
    fast: 150,
    normal: 250,
    slow: 400,
    entrance: 500,
    exit: 200,
} as const;

// ─── Screen Dimensions ─────────────────────────────────────────────
export const Screen = {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    isSmall: SCREEN_WIDTH < 375,
    isMedium: SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 414,
    isLarge: SCREEN_WIDTH >= 414,
} as const;

// ─── Common Styles ──────────────────────────────────────────────────
export const CommonStyles = StyleSheet.create({
    screenContainer: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rowBetween: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    sectionPadding: {
        paddingHorizontal: Spacing.xl,
    },
    cardBase: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
        ...Shadows.card,
    },
    glassCard: {
        backgroundColor: Colors.glass,
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        borderColor: Colors.glassBorder,
        padding: Spacing.lg,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: Spacing.md,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.divider,
        marginVertical: Spacing.md,
    },
});
