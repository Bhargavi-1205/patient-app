// Prescriptions Screen — Modern Premium Design with enhanced header and back navigation
import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    RefreshControl,
    Platform,
    StatusBar,
    TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchPrescriptions } from '../../store/slices/prescriptionsSlice';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../config/theme';
import PrescriptionCard from '../../components/cards/PrescriptionCard';
import FlutterSvgIcon from '../../components/common/FlutterSvgIcon';

export default function PrescriptionsScreen({ navigation }: any) {
    const dispatch = useAppDispatch();
    const { prescriptions, loading } = useAppSelector((state) => state.prescriptions);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (prescriptions.length === 0) {
            dispatch(fetchPrescriptions());
        }
    }, [dispatch, prescriptions.length]);

    const onRefresh = async () => {
        setRefreshing(true);
        await dispatch(fetchPrescriptions());
        setRefreshing(false);
    };

    const clearSearch = useCallback(() => setSearchQuery(''), []);

    const filteredPrescriptions = prescriptions.filter((p: any) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.trim().toLowerCase();
        return (
            (p.doctorName?.toLowerCase() || '').includes(q) ||
            (p.patientName?.toLowerCase() || '').includes(q) ||
            (p.date?.toLowerCase() || '').includes(q)
        );
    });

    const renderHeader = () => (
        <View style={styles.header}>
            <View style={styles.headerBase} />
            <View style={styles.headerOverlay} />
            <View style={[styles.decorCircle, styles.dc1]} />
            <View style={[styles.decorCircle, styles.dc2]} />

            <View style={styles.headerContent}>
                <View style={styles.headerRow}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                        activeOpacity={0.7}>
                        <Ionicons name="chevron-back" size={22} color={Colors.white} />
                    </TouchableOpacity>
                    <View style={styles.headerTitleBlock}>
                        <Text style={styles.title}>Prescriptions</Text>
                        <Text style={styles.subtitle}>Your medical documents</Text>
                    </View>
                    <View style={styles.countBadge}>
                        <Text style={styles.countText}>{prescriptions.length}</Text>
                    </View>
                </View>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <FlutterSvgIcon name="search" size={18} color={Colors.primaryBlue} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by doctor or patient..."
                        placeholderTextColor={Colors.placeholder}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={clearSearch}>
                            <View style={styles.clearButton}>
                                <Ionicons name="close" size={12} color={Colors.white} />
                            </View>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Bottom Curve */}
            <View style={styles.curveWrapper}>
                <View style={styles.curve} />
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.primaryBlue} />
            {renderHeader()}

            {loading && prescriptions.length === 0 ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={Colors.primaryBlue} />
                    <Text style={styles.loadingText}>Loading prescriptions...</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredPrescriptions}
                    keyExtractor={(item, index) => `${item?.id ?? 'prescription'}-${index}`}
                    renderItem={({ item }) => (
                        <PrescriptionCard prescription={item} navigation={navigation} />
                    )}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={[Colors.primaryBlue]}
                            tintColor={Colors.primaryBlue}
                            progressViewOffset={10}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <View style={styles.emptyIconCircle}>
                                <FlutterSvgIcon name="medicalPrescription" size={36} />
                            </View>
                            <Text style={styles.emptyTitle}>
                                {searchQuery ? 'No results found' : 'No prescriptions'}
                            </Text>
                            <Text style={styles.emptySubtext}>
                                {searchQuery
                                    ? 'Try a different search term'
                                    : 'Prescriptions from your consultations will appear here'}
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

    // ─── Header ─────────────────────────────────────────
    header: {
        height: 246,
        position: 'relative',
        overflow: 'hidden',
    },
    headerBase: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: Colors.primaryBlue,
    },
    headerOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(59, 130, 246, 0.4)',
    },
    decorCircle: {
        position: 'absolute',
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
    },
    dc1: { top: -40, right: -30 },
    dc2: { bottom: -50, left: -20 },
    headerContent: {
        paddingTop: Platform.OS === 'ios' ? 58 : 42,
        paddingHorizontal: Spacing.xl,
        zIndex: 1,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 18,
    },
    backButton: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.18)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    headerTitleBlock: {
        flex: 1,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: Colors.white,
    },
    subtitle: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.7)',
        marginTop: 2,
    },
    countBadge: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    countText: {
        color: Colors.white,
        fontSize: 14,
        fontWeight: '700',
    },

    // ─── Search ─────────────────────────────────────────
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.xxl,
        paddingHorizontal: 14,
        minHeight: 54,
        gap: 10,
        borderWidth: 1,
        borderColor: Colors.borderLight,
        ...Shadows.md,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: Colors.heading,
        fontWeight: '400',
    },
    clearButton: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: Colors.muted,
        justifyContent: 'center',
        alignItems: 'center',
    },

    curveWrapper: {
        position: 'absolute',
        bottom: -1,
        left: 0,
        right: 0,
        height: 30,
    },
    curve: {
        width: '100%',
        height: 50,
        backgroundColor: Colors.background,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
    },

    // ─── List ───────────────────────────────────────────
    list: {
        paddingTop: Spacing.md,
        paddingBottom: 100,
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

    // Empty
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
