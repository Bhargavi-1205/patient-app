// Patient Slice — equivalent to Flutter's edit_patient_profile_bloc + update_patient_details_bloc
// Manages patient profile data and updates

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { networkClient } from '../../services/networkClient';
import { tokenHelper } from '../../services/tokenHelper';
import { API_URLS } from '../../config/constants';
import { parsePatientFromJson } from '../../models';

export interface Patient {
    id: string;
    name: string;
    mobile: string;
    email: string;
    gender: string;
    age: number;
    bloodGroup: string;
    address: string;
    profileImage: string | null;
    fileKey: string;
    [key: string]: any;
}

interface PatientState {
    patients: Patient[];
    currentPatient: Patient | null;
    loading: boolean;
    error: string | null;
    updateLoading: boolean;
    updateError: string | null;
    updateSuccess: boolean;
}

const initialState: PatientState = {
    patients: [],
    currentPatient: null,
    loading: false,
    error: null,
    updateLoading: false,
    updateError: null,
    updateSuccess: false,
};

const extractPatientsArray = (json: any): any[] => {
    if (Array.isArray(json)) return json;
    if (Array.isArray(json?.patients)) return json.patients;
    if (Array.isArray(json?.data)) return json.data;
    if (Array.isArray(json?.res)) return json.res;
    if (Array.isArray(json?.res?.patients)) return json.res.patients;
    return [];
};

const extractPatientObject = (json: any): any => {
    if (!json || typeof json !== 'object') return {};
    if (json._id || json.id || json.patient_name || json.patient_mobile) return json;
    if (json.data && typeof json.data === 'object') return extractPatientObject(json.data);
    if (json.res && typeof json.res === 'object') return extractPatientObject(json.res);
    if (json.patient && typeof json.patient === 'object') return extractPatientObject(json.patient);
    return json;
};

export const fetchAllPatients = createAsyncThunk(
    'patient/fetchAll',
    async (_, { rejectWithValue }) => {
        const response = await networkClient.get(
            API_URLS.GET_ALL_PATIENTS,
            (json: any) => extractPatientsArray(json).map((item: any) => parsePatientFromJson(item)),
        );
        if (!response.isSuccess) return rejectWithValue(response.statusMessage);
        return response.data || [];
    },
);

export const fetchPatientDetails = createAsyncThunk(
    'patient/fetchDetails',
    async (patientId: string | undefined, { rejectWithValue }) => {
        let id = patientId;
        if (!id) {
            id = await tokenHelper.getPatientId() || undefined;
        }

        if (!id) return rejectWithValue('Patient ID not found');

        const response = await networkClient.get(
            `${API_URLS.GET_PATIENT_DETAILS}/${id}`,
            (json: any) => parsePatientFromJson(extractPatientObject(json)),
        );
        if (!response.isSuccess) return rejectWithValue(response.statusMessage);
        return response.data;
    },
);

export const updatePatient = createAsyncThunk(
    'patient/update',
    async (
        { patientId, data }: { patientId: string; data: Partial<Patient> },
        { rejectWithValue },
    ) => {
        const payload: Record<string, any> = {};
        if (data.name !== undefined) payload.patient_name = data.name;
        if (data.age !== undefined) payload.age = data.age;
        if (data.gender !== undefined) payload.gender = data.gender;
        if (data.email !== undefined) payload.email = data.email;
        if (data.mobile !== undefined) payload.patient_mobile = data.mobile;
        if (data.bloodGroup !== undefined) payload.blood_group = data.bloodGroup;
        if (data.address !== undefined) payload.address = data.address;

        const response = await networkClient.put(
            `${API_URLS.GET_PATIENT_DETAILS}/${patientId}`,
            payload,
            (json: any) => parsePatientFromJson(extractPatientObject(json)),
        );
        if (!response.isSuccess) return rejectWithValue(response.statusMessage);
        return response.data;
    },
);

const patientSlice = createSlice({
    name: 'patient',
    initialState,
    reducers: {
        setCurrentPatient(state, action) {
            state.currentPatient = action.payload;
        },
        resetUpdateState(state) {
            state.updateLoading = false;
            state.updateError = null;
            state.updateSuccess = false;
        },
    },
    extraReducers: (builder) => {
        // Fetch all
        builder
            .addCase(fetchAllPatients.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAllPatients.fulfilled, (state, action) => {
                state.loading = false;
                state.patients = action.payload as Patient[];
                state.error = null;
            })
            .addCase(fetchAllPatients.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });

        // Fetch details
        builder
            .addCase(fetchPatientDetails.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchPatientDetails.fulfilled, (state, action) => {
                state.loading = false;
                state.currentPatient = action.payload as Patient;
                state.error = null;
            })
            .addCase(fetchPatientDetails.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });

        // Update
        builder
            .addCase(updatePatient.pending, (state) => {
                state.updateLoading = true;
                state.updateError = null;
            })
            .addCase(updatePatient.fulfilled, (state, action) => {
                state.updateLoading = false;
                state.updateSuccess = true;
                state.currentPatient = action.payload as Patient;
            })
            .addCase(updatePatient.rejected, (state, action) => {
                state.updateLoading = false;
                state.updateError = action.payload as string;
            });
    },
});

export const { setCurrentPatient, resetUpdateState } = patientSlice.actions;
export default patientSlice.reducer;
