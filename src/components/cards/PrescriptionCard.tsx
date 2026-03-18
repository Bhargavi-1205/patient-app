// Prescription Card — Modern Premium Design with enhanced layout
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../config/theme';
import { ROUTES } from '../../config/constants';

interface PrescriptionCardProps {
    prescription: {
        id: string;
        consultationId?: string;
        doctorName: string;
        patientName: string;
        date: string;
        pdfUrl: string;
        clinicId: string;
        patientId?: string;
        fileKey?: string;
        [key: string]: any;
    };
    navigation: any;
}

const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    const parsed = Date.parse(dateStr);
    if (!Number.isNaN(parsed)) {
        const d = new Date(parsed);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${d.getDate()} ${months[d.getMonth()]}, ${d.getFullYear()}`;
    }
    return dateStr;
};

export default function PrescriptionCard({ prescription, navigation }: PrescriptionCardProps) {
    const handleView = () => {
        navigation.navigate(ROUTES.PDF_VIEWER, {
            prescription: prescription,
            pdfUrl: prescription.pdfUrl,
            consultationId: prescription.consultationId || prescription.id,
            clinicId: prescription.clinicId,
            patientId: prescription.patientId,
            fileKey: prescription.fileKey,
        });
    };

    return (
        <TouchableOpacity
            style={styles.card}
            activeOpacity={0.75}
            onPress={handleView}>
            {/* Left accent */}
            <View style={styles.accentLine} />

            <View style={styles.cardInner}>
                {/* Top Row */}
                <View style={styles.topRow}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="document-text" size={22} color={Colors.primaryBlue} />
                    </View>
                    <View style={styles.content}>
                        <Text style={styles.doctorName} numberOfLines={1}>
                            Dr. {prescription.doctorName}
                        </Text>
                        <Text style={styles.patientName} numberOfLines={1}>
                            Patient: {prescription.patientName}
                        </Text>
                    </View>
                    <View style={styles.viewButton}>
                        <Ionicons name="document-text-outline" size={16} color={Colors.primaryBlue} />
                        <Text style={styles.viewButtonText}>View</Text>
                    </View>
                </View>

                {/* Divider */}
                <View style={styles.divider} />

                {/* Bottom Row */}
                <View style={styles.bottomRow}>
                    <View style={styles.metaItem}>
                        <Ionicons name="calendar-outline" size={13} color={Colors.muted} />
                        <Text style={styles.metaText}>{formatDate(prescription.date)}</Text>
                    </View>
                    <View style={styles.metaItem}>
                        <Ionicons name="document-outline" size={13} color={Colors.muted} />
                        <Text style={styles.metaText}>PDF Prescription</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.xl,
        marginBottom: Spacing.md,
        marginHorizontal: Spacing.xl,
        overflow: 'hidden',
        ...Shadows.sm,
    },
    accentLine: {
        width: 4,
        alignSelf: 'stretch',
        backgroundColor: '#F59E0B',
    },
    cardInner: {
        flex: 1,
        padding: Spacing.lg,
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 46,
        height: 46,
        borderRadius: 14,
        backgroundColor: '#DDEFFF',
        borderWidth: 1,
        borderColor: '#C9E4FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    content: {
        flex: 1,
        marginRight: 8,
    },
    doctorName: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.heading,
        marginBottom: 2,
    },
    patientName: {
        fontSize: 13,
        color: Colors.body,
    },
    viewButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 10,
        backgroundColor: Colors.primaryUltraLight,
        gap: 5,
    },
    viewButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.primaryBlue,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.divider,
        marginVertical: Spacing.md,
    },
    bottomRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 18,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    metaText: {
        fontSize: 12,
        color: Colors.muted,
        fontWeight: '500',
    },
});
