import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchClinics } from '../../store/slices/clinicsSlice';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '../../config/theme';
import { ROUTES } from '../../config/constants';
import FlutterSvgIcon from '../../components/common/FlutterSvgIcon';

const getClinicId = (clinic: any) => String(clinic?.id || clinic?._id || '');
const getClinicName = (clinic: any) =>
    String(clinic?.name || clinic?.clinicName || clinic?.clinic_name || '');
const getClinicAddress = (clinic: any) =>
    String(clinic?.address || clinic?.clinicAddress || clinic?.clinic_address || '');
const getClinicLogo = (clinic: any) =>
    String(clinic?.clinicLogoUrl || clinic?.clinic_logo_url || clinic?.logo || '');

export default function ClinicListScreen({ navigation }: any) {
    const dispatch = useAppDispatch();
    const { clinics, loading } = useAppSelector((state) => state.clinics);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (clinics.length === 0) {
            dispatch(fetchClinics());
        }
    }, [clinics.length, dispatch]);

    const normalizedQuery = searchQuery.trim().toLowerCase();

    const filteredClinics = useMemo(() => {
        if (!normalizedQuery) return clinics;

        return clinics.filter((clinic) => {
            const name = getClinicName(clinic).toLowerCase();
            const address = getClinicAddress(clinic).toLowerCase();
            return name.includes(normalizedQuery) || address.includes(normalizedQuery);
        });
    }, [clinics, normalizedQuery]);

    const handleClinicPress = (clinic: any) => {
        const clinicId = getClinicId(clinic);
        const clinicName = getClinicName(clinic);
        if (!clinicId) return;

        navigation.navigate(ROUTES.CLINIC_DOCTORS, {
            clinicId,
            clinicName,
        });
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.7}>
                    <FlutterSvgIcon name="back" size={20} color={Colors.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Clinics</Text>
                <View style={styles.headerSpacer} />
            </View>

            <View style={styles.searchWrap}>
                <View style={styles.searchBox}>
                    <FlutterSvgIcon name="search" size={18} color={Colors.muted} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search Clinics"
                        placeholderTextColor={Colors.placeholder}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 ? (
                        <TouchableOpacity
                            onPress={() => setSearchQuery('')}
                            style={styles.clearButton}
                            activeOpacity={0.7}>
                            <FlutterSvgIcon name="false" size={12} color={Colors.white} />
                        </TouchableOpacity>
                    ) : null}
                </View>
            </View>

            {loading && clinics.length === 0 ? (
                <View style={styles.loadingState}>
                    <ActivityIndicator size="large" color={Colors.primaryBlue} />
                </View>
            ) : (
                <FlatList
                    data={filteredClinics}
                    numColumns={2}
                    keyExtractor={(item, index) => `${getClinicId(item) || 'clinic'}-${index}`}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.gridList}
                    columnWrapperStyle={styles.columnWrap}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            activeOpacity={0.85}
                            style={styles.clinicCard}
                            onPress={() => handleClinicPress(item)}>
                            <View style={styles.logoWrap}>
                                {getClinicLogo(item) ? (
                                    <Image
                                        source={{ uri: getClinicLogo(item) }}
                                        style={styles.logoImage}
                                        resizeMode="cover"
                                    />
                                ) : (
                                    <FlutterSvgIcon name="hospital" size={36} color={Colors.primaryBlue} />
                                )}
                            </View>
                            <Text style={styles.clinicName} numberOfLines={2}>
                                {getClinicName(item)}
                            </Text>
                            <Text style={styles.clinicAddress} numberOfLines={2}>
                                {getClinicAddress(item)}
                            </Text>
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={
                        <View style={styles.emptyWrap}>
                            <Text style={styles.emptyText}>No Clinics Available</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        height: 112,
        backgroundColor: Colors.primaryBlue,
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: Platform.OS === 'ios' ? 54 : 18,
        paddingHorizontal: Spacing.xl,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.18)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        flex: 1,
        color: Colors.white,
        fontSize: 20,
        fontWeight: '800',
        marginLeft: 16,
    },
    headerSpacer: {
        width: 40,
    },
    searchWrap: {
        paddingHorizontal: Spacing.xl,
        paddingTop: 16,
        paddingBottom: 8,
    },
    searchBox: {
        minHeight: 54,
        borderRadius: BorderRadius.xxl,
        backgroundColor: Colors.white,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        gap: 8,
        borderWidth: 1,
        borderColor: Colors.borderLight,
        ...Shadows.card,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: Colors.heading,
    },
    clearButton: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: Colors.muted,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    gridList: {
        paddingHorizontal: Spacing.xl,
        paddingVertical: 12,
        paddingBottom: 120,
    },
    columnWrap: {
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    clinicCard: {
        width: '48.5%',
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.xxl,
        padding: 14,
        minHeight: 174,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.borderLight,
        ...Shadows.sm,
    },
    logoWrap: {
        width: 58,
        height: 58,
        borderRadius: 12,
        backgroundColor: Colors.primaryUltraLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    logoImage: {
        width: 58,
        height: 58,
        borderRadius: 12,
    },
    clinicName: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.heading,
        textAlign: 'center',
        marginTop: 2,
    },
    clinicAddress: {
        marginTop: 4,
        fontSize: 11,
        color: Colors.muted,
        textAlign: 'center',
        lineHeight: 15,
    },
    emptyWrap: {
        marginTop: 48,
        alignItems: 'center',
    },
    emptyText: {
        ...Typography.bodyMedium,
        color: Colors.muted,
    },
});
