/**
 * AIML CLUB OCT — CONNECT
 * Shared Domain Types & Interfaces
 *
 * Sourced strictly from:
 * - 03_DATABASE_SCHEMA.md
 * - 04_RBAC_PERMISSIONS.md
 * - 05_API_SPECIFICATION.md
 */

// -----------------------------------------------------------------------------
// 1. RBAC & Identity
// -----------------------------------------------------------------------------

export type GlobalRole =
  | 'SUPER_ADMIN'
  | 'CLUB_ADMIN'
  | 'EVENT_MANAGER'
  | 'MEDIA_MANAGER'
  | 'CERTIFICATE_MANAGER'
  | 'CONTENT_MANAGER'
  | 'VOLUNTEER'
  | 'VIEWER';

export type PermissionScopeType = 'GLOBAL' | 'EVENT' | 'MODULE' | 'SELF';

export interface PermissionScope {
  type: PermissionScopeType;
  resourceId?: string;
}

export type PermissionAction =
  | 'events.view'
  | 'events.create'
  | 'events.update'
  | 'events.delete'
  | 'events.publish'
  | 'participants.view'
  | 'participants.create'
  | 'participants.import'
  | 'participants.update'
  | 'participants.export'
  | 'attendance.view'
  | 'attendance.mark'
  | 'attendance.correct'
  | 'volunteers.view'
  | 'volunteers.assign'
  | 'media.view'
  | 'media.upload'
  | 'media.process'
  | 'media.delete'
  | 'certificates.view'
  | 'certificates.generate'
  | 'certificates.issue'
  | 'certificates.revoke'
  | 'feedback.view'
  | 'feedback.publish'
  | 'chronicle.view'
  | 'chronicle.create'
  | 'chronicle.update'
  | 'chronicle.approve'
  | 'chronicle.publish'
  | 'journey.view'
  | 'journey.create'
  | 'journey.update'
  | 'journey.publish'
  | 'projects.view'
  | 'projects.create'
  | 'projects.update'
  | 'projects.publish'
  | 'research.view'
  | 'research.create'
  | 'learning.view'
  | 'learning.create'
  | 'integrations.view'
  | 'integrations.sync'
  | 'integrations.configure'
  | 'audit.view';

export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'DISABLED';

export interface Account {
  id: string; // uuid
  auth_user_id: string; // Supabase auth user UUID
  email?: string;
  status: AccountStatus;
  created_at: string;
  updated_at: string;
}

export type StudentStatus = 'ACTIVE' | 'INACTIVE' | 'ALUMNI' | 'SUSPENDED';

export interface StudentProfile {
  id: string; // uuid
  student_code?: string; // e.g. STU-000184
  enrollment_number: string; // e.g. 0126AL221001
  full_name: string;
  email?: string;
  phone?: string;
  department?: string;
  course?: string;
  batch?: string;
  semester?: string;
  avatar_media_id?: string;
  status: StudentStatus;
  created_at: string;
  updated_at: string;
}

// -----------------------------------------------------------------------------
// 2. Events & Lifecycle
// -----------------------------------------------------------------------------

export type EventStatus =
  | 'DRAFT'
  | 'PLANNING'
  | 'REGISTRATION_OPEN'
  | 'REGISTRATION_CLOSED'
  | 'LIVE'
  | 'COMPLETED'
  | 'MEDIA_PROCESSING'
  | 'CERTIFICATES'
  | 'ARCHIVED';

export type ResourceVisibility =
  | 'PUBLIC'
  | 'AUTHENTICATED'
  | 'EVENT_MEMBERS'
  | 'TEAM_ONLY'
  | 'ADMIN_ONLY'
  | 'HIDDEN';

export type EventType =
  | 'WORKSHOP'
  | 'HACKATHON'
  | 'BOOTCAMP'
  | 'SEMINAR'
  | 'CONFERENCE'
  | 'COMPETITION'
  | 'WEBINAR'
  | 'MEETUP'
  | 'INTERNAL';

export interface Event {
  id: string; // uuid
  event_code: string; // e.g. EVT-APTIFY-2026
  slug: string;
  title: string;
  short_description?: string;
  description?: string;
  event_type?: EventType | string;
  status: EventStatus;
  visibility: ResourceVisibility;
  cover_media_id?: string;
  venue?: string;
  start_at?: string;
  end_at?: string;
  registration_open_at?: string;
  registration_close_at?: string;
  capacity?: number;
  published_at?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface EventLifecycleTransition {
  from_status: EventStatus;
  to_status: EventStatus;
  reason?: string;
  changed_by?: string;
  timestamp: string;
}

export interface EventAnalytics {
  total_registrations: number;
  confirmed_count: number;
  waitlisted_count: number;
  cancelled_count: number;
  attended_count: number;
  capacity: number | null;
  capacity_percentage: number | null;
}

// -----------------------------------------------------------------------------
// 3. Event Participation & Attendance
// -----------------------------------------------------------------------------

export type RegistrationSource =
  | 'TALLY'
  | 'GOOGLE_SHEETS'
  | 'MANUAL'
  | 'CSV'
  | 'XLSX'
  | 'CLUB_MEMBER'
  | 'WALK_IN';

export type RegistrationStatus =
  | 'REGISTERED'
  | 'CONFIRMED'
  | 'WAITLISTED'
  | 'CANCELLED'
  | 'REJECTED'
  | 'WALK_IN'
  | 'ATTENDED'
  | 'COMPLETED';

export interface EventParticipation {
  id: string;
  event_id: string;
  student_id: string;
  registration_source?: RegistrationSource;
  source_record_id?: string;
  registration_status: RegistrationStatus;
  event_role?: string;
  team_name?: string;
  result?: string;
  notes?: string;
  registered_at?: string;
  created_at: string;
  updated_at: string;
}

export interface EventRegistrationInput {
  student_id?: string;
  full_name: string;
  enrollment_number: string;
  email: string;
  phone?: string;
  department?: string;
  course?: string;
  batch?: string;
  semester?: string;
  source?: RegistrationSource;
  team_name?: string;
  notes?: string;
}


export type SessionStatus = 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED';

export interface EventSession {
  id: string; // uuid
  event_id: string; // uuid
  session_code: string; // e.g. SES-APT-01
  title: string;
  description?: string;
  venue?: string;
  start_at: string;
  end_at: string;
  capacity?: number;
  status: SessionStatus;
  created_at: string;
  updated_at: string;
}

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'EXCUSED' | 'LATE' | 'LEFT_EARLY';
export type AttendanceSource = 'QR' | 'MANUAL' | 'ADMIN' | 'SYSTEM' | 'KIOSK';

export interface AttendanceRecord {
  id: string;
  event_id: string;
  session_id?: string;
  student_id: string;
  participation_id?: string;
  student_name?: string;
  enrollment_number?: string;
  check_in_at?: string;
  check_out_at?: string;
  status: AttendanceStatus;
  source?: AttendanceSource;
  recorded_by?: string;
  corrected_by?: string;
  correction_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface AttendanceCorrection {
  attendance_id: string;
  previous_status: AttendanceStatus;
  new_status: AttendanceStatus;
  reason: string;
  corrected_by: string;
  timestamp: string;
}

export type VolunteerRole =
  | 'ATTENDANCE'
  | 'REGISTRATION_DESK'
  | 'SESSION_SUPPORT'
  | 'MEDIA'
  | 'GENERAL_OPERATIONS';

export type VolunteerStatus = 'ASSIGNED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED';

export interface VolunteerAssignment {
  id: string;
  event_id: string;
  session_id?: string;
  student_id: string;
  student_name?: string;
  enrollment_number?: string;
  role: VolunteerRole;
  assigned_by?: string;
  status: VolunteerStatus;
  created_at: string;
}


// -----------------------------------------------------------------------------
// 4. Media & Storage
// -----------------------------------------------------------------------------

export type MediaType = 'PHOTO' | 'VIDEO' | 'DOCUMENT' | 'POSTER' | 'CERTIFICATE' | 'OTHER';

export type ProcessingStatus = 'UPLOADED' | 'QUEUED' | 'PROCESSING' | 'PROCESSED' | 'FAILED';

export interface MediaAsset {
  id: string;
  event_id?: string;
  media_type: MediaType;
  title?: string;
  original_filename?: string;
  mime_type?: string;
  file_size?: number;
  checksum?: string;
  google_drive_file_id: string;
  google_drive_folder_id?: string;
  visibility: ResourceVisibility;
  processing_status: ProcessingStatus;
  width?: number;
  height?: number;
  duration_seconds?: number;
  uploaded_by?: string;
  created_at: string;
  updated_at: string;
}

// -----------------------------------------------------------------------------
// 5. Certificates & Verification
// -----------------------------------------------------------------------------

export type CertificateType =
  | 'PARTICIPATION'
  | 'COMPLETION'
  | 'WINNER'
  | 'RUNNER_UP'
  | 'VOLUNTEER'
  | 'SPEAKER'
  | 'ORGANIZER'
  | 'CUSTOM';

export type CertificateStatus = 'GENERATED' | 'ISSUED' | 'VALID' | 'REVOKED' | 'REPLACED';

export interface Certificate {
  id: string;
  certificate_id: string; // e.g. AIML26-APT-000184
  verification_token_hash: string;
  student_id: string;
  event_id?: string;
  certificate_type: CertificateType;
  template_id?: string;
  google_drive_file_id?: string;
  status: CertificateStatus;
  issued_at?: string;
  issued_by?: string;
  replaced_by?: string;
  revoked_at?: string;
  revoke_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface PublicCertificateVerification {
  valid: boolean;
  certificate_id: string;
  recipient_name: string;
  event_title: string;
  event?: string;
  certificate_type: string;
  issued_at: string;
  status: CertificateStatus;
}

// -----------------------------------------------------------------------------
// 6. API Envelope & Contracts
// -----------------------------------------------------------------------------

export interface ApiResponseMeta {
  page?: number;
  page_size?: number;
  total?: number;
  has_next?: boolean;
  request_id?: string;
  timestamp?: string;
}

export interface ApiResponse<T> {
  data: T;
  meta?: ApiResponseMeta;
}

export interface ApiErrorDetail {
  code: string;
  message: string;
  request_id?: string;
  field?: string;
}

export interface ApiErrorResponse {
  error: ApiErrorDetail;
}
