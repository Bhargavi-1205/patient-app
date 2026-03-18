// Doctors Slice — equivalent to Flutter's doctor bloc + clinicwisedoctors bloc
// Manages doctor listing, details, and clinic-wise filtering

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { networkClient } from '../../services/networkClient';
import { API_URLS } from '../../config/constants';

// ─── Types ──────────────────────────────────────────────────────
export interface Doctor {
    id: string;
    name: string;
    firstName?: string;
    lastName?: string;
    specialization: string;
    qualification: string;
    experience: string;
    clinicId: string;
    clinicName: string;
    profileImage: string | null;
    availableDays: string[];
    [key: string]: any;
}

interface DoctorsState {
    doctors: Doctor[];
    selectedDoctor: Doctor | null;
    loading: boolean;
    error: string | null;
}

const initialState: DoctorsState = {
    doctors: [],
    selectedDoctor: null,
    loading: false,
    error: null,
};

const extractDoctorsArray = (json: any): any[] => {
    if (Array.isArray(json)) return json;
    if (Array.isArray(json?.data)) return json.data;
    if (Array.isArray(json?.doctors)) return json.doctors;
    if (Array.isArray(json?.res)) return json.res;
    return [];
};

const pickFirstNonEmpty = (...values: Array<unknown>): string => {
    for (const value of values) {
        const str = String(value ?? '').trim();
        if (str) return str;
    }
    return '';
};

const normalizeDoctor = (item: any): Doctor => {
    const firstName = pickFirstNonEmpty(item?.first_name, item?.firstName);
    const lastName = pickFirstNonEmpty(item?.last_name, item?.lastName);
    const fullName = pickFirstNonEmpty(
        item?.name,
        item?.doctor_name,
        `${firstName} ${lastName}`.trim(),
    );

    return {
        id: pickFirstNonEmpty(item?._id, item?.id),
        name: fullName,
        firstName,
        lastName,
        specialization: pickFirstNonEmpty(
            item?.specialization,
            item?.department,
            item?.designation,
        ),
        qualification: pickFirstNonEmpty(item?.qualification),
        experience: pickFirstNonEmpty(item?.experience),
        clinicId: pickFirstNonEmpty(item?.clinic_id, item?.clinicId),
        clinicName: pickFirstNonEmpty(item?.clinic_name, item?.clinicName),
        profileImage: pickFirstNonEmpty(
            item?.profile_image,
            item?.profileImage,
            item?.image,
            item?.avatar,
        ) || null,
        availableDays: Array.isArray(item?.available_days)
            ? item.available_days
            : Array.isArray(item?.availableDays)
              ? item.availableDays
              : [],
        ...item,
    };
};

// ─── Async Thunks ───────────────────────────────────────────────
export const fetchDoctors = createAsyncThunk(
    'doctors/fetchAll',
    async (_, { rejectWithValue }) => {
        const response = await networkClient.get(
            API_URLS.GET_DOCTORS,
            (json: any) => extractDoctorsArray(json).map(normalizeDoctor),
        );
        if (!response.isSuccess) {
            return rejectWithValue(response.statusMessage);
        }
        return response.data || [];
    },
);

export const fetchDoctorsByClinic = createAsyncThunk(
    'doctors/fetchByClinic',
    async (clinicId: string, { rejectWithValue }) => {
        const response = await networkClient.get(
            `${API_URLS.GET_DOCTORS}/${clinicId}`,
            (json: any) => extractDoctorsArray(json).map(normalizeDoctor),
        );
        if (!response.isSuccess) {
            return rejectWithValue(response.statusMessage);
        }
        return response.data || [];
    },
);

// ─── Slice ──────────────────────────────────────────────────────
const doctorsSlice = createSlice({
    name: 'doctors',
    initialState,
    reducers: {
        selectDoctor(state, action) {
            state.selectedDoctor = action.payload;
        },
        clearSelectedDoctor(state) {
            state.selectedDoctor = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchDoctors.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchDoctors.fulfilled, (state, action) => {
                state.loading = false;
                state.doctors = action.payload as Doctor[];
            })
            .addCase(fetchDoctors.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });

        builder
            .addCase(fetchDoctorsByClinic.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchDoctorsByClinic.fulfilled, (state, action) => {
                state.loading = false;
                state.doctors = action.payload as Doctor[];
            })
            .addCase(fetchDoctorsByClinic.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const { selectDoctor, clearSelectedDoctor } = doctorsSlice.actions;
export default doctorsSlice.reducer;
