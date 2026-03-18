// ─── Data Models ────────────────────────────────────────────────
// TypeScript interfaces matching every Flutter data model 1:1
// Includes fromJson helpers for API response parsing

// ─── Doctor (Flutter's doctor_model.dart) ───────────────────────
export interface Doctor {
    id: string;
    clinicId: string;
    firstName: string;
    lastName: string;
    name: string; // computed: firstName + lastName
    registrationNo: string;
    department: string;
    qualification: string;
    designation: string;
    specialization: string;
    clinicName: string;
    slotDuration: number | null;
    description: string | null;
    profileImage: string | null;
    availableDays: string[];
    [key: string]: any;
}

export function parseDoctorFromJson(json: any): Doctor {
    return {
        id: json._id || json.id || '',
        clinicId: json.clinic_id || '',
        firstName: json.first_name || '',
        lastName: json.last_name || '',
        name: `${(json.first_name || '').trim()} ${(json.last_name || '').trim()}`.trim(),
        registrationNo: json.registration_no || '',
        department: json.department || '',
        qualification: json.qualification || '',
        designation: json.designation || '',
        specialization: json.designation || json.department || '',
        clinicName: json.clinic_name || '',
        slotDuration: json.slot_duration ? parseInt(json.slot_duration) : null,
        description: json.description || null,
        profileImage: json.profile_image || null,
        availableDays: json.available_days || [],
    };
}

// ─── Appointment (Flutter's upcoming_appointment_model.dart) ────
export interface Appointment {
    appointmentId: string;
    patientId: string;
    patientName: string;
    aptDate: string;
    aptStartTime: string;
    visitingPatientName: string;
    clinicId: string;
    reasonToVisit: string;
    waitingListCount: number | null;
    aptStatus: string;
    doctorId: string;
    doctorFirstName: string;
    doctorLastName: string;
    doctorDesignation: string;
    doctor?: Doctor;
}

export function parseAppointmentFromJson(json: any): Appointment {
    return {
        appointmentId: json._id || '',
        patientId: json.patient_id || '',
        patientName: json.patient_name || '',
        aptDate: json.apt_date || '',
        aptStartTime: json.apt_start_time || '',
        visitingPatientName: json.visiting_patient_name || '',
        clinicId: json.clinic_id || '',
        reasonToVisit: json.reason_to_visit || '',
        waitingListCount: json.waiting_list_count ?? null,
        aptStatus: json.apt_status || '',
        doctorId: json.doctor_id || '',
        doctorFirstName: json.doctor_first_name || '',
        doctorLastName: json.doctor_last_name || '',
        doctorDesignation: json.doctor_designation || '',
    };
}

// ─── Clinic (Flutter's clinic_model.dart) ───────────────────────
export interface Clinic {
    id: string;
    clinicName: string;
    clinicAddress: string;
    clinicLogoUrl: string;
    doctors: string[];
    frontDeskContact: string;
}

export function parseClinicFromJson(json: any): Clinic {
    return {
        id: json._id || '',
        clinicName: json.clinic_name || '',
        clinicAddress: json.clinic_address || '',
        clinicLogoUrl: json.clinic_logo_url || '',
        doctors: Array.isArray(json.doctors) ? json.doctors.map(String) : [],
        frontDeskContact: json.front_desk_contacts || '',
    };
}

// ─── Patient (Flutter's patient_model.dart) ─────────────────────
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

export function parsePatientFromJson(json: any): Patient {
    return {
        id: json._id || json.id || '',
        name: json.patient_name || json.name || '',
        mobile: json.patient_mobile || json.mobile || json.phone || '',
        email: json.email || '',
        gender: json.gender || 'Male',
        age: parseInt(json.age) || 0,
        bloodGroup: json.blood_group || '',
        address: json.address || '',
        profileImage: json.profile_image || null,
        fileKey: json.file_key || '',
    };
}

// ─── FollowUp (Flutter's followup_model.dart) ───────────────────
export interface FollowUp {
    id: string;
    doctorFirstName: string;
    doctorLastName: string;
    doctorName: string; // computed
    doctorDesignation: string;
    patientId: string;
    patientName: string;
    followUpTimestamp: number;
    clinicId: string;
    doctorId: string;
    clinicName: string;
    consultationId: string;
    clinicFrontDeskContact: string | null;
    scheduledDate: string; // computed from timestamp
    status: string;
}

export function parseFollowUpFromJson(json: any): FollowUp {
    const timestamp = json.follow_up_timestamp || 0;
    const dueDate = new Date(timestamp * 1000);
    return {
        id: json._id || json.consultation_id || '',
        doctorFirstName: json.doctor_first_name || '',
        doctorLastName: json.doctor_last_name || '',
        doctorName: `Dr. ${(json.doctor_first_name || '').trim()} ${(json.doctor_last_name || '').trim()}`.trim(),
        doctorDesignation: json.doctor_designation || '',
        patientId: json.patient_id || '',
        patientName: json.patient_name || '',
        followUpTimestamp: timestamp,
        clinicId: json.clinic_id || '',
        doctorId: json.doctor_id || '',
        clinicName: json.clinic_name || '',
        consultationId: json.consultation_id || '',
        clinicFrontDeskContact: json.clinic_front_desk_contacts || null,
        scheduledDate: dueDate.toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
        }),
        status: dueDate > new Date() ? 'Upcoming' : 'Overdue',
    };
}

// ─── Prescription (Flutter's prescriptions_model.dart) ──────────
export interface Prescription {
    id: string;
    doctorName: string;
    patientName: string;
    aptDate: string;
    pdfLink: string;
    clinicId: string;
    consultationId: string;
}

export function parsePrescriptionFromJson(json: any): Prescription {
    const doctor = json.doctor_details || {};
    const patient = json.patient_details || {};
    const aptTimestamp = json.apt_timestamp;
    const aptDate = aptTimestamp
        ? new Date(aptTimestamp * 1000).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
        })
        : '';

    return {
        id: json._id || json.consultation_id || '',
        doctorName: `${doctor.first_name || ''} ${doctor.last_name || ''}`.trim(),
        patientName: patient.patient_name || '',
        aptDate,
        pdfLink: json.consultation_pdf_link || '',
        clinicId: json.clinic_id || '',
        consultationId: json.consultation_id || '',
    };
}

// ─── Notification (Flutter's notification_model.dart) ───────────
export interface NotificationItem {
    notificationId: string;
    payload: Record<string, any>;
    unreadCount: number;
    read: boolean;
    message: string;
}

export function parseNotificationFromJson(json: any): NotificationItem {
    return {
        notificationId: json.notification_id || '',
        payload: json.payload || {},
        unreadCount: typeof json.unread_count === 'number' ? json.unread_count : 0,
        read: json.read ?? false,
        message: json.payload?.message || '',
    };
}

// ─── Feed (Flutter's feed_model.dart) ───────────────────────────
export interface Feed {
    id: string;
    title: string;
    content: string;
    feedImageUrl: string;
    doctorName: string;
    doctorSpecialty: string;
    doctorImageUrl: string;
    likes: number;
}

export function parseFeedFromJson(json: any): Feed {
    return {
        id: json._id || json.id || '',
        title: json.title || '',
        content: json.content || '',
        feedImageUrl: json.feed_image_url || '',
        doctorName: json.doctor_name || '',
        doctorSpecialty: json.doctor_specialty || '',
        doctorImageUrl: json.doctor_image_url || '',
        likes: json.likes || 0,
    };
}

// ─── Active Medication (Flutter's active_medication_model.dart) ──
export interface ActiveMedication {
    id: string;
    medicineName: string;
    dosage: string;
    frequency: string;
    startDate: string;
    endDate: string;
    prescribedBy: string;
    isActive: boolean;
}

export function parseMedicationFromJson(json: any): ActiveMedication {
    return {
        id: json._id || json.id || '',
        medicineName: json.medicine_name || json.drug_name || '',
        dosage: json.dosage || '',
        frequency: json.frequency || '',
        startDate: json.start_date || '',
        endDate: json.end_date || '',
        prescribedBy: json.prescribed_by || '',
        isActive: json.is_active ?? true,
    };
}

// ─── Available Slot ─────────────────────────────────────────────
export interface AvailableSlot {
    date: string;
    startTime: string;
    endTime: string;
    isBooked: boolean;
}

export function parseSlotFromJson(json: any): AvailableSlot {
    return {
        date: json.date || '',
        startTime: json.start_time || '',
        endTime: json.end_time || '',
        isBooked: json.is_booked ?? false,
    };
}

// ─── Paginated Response (generic) ───────────────────────────────
export interface PaginatedResponse<T> {
    data: T[];
    hasNext: boolean;
    nextPage: number | null;
}

export function parsePaginatedResponse<T>(
    json: any,
    parseItem: (item: any) => T,
): PaginatedResponse<T> {
    return {
        data: Array.isArray(json.data) ? json.data.map(parseItem) : [],
        hasNext: json.has_next ?? false,
        nextPage: json.next_page ?? null,
    };
}
