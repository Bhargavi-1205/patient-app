import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Animated,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FlutterSvgIcon from '../../components/common/FlutterSvgIcon';
import GradientButton from '../../components/ui/GradientButton';
import { API_URLS, ROUTES } from '../../config/constants';
import { BorderRadius, Colors, Screen, Shadows, Spacing } from '../../config/theme';
import { networkClient } from '../../services/networkClient';
import { tokenHelper } from '../../services/tokenHelper';
import { useAppDispatch, useAppSelector } from '../../store';
import { clearErrors, sendOtp, verifyOtp } from '../../store/slices/authSlice';
import {
    clearSelectedLocation,
    setSelectedLocation,
} from '../../store/slices/locationSlice';

const OTP_LENGTH = 4;
const RESEND_SECONDS = 30;

type PatientLocationPayload = {
    lat?: number | string;
    long?: number | string;
    latitude?: number | string;
    longitude?: number | string;
    address?: string;
};

const parseCoordinate = (value: unknown): number | null => {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }

    if (typeof value === 'string') {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) {
            return parsed;
        }
    }

    return null;
};

const normalizePatientLocation = (
    payload: PatientLocationPayload | null | undefined,
): { latitude: number; longitude: number; address?: string } | null => {
    if (!payload || typeof payload !== 'object') {
        return null;
    }

    const latitude = parseCoordinate(payload.latitude ?? payload.lat);
    const longitude = parseCoordinate(payload.longitude ?? payload.long);
    if (latitude === null || longitude === null) {
        return null;
    }

    return {
        latitude,
        longitude,
        address: typeof payload.address === 'string' ? payload.address : undefined,
    };
};

export default function VerifyOTPScreen({ route, navigation }: any) {
    const { phoneNumber } = route.params;
    const dispatch = useAppDispatch();
    const {
        isAuthenticated,
        sendOtpError,
        sendOtpLoading,
        verifyOtpError,
        verifyOtpLoading,
    } = useAppSelector((state) => state.auth);

    const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
    const [timer, setTimer] = useState(0);
    const [hasTriedVerify, setHasTriedVerify] = useState(false);
    const [isSendingInitialOtp, setIsSendingInitialOtp] = useState(true);
    const inputRefs = useRef<(TextInput | null)[]>([]);

    const heroOpacity = useRef(new Animated.Value(0)).current;
    const heroTranslateY = useRef(new Animated.Value(24)).current;
    const cardOpacity = useRef(new Animated.Value(0)).current;
    const cardTranslateY = useRef(new Animated.Value(36)).current;
    const otpAnims = useRef(
        Array.from({ length: OTP_LENGTH }, () => new Animated.Value(0)),
    ).current;
    const successScale = useRef(new Animated.Value(0)).current;

    const hasHandledAuthNavigationRef = useRef(false);
    const authNavigationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const isOTPComplete = otp.every((digit) => digit.length === 1);
    const firstEmptyIndex = otp.findIndex((digit) => digit === '');
    const activeInputIndex = firstEmptyIndex === -1 ? OTP_LENGTH - 1 : firstEmptyIndex;

    const formattedPhone = useMemo(() => {
        if (!phoneNumber) {
            return '+91';
        }
        if (phoneNumber.length <= 5) {
            return `+91 ${phoneNumber}`;
        }
        return `+91 ${phoneNumber.slice(0, 5)} ${phoneNumber.slice(5)}`;
    }, [phoneNumber]);

    const requestOtp = useCallback(async (): Promise<boolean> => {
        dispatch(clearErrors());

        const result = await dispatch(sendOtp(phoneNumber));
        const isSuccess = sendOtp.fulfilled.match(result);

        if (isSuccess) {
            setTimer(RESEND_SECONDS);
        } else {
            setTimer(0);
        }

        return isSuccess;
    }, [dispatch, phoneNumber]);

    useEffect(() => {
        Animated.parallel([
            Animated.timing(heroOpacity, {
                toValue: 1,
                duration: 380,
                useNativeDriver: true,
            }),
            Animated.timing(heroTranslateY, {
                toValue: 0,
                duration: 380,
                useNativeDriver: true,
            }),
        ]).start();

        const cardTimer = setTimeout(() => {
            Animated.parallel([
                Animated.timing(cardOpacity, {
                    toValue: 1,
                    duration: 320,
                    useNativeDriver: true,
                }),
                Animated.spring(cardTranslateY, {
                    toValue: 0,
                    useNativeDriver: true,
                    friction: 9,
                    tension: 70,
                }),
            ]).start();
        }, 100);

        otpAnims.forEach((anim, index) => {
            setTimeout(() => {
                Animated.spring(anim, {
                    toValue: 1,
                    useNativeDriver: true,
                    friction: 7,
                    tension: 78,
                }).start();
            }, 160 + index * 70);
        });

        return () => clearTimeout(cardTimer);
    }, [cardOpacity, cardTranslateY, heroOpacity, heroTranslateY, otpAnims]);

    useEffect(() => {
        if (timer <= 0) {
            return;
        }

        const intervalId = setInterval(() => {
            setTimer((current) => current - 1);
        }, 1000);

        return () => clearInterval(intervalId);
    }, [timer]);

    useEffect(() => {
        let isCancelled = false;

        const sendInitialOtp = async () => {
            setIsSendingInitialOtp(true);
            setOtp(Array(OTP_LENGTH).fill(''));

            const success = await requestOtp();
            if (isCancelled) {
                return;
            }

            setIsSendingInitialOtp(false);
            if (success) {
                inputRefs.current[0]?.focus();
            }
        };

        void sendInitialOtp();

        return () => {
            isCancelled = true;
        };
    }, [requestOtp]);

    useEffect(() => {
        if (!isAuthenticated) {
            return;
        }

        if (hasHandledAuthNavigationRef.current) {
            return;
        }
        hasHandledAuthNavigationRef.current = true;

        let isCancelled = false;

        Animated.spring(successScale, {
            toValue: 1,
            useNativeDriver: true,
            friction: 5,
            tension: 60,
        }).start(() => {
            authNavigationTimerRef.current = setTimeout(async () => {
                if (isCancelled) {
                    return;
                }

                const patientId = await tokenHelper.getPatientId();
                if (isCancelled) {
                    return;
                }

                if (patientId) {
                    const locationResponse = await networkClient.get(
                        `${API_URLS.GET_PATIENT_DETAILS}/${patientId}/location`,
                        (json: any) => json,
                    );

                    if (isCancelled) {
                        return;
                    }

                    if (locationResponse.isSuccess) {
                        const serverLocation = normalizePatientLocation(
                            locationResponse.data as PatientLocationPayload,
                        );

                        if (serverLocation) {
                            await tokenHelper.saveSelectedLocation(serverLocation);
                            if (isCancelled) {
                                return;
                            }

                            dispatch(setSelectedLocation(serverLocation));
                            navigation.reset({
                                index: 0,
                                routes: [
                                    {
                                        name: ROUTES.MAIN_TABS,
                                        params: { selectedLocation: serverLocation },
                                    },
                                ],
                            });
                            return;
                        }
                    }
                }

                await tokenHelper.clearSelectedLocation();
                if (isCancelled) {
                    return;
                }

                dispatch(clearSelectedLocation());
                navigation.reset({
                    index: 0,
                    routes: [{ name: ROUTES.MAP }],
                });
            }, 280);
        });

        return () => {
            isCancelled = true;
            if (authNavigationTimerRef.current) {
                clearTimeout(authNavigationTimerRef.current);
                authNavigationTimerRef.current = null;
            }
        };
    }, [dispatch, isAuthenticated, navigation, successScale]);

    const handleOtpInput = (value: string, index: number) => {
        const cleaned = value.replace(/\D/g, '');
        const nextOtp = [...otp];

        if (verifyOtpError) {
            dispatch(clearErrors());
        }
        if (hasTriedVerify) {
            setHasTriedVerify(false);
        }

        if (cleaned.length > 1) {
            const chars = cleaned.slice(0, OTP_LENGTH - index).split('');
            chars.forEach((char, charIndex) => {
                nextOtp[index + charIndex] = char;
            });
            setOtp(nextOtp);

            const nextIndex = Math.min(index + chars.length, OTP_LENGTH - 1);
            inputRefs.current[nextIndex]?.focus();
            return;
        }

        nextOtp[index] = cleaned;
        setOtp(nextOtp);

        if (cleaned && index < OTP_LENGTH - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleBackspace = (index: number) => {
        if (otp[index] === '' && index > 0) {
            const nextOtp = [...otp];
            nextOtp[index - 1] = '';
            setOtp(nextOtp);
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleVerify = async () => {
        setHasTriedVerify(true);

        if (!isOTPComplete || verifyOtpLoading) {
            return;
        }

        dispatch(clearErrors());
        await dispatch(verifyOtp({ phoneNumber, otp: otp.join('') }));
    };

    const handleResend = async () => {
        if (timer > 0 || sendOtpLoading || isSendingInitialOtp) {
            return;
        }

        setOtp(Array(OTP_LENGTH).fill(''));
        setHasTriedVerify(false);
        const success = await requestOtp();
        if (success) {
            inputRefs.current[0]?.focus();
        }
    };

    const showIncompleteError = hasTriedVerify && !isOTPComplete;
    const isSendingOtp = isSendingInitialOtp || sendOtpLoading;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.primaryDark} />

            <View style={styles.heroSection}>
                <View style={[styles.heroBubble, styles.heroBubblePrimary]} />
                <View style={[styles.heroBubble, styles.heroBubbleSecondary]} />

                <SafeAreaView edges={['top']} style={styles.heroSafeArea}>
                    <Animated.View
                        style={[
                            styles.heroContent,
                            {
                                opacity: heroOpacity,
                                transform: [{ translateY: heroTranslateY }],
                            },
                        ]}>
                        <Text style={styles.stepLabel}>Step 2 of 2</Text>
                        <Text style={styles.heroTitle}>Verify your number</Text>
                        <Text style={styles.heroSubtitle}>Enter the one-time code sent to</Text>

                        <View style={styles.phoneBadge}>
                            <Text style={styles.phoneBadgeText}>{formattedPhone}</Text>
                            <TouchableOpacity
                                style={styles.editButton}
                                onPress={() => navigation.goBack()}
                                activeOpacity={0.85}>
                                <FlutterSvgIcon name="edit" size={13} color={Colors.white} />
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </SafeAreaView>
            </View>

            <KeyboardAvoidingView
                style={styles.mainSection}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}>
                    <Animated.View
                        style={[
                            styles.authCard,
                            {
                                opacity: cardOpacity,
                                transform: [{ translateY: cardTranslateY }],
                            },
                        ]}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardTitle}>4-digit OTP</Text>
                            <Text style={styles.cardSubtitle}>Type the code to continue securely.</Text>
                        </View>

                        <View style={styles.otpRow}>
                            {otp.map((digit, index) => {
                                const isFilled = digit.length === 1;
                                const isActive = index === activeInputIndex;

                                return (
                                    <Animated.View
                                        key={index}
                                        style={[
                                            styles.otpInputWrapper,
                                            {
                                                transform: [
                                                    {
                                                        scale: otpAnims[index].interpolate({
                                                            inputRange: [0, 1],
                                                            outputRange: [0.72, 1],
                                                        }),
                                                    },
                                                ],
                                                opacity: otpAnims[index],
                                            },
                                        ]}>
                                        <TextInput
                                            ref={(ref) => {
                                                inputRefs.current[index] = ref;
                                            }}
                                            autoFocus={index === 0}
                                            keyboardType="number-pad"
                                            maxLength={1}
                                            onChangeText={(value) => handleOtpInput(value, index)}
                                            onKeyPress={({ nativeEvent }) => {
                                                if (nativeEvent.key === 'Backspace') {
                                                    handleBackspace(index);
                                                }
                                            }}
                                            selectTextOnFocus
                                            selectionColor={Colors.primaryBlue}
                                            style={[
                                                styles.otpInput,
                                                isFilled && styles.otpInputFilled,
                                                isActive && styles.otpInputActive,
                                            ]}
                                            textAlign="center"
                                            value={digit}
                                        />
                                    </Animated.View>
                                );
                            })}
                        </View>

                        {showIncompleteError ? (
                            <View style={styles.errorBanner}>
                                <FlutterSvgIcon name="more" size={14} color={Colors.warning} />
                                <Text style={styles.warningText}>Enter all 4 digits to verify.</Text>
                            </View>
                        ) : null}

                        {verifyOtpError ? (
                            <View style={styles.errorBanner}>
                                <FlutterSvgIcon name="false" size={14} color={Colors.error} />
                                <Text style={styles.errorText}>{verifyOtpError}</Text>
                            </View>
                        ) : null}

                        {sendOtpError ? (
                            <View style={styles.errorBanner}>
                                <FlutterSvgIcon name="false" size={14} color={Colors.error} />
                                <Text style={styles.errorText}>{sendOtpError}</Text>
                            </View>
                        ) : null}

                        {!showIncompleteError && !verifyOtpError && !sendOtpError ? (
                            <Text style={styles.helperText}>For security, this code expires quickly.</Text>
                        ) : null}

                        <GradientButton
                            title="Verify and Continue"
                            loading={verifyOtpLoading}
                            disabled={!isOTPComplete || isSendingOtp}
                            onPress={handleVerify}
                            icon={<FlutterSvgIcon name="verified" size={16} color={Colors.white} />}
                        />

                        <View style={styles.resendSection}>
                            <Text style={styles.resendLabel}>Did not receive the OTP?</Text>

                            {!isSendingOtp && timer > 0 ? (
                                <View style={styles.timerPill}>
                                    <FlutterSvgIcon name="time" size={15} color={Colors.primaryBlue} />
                                    <Text style={styles.timerText}>Resend available in {timer}s</Text>
                                </View>
                            ) : !isSendingOtp ? (
                                <TouchableOpacity
                                    activeOpacity={0.85}
                                    disabled={sendOtpLoading}
                                    onPress={handleResend}
                                    style={styles.resendButton}>
                                    <FlutterSvgIcon name="chat" size={15} color={Colors.primaryBlue} />
                                    <Text style={styles.resendButtonText}>Resend OTP</Text>
                                </TouchableOpacity>
                            ) : null}
                        </View>
                    </Animated.View>
                </ScrollView>

                {isAuthenticated ? (
                    <Animated.View
                        style={[
                            styles.successOverlay,
                            {
                                transform: [{ scale: successScale }],
                            },
                        ]}>
                        <View style={styles.successCircle}>
                            <FlutterSvgIcon name="verified" size={42} color={Colors.white} />
                        </View>
                        <Text style={styles.successTitle}>Verified</Text>
                        <Text style={styles.successSubtitle}>Preparing your dashboard...</Text>
                    </Animated.View>
                ) : null}
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    heroSection: {
        minHeight: 252,
        height: Math.max(252, Screen.height * 0.31),
        backgroundColor: Colors.primaryDark,
        overflow: 'hidden',
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
    },
    heroBubble: {
        position: 'absolute',
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    heroBubblePrimary: {
        width: 210,
        height: 210,
        top: -70,
        right: -50,
    },
    heroBubbleSecondary: {
        width: 140,
        height: 140,
        bottom: -44,
        left: -34,
    },
    heroSafeArea: {
        flex: 1,
    },
    heroContent: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.xl,
        gap: 10,
    },
    stepLabel: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(255,255,255,0.2)',
        color: Colors.white,
        borderRadius: BorderRadius.round,
        overflow: 'hidden',
        paddingHorizontal: 10,
        paddingVertical: 4,
        fontSize: 12,
        fontWeight: '700',
    },
    heroTitle: {
        color: Colors.white,
        fontSize: 30,
        lineHeight: 36,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    heroSubtitle: {
        color: 'rgba(255,255,255,0.84)',
        fontSize: 15,
    },
    phoneBadge: {
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderRadius: BorderRadius.round,
        backgroundColor: 'rgba(15, 23, 42, 0.25)',
        paddingVertical: 6,
        paddingHorizontal: 12,
    },
    phoneBadgeText: {
        color: Colors.white,
        fontSize: 15,
        fontWeight: '700',
        letterSpacing: 0.2,
    },
    editButton: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    mainSection: {
        flex: 1,
        marginTop: -24,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: Spacing.xl,
        paddingBottom: Platform.OS === 'ios' ? 28 : 20,
    },
    authCard: {
        marginTop: Spacing.md,
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.xxxl,
        padding: Spacing.xl,
        gap: Spacing.lg,
        ...Shadows.lg,
    },
    cardHeader: {
        gap: 6,
    },
    cardTitle: {
        color: Colors.heading,
        fontSize: 24,
        fontWeight: '800',
        letterSpacing: -0.4,
    },
    cardSubtitle: {
        color: Colors.paragraph,
        fontSize: 14,
        lineHeight: 20,
    },
    otpRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
    },
    otpInputWrapper: {
        flex: 1,
    },
    otpInput: {
        height: 64,
        borderRadius: BorderRadius.xl,
        borderWidth: 1.5,
        borderColor: Colors.border,
        backgroundColor: Colors.surfaceSecondary,
        color: Colors.heading,
        fontSize: 26,
        fontWeight: '800',
    },
    otpInputFilled: {
        borderColor: Colors.primaryBlue,
        backgroundColor: Colors.primaryUltraLight,
    },
    otpInputActive: {
        borderColor: Colors.primaryBlue,
        ...Shadows.glow,
    },
    helperText: {
        color: Colors.muted,
        fontSize: 12,
        lineHeight: 18,
    },
    errorBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderRadius: BorderRadius.md,
        backgroundColor: Colors.errorLight,
        paddingHorizontal: 10,
        paddingVertical: 8,
    },
    warningText: {
        flex: 1,
        color: Colors.warning,
        fontSize: 12,
        fontWeight: '700',
    },
    errorText: {
        flex: 1,
        color: Colors.error,
        fontSize: 12,
        fontWeight: '700',
    },
    resendSection: {
        alignItems: 'center',
        gap: 10,
        marginTop: 4,
    },
    resendLabel: {
        color: Colors.paragraph,
        fontSize: 13,
    },
    timerPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderRadius: BorderRadius.round,
        backgroundColor: Colors.primaryUltraLight,
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    timerText: {
        color: Colors.primaryBlue,
        fontSize: 13,
        fontWeight: '700',
    },
    resendButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderRadius: BorderRadius.round,
        backgroundColor: Colors.primaryUltraLight,
        paddingVertical: 10,
        paddingHorizontal: 14,
    },
    resendButtonText: {
        color: Colors.primaryBlue,
        fontSize: 14,
        fontWeight: '700',
    },
    successOverlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 99,
        backgroundColor: 'rgba(255, 255, 255, 0.96)',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
    },
    successCircle: {
        width: 92,
        height: 92,
        borderRadius: 46,
        backgroundColor: Colors.success,
        justifyContent: 'center',
        alignItems: 'center',
        ...Shadows.glow,
    },
    successTitle: {
        color: Colors.success,
        fontSize: 24,
        fontWeight: '800',
    },
    successSubtitle: {
        color: Colors.paragraph,
        fontSize: 14,
    },
});
