// Redux Store — combines all slices (equivalent to Flutter's MultiBlocProvider)

import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

// Slices
import networkReducer from './slices/networkSlice';
import authReducer from './slices/authSlice';
import appointmentsReducer from './slices/appointmentsSlice';
import doctorsReducer from './slices/doctorsSlice';
import clinicsReducer from './slices/clinicsSlice';
import patientReducer from './slices/patientSlice';
import medicationsReducer from './slices/medicationsSlice';
import consultationsReducer from './slices/consultationsSlice';
import prescriptionsReducer from './slices/prescriptionsSlice';
import notificationsReducer from './slices/notificationsSlice';
import locationReducer from './slices/locationSlice';

export const store = configureStore({
    reducer: {
        network: networkReducer,
        auth: authReducer,
        appointments: appointmentsReducer,
        doctors: doctorsReducer,
        clinics: clinicsReducer,
        patient: patientReducer,
        medications: medicationsReducer,
        consultations: consultationsReducer,
        prescriptions: prescriptionsReducer,
        notifications: notificationsReducer,
        location: locationReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false, // Allow non-serializable data in store
        }),
});

// ─── Typed Hooks ────────────────────────────────────────────────
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
