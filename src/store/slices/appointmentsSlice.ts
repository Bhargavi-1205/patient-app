// Appointments Slice — equivalent to Flutter's upcomingconsultations_bloc.dart
// Manages upcoming consultations, booking, cancellation, and rescheduling

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { networkClient } from '../../services/networkClient';
import { API_URLS } from '../../config/constants';

const toUnixTimestamp = (dateValue: string, timeValue: string): number | null => {
    const dateMatch = String(dateValue).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const timeMatch = String(timeValue).match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (!dateMatch || !timeMatch) return null;

    const [, year, month, day] = dateMatch;
    const [, hour, minute, second] = timeMatch;
    const parsed = new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hour),
        Number(minute),
        Number(second || '0'),
        0,
    );
    if (Number.isNaN(parsed.getTime())) return null;

    return Math.floor(parsed.getTime() / 1000);
};

const normalizeTimeToHHmmss = (timeValue: string): string => {
    const timeMatch = String(timeValue).match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (!timeMatch) return timeValue;
    const [, hour, minute, second] = timeMatch;
    return `${String(hour).padStart(2, '0')}:${minute}:${second || '00'}`;
};

// ─── Types ──────────────────────────────────────────────────────
export interface Appointment {
    id: string;
    doctorId: string;
    doctorName: string;
    doctorSpecialization: string;
    clinicName: string;
    date: string;
    time: string;
    status: string;
    patientName: string;
    patientId?: string;
    fileKey?: string;
    clinicId?: string;
    consultationId?: string;
    consultationPdfLink?: string;
    aptTimestamp?: number;
    reasonToVisit?: string;
    [key: string]: any;
}

export interface AvailableSlot {
    time: string;
    isAvailable: boolean;
    [key: string]: any;
}

interface AppointmentsState {
    upcoming: Appointment[];
    history: Appointment[];
    availableSlots: AvailableSlot[];
    loading: boolean;
    error: string | null;
    bookingLoading: boolean;
    bookingError: string | null;
    bookingErrorMeta: any | null;
    bookingSuccess: boolean;
}

const initialState: AppointmentsState = {
    upcoming: [],
    history: [],
    availableSlots: [],
    loading: false,
    error: null,
    bookingLoading: false,
    bookingError: null,
    bookingErrorMeta: null,
    bookingSuccess: false,
};

// ─── Async Thunks ───────────────────────────────────────────────
export const fetchUpcomingAppointments = createAsyncThunk(
    'appointments/fetchUpcoming',
    async (_, { rejectWithValue }) => {
        const response = await networkClient.get(
            API_URLS.GET_UPCOMING_APPOINTMENTS,
            (json: any) => {
                const allAppointments: Appointment[] = [];
                // backend returns { "date": [List], "date2": [List] }
                if (json && typeof json === 'object') {
                    Object.values(json).forEach((value: any) => {
                        if (Array.isArray(value)) {
                            value.forEach((item: any) => {
                                allAppointments.push({
                                    id: item._id || Math.random().toString(),
                                    doctorId: item.doctor_id || '',
                                    doctorName: `${item.doctor_first_name || ''} ${item.doctor_last_name || ''}`.trim(),
                                    doctorSpecialization: item.doctor_designation || '',
                                    clinicName: item.clinic_name || '',
                                    clinicId: item.clinic_id || '',
                                    patientId: item.patient_id || '',
                                    consultationId: item.consultation_id || item._id || '',
                                    date: item.apt_date || '',
                                    time: item.apt_start_time || '',
                                    status: item.apt_status || '',
                                    patientName: item.patient_name || item.visiting_patient_name || '',
                                    visitingPatientName: item.visiting_patient_name || '',
                                });
                            });
                        }
                    });
                }
                return allAppointments;
            },
        );
        if (!response.isSuccess) {
            return rejectWithValue(response.statusMessage);
        }
        return response.data || [];
    },
);

export const fetchAppointmentHistory = createAsyncThunk(
    'appointments/fetchHistory',
    async (_, { rejectWithValue }) => {
        const response = await networkClient.get(
            API_URLS.GET_APPOINTMENT_HISTORY,
            (json: any) => {
                if (!Array.isArray(json)) return [];
                return json.map((item: any) => ({
                    id: item._id || Math.random().toString(),
                    doctorId: item.doctor_id || '',
                    doctorName: item.doctor_name
                        ? String(item.doctor_name)
                        : `${item.doctor_first_name || ''} ${item.doctor_last_name || ''}`.trim(),
                    doctorSpecialization: item.doctor_designation || '',
                    clinicName: item.clinic_name || '',
                    date: item.apt_date || '',
                    time: item.apt_start_time || '',
                    status: item.apt_status || item.status || '',
                    patientName: item.patient_name || '',
                    patientId: item.patient_id || '',
                    fileKey: item.file_key || item.patient_file_key || item?.patient_details?.file_key || '',
                    clinicId: item.clinic_id || '',
                    consultationId: item.consultation_id || item._id || '',
                    consultationPdfLink: item.consultation_pdf_link || '',
                    aptTimestamp: item.apt_timestamp || 0,
                    reasonToVisit: item.reason_to_visit || '',
                })) as Appointment[];
            },
        );
        if (!response.isSuccess) {
            return rejectWithValue(response.statusMessage);
        }
        return response.data || [];
    },
);

export const bookAppointment = createAsyncThunk(
    'appointments/book',
    async (
        bookingData: {
            doctorId: string;
            clinicId: string;
            date: string;
            time: string;
            patientId: string;
            reasonToVisit?: string;
            [key: string]: any;
        },
        { rejectWithValue },
    ) => {
        const appointmentTimestamp =
            typeof bookingData.appointmentDate === 'number'
                ? bookingData.appointmentDate
                : toUnixTimestamp(bookingData.date, bookingData.time);

        const payload = {
            doctor_id: bookingData.doctorId,
            clinic_id: bookingData.clinicId,
            patient_id: bookingData.patientId,
            apt_date: bookingData.date,
            apt_start_time: normalizeTimeToHHmmss(bookingData.time),
            reason_to_visit: bookingData.reasonToVisit || 'Consultation',
            ...(appointmentTimestamp ? { appointment_date: appointmentTimestamp } : {}),
            ...(appointmentTimestamp ? { apt_timestamp: appointmentTimestamp } : {}),
        };

        const response = await networkClient.post(
            API_URLS.BOOK_APPOINTMENT,
            payload,
            (json: any) => json,
        );
        if (!response.isSuccess) {
            return rejectWithValue({
                message: response.statusMessage,
                rawData: response.rawData,
                statusCode: response.statusCode,
            });
        }
        return response.data;
    },
);

export const rescheduleAppointment = createAsyncThunk(
    'appointments/reschedule',
    async (
        {
            appointmentId,
            patientId,
            appointmentDate,
        }: {
            appointmentId: string;
            patientId: string;
            appointmentDate: number;
        },
        { rejectWithValue },
    ) => {
        const response = await networkClient.post(
            `${API_URLS.RESCHEDULE_APPOINTMENT}/${appointmentId}/${patientId}/reschedule`,
            { appointment_date: appointmentDate },
            (json: any) => json,
        );
        if (!response.isSuccess) {
            return rejectWithValue(response.statusMessage);
        }
        return response.data;
    },
);

export const cancelAppointment = createAsyncThunk(
    'appointments/cancel',
    async (
        {
            clinicId,
            doctorId,
            appointmentId,
        }: {
            clinicId: string;
            doctorId: string;
            appointmentId: string;
        },
        { rejectWithValue },
    ) => {
        const response = await networkClient.del(
            `${API_URLS.CANCEL_APPOINTMENT}/${clinicId}/${doctorId}/${appointmentId}`,
            null,
            (json: any) => json,
        );
        if (!response.isSuccess) {
            return rejectWithValue(response.statusMessage);
        }
        return appointmentId;
    },
);

// ─── Slice ──────────────────────────────────────────────────────
const appointmentsSlice = createSlice({
    name: 'appointments',
    initialState,
    reducers: {
        resetBookingState(state) {
            state.bookingLoading = false;
            state.bookingError = null;
            state.bookingErrorMeta = null;
            state.bookingSuccess = false;
        },
    },
    extraReducers: (builder) => {
        // Upcoming
        builder
            .addCase(fetchUpcomingAppointments.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchUpcomingAppointments.fulfilled, (state, action) => {
                state.loading = false;
                state.upcoming = action.payload as Appointment[];
            })
            .addCase(fetchUpcomingAppointments.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });

        // History
        builder
            .addCase(fetchAppointmentHistory.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchAppointmentHistory.fulfilled, (state, action) => {
                state.loading = false;
                state.history = action.payload as Appointment[];
            })
            .addCase(fetchAppointmentHistory.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });

        // Booking
        builder
            .addCase(bookAppointment.pending, (state) => {
                state.bookingLoading = true;
                state.bookingError = null;
                state.bookingErrorMeta = null;
            })
            .addCase(bookAppointment.fulfilled, (state) => {
                state.bookingLoading = false;
                state.bookingSuccess = true;
            })
            .addCase(bookAppointment.rejected, (state, action) => {
                state.bookingLoading = false;
                state.bookingError =
                    (action.payload as any)?.message ||
                    (action.error.message as string) ||
                    'Unable to book appointment.';
                state.bookingErrorMeta = (action.payload as any)?.rawData || null;
            });

        builder
            .addCase(rescheduleAppointment.pending, (state) => {
                state.bookingLoading = true;
                state.bookingError = null;
                state.bookingErrorMeta = null;
            })
            .addCase(rescheduleAppointment.fulfilled, (state) => {
                state.bookingLoading = false;
                state.bookingSuccess = true;
            })
            .addCase(rescheduleAppointment.rejected, (state, action) => {
                state.bookingLoading = false;
                state.bookingError =
                    (action.payload as any)?.message ||
                    (action.error.message as string) ||
                    'Unable to reschedule appointment.';
                state.bookingErrorMeta = (action.payload as any)?.rawData || null;
            });

        // Cancel
        builder.addCase(cancelAppointment.fulfilled, (state, action) => {
            state.upcoming = state.upcoming.filter(
                (apt) => apt.id !== action.payload,
            );
        });
    },
});

export const { resetBookingState } = appointmentsSlice.actions;
export default appointmentsSlice.reducer;
