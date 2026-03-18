// Appointment Booking Screen — Modern Premium Design
// Doctor search + selection for booking
import React, { useState } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    TextInput,
    TouchableOpacity,
    RefreshControl,
    Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchDoctors } from '../../store/slices/doctorsSlice';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../config/theme';
import { ROUTES } from '../../config/constants';
import DoctorCard from '../../components/cards/DoctorCard';
import FlutterSvgIcon from '../../components/common/FlutterSvgIcon';

export default function AppointmentBookingScreen({ navigation }: any) {
    const dispatch = useAppDispatch();
    const { doctors, loading } = useAppSelector((state) => state.doctors);
    const [searchQuery, setSearchQuery] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    useFocusEffect(
        React.useCallback(() => {
            dispatch(fetchDoctors());
        }, [dispatch]),
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await dispatch(fetchDoctors());
        setRefreshing(false);
    };

    const normalizedQuery = searchQuery.trim().toLowerCase();

    const filtered = doctors.filter((doctor) => {
        if (!normalizedQuery) return true;

        const visibleQualification = (
            doctor.qualification || doctor.specialization || ''
        ).toLowerCase();

        return (
            (doctor.name?.toLowerCase() || '').includes(normalizedQuery) ||
            visibleQualification.includes(normalizedQuery) ||
            (doctor.clinicName?.toLowerCase() || '').includes(normalizedQuery)
        );
    });

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Book Appointment</Text>
                    <Text style={styles.headerSubtitle}>Choose your preferred doctor</Text>
                </View>
            </View>

            {/* Search */}
            <View style={styles.searchWrapper}>
                <View style={styles.searchContainer}>
                    <FlutterSvgIcon name="search" size={20} color={Colors.primaryBlue} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by name, specialty, clinic..."
                        placeholderTextColor={Colors.placeholder}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <View style={styles.clearBtn}>
                                <FlutterSvgIcon name="false" size={12} color={Colors.white} />
                            </View>
                        </TouchableOpacity>
                    )}
                </View>
                <Text style={styles.resultCount}>
                    {filtered.length} doctor{filtered.length !== 1 ? 's' : ''} available
                </Text>
            </View>

            {loading && doctors.length === 0 ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={Colors.primaryBlue} />
                    <Text style={styles.loadingText}>Finding doctors...</Text>
                </View>
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={(item, index) => `${item?.id ?? 'doctor'}-${index}`}
                    renderItem={({ item }) => (
                        <DoctorCard
                            doctor={item}
                            navigation={navigation}
                            onBookPress={() =>
                                navigation.navigate(ROUTES.BOOKING_FLOW, {
                                    consultationId: item.id,
                                    doctorId: item.id,
                                    clinicId: item.clinicId,
                                    doctorName: `${item.name}`,
                                })
                            }
                        />
                    )}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={[Colors.primaryBlue]}
                            tintColor={Colors.primaryBlue}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <View style={styles.emptyIconCircle}>
                                <FlutterSvgIcon name="search" size={40} color={Colors.muted} />
                            </View>
                            <Text style={styles.emptyTitle}>No doctors found</Text>
                            <Text style={styles.emptySubtext}>
                                {searchQuery
                                    ? 'Try a different search term'
                                    : 'No doctors available at the moment'}
                            </Text>
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
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: Platform.OS === 'ios' ? 58 : 42,
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.lg,
        backgroundColor: Colors.background,
        gap: 12,
    },

    headerTitle: {
        ...Typography.headlineMedium,
    },
    headerSubtitle: {
        fontSize: 13,
        color: Colors.muted,
        marginTop: 2,
    },
    searchWrapper: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.md,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.xl,
        paddingHorizontal: 14,
        minHeight: 52,
        gap: 10,
        borderWidth: 1,
        borderColor: Colors.borderLight,
        ...Shadows.sm,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: Colors.heading,
    },
    clearBtn: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: Colors.muted,
        justifyContent: 'center',
        alignItems: 'center',
    },
    resultCount: {
        fontSize: 12,
        color: Colors.muted,
        marginTop: 8,
        marginLeft: 4,
        fontWeight: '600',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    loadingText: {
        ...Typography.bodySmall,
        color: Colors.muted,
    },
    list: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: 100,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 60,
        paddingHorizontal: 40,
    },
    emptyIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.surfaceSecondary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    emptyTitle: {
        ...Typography.headlineSmall,
        marginBottom: 8,
    },
    emptySubtext: {
        ...Typography.bodyMedium,
        textAlign: 'center',
        color: Colors.muted,
    },
});
