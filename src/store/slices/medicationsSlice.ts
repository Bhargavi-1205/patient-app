// Medications Slice — equivalent to Flutter's active_medication_bloc.dart
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { networkClient } from '../../services/networkClient';
import { API_URLS } from '../../config/constants';
import { tokenHelper } from '../../services/tokenHelper';

export interface Medication {
    id: string;
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
    startDate: string;
    endDate: string;
    status: string;
    timeOfDay?: string;
    [key: string]: any;
}

interface MedicationsState {
    activeMedications: Medication[];
    loading: boolean;
    error: string | null;
}

const initialState: MedicationsState = {
    activeMedications: [],
    loading: false,
    error: null,
};

export const fetchActiveMedications = createAsyncThunk(
    'medications/fetchActive',
    async (_, { rejectWithValue }) => {
        const mapMedicationPayload = (json: any) => {
            const flattened: Medication[] = [];
            const payload = json?.data ?? json ?? {};

            // backend typically returns { "Breakfast": { "PatientName": [Prescriptions] } }
            if (payload && typeof payload === 'object') {
                Object.entries(payload).forEach(([timeKey, patientMap]: [string, any]) => {
                    if (patientMap && typeof patientMap === 'object') {
                        Object.values(patientMap).forEach((prescriptions: any) => {
                            if (Array.isArray(prescriptions)) {
                                prescriptions.forEach((item: any) => {
                                    flattened.push({
                                        id: item.prescription_id || Math.random().toString(),
                                        name: item.brand_name || 'Medicine',
                                        dosage: item.variant_id || '',
                                        frequency: timeKey,
                                        duration: item.duration?.toString() || '',
                                        instructions: '',
                                        startDate: item.created_at ? new Date(item.created_at).toLocaleDateString() : '',
                                        endDate: item.expiry_at ? new Date(item.expiry_at).toLocaleDateString() : '',
                                        status: 'active',
                                        timeOfDay: timeKey,
                                    });
                                });
                            }
                        });
                    }
                });
            }

            return flattened;
        };

        const patientId = await tokenHelper.getPatientId();
        const url = patientId
            ? `${API_URLS.GET_ACTIVE_MEDICATIONS}?patient_id=${encodeURIComponent(String(patientId))}`
            : API_URLS.GET_ACTIVE_MEDICATIONS;

        const response = await networkClient.get(url, mapMedicationPayload);
        if (response.isSuccess) {
            return response.data || [];
        }

        return rejectWithValue(response.statusMessage || 'Unable to fetch active medications.');
    },
);

const medicationsSlice = createSlice({
    name: 'medications',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchActiveMedications.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchActiveMedications.fulfilled, (state, action) => {
                state.loading = false;
                state.activeMedications = action.payload as Medication[];
            })
            .addCase(fetchActiveMedications.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export default medicationsSlice.reducer;
