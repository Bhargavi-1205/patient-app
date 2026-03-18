// Consultations Slice — equivalent to Flutter's recentconsultation & followup blocs
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { networkClient } from '../../services/networkClient';
import { API_URLS } from '../../config/constants';

export interface Consultation {
    id: string;
    doctorId: string;
    doctorName: string;
    specialization: string;
    doctorQualification: string;
    doctorPhotoUrl: string;
    date: string;
    diagnosis: string;
    status: string;
    patientId: string;
    patientName: string;
    clinicId: string;
    clinicName: string;
    [key: string]: any;
}

export interface FollowUp {
    id: string;
    consultationId: string;
    doctorId: string;
    doctorName: string;
    specialization: string;
    doctorPhotoUrl: string;
    scheduledDate: string;
    status: string;
    clinicId: string;
    clinicName: string;
    clinicPhone: string;
    patientName: string;
    [key: string]: any;
}

interface ConsultationsState {
    recent: Consultation[];
    followUps: FollowUp[];
    loading: boolean;
    error: string | null;
}

const initialState: ConsultationsState = {
    recent: [],
    followUps: [],
    loading: false,
    error: null,
};

export const fetchRecentConsultations = createAsyncThunk(
    'consultations/fetchRecent',
    async (_, { rejectWithValue }) => {
        const response = await networkClient.get(
            API_URLS.GET_RECENT_CONSULTATIONS,
            (json: any) => {
                if (!Array.isArray(json)) return [];
                return json.map((item: any) => ({
                    id: item._id || Math.random().toString(),
                    doctorId: item.doctor_id || '',
                    doctorName: `${item.doctor_first_name || ''} ${item.doctor_last_name || ''}`.trim(),
                    specialization: item.doctor_designation || '',
                    doctorQualification: item.doctor_qualification || '',
                    doctorPhotoUrl: item.doctor_photo_url || item.doctor_image || '',
                    date: item.apt_date || '',
                    diagnosis: item.diagnosis || 'General Consultation',
                    status: item.apt_status || '',
                    patientId: item.patient_id || '',
                    patientName: item.patient_name || '',
                    clinicId: item.clinic_id || '',
                    clinicName: item.clinic_name || '',
                })) as Consultation[];
            }
        );
        if (!response.isSuccess) return rejectWithValue(response.statusMessage);
        return response.data || [];
    },
);

export const fetchFollowUps = createAsyncThunk(
    'consultations/fetchFollowUps',
    async (_, { rejectWithValue }) => {
        const response = await networkClient.get(
            API_URLS.GET_FOLLOW_UPS,
            (json: any) => {
                if (!Array.isArray(json)) return [];
                return json.map((item: any) => ({
                    id: item._id || Math.random().toString(),
                    consultationId: item.consultation_id || '',
                    doctorId: item.doctor_id || '',
                    doctorName: `${item.doctor_first_name || ''} ${item.doctor_last_name || ''}`.trim(),
                    specialization: item.doctor_designation || item.doctor_qualification || '',
                    doctorPhotoUrl: item.doctor_photo_url || item.doctor_image || '',
                    scheduledDate: item.follow_up_timestamp
                        ? new Date(item.follow_up_timestamp * 1000).toLocaleDateString()
                        : item.follow_up_date || '',
                    status: 'Pending',
                    clinicId: item.clinic_id || item.clinicId || '',
                    clinicName: item.clinic_name || '',
                    clinicPhone:
                        item.clinic_front_desk_contacts ||
                        item.front_desk_contacts ||
                        item?.clinic_details?.clinic_front_desk_contacts ||
                        item?.clinic_details?.front_desk_contacts ||
                        item.clinic_phone ||
                        item.clinic_mobile ||
                        item.phone ||
                        item.contact_number ||
                        '',
                    patientName: item.patient_name || '',
                })) as FollowUp[];
            }
        );
        if (!response.isSuccess) return rejectWithValue(response.statusMessage);
        return response.data || [];
    },
);

const consultationsSlice = createSlice({
    name: 'consultations',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchRecentConsultations.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchRecentConsultations.fulfilled, (state, action) => {
                state.loading = false;
                state.recent = action.payload as Consultation[];
            })
            .addCase(fetchRecentConsultations.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });

        builder
            .addCase(fetchFollowUps.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchFollowUps.fulfilled, (state, action) => {
                state.loading = false;
                state.followUps = action.payload as FollowUp[];
            })
            .addCase(fetchFollowUps.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export default consultationsSlice.reducer;
