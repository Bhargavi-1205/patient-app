import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../../store';
import {
    fetchPatientDetails,
    resetUpdateState,
    updatePatient,
} from '../../store/slices/patientSlice';
import { tokenHelper } from '../../services/tokenHelper';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '../../config/theme';
import GradientButton from '../../components/ui/GradientButton';

type EditProfileScreenProps = {
    navigation: any;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function EditProfileScreen({ navigation }: EditProfileScreenProps) {
    const dispatch = useAppDispatch();
    const authPhoneNumber = useAppSelector((state) => state.auth.phoneNumber);
    const { currentPatient, loading, updateLoading, updateSuccess, updateError } = useAppSelector(
        (state) => state.patient,
    );

    const [initialized, setInitialized] = useState(false);
    const [loginMobile, setLoginMobile] = useState('');

    const [name, setName] = useState('');
    const [age, setAge] = useState('');
    const [gender, setGender] = useState('');
    const [email, setEmail] = useState('');
    const [originalEmail, setOriginalEmail] = useState('');
    const [emailTouched, setEmailTouched] = useState(false);

    useEffect(() => {
        dispatch(fetchPatientDetails(''));
    }, [dispatch]);

    useEffect(() => {
        let mounted = true;
        tokenHelper.getMobile().then((mobile) => {
            if (mounted && mobile) {
                setLoginMobile(mobile);
            }
        });

        return () => {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        if (!currentPatient || initialized) {
            return;
        }

        setName(currentPatient.name || '');
        setAge(currentPatient.age?.toString() || '');
        setGender(currentPatient.gender || '');
        setEmail(currentPatient.email || '');
        setOriginalEmail(currentPatient.email || '');
        setInitialized(true);
    }, [currentPatient, initialized]);

    useEffect(() => {
        if (updateSuccess) {
            Alert.alert('Success', 'Profile updated successfully');
            dispatch(resetUpdateState());
        }

        if (updateError) {
            Alert.alert('Error', updateError);
            dispatch(resetUpdateState());
        }
    }, [dispatch, updateError, updateSuccess]);

    const mobileFromLogin = useMemo(() => {
        return authPhoneNumber || loginMobile;
    }, [authPhoneNumber, loginMobile]);

    const hasEmailChanges = useMemo(() => {
        return email.trim() !== originalEmail.trim();
    }, [email, originalEmail]);

    const emailTrimmed = useMemo(() => email.trim(), [email]);

    const emailValidationError = useMemo(() => {
        if (!emailTouched && !hasEmailChanges) return null;
        if (!emailTrimmed) return 'Email is required.';
        if (!EMAIL_REGEX.test(emailTrimmed)) return 'Please enter a valid email address.';
        return null;
    }, [emailTouched, hasEmailChanges, emailTrimmed]);

    const handleSave = () => {
        if (!hasEmailChanges) {
            Alert.alert('Info', 'No changes to save');
            return;
        }

        if (emailValidationError) {
            Alert.alert('Invalid email', emailValidationError);
            return;
        }

        if (!currentPatient?.id) {
            Alert.alert('Error', 'Patient details are missing. Please try again.');
            return;
        }

        dispatch(
            updatePatient({
                patientId: currentPatient.id,
                data: { email: emailTrimmed },
            }),
        );
    };

    if (loading && !initialized) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={Colors.primaryBlue} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

            <View style={styles.header}>
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}>
                    <Ionicons name="chevron-back" size={22} color={Colors.heading} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Profile</Text>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                style={styles.scrollView}>
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Patient Details</Text>
                    <Text style={styles.cardSubtitle}>Only email can be edited.</Text>

                    <View style={styles.readOnlyRow}>
                        <Text style={styles.label}>Name</Text>
                        <Text style={styles.value}>{name || '-'}</Text>
                    </View>

                    <View style={styles.readOnlyRow}>
                        <Text style={styles.label}>Age</Text>
                        <Text style={styles.value}>{age || '-'}</Text>
                    </View>

                    <View style={styles.readOnlyRow}>
                        <Text style={styles.label}>Gender</Text>
                        <Text style={styles.value}>{gender || '-'}</Text>
                    </View>

                    <View style={styles.readOnlyRow}>
                        <View style={styles.mobileLabelWrap}>
                            <Text style={styles.label}>Mobile Number</Text>
                            <Text style={styles.mobileHint}>From login</Text>
                        </View>
                        <Text style={styles.value}>{mobileFromLogin || '-'}</Text>
                    </View>

                    <Text style={styles.inputLabel}>Email</Text>
                    <View style={[styles.inputContainer, emailValidationError ? styles.inputContainerError : null]}>
                        <Ionicons name="mail-outline" size={18} color={Colors.primaryBlue} />
                        <TextInput
                            autoCapitalize="none"
                            autoCorrect={false}
                            keyboardType="email-address"
                            onBlur={() => setEmailTouched(true)}
                            onChangeText={(value) => {
                                setEmailTouched(true);
                                setEmail(value);
                            }}
                            placeholder="Enter email"
                            placeholderTextColor={Colors.placeholder}
                            style={styles.input}
                            textContentType="emailAddress"
                            value={email}
                        />
                    </View>
                    {!!emailValidationError && <Text style={styles.inputErrorText}>{emailValidationError}</Text>}
                </View>

                <View style={styles.buttonContainer}>
                    <GradientButton
                        disabled={!hasEmailChanges || !!emailValidationError}
                        loading={updateLoading}
                        onPress={handleSave}
                        title="Save Changes"
                    />
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: 12,
        paddingBottom: Spacing.md,
        paddingHorizontal: Spacing.xl,
        paddingTop: Platform.OS === 'ios' ? 56 : 42,
    },
    backButton: {
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        height: 38,
        justifyContent: 'center',
        width: 38,
    },
    headerTitle: {
        ...Typography.headlineMedium,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        paddingBottom: 40,
        paddingHorizontal: Spacing.xl,
    },
    card: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
        ...Shadows.sm,
    },
    cardTitle: {
        color: Colors.heading,
        fontSize: 18,
        fontWeight: '700',
    },
    cardSubtitle: {
        color: Colors.muted,
        fontSize: 12,
        marginBottom: Spacing.lg,
        marginTop: 4,
    },
    readOnlyRow: {
        alignItems: 'center',
        borderBottomColor: Colors.divider,
        borderBottomWidth: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
    },
    label: {
        color: Colors.muted,
        fontSize: 13,
        fontWeight: '600',
    },
    value: {
        color: Colors.heading,
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 12,
        textAlign: 'right',
    },
    mobileLabelWrap: {
        gap: 2,
    },
    mobileHint: {
        color: Colors.primaryBlue,
        fontSize: 11,
        fontWeight: '600',
    },
    inputLabel: {
        color: Colors.heading,
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 8,
        marginTop: Spacing.lg,
    },
    inputContainer: {
        alignItems: 'center',
        backgroundColor: Colors.surfaceSecondary,
        borderColor: Colors.border,
        borderRadius: BorderRadius.lg,
        borderWidth: 1.5,
        flexDirection: 'row',
        gap: 10,
        height: 50,
        paddingHorizontal: 14,
    },
    inputContainerError: {
        backgroundColor: Colors.errorLight,
        borderColor: Colors.error,
    },
    input: {
        color: Colors.heading,
        flex: 1,
        fontSize: 15,
        fontWeight: '500',
        paddingVertical: 0,
    },
    inputErrorText: {
        color: Colors.error,
        fontSize: 12,
        fontWeight: '600',
        marginTop: 8,
    },
    buttonContainer: {
        marginTop: Spacing.xl,
    },
});
