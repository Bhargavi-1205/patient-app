import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Share,
    Alert,
    Platform,
    ActivityIndicator,
    StatusBar,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../config/theme';
import { networkClient } from '../../services/networkClient';
import { API_URLS } from '../../config/constants';
import { tokenHelper } from '../../services/tokenHelper';
import AESHelper from '../../services/aesHelper';

// Use legacy import for expo-file-system (SDK 54 restructured the API)
// @ts-ignore — legacy subpath may not have types
import * as FileSystem from 'expo-file-system/legacy';

type MinimalPatient = {
    id: string;
    fileKey: string;
};

type FileKeyCandidate = {
    source: 'route' | 'patient_lookup' | 'patient_lookup_all' | 'consultation_lookup' | 'storage_fallback';
    value: string;
};


const getBuffer = () => {
    const bufferModule = require('buffer');
    return bufferModule.Buffer;
};

const bytesToBase64 = (bytes: Uint8Array): string => {
    const Buffer = getBuffer();
    return Buffer.from(bytes).toString('base64');
};

const extractFileNameFromUrl = (url: string): string | null => {
    try {
        const parsedUrl = new URL(url);
        const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);
        return pathSegments.length > 0 ? pathSegments[pathSegments.length - 1] : null;
    } catch {
        const sanitizedUrl = url.split('?')[0];
        const pathSegments = sanitizedUrl.split('/').filter(Boolean);
        return pathSegments.length > 0 ? pathSegments[pathSegments.length - 1] : null;
    }
};

const extractPatientsArray = (json: any): any[] => {
    if (Array.isArray(json)) return json;
    if (Array.isArray(json?.patients)) return json.patients;
    if (Array.isArray(json?.data)) return json.data;
    if (Array.isArray(json?.res)) return json.res;
    if (Array.isArray(json?.res?.patients)) return json.res.patients;
    return [];
};

const extractFileKeysFromPayload = (payload: any): string[] => {
    const candidates = [
        payload?.file_key,
        payload?.fileKey,
        payload?.patient_file_key,
        payload?.patientFileKey,
        payload?.patient_details?.file_key,
        payload?.patient_details?.fileKey,
        payload?.primary_patient?.file_key,
        payload?.primary_patient?.fileKey,
        payload?.patient?.file_key,
        payload?.patient?.fileKey,
    ].map((value) => String(value || '').trim()).filter(Boolean);

    return candidates.filter((item, index) => candidates.indexOf(item) === index);
};

/**
 * Build HTML for Android — renders PDF from base64 using pdf.js (canvas per page).
 * Android WebView cannot natively display PDFs, so we use Mozilla's pdf.js.
 */
const buildAndroidPdfJsHtml = (base64Data: string): string => {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=3.0, user-scalable=yes">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            background: #f0f0f0;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 0;
        }
        .page-container {
            width: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 8px 0;
        }
        canvas {
            display: block;
            margin: 6px auto;
            max-width: 98%;
            background: #fff;
            box-shadow: 0 1px 4px rgba(0,0,0,0.15);
        }
        .loading {
            color: #666;
            font-family: -apple-system, sans-serif;
            text-align: center;
            padding: 60px 20px;
            font-size: 15px;
        }
        .error {
            color: #dc3545;
            font-family: -apple-system, sans-serif;
            text-align: center;
            padding: 60px 20px;
            font-size: 14px;
        }
    </style>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
</head>
<body>
    <div id="status" class="loading">Rendering PDF...</div>
    <div id="pages" class="page-container"></div>
    <script>
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

        async function renderPdf() {
            try {
                var base64 = "${base64Data}";
                var binaryStr = atob(base64);
                var bytes = new Uint8Array(binaryStr.length);
                for (var i = 0; i < binaryStr.length; i++) {
                    bytes[i] = binaryStr.charCodeAt(i);
                }

                var pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
                document.getElementById('status').style.display = 'none';

                var pagesContainer = document.getElementById('pages');
                var totalPages = pdf.numPages;

                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'loaded', pages: totalPages }));

                // Calculate scale based on screen width
                var containerWidth = window.innerWidth - 16; // 8px padding each side

                for (var pageNum = 1; pageNum <= totalPages; pageNum++) {
                    var page = await pdf.getPage(pageNum);
                    var unscaledViewport = page.getViewport({ scale: 1.0 });
                    var scale = (containerWidth / unscaledViewport.width) * 2; // 2x for retina
                    var viewport = page.getViewport({ scale: scale });

                    var canvas = document.createElement('canvas');
                    canvas.width = viewport.width;
                    canvas.height = viewport.height;
                    canvas.style.width = containerWidth + 'px';
                    canvas.style.height = (containerWidth * viewport.height / viewport.width) + 'px';
                    pagesContainer.appendChild(canvas);

                    var ctx = canvas.getContext('2d');
                    await page.render({ canvasContext: ctx, viewport: viewport }).promise;
                }
            } catch (err) {
                document.getElementById('status').className = 'error';
                document.getElementById('status').textContent = 'Failed to render PDF: ' + err.message;
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: err.message }));
            }
        }
        renderPdf();
    </script>
</body>
</html>`;
};

/** Fallback: Google Docs Viewer for public URLs */
const buildRemotePdfHtml = (pdfUrl: string): string => {
    const encodedUrl = encodeURIComponent(pdfUrl);
    return `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * { margin: 0; padding: 0; }
        html, body { width: 100%; height: 100%; overflow: hidden; background: #f0f0f0; }
        iframe { width: 100%; height: 100%; border: none; }
    </style>
</head>
<body>
    <iframe src="https://docs.google.com/gview?embedded=true&url=${encodedUrl}"
            onload="window.ReactNativeWebView.postMessage(JSON.stringify({type:'loaded', pages: 1}))">
    </iframe>
</body>
</html>`;
};

export default function PDFViewerScreen({ route, navigation }: any) {
    const {
        pdfUrl: incomingPdfUrl,
        consultationId,
        clinicId: incomingClinicId,
        patientId: incomingPatientId,
        fileKey: incomingFileKey,
        prescription,
    } = route.params || {};

    const [pdfSource, setPdfSource] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [resolvedPdfUrl, setResolvedPdfUrl] = useState<string>('');
    const [downloading, setDownloading] = useState(false);
    const isMountedRef = useRef(true);
    const localFileUriRef = useRef<string | null>(null);
    const consultationPayloadPromiseRef = useRef<Promise<any | null> | null>(null);
    const consultationPayloadKeyRef = useRef<string | null>(null);

    const doctorDisplayName = useMemo(
        () => prescription?.doctorName || 'N/A',
        [prescription?.doctorName],
    );

    useEffect(() => {
        return () => {
            isMountedRef.current = false;
            if (localFileUriRef.current) {
                FileSystem.deleteAsync(localFileUriRef.current, { idempotent: true }).catch(() => { });
            }
        };
    }, []);

    // ─── Data Resolution Helpers ────────────────────────────────────

    const fetchPdfUrlFromConsultation = useCallback(async () => {
        if (!consultationId) return '';

        const consultationIdKey = String(consultationId);
        if (consultationPayloadKeyRef.current !== consultationIdKey) {
            consultationPayloadKeyRef.current = consultationIdKey;
            consultationPayloadPromiseRef.current = null;
        }

        if (!consultationPayloadPromiseRef.current) {
            consultationPayloadPromiseRef.current = (async () => {
                const url = `${API_URLS.GET_PDF_DATA}/${encodeURIComponent(consultationIdKey)}`;
                const response = await networkClient.get(url, (json: any) => json?.data ?? json ?? null);
                return response.isSuccess ? (response.data ?? null) : null;
            })();
        }

        const payload = await consultationPayloadPromiseRef.current;
        const source = Array.isArray(payload) ? payload[0] : payload;

        const maybeUrl =
            source?.consultation_pdf_link ||
            source?.pdf_url ||
            source?.url ||
            '';

        return typeof maybeUrl === 'string' ? maybeUrl : '';
    }, [consultationId]);

    const resolveFileKeyCandidates = useCallback(async (): Promise<FileKeyCandidate[]> => {
        const candidates: FileKeyCandidate[] = [];

        if (incomingFileKey) {
            candidates.push({ source: 'route', value: String(incomingFileKey) });
        }

        if (consultationId) {
            const consultationPdfUrl = await fetchPdfUrlFromConsultation();
            if (consultationPdfUrl) {
                // no-op; ensures consultation payload lookup ran before extracting file keys
            }
            if (consultationPayloadPromiseRef.current) {
                const payload = await consultationPayloadPromiseRef.current;
                const fileKeys = extractFileKeysFromPayload(Array.isArray(payload) ? payload[0] : payload);
                fileKeys.filter(Boolean).forEach((key) =>
                    candidates.push({ source: 'consultation_lookup', value: key }),
                );
            }
        }

        if (incomingPatientId) {
            const resp = await networkClient.get(API_URLS.GET_ALL_PATIENTS, (json: any) => {
                const patients = extractPatientsArray(json);
                return patients.map((item: any) => ({
                    id: String(item?._id || item?.id || ''),
                    fileKey: String(item?.file_key || item?.fileKey || ''),
                })) as MinimalPatient[];
            });
            if (resp.isSuccess && Array.isArray(resp.data)) {
                const matched = (resp.data as MinimalPatient[]).find((p) => p.id === incomingPatientId);
                if (matched?.fileKey) {
                    candidates.push({ source: 'patient_lookup', value: matched.fileKey });
                }
                (resp.data as MinimalPatient[])
                    .map((p) => p.fileKey).filter(Boolean)
                    .filter((key) => key !== matched?.fileKey)
                    .forEach((key) => candidates.push({ source: 'patient_lookup_all', value: key }));
            }
        }

        const fallback = await tokenHelper.getFileKey();
        if (fallback) candidates.push({ source: 'storage_fallback', value: fallback });

        return candidates.filter((c, i, arr) => arr.findIndex((x) => x.value === c.value) === i);
    }, [consultationId, fetchPdfUrlFromConsultation, incomingFileKey, incomingPatientId]);

    // ─── Decrypt Path ───────────────────────────────────────────────

    const tryDecryptPdf = useCallback(
        async (pdfUrl: string, clinicId: string): Promise<string | null> => {
            const fileName = extractFileNameFromUrl(pdfUrl);
            const fileKeyCandidates = await resolveFileKeyCandidates();

            if (!fileName || !clinicId || fileKeyCandidates.length === 0) return null;

            const encResp = await networkClient.makeRequest({
                method: 'GET',
                url: `/prescriptions/view/${clinicId}/${fileName}`,
                data: null,
                parseAsResponseModel: false,
                createData: (json: any) => json,
            });

            if (!encResp.isSuccess || !encResp.data?.encrypted_data) return null;
            const encryptedPayload = encResp.data.encrypted_data;

            for (const candidate of fileKeyCandidates) {
                const decryptKey = await AESHelper.decryptCBC(candidate.value);
                if (!decryptKey) continue;

                const decryptedBytes = await AESHelper.decryptPdfData(encryptedPayload, decryptKey);
                if (!decryptedBytes) continue;

                const localUri = FileSystem.cacheDirectory + `decrypted_${Date.now()}.pdf`;
                await FileSystem.writeAsStringAsync(localUri, bytesToBase64(decryptedBytes), {
                    encoding: FileSystem.EncodingType.Base64,
                });
                return localUri;
            }
            return null;
        },
        [resolveFileKeyCandidates],
    );

    // ─── Download Path ──────────────────────────────────────────────

    const downloadPdfLocally = useCallback(async (url: string): Promise<string | null> => {
        try {
            const accessToken = await tokenHelper.getAccessToken();
            const headers: Record<string, string> = accessToken
                ? { Authorization: `Bearer ${accessToken}` }
                : {};

            const localUri = FileSystem.cacheDirectory + `prescription_${Date.now()}.pdf`;
            const result = await FileSystem.downloadAsync(url, localUri, { headers });

            if (result.status !== 200) {
                return null;
            }
            return localUri;
        } catch {
            return null;
        }
    }, []);

    // ─── Main Resolver ──────────────────────────────────────────────

    const resolvePdf = useCallback(async () => {
        setLoading(true);
        setErrorMessage(null);

        try {
            const pdfUrl = incomingPdfUrl || (await fetchPdfUrlFromConsultation());

            if (!pdfUrl) {
                if (isMountedRef.current) {
                    setErrorMessage('Prescription document is not available.');
                    setLoading(false);
                }
                return;
            }

            if (isMountedRef.current) setResolvedPdfUrl(pdfUrl);

            let localPdfUri: string | null = null;

            // Path 1: Encrypted PDF decrypt
            if (incomingClinicId) {
                try {
                    localPdfUri = await tryDecryptPdf(pdfUrl, incomingClinicId);
                } catch {
                    // Decryption failed, will try download path
                }
            }

            // Path 2: Download directly
            if (!localPdfUri) {
                try {
                    localPdfUri = await downloadPdfLocally(pdfUrl);
                } catch {
                    // Download failed, will try Google Docs fallback
                }
            }

            if (!isMountedRef.current) return;

            if (localPdfUri) {
                localFileUriRef.current = localPdfUri;

                if (Platform.OS === 'ios') {
                    setPdfSource({ uri: localPdfUri });
                } else {
                    // Android: Read file as base64 and render with pdf.js
                    const base64Content = await FileSystem.readAsStringAsync(localPdfUri, {
                        encoding: FileSystem.EncodingType.Base64,
                    });
                    setPdfSource({ html: buildAndroidPdfJsHtml(base64Content) });
                }

                setLoading(false);
                return;
            }

            // Path 3: Public URL fallback via Google Docs
            if (isMountedRef.current) {
                setPdfSource({ html: buildRemotePdfHtml(pdfUrl) });
                setLoading(false);
            }
        } catch (error: any) {
            if (isMountedRef.current) {
                setErrorMessage(error?.message || 'Failed to load prescription PDF.');
                setLoading(false);
            }
        }
    }, [incomingPdfUrl, incomingClinicId, fetchPdfUrlFromConsultation, tryDecryptPdf, downloadPdfLocally]);

    useEffect(() => {
        resolvePdf();
    }, [resolvePdf]);

    // ─── Handlers ───────────────────────────────────────────────────

    const handleWebViewMessage = useCallback((event: any) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'loaded') {
                // PDF loaded successfully
            } else if (data.type === 'error') {
                setErrorMessage(`PDF render error: ${data.message}`);
            }
        } catch {
            // ignore
        }
    }, []);

    const ensureLocalPdfForActions = useCallback(async (): Promise<string | null> => {
        if (localFileUriRef.current) {
            const info = await FileSystem.getInfoAsync(localFileUriRef.current);
            if (info.exists) {
                return localFileUriRef.current;
            }
            localFileUriRef.current = null;
        }

        if (!resolvedPdfUrl) {
            return null;
        }

        let localUri: string | null = null;

        if (incomingClinicId) {
            try {
                localUri = await tryDecryptPdf(resolvedPdfUrl, incomingClinicId);
            } catch {
                localUri = null;
            }
        }

        if (!localUri) {
            localUri = await downloadPdfLocally(resolvedPdfUrl);
        }

        if (localUri) {
            localFileUriRef.current = localUri;
            return localUri;
        }

        return null;
    }, [downloadPdfLocally, incomingClinicId, resolvedPdfUrl, tryDecryptPdf]);

    /** Save PDF to device local storage (Downloads on Android, Files on iOS) */
    const handleDownload = useCallback(async () => {
        const sourceUri = await ensureLocalPdfForActions();
        if (!sourceUri) {
            Alert.alert('Download', 'No PDF available to download.');
            return;
        }
        try {
            setDownloading(true);
            const doctorSuffix = doctorDisplayName !== 'N/A'
                ? `_Dr_${doctorDisplayName.replace(/\s+/g, '_')}`
                : '';
            const fileName = `Prescription${doctorSuffix}_${Date.now()}.pdf`;

            if (Platform.OS === 'android') {
                // Android: Use SAF (Storage Access Framework) to let user pick save location
                const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
                if (permissions.granted) {
                    const base64Content = await FileSystem.readAsStringAsync(sourceUri, {
                        encoding: FileSystem.EncodingType.Base64,
                    });
                    const newFileUri = await FileSystem.StorageAccessFramework.createFileAsync(
                        permissions.directoryUri,
                        fileName,
                        'application/pdf',
                    );
                    await FileSystem.writeAsStringAsync(newFileUri, base64Content, {
                        encoding: FileSystem.EncodingType.Base64,
                    });
                    Alert.alert('Downloaded', 'Prescription has been saved to your selected folder.');
                } else {
                    Alert.alert('Permission Required', 'Please allow folder access to save the prescription.');
                }
            } else {
                // iOS: Copy to a Documents directory, then use share sheet targeting "Save to Files"
                const docDir = FileSystem.documentDirectory + fileName;
                await FileSystem.copyAsync({
                    from: sourceUri,
                    to: docDir,
                });
                // On iOS, use Sharing to open the share sheet so user can "Save to Files"
                const isAvailable = await Sharing.isAvailableAsync();
                if (isAvailable) {
                    await Sharing.shareAsync(docDir, {
                        mimeType: 'application/pdf',
                        dialogTitle: 'Save Prescription',
                        UTI: 'com.adobe.pdf',
                    });
                } else {
                    Alert.alert('Downloaded', `Prescription saved as ${fileName}`);
                }
            }
        } catch (error: any) {
            Alert.alert('Error', 'Failed to download prescription.');
        } finally {
            setDownloading(false);
        }
    }, [doctorDisplayName, ensureLocalPdfForActions]);

    const handleShare = useCallback(async () => {
        if (!resolvedPdfUrl && !localFileUriRef.current) {
            Alert.alert('Share', 'No PDF available to share.');
            return;
        }

        try {
            const sourceUri = await ensureLocalPdfForActions();
            if (sourceUri) {
                const info = await FileSystem.getInfoAsync(sourceUri);
                if (info.exists) {
                    await Sharing.shareAsync(sourceUri, {
                        mimeType: 'application/pdf',
                        dialogTitle: 'Share Prescription',
                        UTI: 'com.adobe.pdf',
                    });
                    return;
                }
            }
            await Share.share({
                message: `Medical Prescription | Dr. ${doctorDisplayName}`,
                url: resolvedPdfUrl,
            });
        } catch {
            Alert.alert('Error', 'Failed to share prescription.');
        }
    }, [doctorDisplayName, ensureLocalPdfForActions, resolvedPdfUrl]);

    const handlePrint = useCallback(async () => {
        try {
            const sourceUri = await ensureLocalPdfForActions();
            if (!sourceUri && !resolvedPdfUrl) {
                Alert.alert('Print', 'No PDF available to print.');
                return;
            }

            await Print.printAsync({
                uri: sourceUri || resolvedPdfUrl,
            });
        } catch {
            Alert.alert('Error', 'Failed to print prescription.');
        }
    }, [ensureLocalPdfForActions, resolvedPdfUrl]);

    // ─── UI ─────────────────────────────────────────────────────────

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

            {/* ── Header ── */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.7}>
                    <Ionicons name="chevron-back" size={22} color="#1A1A2E" />
                </TouchableOpacity>

                <View style={styles.headerTitleBlock}>
                    <Text style={styles.headerTitle}>Prescription</Text>
                    {doctorDisplayName !== 'N/A' && (
                        <Text style={styles.headerSubtitle}>Dr. {doctorDisplayName}</Text>
                    )}
                </View>

                <View style={styles.headerActions}>
                    <TouchableOpacity
                        style={[styles.actionBtn, downloading && styles.actionBtnDisabled]}
                        onPress={handleDownload}
                        activeOpacity={0.7}
                        disabled={downloading}>
                        {downloading ? (
                            <ActivityIndicator size="small" color="#4A90D9" />
                        ) : (
                            <Ionicons name="download-outline" size={20} color="#4A90D9" />
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={handlePrint}
                        activeOpacity={0.7}>
                        <Ionicons name="print-outline" size={20} color="#4A90D9" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={handleShare}
                        activeOpacity={0.7}>
                        <Ionicons name="share-social-outline" size={20} color="#4A90D9" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* ── PDF Content ── */}
            <View style={styles.contentArea}>
                {loading ? (
                    <View style={styles.centerWrap}>
                        <View style={styles.loadingCard}>
                            <ActivityIndicator size="large" color="#4A90D9" />
                            <Text style={styles.loadingText}>Loading prescription...</Text>
                        </View>
                    </View>
                ) : errorMessage && !pdfSource ? (
                    <View style={styles.centerWrap}>
                        <View style={styles.errorCard}>
                            <Ionicons name="document-text-outline" size={48} color="#B0BEC5" />
                            <Text style={styles.errorTitle}>Document unavailable</Text>
                            <Text style={styles.errorText}>{errorMessage}</Text>
                        </View>
                    </View>
                ) : pdfSource ? (
                    <WebView
                        originWhitelist={['*']}
                        source={pdfSource}
                        style={styles.webview}
                        javaScriptEnabled={true}
                        domStorageEnabled={true}
                        startInLoadingState={true}
                        allowFileAccess={true}
                        allowUniversalAccessFromFileURLs={true}
                        onMessage={handleWebViewMessage}
                        renderLoading={() => (
                            <View style={styles.webviewLoading}>
                                <ActivityIndicator size="large" color="#4A90D9" />
                            </View>
                        )}
                    />
                ) : (
                    <View style={styles.centerWrap}>
                        <View style={styles.errorCard}>
                            <Ionicons name="document-text-outline" size={48} color="#B0BEC5" />
                            <Text style={styles.errorTitle}>Document unavailable</Text>
                            <Text style={styles.errorText}>Prescription file could not be loaded.</Text>
                        </View>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ECEFF1',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: Platform.OS === 'ios' ? 54 : StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 38,
        paddingBottom: 14,
        paddingHorizontal: 16,
        backgroundColor: '#ffffff',
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#E0E0E0',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        gap: 10,
    },
    backBtn: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitleBlock: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 19,
        fontWeight: '700',
        color: '#1A1A2E',
        letterSpacing: -0.3,
    },
    headerSubtitle: {
        fontSize: 13,
        color: '#78909C',
        marginTop: 2,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    actionBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#EBF2FA',
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionBtnDisabled: {
        opacity: 0.6,
    },
    contentArea: {
        flex: 1,
        backgroundColor: '#ECEFF1',
    },
    webview: {
        flex: 1,
        backgroundColor: '#ECEFF1',
    },
    webviewLoading: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ECEFF1',
    },
    centerWrap: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    loadingCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        paddingHorizontal: 40,
        paddingVertical: 32,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    loadingText: {
        fontSize: 14,
        color: '#78909C',
        marginTop: 14,
        fontWeight: '500',
    },
    errorCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        paddingHorizontal: 32,
        paddingVertical: 28,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    errorTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#455A64',
        marginTop: 14,
        textAlign: 'center',
    },
    errorText: {
        fontSize: 13,
        color: '#90A4AE',
        marginTop: 6,
        textAlign: 'center',
        lineHeight: 18,
    },
});
