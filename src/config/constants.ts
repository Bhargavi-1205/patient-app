// App-wide constants — equivalent to Flutter's constants.dart + network_constant.dart

// ─── Network Constants ──────────────────────────────────────────────
export const NETWORK = {
    CODE_NETWORK_ERROR: 1100,
    UNAUTHORIZED: 401,
    TOKEN_EXPIRED: 2008,
    API_SUCCESS: 200,
    API_SUCCESS_2: 201,
    REQUEST_TIMEOUT: 408,
    INTERNAL_SERVER_ERROR: 500,

    KEYS: {
        SUCCESS: 'success',
        MESSAGE: 'message',
        DATA: 'data',
        ERROR: 'something went wrong',
        ERROR_NOT_FOUND: 'Not Found',
        ERROR_MESSAGE: 'errorMessage',
        ERROR_CODE: 'errorCode',
    },
} as const;

// ─── Storage Keys ───────────────────────────────────────────────────
export const STORAGE_KEYS = {
    ACCESS_TOKEN: 'access_token',
    REFRESH_TOKEN: 'refresh_token',
    PATIENT_ID: 'patient_id',
    FILE_KEY: 'file_key',
    FIRST_RUN: 'first_run_completed',
    MOBILE: 'patient_mobile',
    SELECTED_LOCATION: 'selected_location',
} as const;

// ─── API Endpoints — equivalent to Flutter's api_url.dart ───────────
export const API_URLS = {
    // Auth
    SEND_OTP: '/auth/verify-mobile',
    VERIFY_OTP: '/auth/verify-otp',

    // Doctors & Clinics
    GET_DOCTORS: '/doctors',
    GET_CLINICS: '/clinics',

    // Appointments
    BOOK_APPOINTMENT: '/appointments/book',
    GET_UPCOMING_APPOINTMENTS: '/appointments/future',
    GET_APPOINTMENT_HISTORY: '/appointments/history',
    GET_RECENT_CONSULTATIONS: '/appointments/recent',
    GET_FOLLOW_UPS: '/appointments/follow-ups',
    CANCEL_APPOINTMENT: '/appointments/cancel',
    RESCHEDULE_APPOINTMENT: '/appointments',

    // Patient
    GET_PATIENT_DETAILS: '/patients',
    GET_ALL_PATIENTS: '/patients/all',

    // Other
    GET_ACTIVE_MEDICATIONS: '/prescriptions/active-medications',
    GET_PRESCRIPTIONS: '/prescriptions',
    GET_NOTIFICATIONS: '/notifications',
    GET_FEED: '/feeds',
    GET_PDF_DATA: '/consultation/history',
} as const;

// ─── AES Encryption Keys ────────────────────────────────────────────
export const AES_CONFIG = {
    CBC_KEY: '12345678901234567890123456789012', // 32 bytes
    CBC_IV: '1234567890123456', // 16 bytes
} as const;

// ─── Route Names ────────────────────────────────────────────────────
export const ROUTES = {
    PHONE_NUMBER: 'PhoneNumber',
    VERIFY_OTP: 'VerifyOTP',
    MAP: 'Map',
    MAIN_TABS: 'MainTabs',
    HOME: 'Home',
    CONSULTATION: 'Consultation',
    FEED: 'Feed',
    APPOINTMENT_BOOKING: 'AppointmentBooking',
    AVAILABLE_SLOTS: 'AvailableSlots',
    CANCEL_APPOINTMENT: 'CancelAppointment',
    RESCHEDULE: 'Reschedule',
    DOCTOR_DETAILS: 'DoctorDetails',
    CLINIC_DOCTORS: 'ClinicDoctors',
    CLINIC_LIST: 'ClinicList',
    PRESCRIPTIONS: 'Prescriptions',
    PDF_VIEWER: 'PDFViewer',
    EDIT_PROFILE: 'EditProfile',
    MY_DOCTORS: 'MyDoctors',
    APPOINTMENT_HISTORY: 'AppointmentHistory',
    PATIENT_LIST: 'PatientList',
    UPDATE_PATIENT: 'UpdatePatient',
    BOOKING_FLOW: 'BookingFlow',
    NOTIFICATIONS: 'Notifications',
} as const;
