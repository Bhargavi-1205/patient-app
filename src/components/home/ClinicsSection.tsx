import React, { useMemo } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppSelector } from '../../store';
import { BorderRadius, Colors, Shadows, Spacing } from '../../config/theme';
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

    const visibleClinics = useMemo(() => clinics.slice(0, 6), [clinics]);

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
                            style={styles.card}
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
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 18,
        color: Colors.heading,
        fontWeight: '500',
    },
    seeAllText: {
        color: Colors.primaryBlue,
        fontSize: 14,
        fontWeight: '500',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        columnGap: 10,
        rowGap: 12,
    },
    card: {
        width: '31%',
        backgroundColor: Colors.white,
        borderRadius: 12,
        padding: 10,
        alignItems: 'center',
        minHeight: 110,
        ...Shadows.sm,
    },
    logoWrap: {
        width: 50,
        height: 50,
        borderRadius: 8,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoImage: {
        width: 50,
        height: 50,
        borderRadius: 8,
    },
    nameText: {
        marginTop: 4,
        textAlign: 'center',
        fontSize: 13,
        fontWeight: '600',
        color: Colors.primaryBlue,
    },
    addressText: {
        marginTop: 2,
        textAlign: 'center',
        fontSize: 11,
        color: Colors.muted,
        lineHeight: 14,
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
