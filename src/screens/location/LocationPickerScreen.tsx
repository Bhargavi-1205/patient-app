import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CommonActions } from '@react-navigation/native';
import {
    ActivityIndicator,
    Keyboard,
    KeyboardAvoidingView,
    Linking,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import MapView, {
    MapPressEvent,
    Marker,
    type MarkerDragStartEndEvent,
    PROVIDER_GOOGLE,
    Region,
} from 'react-native-maps';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { BorderRadius, Colors, Shadows, Spacing } from '../../config/theme';
import { ENV } from '../../config/env';
import { API_URLS, ROUTES } from '../../config/constants';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import { useAppDispatch } from '../../store';
import { setSelectedLocation } from '../../store/slices/locationSlice';
import { tokenHelper } from '../../services/tokenHelper';
import { networkClient } from '../../services/networkClient';

type Coordinates = {
    latitude: number;
    longitude: number;
};

type PlaceDetails = {
    formatted_address?: string;
    geometry?: {
        location?: {
            lat?: number;
            lng?: number;
        };
    };
};

type GeocodeAddressComponent = {
    long_name: string;
    types: string[];
};

type GeocodeResult = {
    formatted_address?: string;
    address_components?: GeocodeAddressComponent[];
};

type GeocodeResponse = {
    status?: string;
    results?: GeocodeResult[];
};

type LocationPermissionState = 'unknown' | 'granted' | 'denied' | 'blocked';
type LocationPickerScreenProps = NativeStackScreenProps<RootStackParamList, typeof ROUTES.MAP>;

const DEFAULT_COORDINATES: Coordinates = {
    latitude: 12.9716,
    longitude: 77.5946,
};

const DEFAULT_DELTA = {
    latitudeDelta: 0.0125,
    longitudeDelta: 0.0125,
};

// Controlled map state can trigger many renders; ignore tiny region diffs.
const REGION_EPSILON = 0.00001;

function buildRegion(coords: Coordinates): Region {
    return {
        latitude: coords.latitude,
        longitude: coords.longitude,
        latitudeDelta: DEFAULT_DELTA.latitudeDelta,
        longitudeDelta: DEFAULT_DELTA.longitudeDelta,
    };
}

function hasSignificantRegionDiff(a: Region, b: Region): boolean {
    return (
        Math.abs(a.latitude - b.latitude) > REGION_EPSILON ||
        Math.abs(a.longitude - b.longitude) > REGION_EPSILON ||
        Math.abs(a.latitudeDelta - b.latitudeDelta) > REGION_EPSILON ||
        Math.abs(a.longitudeDelta - b.longitudeDelta) > REGION_EPSILON
    );
}

function parsePermissionToState(
    status: Location.PermissionStatus,
    canAskAgain: boolean,
): LocationPermissionState {
    if (status === Location.PermissionStatus.GRANTED) {
        return 'granted';
    }
    if (status === Location.PermissionStatus.DENIED && !canAskAgain) {
        return 'blocked';
    }
    return 'denied';
}

function formatLocationNameFromGeocode(result: GeocodeResult): string | null {
    // Flutter implementation uses formatted_address from Google Geocoding.
    return result.formatted_address || null;
}

export default function LocationPickerScreen({ navigation, route }: LocationPickerScreenProps) {
    const dispatch = useAppDispatch();
    const initialCoords: Coordinates = useMemo(() => {
        const routeLocation = route?.params?.initialLocation;
        if (
            routeLocation &&
            typeof routeLocation.latitude === 'number' &&
            typeof routeLocation.longitude === 'number'
        ) {
            return {
                latitude: routeLocation.latitude,
                longitude: routeLocation.longitude,
            };
        }
        return DEFAULT_COORDINATES;
    }, [route?.params?.initialLocation?.latitude, route?.params?.initialLocation?.longitude]);

    const [selectedCoords, setSelectedCoords] = useState<Coordinates>(initialCoords);
    const [region, setRegion] = useState<Region>(() => buildRegion(initialCoords));
    const [permissionState, setPermissionState] = useState<LocationPermissionState>('unknown');
    const [isFetchingLocation, setIsFetchingLocation] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false);
    const [isResolvingAddress, setIsResolvingAddress] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [selectedPlaceName, setSelectedPlaceName] = useState<string | null>(
        route?.params?.initialLocation?.address || null,
    );

    const mapRef = useRef<MapView | null>(null);
    const isMountedRef = useRef(true);
    const regionRef = useRef<Region>(buildRegion(initialCoords));
    const isMapReadyRef = useRef(false);
    const hasFetchedInitialLocationRef = useRef(false);
    const geocodeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const geocodeRequestIdRef = useRef(0);
    const lastResolvedCoordsKeyRef = useRef<string>('');
    const resolvedAddressCacheRef = useRef<Map<string, string>>(new Map());
    const hasGooglePlacesApiKey = useMemo(() => Boolean(ENV.GOOGLE_MAPS_API_KEY?.trim()), []);

    useEffect(() => {
        return () => {
            isMountedRef.current = false;
            if (geocodeDebounceRef.current) {
                clearTimeout(geocodeDebounceRef.current);
            }
        };
    }, []);

    const placesQuery = useMemo(
        () => ({
            key: ENV.GOOGLE_MAPS_API_KEY,
            language: 'en',
        }),
        [],
    );

    const searchTextInputProps = useMemo(
        () => ({
            placeholderTextColor: Colors.muted,
            returnKeyType: 'search' as const,
            autoCorrect: false,
            autoCapitalize: 'none' as const,
        }),
        [],
    );

    const selectedLocationText = useMemo(() => {
        if (selectedPlaceName) {
            return selectedPlaceName;
        }
        if (isResolvingAddress) {
            return 'Fetching exact address...';
        }
        return 'Address unavailable for selected location.';
    }, [isResolvingAddress, selectedPlaceName]);

    const syncSelectedLocation = useCallback((nextRegion: Region) => {
        regionRef.current = nextRegion;
        setRegion((prev) => (hasSignificantRegionDiff(prev, nextRegion) ? nextRegion : prev));
        setSelectedCoords((prev) => {
            if (
                Math.abs(prev.latitude - nextRegion.latitude) <= REGION_EPSILON &&
                Math.abs(prev.longitude - nextRegion.longitude) <= REGION_EPSILON
            ) {
                return prev;
            }
            return {
                latitude: nextRegion.latitude,
                longitude: nextRegion.longitude,
            };
        });
    }, []);

    const applySelectedCoordinate = useCallback(
        (coords: Coordinates, animate: boolean, clearPlaceName = true) => {
            const nextRegion = {
                ...regionRef.current,
                latitude: coords.latitude,
                longitude: coords.longitude,
            };
            syncSelectedLocation(nextRegion);
            if (clearPlaceName) {
                setSelectedPlaceName(null);
                lastResolvedCoordsKeyRef.current = '';
            }
            if (animate && mapRef.current && isMapReadyRef.current) {
                mapRef.current.animateToRegion(nextRegion, 350);
            }
        },
        [syncSelectedLocation],
    );

    const resolveLocationName = useCallback(async (coords: Coordinates): Promise<string | null> => {
        if (!ENV.GOOGLE_MAPS_API_KEY?.trim()) {
            return null;
        }

        const endpoint =
            `https://maps.googleapis.com/maps/api/geocode/json` +
            `?latlng=${coords.latitude},${coords.longitude}` +
            `&key=${ENV.GOOGLE_MAPS_API_KEY}` +
            `&language=en`;

        try {
            const response = await fetch(endpoint);
            if (!response.ok) {
                return null;
            }

            const payload = (await response.json()) as GeocodeResponse;
            if (payload.status !== 'OK' || !payload.results?.length) {
                return null;
            }

            return formatLocationNameFromGeocode(payload.results[0]);
        } catch (geocodeError) {
            return null;
        }
    }, []);

    const getCoordsKey = useCallback(
        (coords: Coordinates) => `${coords.latitude.toFixed(6)},${coords.longitude.toFixed(6)}`,
        [],
    );

    const resolveAddressForCoordinates = useCallback(
        async (coords: Coordinates) => {
            const coordsKey = getCoordsKey(coords);
            if (coordsKey === lastResolvedCoordsKeyRef.current) {
                return;
            }

            const cachedAddress = resolvedAddressCacheRef.current.get(coordsKey);
            if (cachedAddress) {
                setSelectedPlaceName(cachedAddress);
                setIsResolvingAddress(false);
                lastResolvedCoordsKeyRef.current = coordsKey;
                return;
            }

            const requestId = geocodeRequestIdRef.current + 1;
            geocodeRequestIdRef.current = requestId;
            setIsResolvingAddress(true);

            const resolvedAddress = await resolveLocationName(coords);

            if (!isMountedRef.current || requestId !== geocodeRequestIdRef.current) {
                return;
            }

            setSelectedPlaceName(resolvedAddress);
            setIsResolvingAddress(false);
            if (resolvedAddress) {
                resolvedAddressCacheRef.current.set(coordsKey, resolvedAddress);
                lastResolvedCoordsKeyRef.current = coordsKey;
            }
        },
        [getCoordsKey, resolveLocationName],
    );

    const scheduleAddressResolution = useCallback(
        (coords: Coordinates) => {
            if (geocodeDebounceRef.current) {
                clearTimeout(geocodeDebounceRef.current);
            }

            geocodeDebounceRef.current = setTimeout(() => {
                void resolveAddressForCoordinates(coords);
            }, 350);
        },
        [resolveAddressForCoordinates],
    );

    const ensureLocationPermission = useCallback(async (): Promise<boolean> => {
        try {
            const currentPermission = await Location.getForegroundPermissionsAsync();
            if (currentPermission.granted) {
                setPermissionState('granted');
                setErrorMessage(null);
                return true;
            }

            const requestedPermission = await Location.requestForegroundPermissionsAsync();
            const nextPermissionState = parsePermissionToState(
                requestedPermission.status,
                requestedPermission.canAskAgain,
            );
            setPermissionState(nextPermissionState);

            if (nextPermissionState === 'granted') {
                setErrorMessage(null);
                return true;
            }

            if (nextPermissionState === 'blocked') {
                setErrorMessage('Location permission is blocked. Please enable it from app settings.');
            } else {
                setErrorMessage('Location permission denied. Please allow permission to continue.');
            }
            return false;
        } catch {
            setErrorMessage('Unable to request location permission.');
            return false;
        }
    }, []);

    const fetchCurrentLocation = useCallback(async () => {
        setIsFetchingLocation(true);
        setErrorMessage(null);

        const granted = await ensureLocationPermission();
        if (!granted) {
            if (isMountedRef.current) {
                setIsFetchingLocation(false);
            }
            return;
        }

        try {
            const position = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
                mayShowUserSettingsDialog: true,
            });

            if (!isMountedRef.current) {
                return;
            }

            const coords: Coordinates = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
            };
            applySelectedCoordinate(coords, true);
            scheduleAddressResolution(coords);
        } catch (error: any) {
            if (!isMountedRef.current) {
                return;
            }
            const errorMessageText = String(error?.message || '').toLowerCase();

            if (errorMessageText.includes('permission')) {
                setPermissionState('denied');
                setErrorMessage('Location permission denied. Please allow it and try again.');
            } else if (errorMessageText.includes('timeout')) {
                setErrorMessage('Location request timed out. Please try again.');
            } else {
                setErrorMessage(error?.message || 'Unable to fetch current location.');
            }
        } finally {
            if (isMountedRef.current) {
                setIsFetchingLocation(false);
            }
        }
    }, [applySelectedCoordinate, ensureLocationPermission, scheduleAddressResolution]);

    useEffect(() => {
        if (hasFetchedInitialLocationRef.current) {
            return;
        }
        hasFetchedInitialLocationRef.current = true;
        fetchCurrentLocation();
    }, [fetchCurrentLocation]);

    const handleMapReady = useCallback(() => {
        isMapReadyRef.current = true;
    }, []);

    const handleRegionChangeComplete = useCallback(
        (nextRegion: Region) => {
            if (!hasSignificantRegionDiff(regionRef.current, nextRegion)) {
                return;
            }
            syncSelectedLocation(nextRegion);
            scheduleAddressResolution({
                latitude: nextRegion.latitude,
                longitude: nextRegion.longitude,
            });
        },
        [scheduleAddressResolution, syncSelectedLocation],
    );

    const handleMarkerDragEnd = useCallback(
        (event: MarkerDragStartEndEvent) => {
            const { latitude, longitude } = event.nativeEvent.coordinate;
            applySelectedCoordinate({ latitude, longitude }, false);
            scheduleAddressResolution({ latitude, longitude });
        },
        [applySelectedCoordinate, scheduleAddressResolution],
    );

    const handleMapPress = useCallback(
        (event: MapPressEvent) => {
            const { latitude, longitude } = event.nativeEvent.coordinate;
            Keyboard.dismiss();
            applySelectedCoordinate({ latitude, longitude }, false);
            scheduleAddressResolution({ latitude, longitude });
        },
        [applySelectedCoordinate, scheduleAddressResolution],
    );

    const handlePlaceSelected = useCallback(
        (_data: unknown, details: PlaceDetails | null) => {
            const lat = details?.geometry?.location?.lat;
            const lng = details?.geometry?.location?.lng;
            if (typeof lat !== 'number' || typeof lng !== 'number') {
                setErrorMessage('Selected place does not have valid coordinates.');
                return;
            }

            if (geocodeDebounceRef.current) {
                clearTimeout(geocodeDebounceRef.current);
            }
            // Invalidate any in-flight reverse-geocode call for older coordinates.
            geocodeRequestIdRef.current += 1;

            setSelectedPlaceName(details?.formatted_address || null);
            setIsResolvingAddress(false);
            lastResolvedCoordsKeyRef.current = getCoordsKey({ latitude: lat, longitude: lng });
            setErrorMessage(null);
            applySelectedCoordinate({ latitude: lat, longitude: lng }, true, false);
            if (!details?.formatted_address) {
                scheduleAddressResolution({ latitude: lat, longitude: lng });
            }
            Keyboard.dismiss();
        },
        [applySelectedCoordinate, getCoordsKey, scheduleAddressResolution],
    );

    const handlePlaceFailure = useCallback((error: string) => {
        setErrorMessage(error ? `Google Places error: ${error}` : 'Google Places request failed.');
    }, []);

    const handlePlaceNotFound = useCallback(() => {
        setErrorMessage('No location found for your search.');
    }, []);

    const handlePlaceTimeout = useCallback(() => {
        setErrorMessage('Google Places request timed out. Please try again.');
    }, []);

    const handleRetryPermission = useCallback(() => {
        fetchCurrentLocation();
    }, [fetchCurrentLocation]);

    const handleOpenSettings = useCallback(() => {
        Linking.openSettings().catch(() => {
            setErrorMessage('Unable to open app settings.');
        });
    }, []);

    const handleBack = useCallback(() => {
        navigation.goBack();
    }, [navigation]);

    const handleConfirmLocation = useCallback(async () => {
        if (isConfirming) {
            return;
        }

        setIsConfirming(true);
        setErrorMessage(null);

        const baseCoords = {
            latitude: selectedCoords.latitude,
            longitude: selectedCoords.longitude,
        };
        const resolvedName = selectedPlaceName || (await resolveLocationName(baseCoords)) || 'Selected location';
        const selectedLocation = {
            ...baseCoords,
            address: resolvedName,
        };

        const returnTo = route?.params?.returnTo;
        const returnParams = route?.params?.returnParams || {};

        try {
            const patientId = await tokenHelper.getPatientId();
            if (patientId) {
                const saveLocationResponse = await networkClient.post(
                    `${API_URLS.GET_PATIENT_DETAILS}/${patientId}/location`,
                    {
                        lat: String(baseCoords.latitude),
                        long: String(baseCoords.longitude),
                        address: resolvedName,
                    },
                    (json: any) => json,
                );

                if (!saveLocationResponse.isSuccess) {
                    setErrorMessage(
                        saveLocationResponse.statusMessage ||
                            'Unable to save location. Please try again.',
                    );
                    return;
                }
            }

            await tokenHelper.saveSelectedLocation(selectedLocation);
            dispatch(setSelectedLocation(selectedLocation));

            if (returnTo) {
                navigation.dispatch(
                    CommonActions.navigate({
                        name: returnTo,
                        params: { ...returnParams, selectedLocation },
                    }),
                );
                return;
            }

            navigation.reset({
                index: 0,
                routes: [{ name: ROUTES.MAIN_TABS, params: { selectedLocation } }],
            });
        } catch (navigationError) {
            setErrorMessage('Unable to confirm location. Please try again.');
        } finally {
            if (isMountedRef.current) {
                setIsConfirming(false);
            }
        }
    }, [
        isConfirming,
        navigation,
        route?.params?.returnParams,
        route?.params?.returnTo,
        selectedPlaceName,
        selectedCoords.latitude,
        selectedCoords.longitude,
        dispatch,
        resolveLocationName,
    ]);

    return (
        <View style={styles.container}>
            <MapView
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                region={region}
                onMapReady={handleMapReady}
                onRegionChangeComplete={handleRegionChangeComplete}
                onPress={handleMapPress}
                moveOnMarkerPress={false}
                loadingEnabled
                showsCompass
                showsUserLocation={permissionState === 'granted'}
                showsMyLocationButton={false}>
                <Marker
                    coordinate={selectedCoords}
                    draggable
                    onDragEnd={handleMarkerDragEnd}
                    tracksViewChanges={false}
                />
            </MapView>

            <View style={styles.topActionRow}>
                <TouchableOpacity
                    style={styles.mapActionButton}
                    onPress={handleBack}
                    activeOpacity={0.8}>
                    <Ionicons name="chevron-back" size={20} color={Colors.heading} />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.mapActionButton, isFetchingLocation && styles.disabledButton]}
                    onPress={handleRetryPermission}
                    disabled={isFetchingLocation}
                    activeOpacity={0.8}>
                    <Ionicons name="locate" size={18} color={Colors.heading} />
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.searchOverlay}
                pointerEvents="box-none">
                {hasGooglePlacesApiKey ? (
                    <GooglePlacesAutocomplete
                        placeholder="Search location"
                        fetchDetails
                        debounce={300}
                        minLength={2}
                        timeout={15000}
                        enablePoweredByContainer={false}
                        keyboardShouldPersistTaps="handled"
                        nearbyPlacesAPI="GooglePlacesSearch"
                        query={placesQuery}
                        onPress={handlePlaceSelected}
                        onFail={handlePlaceFailure}
                        onNotFound={handlePlaceNotFound}
                        onTimeout={handlePlaceTimeout}
                        textInputProps={searchTextInputProps}
                        styles={googlePlacesStyles}
                    />
                ) : (
                    <View style={styles.searchDisabledCard}>
                        <Text style={styles.searchDisabledText}>
                            Search unavailable: Google Places API key is missing.
                        </Text>
                    </View>
                )}
            </KeyboardAvoidingView>

            <View style={styles.footerCard}>
                <Text style={styles.footerTitle}>Selected Location</Text>
                <Text style={styles.coordinatesText} numberOfLines={3}>
                    {selectedLocationText}
                </Text>
                {isResolvingAddress ? (
                    <Text style={styles.resolvingText}>Updating address...</Text>
                ) : null}

                {errorMessage ? (
                    <Text style={styles.errorText}>{errorMessage}</Text>
                ) : (
                    <Text style={styles.helperText}>
                        Drag marker, move map, or search to update exact address.
                    </Text>
                )}

                <View style={styles.actionRow}>
                    <TouchableOpacity
                        style={[styles.secondaryButton, isFetchingLocation && styles.disabledButton]}
                        disabled={isFetchingLocation}
                        activeOpacity={0.85}
                        onPress={handleRetryPermission}>
                        <Text style={styles.secondaryButtonText}>Use Current Location</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.primaryButton, isConfirming && styles.disabledButton]}
                        disabled={isConfirming}
                        activeOpacity={0.9}
                        onPress={handleConfirmLocation}>
                        <Text style={styles.primaryButtonText}>
                            {isConfirming ? 'Confirming...' : 'Confirm Location'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {permissionState === 'blocked' ? (
                    <TouchableOpacity
                        style={styles.settingsButton}
                        activeOpacity={0.8}
                        onPress={handleOpenSettings}>
                        <Text style={styles.settingsButtonText}>Open App Settings</Text>
                    </TouchableOpacity>
                ) : null}
            </View>

            {isFetchingLocation ? (
                <View style={styles.loaderOverlay}>
                    <ActivityIndicator size="large" color={Colors.white} />
                    <Text style={styles.loaderText}>Fetching current location...</Text>
                </View>
            ) : null}
        </View>
    );
}

const googlePlacesStyles = {
    container: {
        flex: 0,
    },
    textInputContainer: {
        backgroundColor: 'transparent',
        paddingHorizontal: Spacing.lg,
    },
    textInput: {
        height: 48,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.border,
        backgroundColor: Colors.white,
        color: Colors.heading,
        fontSize: 15,
        paddingHorizontal: Spacing.md,
        ...Shadows.sm,
    },
    listView: {
        backgroundColor: Colors.white,
        marginHorizontal: Spacing.lg,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.border,
        ...Shadows.card,
    },
    row: {
        paddingVertical: 12,
        paddingHorizontal: 14,
    },
    description: {
        color: Colors.heading,
        fontSize: 14,
    },
} as const;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    topActionRow: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 56 : 20,
        left: Spacing.lg,
        right: Spacing.lg,
        zIndex: 25,
        elevation: 25,
        flexDirection: 'row',
        justifyContent: 'space-between',
        pointerEvents: 'box-none',
    },
    mapActionButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: Colors.border,
        justifyContent: 'center',
        alignItems: 'center',
        ...Shadows.sm,
    },
    searchOverlay: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 112 : 74,
        left: 0,
        right: 0,
        zIndex: 20,
        elevation: 20,
    },
    searchDisabledCard: {
        marginHorizontal: Spacing.lg,
        height: 48,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.border,
        backgroundColor: Colors.white,
        justifyContent: 'center',
        paddingHorizontal: Spacing.md,
        ...Shadows.sm,
    },
    searchDisabledText: {
        color: Colors.muted,
        fontSize: 13,
    },
    footerCard: {
        position: 'absolute',
        left: Spacing.lg,
        right: Spacing.lg,
        bottom: Spacing.lg,
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
        ...Shadows.card,
    },
    footerTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.paragraph,
    },
    coordinatesText: {
        marginTop: 4,
        fontSize: 15,
        fontWeight: '700',
        color: Colors.heading,
    },
    helperText: {
        marginTop: 6,
        fontSize: 12,
        color: Colors.muted,
    },
    resolvingText: {
        marginTop: 6,
        fontSize: 12,
        color: Colors.primaryBlue,
        fontWeight: '600',
    },
    errorText: {
        marginTop: 6,
        fontSize: 12,
        color: Colors.error,
    },
    actionRow: {
        marginTop: Spacing.md,
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    primaryButton: {
        flex: 1,
        height: 46,
        borderRadius: BorderRadius.lg,
        backgroundColor: Colors.primaryBlue,
        justifyContent: 'center',
        alignItems: 'center',
    },
    secondaryButton: {
        flex: 1,
        height: 46,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.border,
        backgroundColor: Colors.surfaceSecondary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    primaryButtonText: {
        color: Colors.white,
        fontSize: 14,
        fontWeight: '700',
    },
    secondaryButtonText: {
        color: Colors.heading,
        fontSize: 13,
        fontWeight: '600',
    },
    disabledButton: {
        opacity: 0.55,
    },
    settingsButton: {
        marginTop: Spacing.sm,
        alignSelf: 'center',
        paddingVertical: 4,
    },
    settingsButtonText: {
        color: Colors.primaryBlue,
        fontSize: 13,
        fontWeight: '600',
        textDecorationLine: 'underline',
    },
    loaderOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.35)',
        justifyContent: 'center',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    loaderText: {
        color: Colors.white,
        fontSize: 14,
        fontWeight: '600',
    },
});
