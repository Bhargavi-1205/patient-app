import React, { useMemo } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppSelector } from '../../store';
import { BorderRadius, Colors, Screen, Shadows, Spacing, Typography } from '../../config/theme';
import { ROUTES } from '../../config/constants';
import FlutterSvgIcon from '../common/FlutterSvgIcon';

interface Props {
    navigation: any;
}

const getClinicId = (clinic: any) => String(clinic?.id || clinic?._id || '');
const getClinicName = (clinic: any) =>
    String(clinic?.name || clinic?.clinicName || clinic?.clinic_name || '');
const getClinicAddress = (clinic: any) =>
    String(clinic?.address || clinic?.clinicAddress || clinic?.clinic_address || '');
const getClinicLogo = (clinic: any) =>
    String(clinic?.clinicLogoUrl || clinic?.clinic_logo_url || clinic?.logo || '');

const capitalizeEachWord = (input: string) =>
    input
        .split(' ')
        .map((word) => (word ? `${word[0].toUpperCase()}${word.slice(1).toLowerCase()}` : ''))
        .join(' ');

export default function ClinicsSection({ navigation }: Props) {
    const { clinics } = useAppSelector((state) => state.clinics);

    const visibleClinics = useMemo(() => clinics.slice(0, 4), [clinics]);
    const columns = Screen.isSmall ? 2 : 3;
    const cardWidth = columns === 2 ? '48%' : '31.5%';

    if (clinics.length === 0) {
        return (
            <View style={styles.section}>
                <View style={styles.headerRow}>
                    <Text style={styles.sectionTitle}>Select Doctor By Clinic</Text>
                </View>
                <View style={styles.emptyWrap}>
                    <Text style={styles.emptyText}>No Clinics Available</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.section}>
            <View style={styles.headerRow}>
                <Text style={styles.sectionTitle}>Select Doctor By Clinic</Text>
                <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate(ROUTES.CLINIC_LIST)}>
                    <Text style={styles.seeAllText}>See all</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.grid}>
                {visibleClinics.map((clinic, index) => {
                    const clinicId = getClinicId(clinic);
                    const clinicName = getClinicName(clinic);
                    const clinicAddress = getClinicAddress(clinic);
                    const clinicLogo = getClinicLogo(clinic);

                    return (
                        <TouchableOpacity
                            key={`${clinicId || 'clinic'}-${index}`}
                            activeOpacity={0.85}
                            style={[styles.card, { width: cardWidth }]}
                            onPress={() =>
                                navigation.navigate(ROUTES.CLINIC_DOCTORS, {
                                    clinicId,
                                    clinicName,
                                })
                            }>
                            <View style={styles.logoWrap}>
                                {clinicLogo ? (
                                    <Image
                                        source={{ uri: clinicLogo }}
                                        style={styles.logoImage}
                                        resizeMode="cover"
                                    />
                                ) : (
                                    <FlutterSvgIcon name="hospital" size={40} />
                                )}
                            </View>
                            <Text style={styles.nameText} numberOfLines={1}>
                                {capitalizeEachWord(clinicName)}
                            </Text>
                            <Text style={styles.addressText} numberOfLines={2}>
                                {clinicAddress}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    section: {
        marginBottom: Spacing.xxl,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    sectionTitle: {
        ...Typography.headlineSmall,
        flex: 1,
        paddingRight: Spacing.md,
    },
    seeAllText: {
        color: Colors.primaryBlue,
        fontSize: 14,
        fontWeight: '700',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        rowGap: 12,
    },
    card: {
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.xl,
        paddingHorizontal: 10,
        paddingVertical: 14,
        alignItems: 'center',
        minHeight: 132,
        borderWidth: 1,
        borderColor: Colors.borderLight,
        ...Shadows.sm,
    },
    logoWrap: {
        width: 56,
        height: 56,
        borderRadius: 14,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.surfaceSecondary,
    },
    logoImage: {
        width: 56,
        height: 56,
        borderRadius: 14,
    },
    nameText: {
        marginTop: 10,
        textAlign: 'center',
        fontSize: 13,
        fontWeight: '700',
        color: Colors.heading,
    },
    addressText: {
        marginTop: 4,
        textAlign: 'center',
        fontSize: 11,
        color: Colors.muted,
        lineHeight: 16,
    },
    emptyWrap: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 14,
        color: Colors.muted,
        fontWeight: '500',
    },
});
