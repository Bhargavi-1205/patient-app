import React, { useEffect, useMemo } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchDoctorsByClinic } from '../../store/slices/doctorsSlice';
import { fetchClinics } from '../../store/slices/clinicsSlice';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '../../config/theme';
import { ROUTES } from '../../config/constants';
import { FLUTTER_PLACEHOLDER_IMAGES } from '../../config/flutterAssets';

const SCREEN_BG = '#ECECF4';

const ensureDoctorPrefix = (name: string): string => {
    const trimmed = (name || '').trim();
    if (!trimmed) return 'Doctor';
    return trimmed.toLowerCase().startsWith('dr.') ? trimmed : `Dr. ${trimmed}`;
};

const extractQualificationTags = (qualification: string): string[] => {
    if (!qualification) return [];

    const tags = qualification
        .split(/[|,/;]+/)
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part) => part.toUpperCase())
        .slice(0, 3);

    return Array.from(new Set(tags));
};

const normalizeClinicPhone = (clinic: any): string => {
    return String(
        clinic?.front_desk_contacts ||
            clinic?.clinic_front_desk_contacts ||
            clinic?.frontDeskContact ||
            clinic?.clinicFrontDeskContact ||
            clinic?.phone ||
            clinic?.mobile ||
            clinic?.contact ||
            clinic?.contact_number ||
            clinic?.clinic_phone ||
            clinic?.clinic_mobile ||
            '',
    );
};

const normalizeClinicAddress = (clinic: any): string => {
    return String(clinic?.address || clinic?.clinicAddress || clinic?.clinic_address || '');
};

const normalizeClinicName = (clinic: any): string => {
    return String(clinic?.name || clinic?.clinicName || clinic?.clinic_name || '');
};

const normalizeClinicLogo = (clinic: any): string => {
    return String(clinic?.clinicLogoUrl || clinic?.clinic_logo_url || clinic?.logo || '');
};

export default function ClinicDoctorsScreen({ route, navigation }: any) {
    const { clinicId, clinicName } = route.params || {};
    const dispatch = useAppDispatch();
    const { doctors, loading } = useAppSelector((state) => state.doctors);
    const { clinics } = useAppSelector((state) => state.clinics);

    useEffect(() => {
        if (clinicId) {
            dispatch(fetchDoctorsByClinic(clinicId));
        }
    }, [clinicId, dispatch]);

    useEffect(() => {
        if (clinics.length === 0) {
            dispatch(fetchClinics());
        }
    }, [clinics.length, dispatch]);

    const selectedClinic = useMemo(() => {
        const byId = clinics.find((item: any) => {
            const id = String(item?.id || item?._id || '');
            return id === String(clinicId || '');
        });

        if (byId) {
            return byId;
        }

        const targetName = String(clinicName || '').trim().toLowerCase();
        if (!targetName) {
            return null;
        }

        return (
            clinics.find((item: any) => normalizeClinicName(item).trim().toLowerCase() === targetName) ||
            null
        );
    }, [clinicId, clinicName, clinics]);

    const headerName = normalizeClinicName(selectedClinic) || clinicName || 'Clinic';
    const headerPhone = normalizeClinicPhone(selectedClinic);
    const headerAddress = normalizeClinicAddress(selectedClinic);
    const headerLogo = normalizeClinicLogo(selectedClinic);

    const renderHeader = () => (
        <View style={styles.headerWrap}>
            <View style={styles.headerTopRow}>
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}>
                    <Ionicons name="arrow-back" size={22} color={Colors.white} />
                </TouchableOpacity>

                <View style={styles.clinicLogoWrap}>
                    {headerLogo ? (
                        <Image source={{ uri: headerLogo }} style={styles.clinicLogo} />
                    ) : (
                        <Image source={FLUTTER_PLACEHOLDER_IMAGES.patientIcon} style={styles.clinicLogo} />
                    )}
                </View>

                <View style={styles.clinicInfo}>
                    <Text style={styles.clinicName} numberOfLines={1}>
                        {headerName}
                    </Text>

                    {headerPhone ? (
                        <View style={styles.metaRow}>
                            <Ionicons name="call-outline" size={13} color="#D2E8FF" />
                            <Text style={styles.metaText} numberOfLines={1}>
                                {headerPhone}
                            </Text>
                        </View>
                    ) : null}

                    {headerAddress ? (
                        <View style={styles.metaRow}>
                            <Ionicons name="location-outline" size={13} color="#D2E8FF" />
                            <Text style={styles.metaText} numberOfLines={2}>
                                {headerAddress}
                            </Text>
                        </View>
                    ) : null}
                </View>
            </View>
        </View>
    );

    const renderDoctorCard = ({ item }: { item: any }) => {
        const tags = extractQualificationTags(item.qualification || item.specialization || '');
        const doctorName = ensureDoctorPrefix(item.name || `${item.firstName || ''} ${item.lastName || ''}`.trim());
        const specialization = item.specialization || item.designation || 'Consultant';

        return (
            <View style={styles.card}>
                <View style={styles.cardTopRow}>
                    <View style={styles.avatarWrap}>
                        {item.profileImage ? (
                            <Image source={{ uri: item.profileImage }} style={styles.avatar} />
                        ) : (
                            <Image source={FLUTTER_PLACEHOLDER_IMAGES.thumbnail} style={styles.avatar} />
                        )}
                    </View>

                    <View style={styles.cardContent}>
                        <Text style={styles.doctorName} numberOfLines={1}>
                            {doctorName}
                        </Text>

                        {tags.length > 0 ? (
                            <View style={styles.chipsRow}>
                                <Ionicons name="school-outline" size={12} color="#89A8CA" />
                                {tags.map((tag) => (
                                    <View key={`${item.id}-${tag}`} style={styles.chip}>
                                        <Text style={styles.chipText}>{tag}</Text>
                                    </View>
                                ))}
                            </View>
                        ) : null}

                        <Text style={styles.specialization} numberOfLines={2}>
                            {specialization}
                            {headerName ? ` | ${headerName}` : ''}
                        </Text>
                    </View>
                </View>

                <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.viewDoctorBtn}
                    onPress={() => navigation.navigate(ROUTES.DOCTOR_DETAILS, { doctorId: item.id })}>
                    <Text style={styles.viewDoctorText}>View Doctor</Text>
                </TouchableOpacity>
            </View>
        );
    };

    if (loading && doctors.length === 0) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={Colors.primaryBlue} />
                <Text style={styles.loadingText}>Loading doctors...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.primaryBlue} />

            <FlatList
                data={doctors}
                keyExtractor={(item, index) => `${item?.id ?? 'doctor'}-${index}`}
                renderItem={renderDoctorCard}
                ListHeaderComponent={renderHeader}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyWrap}>
                        <Text style={styles.emptyTitle}>No doctors available</Text>
                        <Text style={styles.emptySubText}>Please try another clinic.</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: SCREEN_BG,
    },
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: SCREEN_BG,
    },
    loadingText: {
        ...Typography.bodySmall,
        color: Colors.muted,
    },
    headerWrap: {
        backgroundColor: Colors.primaryBlue,
        paddingTop: Platform.OS === 'ios' ? 54 : 42,
        paddingBottom: 14,
        paddingHorizontal: Spacing.lg,
    },
    headerTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        width: 34,
        height: 34,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    clinicLogoWrap: {
        width: 64,
        height: 64,
        borderRadius: 10,
        overflow: 'hidden',
        backgroundColor: Colors.white,
        marginRight: 12,
    },
    clinicLogo: {
        width: '100%',
        height: '100%',
    },
    clinicInfo: {
        flex: 1,
    },
    clinicName: {
        color: Colors.white,
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 2,
        lineHeight: 30,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginTop: 2,
    },
    metaText: {
        color: '#DDEEFF',
        fontSize: 12,
        fontWeight: '500',
        flex: 1,
    },
    listContent: {
        paddingBottom: 26,
    },
    card: {
        marginHorizontal: Spacing.lg,
        marginTop: Spacing.md,
        backgroundColor: Colors.white,
        borderRadius: 14,
        padding: 12,
        ...Shadows.sm,
    },
    cardTopRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    avatarWrap: {
        width: 52,
        height: 52,
        borderRadius: 26,
        overflow: 'hidden',
        marginRight: 10,
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    cardContent: {
        flex: 1,
    },
    doctorName: {
        color: '#6D7B88',
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 3,
    },
    chipsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 4,
        flexWrap: 'wrap',
    },
    chip: {
        backgroundColor: '#E4EDF8',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    chipText: {
        color: '#8AA1B9',
        fontSize: 10,
        fontWeight: '700',
    },
    specialization: {
        color: '#7A8088',
        fontSize: 12,
        lineHeight: 17,
        fontWeight: '500',
    },
    viewDoctorBtn: {
        alignSelf: 'center',
        marginTop: 10,
        backgroundColor: '#D6E8FA',
        borderRadius: 6,
        paddingHorizontal: 14,
        paddingVertical: 4,
    },
    viewDoctorText: {
        color: Colors.primaryBlue,
        fontSize: 13,
        fontWeight: '700',
    },
    emptyWrap: {
        marginTop: 80,
        alignItems: 'center',
        paddingHorizontal: 30,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.heading,
        marginBottom: 4,
    },
    emptySubText: {
        fontSize: 13,
        color: Colors.muted,
    },
});
