// Notifications Screen — matches Flutter's notifications_screen.dart
// SSE-powered real-time notifications with connection status, mark-read, and clear-all
import React, { useEffect, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    Platform,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../../store';
import {
    markAllAsRead,
    clearAllNotifications,
    startListeningNotifications,
    reconnectNotifications,
    ConnectionStatus,
} from '../../store/slices/notificationsSlice';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../config/theme';
import FlutterSvgIcon from '../../components/common/FlutterSvgIcon';

// ─── Connection Status Indicator ────────────────────────────────
function ConnectionStatusIcon({
    status,
    onReconnect,
}: {
    status: ConnectionStatus;
    onReconnect: () => void;
}) {
    let iconName: string;
    let color: string;

    switch (status) {
        case 'connected':
            iconName = 'wifi';
            color = '#22C55E';
            break;
        case 'connecting':
            iconName = 'wifi';
            color = '#F59E0B';
            break;
        case 'disconnected':
            iconName = 'wifi';
            color = '#EF4444';
            break;
    }

    return (
        <TouchableOpacity
            style={styles.connectionIcon}
            onPress={status === 'disconnected' ? onReconnect : undefined}
            activeOpacity={status === 'disconnected' ? 0.7 : 1}>
            <View style={[styles.connectionDot, { backgroundColor: color }]} />
        </TouchableOpacity>
    );
}

// ─── Disconnected Banner ────────────────────────────────────────
function DisconnectedBanner({ onReconnect }: { onReconnect: () => void }) {
    return (
        <View style={styles.disconnectedBanner}>
            <FlutterSvgIcon name="bell" size={14} color="#FFF" />
            <Text style={styles.disconnectedText}>Notifications disconnected</Text>
            <TouchableOpacity onPress={onReconnect} activeOpacity={0.7}>
                <Text style={styles.reconnectText}>RECONNECT</Text>
            </TouchableOpacity>
        </View>
    );
}

// ─── Notification Card ──────────────────────────────────────────
function NotificationCard({ notification }: { notification: { id: string; message: string; read: boolean } }) {
    return (
        <View style={[styles.notificationCard, !notification.read && styles.unreadCard]}>
            <View style={[styles.iconContainer, { backgroundColor: notification.read ? '#F1F5F9' : '#EFF6FF' }]}>
                <FlutterSvgIcon
                    name="bell"
                    size={22}
                    color={notification.read ? '#94A3B8' : '#4A90E2'}
                />
            </View>
            <View style={styles.contentContainer}>
                <Text
                    style={[
                        styles.notificationMessage,
                        !notification.read && styles.unreadMessage,
                    ]}
                    numberOfLines={3}>
                    {notification.message}
                </Text>
                {!notification.read && <View style={styles.unreadDot} />}
            </View>
        </View>
    );
}

// ─── Main Screen ────────────────────────────────────────────────
export default function NotificationsScreen({ navigation }: any) {
    const dispatch = useAppDispatch();
    const { notifications, unreadCount, connectionStatus, error } = useAppSelector(
        (state) => state.notifications,
    );
    const [refreshing, setRefreshing] = React.useState(false);

    // Mark all as read when opening the screen (like Flutter does on screen open)
    useEffect(() => {
        if (unreadCount > 0) {
            dispatch(markAllAsRead());
        }
    }, []);

    const handleReconnect = useCallback(() => {
        dispatch(reconnectNotifications());
    }, [dispatch]);

    const handleClearAll = useCallback(() => {
        dispatch(clearAllNotifications());
    }, [dispatch]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await dispatch(startListeningNotifications());
        setRefreshing(false);
    }, [dispatch]);

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                        activeOpacity={0.7}>
                        <FlutterSvgIcon name="back" size={16} color={Colors.heading} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Notifications</Text>
                    {unreadCount > 0 && (
                        <View style={styles.unreadBadge}>
                            <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
                        </View>
                    )}
                </View>
                <View style={styles.headerRight}>
                    <ConnectionStatusIcon
                        status={connectionStatus}
                        onReconnect={handleReconnect}
                    />
                    {notifications.length > 0 && (
                        <TouchableOpacity
                            onPress={handleClearAll}
                            activeOpacity={0.7}
                            style={styles.clearAllButton}>
                            <Text style={styles.clearAllText}>CLEAR ALL</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Disconnected Banner */}
            {connectionStatus === 'disconnected' && (
                <DisconnectedBanner onReconnect={handleReconnect} />
            )}

            {/* Error State */}
            {error && connectionStatus === 'disconnected' && notifications.length === 0 && (
                <View style={styles.errorContainer}>
                    <View style={styles.emptyIconCircle}>
                        <FlutterSvgIcon name="bell" size={40} color="#EF4444" />
                    </View>
                    <Text style={styles.emptyTitle}>Connection Error</Text>
                    <Text style={styles.emptySubtext}>{error}</Text>
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={handleReconnect}
                        activeOpacity={0.7}>
                        <Text style={styles.retryText}>Retry Connection</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Connecting State (no notifications yet) */}
            {connectionStatus === 'connecting' && notifications.length === 0 && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.primaryBlue} />
                    <Text style={styles.loadingText}>Connecting...</Text>
                </View>
            )}

            {/* Notifications List */}
            {(notifications.length > 0 || (connectionStatus !== 'connecting' && !error)) && (
                <FlatList
                    data={notifications}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => <NotificationCard notification={item} />}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
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
                                <FlutterSvgIcon name="bell" size={40} color={Colors.muted} />
                            </View>
                            <Text style={styles.emptyTitle}>No notifications</Text>
                            <Text style={styles.emptySubtext}>
                                You don't have any notifications yet
                            </Text>
                            {connectionStatus === 'disconnected' && (
                                <TouchableOpacity
                                    style={styles.retryButton}
                                    onPress={handleReconnect}
                                    activeOpacity={0.7}>
                                    <Text style={styles.retryText}>Connect Now</Text>
                                </TouchableOpacity>
                            )}
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
        justifyContent: 'space-between',
        paddingTop: Platform.OS === 'ios' ? 58 : 16,
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.lg,
        backgroundColor: Colors.background,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    backButton: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.borderLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        ...Typography.headlineMedium,
    },
    unreadBadge: {
        backgroundColor: Colors.error,
        borderRadius: BorderRadius.round,
        minWidth: 22,
        height: 22,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
    },
    unreadBadgeText: {
        color: Colors.white,
        fontSize: 11,
        fontWeight: '800',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    connectionIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    connectionDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    clearAllButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: BorderRadius.round,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.borderLight,
    },
    clearAllText: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.heading,
        letterSpacing: 0.5,
    },

    // Disconnected Banner
    disconnectedBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F97316',
        paddingVertical: 8,
        paddingHorizontal: Spacing.lg,
        gap: 8,
    },
    disconnectedText: {
        flex: 1,
        fontSize: 12,
        color: '#FFF',
    },
    reconnectText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#FFF',
    },

    // List
    list: {
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.lg,
        paddingBottom: 100,
    },

    // Notification Card
    notificationCard: {
        flexDirection: 'row',
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.xxl,
        padding: Spacing.lg,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.borderLight,
        ...Shadows.xs,
    },
    unreadCard: {
        backgroundColor: Colors.primaryUltraLight,
        borderWidth: 1,
        borderColor: Colors.primaryLight + '30',
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    contentContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    notificationMessage: {
        flex: 1,
        fontSize: 14,
        fontWeight: '400',
        color: Colors.paragraph,
        lineHeight: 20,
    },
    unreadMessage: {
        fontWeight: '600',
        color: Colors.heading,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.primaryBlue,
        marginLeft: 8,
    },

    // Empty / Error / Loading
    emptyContainer: {
        alignItems: 'center',
        marginTop: 100,
        paddingHorizontal: 40,
    },
    errorContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    loadingText: {
        ...Typography.bodyMedium,
        color: Colors.muted,
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
    retryButton: {
        marginTop: 20,
        backgroundColor: Colors.primaryBlue,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: BorderRadius.lg,
    },
    retryText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
    },
});
