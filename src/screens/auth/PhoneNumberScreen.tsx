import React, { useEffect, useMemo, useRef, useState } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FlutterSvgIcon from "../../components/common/FlutterSvgIcon";
import GradientButton from "../../components/ui/GradientButton";
import { ROUTES } from "../../config/constants";
import {
  BorderRadius,
  Colors,
  Screen,
  Shadows,
  Spacing,
} from "../../config/theme";
import { useAppDispatch } from "../../store";
import { clearErrors } from "../../store/slices/authSlice";

const COUNTRY_CODE = "+91";

export default function PhoneNumberScreen({ navigation }: any) {
  const dispatch = useAppDispatch();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);

  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroTranslateY = useRef(new Animated.Value(24)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(heroOpacity, {
        toValue: 1,
        duration: 420,
        useNativeDriver: true,
      }),
      Animated.timing(heroTranslateY, {
        toValue: 0,
        duration: 420,
        useNativeDriver: true,
      }),
    ]).start();

    const cardTimer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 380,
          useNativeDriver: true,
        }),
        Animated.spring(cardTranslateY, {
          toValue: 0,
          useNativeDriver: true,
          friction: 8,
          tension: 64,
        }),
      ]).start();
    }, 120);

    return () => clearTimeout(cardTimer);
  }, [cardOpacity, cardTranslateY, heroOpacity, heroTranslateY]);

  const isValidPhone = phoneNumber.length === 10;
  const isSubmitEnabled = acceptedTerms && isValidPhone;

  const handlePhoneChange = (value: string) => {
    const normalized = value.replace(/\D/g, "").slice(0, 10);
    setPhoneNumber(normalized);
  };

  const handleSendOtp = () => {
    if (!isSubmitEnabled) {
      return;
    }

    dispatch(clearErrors());
    navigation.navigate(ROUTES.VERIFY_OTP, { phoneNumber });
  };

  const phoneFieldBorderColor =
    isInputFocused || isValidPhone ? Colors.primaryBlue : Colors.border;

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={Colors.primaryDark}
      />

      <View style={styles.heroSection}>
        <View style={[styles.heroBubble, styles.heroBubblePrimary]} />
        <View style={[styles.heroBubble, styles.heroBubbleSecondary]} />
        <View style={[styles.heroBubble, styles.heroBubbleAccent]} />

        <SafeAreaView edges={["top"]} style={styles.heroSafeArea}>
          <Animated.View
            style={[
              styles.heroContent,
              {
                opacity: heroOpacity,
                transform: [{ translateY: heroTranslateY }],
              },
            ]}
          >
            <Text style={styles.stepLabel}>Step 1 of 2</Text>
            <Text style={styles.heroTitle}>Sign in to MakoPlus</Text>
            <Text style={styles.heroSubtitle}>
              Secure access to appointments, prescriptions, and your care
              timeline.
            </Text>
          </Animated.View>
        </SafeAreaView>
      </View>

      <KeyboardAvoidingView
        style={styles.mainSection}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.authCard,
              {
                opacity: cardOpacity,
                transform: [{ translateY: cardTranslateY }],
              },
            ]}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Mobile number</Text>
              <Text style={styles.cardSubtitle}>
                We will send a 4-digit OTP to verify your account.
              </Text>
            </View>

            <View
              style={[
                styles.phoneField,
                { borderColor: phoneFieldBorderColor },
              ]}
            >
              <View style={styles.countryPrefix}>
                <Text style={styles.countryCode}>{COUNTRY_CODE}</Text>
                <View style={styles.prefixDivider} />
              </View>

              <TextInput
                autoFocus
                keyboardType="phone-pad"
                maxLength={10}
                onBlur={() => setIsInputFocused(false)}
                onChangeText={handlePhoneChange}
                onFocus={() => setIsInputFocused(true)}
                placeholder="Enter 10-digit number"
                placeholderTextColor={Colors.placeholder}
                selectionColor={Colors.primaryBlue}
                style={styles.phoneInput}
                value={phoneNumber}
              />

              {isValidPhone ? (
                <View style={styles.validIcon}>
                  <FlutterSvgIcon
                    name="verified"
                    size={18}
                    color={Colors.success}
                  />
                </View>
              ) : null}
            </View>

            <Text style={styles.helperText}>
              Only Indian mobile numbers are supported right now.
            </Text>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setAcceptedTerms((current) => !current)}
              style={styles.termsRow}
            >
              <View
                style={[
                  styles.checkbox,
                  acceptedTerms && styles.checkboxActive,
                ]}
              >
                {acceptedTerms ? (
                  <FlutterSvgIcon
                    name="verified"
                    size={12}
                    color={Colors.white}
                  />
                ) : null}
              </View>

              <Text style={styles.termsText}>
                I agree to the{" "}
                <Text style={styles.termsLink}>Privacy Policy</Text> and{" "}
                <Text style={styles.termsLink}>Terms of Service</Text>.
              </Text>
            </TouchableOpacity>

            <GradientButton
              title="Continue with OTP"
              disabled={!isSubmitEnabled}
              onPress={handleSendOtp}
              //   icon={
              //     <FlutterSvgIcon name="forward" size={16} color={Colors.white} />
              //   }
            />
          </Animated.View>
        </ScrollView>
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
    minHeight: 292,
    height: Math.max(292, Screen.height * 0.36),
    backgroundColor: Colors.primaryDark,
    overflow: "hidden",
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroBubble: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  heroBubblePrimary: {
    width: 220,
    height: 220,
    top: -64,
    right: -56,
  },
  heroBubbleSecondary: {
    width: 160,
    height: 160,
    bottom: -56,
    left: -48,
  },
  heroBubbleAccent: {
    width: 84,
    height: 84,
    top: 96,
    right: 70,
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  heroSafeArea: {
    flex: 1,
  },
  heroContent: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxxl,
    gap: Spacing.md,
  },
  stepLabel: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.2)",
    color: Colors.white,
    borderRadius: BorderRadius.round,
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  heroTitle: {
    color: Colors.white,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "800",
    letterSpacing: -0.6,
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.84)",
    fontSize: 15,
    lineHeight: 22,
  },
  securityPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.round,
    backgroundColor: "rgba(15, 23, 42, 0.24)",
  },
  securityText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: "600",
  },
  mainSection: {
    flex: 1,
    marginTop: -26,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Platform.OS === "ios" ? 28 : 20,
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
    lineHeight: 30,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  cardSubtitle: {
    color: Colors.paragraph,
    fontSize: 14,
    lineHeight: 20,
  },
  previewBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.primaryUltraLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  previewText: {
    color: Colors.primaryBlue,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  phoneField: {
    height: 58,
    borderWidth: 1.5,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.surfaceSecondary,
    flexDirection: "row",
    alignItems: "center",
  },
  countryPrefix: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 14,
    paddingRight: 6,
  },
  countryCode: {
    color: Colors.heading,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  prefixDivider: {
    width: 1,
    height: 24,
    marginLeft: 10,
    backgroundColor: Colors.border,
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 12,
    fontSize: 17,
    color: Colors.heading,
    fontWeight: "600",
    letterSpacing: 0.4,
  },
  validIcon: {
    paddingRight: 14,
  },
  helperText: {
    color: Colors.muted,
    fontSize: 12,
    lineHeight: 18,
  },
  inlineError: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.errorLight,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  inlineErrorText: {
    flex: 1,
    color: Colors.error,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "600",
  },
  termsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: Spacing.xs,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: BorderRadius.sm,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  checkboxActive: {
    backgroundColor: Colors.primaryBlue,
    borderColor: Colors.primaryBlue,
  },
  termsText: {
    flex: 1,
    color: Colors.paragraph,
    fontSize: 13,
    lineHeight: 20,
  },
  termsLink: {
    color: Colors.primaryBlue,
    fontWeight: "700",
  },
});
