// Clinics Slice — equivalent to Flutter's clinic_bloc.dart

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { networkClient } from '../../services/networkClient';
import { API_URLS } from '../../config/constants';

export interface Clinic {
    id: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    phone: string;
    [key: string]: any;
}

interface ClinicsState {
    clinics: Clinic[];
    selectedClinic: Clinic | null;
    loading: boolean;
    error: string | null;
}

const initialState: ClinicsState = {
    clinics: [],
    selectedClinic: null,
    loading: false,
    error: null,
};

export const fetchClinics = createAsyncThunk(
    'clinics/fetchAll',
    async (_, { rejectWithValue }) => {
        const response = await networkClient.get(
            API_URLS.GET_CLINICS,
            (json: any) => {
                if (!Array.isArray(json)) return [];

                return json.map((item: any) => {
                    const normalizedPhone =
                        item.front_desk_contacts ||
                        item.clinic_front_desk_contacts ||
                        item.phone ||
                        item.mobile ||
                        item.contact ||
                        item.contact_number ||
                        item.clinic_phone ||
                        item.clinic_mobile ||
                        item.phone_number ||
                        '';

                    return {
                        ...item,
                        id: item._id || item.id || '',
                        name: item.clinic_name || item.clinicName || item.name || '',
                        address: item.clinic_address || item.clinicAddress || item.address || '',
                        latitude: Number(item.latitude) || 0,
                        longitude: Number(item.longitude) || 0,
                        phone: normalizedPhone,
                        frontDeskContact: normalizedPhone,
                    } as Clinic;
                });
            },
        );
        if (!response.isSuccess) {
            return rejectWithValue(response.statusMessage);
        }
        return response.data || [];
    },
);

const clinicsSlice = createSlice({
    name: 'clinics',
    initialState,
    reducers: {
        selectClinic(state, action) {
            state.selectedClinic = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchClinics.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchClinics.fulfilled, (state, action) => {
                state.loading = false;
                state.clinics = action.payload as Clinic[];
            })
            .addCase(fetchClinics.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const { selectClinic } = clinicsSlice.actions;
export default clinicsSlice.reducer;
