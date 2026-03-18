// Feed Screen — Modern Premium Design
// Social-style health articles/blog cards from doctors

import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    FlatList,
    Image,
    StyleSheet,
    TouchableOpacity,
    RefreshControl,
    Animated,
    Platform,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../config/theme';
import { networkClient } from '../../services/networkClient';
import { API_URLS } from '../../config/constants';
import FlutterSvgIcon from '../../components/common/FlutterSvgIcon';
import { FLUTTER_PLACEHOLDER_IMAGES } from '../../config/flutterAssets';

interface Feed {
    id: string;
    title: string;
    content: string;
    feedImageUrl: string;
    doctorName: string;
    doctorSpecialty: string;
    doctorImageUrl: string;
    likes: number;
}

export default function FeedScreen() {
    const [feeds, setFeeds] = useState<Feed[]>([]);
    const [loading, setLoading] = useState(false);
    const [liked, setLiked] = useState<Set<string>>(new Set());

    const fetchFeeds = async () => {
        setLoading(true);
        try {
            const response = await networkClient.get(
                API_URLS.GET_FEED,
                (json: any) => json as Feed[],
            );
            if (response.isSuccess && response.data) {
                setFeeds(response.data);
            }
        } catch {
            // Silently fail — empty state handles it
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchFeeds();
    }, []);

    const toggleLike = (id: string) => {
        setLiked((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const renderFeedCard = ({ item, index }: { item: Feed; index: number }) => {
        const isLiked = liked.has(item.id);

        return (
            <View style={styles.card}>
                {/* Feed Image */}
                <View style={styles.imageContainer}>
                    {item.feedImageUrl ? (
                        <Image source={{ uri: item.feedImageUrl }} style={styles.feedImage} />
                    ) : (
                        <Image source={FLUTTER_PLACEHOLDER_IMAGES.blogImage} style={styles.feedImage} />
                    )}
                    {/* Category badge */}
                    <View style={styles.categoryBadge}>
                        <Text style={styles.categoryText}>Health Tip</Text>
                    </View>
                </View>

                {/* Text Content */}
                <View style={styles.cardContent}>
                    <Text style={styles.feedTitle} numberOfLines={2}>
                        {item.title}
                    </Text>
                    <Text style={styles.feedBody} numberOfLines={3}>
                        {item.content}
                    </Text>

                    {/* Bottom Row: Doctor + Actions */}
                    <View style={styles.bottomRow}>
                        <View style={styles.doctorRow}>
                            {item.doctorImageUrl ? (
                                <Image
                                    source={{ uri: item.doctorImageUrl }}
                                    style={styles.doctorAvatar}
                                />
                            ) : (
                                <Image
                                    source={FLUTTER_PLACEHOLDER_IMAGES.thumbnail}
                                    style={styles.doctorAvatar}
                                />
                            )}
                            <View style={styles.doctorInfo}>
                                <Text style={styles.doctorName}>{item.doctorName}</Text>
                                <Text style={styles.doctorSpecialty}>{item.doctorSpecialty}</Text>
                            </View>
                        </View>

                        <View style={styles.actionsRow}>
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => toggleLike(item.id)}>
                                <FlutterSvgIcon
                                    name="star"
                                    size={20}
                                    color={isLiked ? '#F59E0B' : Colors.muted}
                                />
                                <Text style={[styles.actionCount, isLiked && { color: '#F59E0B' }]}>
                                    {item.likes + (isLiked ? 1 : 0)}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.actionButton}>
                                <FlutterSvgIcon name="forward" size={18} color={Colors.muted} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.actionButton}>
                                <FlutterSvgIcon name="reports" size={20} color={Colors.muted} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Health Feed</Text>
                <Text style={styles.headerSubtitle}>Stay updated with health tips</Text>
            </View>

            <FlatList
                data={feeds}
                keyExtractor={(item, index) => `${item?.id ?? 'feed'}-${index}`}
                renderItem={renderFeedCard}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={loading}
                        onRefresh={fetchFeeds}
                        colors={[Colors.primaryBlue]}
                        tintColor={Colors.primaryBlue}
                    />
                }
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.emptyContainer}>
                            <View style={styles.emptyIconCircle}>
                                <FlutterSvgIcon name="reports" size={40} color={Colors.muted} />
                            </View>
                            <Text style={styles.emptyTitle}>No articles yet</Text>
                            <Text style={styles.emptySubtext}>
                                Health tips from doctors will appear here
                            </Text>
                        </View>
                    ) : null
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        paddingTop: Platform.OS === 'ios' ? 60 : 44,
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.lg,
        backgroundColor: Colors.surface,
    },
    headerTitle: {
        ...Typography.headlineLarge,
    },
    headerSubtitle: {
        ...Typography.bodySmall,
        color: Colors.muted,
        marginTop: 4,
    },
    list: {
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.lg,
        paddingBottom: 120,
    },
    card: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.xxl,
        marginBottom: Spacing.xl,
        overflow: 'hidden',
        ...Shadows.card,
    },
    imageContainer: {
        position: 'relative',
    },
    feedImage: {
        width: '100%',
        height: 200,
        resizeMode: 'cover',
    },
    categoryBadge: {
        position: 'absolute',
        top: 12,
        left: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: BorderRadius.round,
    },
    categoryText: {
        fontSize: 11,
        fontWeight: '700',
        color: Colors.primaryBlue,
    },
    cardContent: {
        padding: Spacing.lg,
    },
    feedTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: Colors.heading,
        lineHeight: 24,
        marginBottom: 8,
    },
    feedBody: {
        fontSize: 14,
        color: Colors.paragraph,
        lineHeight: 21,
        marginBottom: Spacing.lg,
    },
    bottomRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: Colors.divider,
        paddingTop: Spacing.md,
    },
    doctorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    doctorAvatar: {
        width: 36,
        height: 36,
        borderRadius: 12,
        marginRight: 10,
    },
    doctorInfo: {
        flex: 1,
    },
    doctorName: {
        fontWeight: '600',
        fontSize: 13,
        color: Colors.heading,
    },
    doctorSpecialty: {
        fontSize: 11,
        color: Colors.muted,
    },
    actionsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    actionCount: {
        fontSize: 13,
        color: Colors.muted,
        fontWeight: '500',
    },

    // Empty
    emptyContainer: {
        alignItems: 'center',
        marginTop: 80,
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
