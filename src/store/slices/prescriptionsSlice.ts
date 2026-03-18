// Prescriptions Slice — equivalent to Flutter's prescriptions bloc
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { networkClient } from '../../services/networkClient';
import { API_URLS } from '../../config/constants';

export interface Prescription {
    id: string;
    consultationId: string;
    doctorName: string;
    patientName: string;
    date: string;
    pdfUrl: string;
    clinicId: string;
    patientId: string;
    fileKey?: string;
    [key: string]: any;
}

interface PrescriptionsState {
    prescriptions: Prescription[];
    loading: boolean;
    error: string | null;
}

const initialState: PrescriptionsState = {
    prescriptions: [],
    loading: false,
    error: null,
};

export const fetchPrescriptions = createAsyncThunk(
    'prescriptions/fetchAll',
    async (_, { rejectWithValue }) => {
        const response = await networkClient.get(
            API_URLS.GET_PRESCRIPTIONS,
            (json: any) => {
                const data = Array.isArray(json) ? json : (json?.data || []);
                return data.map((item: any) => {
                    const doctor = item.doctor_details || {};
                    const patient = item.patient_details || {};
                    const aptTimestamp = item.apt_timestamp;
                    const date = aptTimestamp
                        ? new Date(aptTimestamp * 1000).toLocaleDateString('en-GB') + ' ' +
                        new Date(aptTimestamp * 1000).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
                        : 'N/A';

                    return {
                        id: item._id || item.consultation_id || item.id || Math.random().toString(),
                        consultationId: item.consultation_id || item._id || '',
                        doctorName: `${doctor.first_name || ''} ${doctor.last_name || ''}`.trim(),
                        patientName: patient.patient_name || 'N/A',
                        date: date,
                        pdfUrl: item.consultation_pdf_link || '',
                        clinicId: item.clinic_id || '',
                        patientId: item.patient_id || patient._id || '',
                        fileKey: item.file_key || patient.file_key || '',
                    } as Prescription;
                });
            },
        );
        if (!response.isSuccess) return rejectWithValue(response.statusMessage);
        return response.data || [];
    },
);



const prescriptionsSlice = createSlice({
    name: 'prescriptions',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchPrescriptions.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchPrescriptions.fulfilled, (state, action) => {
                state.loading = false;
                state.prescriptions = action.payload as Prescription[];
            })
            .addCase(fetchPrescriptions.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export default prescriptionsSlice.reducer;
