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
  | 'face_enrollment.view'
  | 'face_embedding.delete'
  | 'face.search'
  | 'face.dispute'
  | 'certificates.view'
  | 'certificates.create'
  | 'certificates.generate'
  | 'certificates.approve'
  | 'certificates.issue'
  | 'certificates.revoke'
  | 'certificates.replace'
  | 'certificates.template.manage'
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

export type CertificateStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'GENERATED'
  | 'ISSUED'
  | 'VALID'
  | 'REVOKED'
  | 'REPLACED';

export type CertificateFieldName =
  | 'RECIPIENT_NAME'
  | 'EVENT_NAME'
  | 'EVENT_DATE'
  | 'CERTIFICATE_ID'
  | 'ISSUE_DATE'
  | 'SIGNATORY_TITLE'
  | 'CUSTOM';

export interface CertificateFieldPlacement {
  field_name: CertificateFieldName;
  x: number; // percentage or px
  y: number;
  width?: number;
  height?: number;
  font_size?: number;
  font_weight?: string;
  font_family?: string;
  color?: string;
  text_align?: 'left' | 'center' | 'right';
}

export interface CertificateTemplateConfig {
  fields: CertificateFieldPlacement[];
  dimensions?: { width: number; height: number };
  qr_placement?: { x: number; y: number; size: number };
}

export interface CertificateTemplateVersion {
  id: string;
  template_id: string;
  version_number: number;
  configuration: CertificateTemplateConfig;
  google_drive_file_id?: string;
  changelog?: string;
  created_by?: string;
  created_at: string;
}

export interface CertificateTemplate {
  id: string;
  name: string;
  certificate_type: CertificateType;
  google_drive_file_id?: string;
  configuration: CertificateTemplateConfig;
  version: number;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  versions?: CertificateTemplateVersion[];
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export type BatchStatus =
  | 'DRAFT'
  | 'GENERATING'
  | 'GENERATED'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'ISSUED'
  | 'FAILED';

export interface CertificateBatch {
  id: string;
  event_id: string;
  template_id: string;
  template_version_id?: string;
  certificate_type: CertificateType;
  status: BatchStatus;
  eligibility_criteria: {
    min_attendance_sessions?: number;
    require_confirmed_registration?: boolean;
    target_roles?: string[];
  };
  total_eligible: number;
  total_generated: number;
  total_failed: number;
  approved_by?: string;
  approved_at?: string;
  issued_at?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CertificateRecipientEligibility {
  student_id: string;
  full_name: string;
  enrollment_number: string;
  email?: string;
  attended_sessions: number;
  total_sessions: number;
  is_eligible: boolean;
  ineligibility_reason?: string;
  existing_certificate_id?: string;
}

export interface Certificate {
  id: string;
  certificate_id: string; // e.g. AIML26-APT-000184
  verification_token_hash: string;
  student_id: string;
  event_id?: string;
  batch_id?: string;
  certificate_type: CertificateType;
  template_id?: string;
  template_version_id?: string;
  google_drive_file_id?: string;
  status: CertificateStatus;
  issued_at?: string;
  issued_by?: string;
  replaced_by?: string;
  revoked_at?: string;
  revoke_reason?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface PublicCertificateVerification {
  valid: boolean;
  certificate_id: string;
  recipient_name: string;
  event_title: string;
  event?: string;
  event_date?: string;
  certificate_type: string;
  issued_at: string;
  status: CertificateStatus;
  verification_url?: string;
  revoked_at?: string;
  revoke_reason?: string;
  replaced_by_certificate_id?: string;
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

// -----------------------------------------------------------------------------
// 7. Media Intelligence & Biometric Privacy (Phase 4)
// -----------------------------------------------------------------------------

export type ProcessingJobType = 'THUMBNAIL_GENERATION' | 'FACE_DETECTION' | 'KEYFRAME_SAMPLING';
export type ProcessingJobStatus = 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface MediaProcessingJob {
  id: string;
  media_asset_id: string;
  job_type: ProcessingJobType;
  status: ProcessingJobStatus;
  attempts: number;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export type FaceConsentStatus = 'ACTIVE' | 'WITHDRAWN' | 'EXPIRED' | 'DELETED';

export interface FaceEnrollment {
  id: string;
  student_id: string;
  consent_version: string;
  consented_at: string;
  withdrawn_at?: string;
  status: FaceConsentStatus;
  model_version?: string;
  created_at: string;
  updated_at: string;
}

export interface MediaFaceMatch {
  id: string;
  media_asset_id: string;
  matched_student_id?: string;
  confidence?: number;
  detection_quality?: number;
  bounding_box?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  model_version?: string;
  created_at: string;
}

export type FaceReportType = 'NOT_ME' | 'WRONG_PERSON' | 'UNCONSENTED_INDEX' | 'POOR_CROP';
export type FaceReportStatus = 'OPEN' | 'RESOLVED_DISPUTED' | 'DISMISSED';

export interface FaceMatchReport {
  id: string;
  student_id: string;
  media_asset_id: string;
  media_face_id?: string;
  report_type: FaceReportType;
  description?: string;
  status: FaceReportStatus;
  reviewed_by?: string;
  reviewed_at?: string;
  resolution_notes?: string;
  created_at: string;
}

// -----------------------------------------------------------------------------
// 8. Chronicle, Journey & Feedback (Phase 6.1)
// -----------------------------------------------------------------------------

export type ChronicleEditionType =
  | 'WEEKLY_UPDATE'
  | 'MONTHLY_DIGEST'
  | 'EVENT_RECAP'
  | 'RESEARCH_DIGEST'
  | 'COMMUNITY_UPDATE'
  | 'INSTITUTIONAL_ANNOUNCEMENT';

export type ChronicleStatus = 'DRAFT' | 'REVIEW' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED';

export type ChronicleVisibility = 'PUBLIC' | 'MEMBERS_ONLY' | 'INTERNAL';

export interface EventChronicleItem {
  id: string;
  chronicle_id: string;
  event_id: string;
  display_order: number;
  event_title?: string;
  event_slug?: string;
  event_type?: string;
  start_at?: string;
  venue?: string;
  event?: {
    id: string;
    title: string;
    slug: string;
    event_type?: string;
    start_date?: string;
    end_date?: string;
    venue?: string;
    cover_image_url?: string;
  };
}

export interface ChronicleEntry {
  id: string;
  title: string;
  slug: string;
  edition_type: ChronicleEditionType;
  excerpt?: string;
  content: string; // Markdown or sanitized HTML
  cover_media_id?: string;
  cover_media_url?: string;
  visibility: ChronicleVisibility;
  status: ChronicleStatus;
  scheduled_at?: string;
  published_at?: string;
  created_by?: string;
  approved_by?: string;
  seo_title?: string;
  seo_description?: string;
  linked_events?: EventChronicleItem[];
  created_at: string;
  updated_at: string;
}

export interface ChronicleCreatePayload {
  title: string;
  slug?: string;
  edition_type: ChronicleEditionType;
  excerpt?: string;
  content: string;
  cover_media_id?: string;
  visibility?: ChronicleVisibility;
  scheduled_at?: string;
  seo_title?: string;
  seo_description?: string;
  linked_event_ids?: string[];
}

export interface ChronicleUpdatePayload {
  title?: string;
  slug?: string;
  edition_type?: ChronicleEditionType;
  excerpt?: string;
  content?: string;
  cover_media_id?: string;
  visibility?: ChronicleVisibility;
  status?: ChronicleStatus;
  scheduled_at?: string;
  seo_title?: string;
  seo_description?: string;
  linked_event_ids?: string[];
}

export type JourneyMilestoneType =
  | 'FOUNDATION'
  | 'EVENT'
  | 'ACHIEVEMENT'
  | 'PARTNERSHIP'
  | 'LEADERSHIP'
  | 'RESEARCH'
  | 'COLLABORATION'
  | 'OTHER';

export type JourneyMilestoneStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export type JourneyMilestoneVisibility = 'PUBLIC' | 'MEMBERS_ONLY' | 'INTERNAL';

export interface JourneyMilestone {
  id: string;
  title: string;
  slug: string;
  milestone_date: string; // YYYY-MM-DD
  milestone_type: JourneyMilestoneType;
  description: string;
  cover_media_id?: string;
  cover_media_url?: string;
  linked_event_id?: string;
  linked_event_title?: string;
  linked_event_slug?: string;
  linked_event?: {
    id: string;
    title: string;
    slug: string;
    start_date?: string;
  };
  linked_project_id?: string;
  external_link?: string;
  visibility: JourneyMilestoneVisibility;
  status: JourneyMilestoneStatus;
  display_order: number;
  published_at?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface JourneyMilestoneCreatePayload {
  title: string;
  slug?: string;
  milestone_date: string;
  milestone_type: JourneyMilestoneType;
  description: string;
  cover_media_id?: string;
  linked_event_id?: string;
  linked_project_id?: string;
  external_link?: string;
  visibility?: JourneyMilestoneVisibility;
  status?: JourneyMilestoneStatus;
  display_order?: number;
}

export interface JourneyMilestoneUpdatePayload {
  title?: string;
  slug?: string;
  milestone_date?: string;
  milestone_type?: JourneyMilestoneType;
  description?: string;
  cover_media_id?: string;
  linked_event_id?: string;
  linked_project_id?: string;
  external_link?: string;
  visibility?: JourneyMilestoneVisibility;
  status?: JourneyMilestoneStatus;
  display_order?: number;
}

export type FeedbackSource = 'PORTAL' | 'PWA' | 'EVENT_APP';

export type FeedbackPublicationConsent = 'NO' | 'ANONYMOUS' | 'PUBLIC_NAME';

export type FeedbackModerationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type FeedbackVisibility = 'ADMIN_ONLY' | 'PUBLIC';

export interface Feedback {
  id: string;
  event_id: string;
  student_id: string;
  participation_id?: string;
  source: FeedbackSource;
  rating: number; // 1 to 5
  feedback_text?: string;
  suggestion_text?: string;
  publication_consent: FeedbackPublicationConsent;
  is_anonymous: boolean;
  moderation_status: FeedbackModerationStatus;
  visibility: FeedbackVisibility;
  moderated_by?: string;
  moderated_at?: string;
  moderation_notes?: string;
  created_at: string;
  updated_at: string;
  // Optional expanded relations (admin only)
  student?: {
    id: string;
    full_name: string;
    enrollment_number?: string;
  };
  event?: {
    id: string;
    title: string;
    slug: string;
  };
}

export interface PublicFeedback {
  id: string;
  event_id: string;
  rating: number;
  feedback_text?: string;
  suggestion_text?: string;
  author_name?: string; // either real name if PUBLIC_NAME, or "Anonymous Participant"
  is_anonymous: boolean;
  created_at: string;
}

export interface FeedbackCreatePayload {
  rating: number; // 1-5
  feedback_text?: string;
  suggestion_text?: string;
  publication_consent?: FeedbackPublicationConsent;
  source?: FeedbackSource;
}

export interface FeedbackModeratePayload {
  moderation_status: FeedbackModerationStatus;
  visibility?: FeedbackVisibility;
  moderation_notes?: string;
}

export interface FeedbackSummary {
  event_id: string;
  total_feedback: number;
  average_rating: number;
  rating_distribution: Record<number, number>; // 1: n, 2: n, ...
  pending_moderation_count: number;
  approved_count: number;
  rejected_count: number;
}

// -----------------------------------------------------------------------------
// 10. Knowledge & Innovation Showcase (Phase 7)
// -----------------------------------------------------------------------------

// --- Projects ---
export type ProjectStatus = 'IDEA' | 'IN_DEVELOPMENT' | 'COMPLETED' | 'ARCHIVED';

export type ProjectVisibility = 'PUBLIC' | 'AUTHENTICATED' | 'TEAM_ONLY' | 'HIDDEN';

export type ProjectMemberRole = 'LEAD' | 'CONTRIBUTOR' | 'MENTOR' | 'ADVISOR';

export interface ProjectMember {
  id: string;
  project_id: string;
  student_id: string;
  role: ProjectMemberRole;
  display_order: number;
  created_at: string;
  student?: {
    id: string;
    full_name: string;
    enrollment_number?: string;
    avatar_url?: string;
  };
}

export interface Project {
  id: string;
  title: string;
  slug: string;
  summary: string;
  description: string;
  status: ProjectStatus;
  technology_stack: string[];
  repository_url?: string;
  demo_url?: string;
  documentation_url?: string;
  cover_media_id?: string;
  cover_media_url?: string;
  linked_event_id?: string;
  linked_event_title?: string;
  linked_event_slug?: string;
  visibility: ProjectVisibility;
  is_featured: boolean;
  created_by?: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
  members?: ProjectMember[];
}

export interface ProjectCreatePayload {
  title: string;
  slug?: string;
  summary: string;
  description: string;
  status?: ProjectStatus;
  technology_stack?: string[];
  repository_url?: string;
  demo_url?: string;
  documentation_url?: string;
  cover_media_id?: string;
  linked_event_id?: string;
  visibility?: ProjectVisibility;
  is_featured?: boolean;
}

export interface ProjectUpdatePayload {
  title?: string;
  slug?: string;
  summary?: string;
  description?: string;
  status?: ProjectStatus;
  technology_stack?: string[];
  repository_url?: string;
  demo_url?: string;
  documentation_url?: string;
  cover_media_id?: string;
  linked_event_id?: string;
  visibility?: ProjectVisibility;
  is_featured?: boolean;
}

export interface ProjectMemberAddPayload {
  student_id: string;
  role?: ProjectMemberRole;
  display_order?: number;
}

// --- Research ---
export type ResearchCategory =
  | 'AI_ML'
  | 'COMPUTER_VISION'
  | 'NLP'
  | 'REINFORCEMENT_LEARNING'
  | 'GENERATIVE_AI'
  | 'ROBOTICS'
  | 'DATA_SCIENCE';

export type ResearchStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export type ResearchVisibility = 'PUBLIC' | 'AUTHENTICATED' | 'HIDDEN';

export interface ResearchAuthor {
  name: string;
  enrollment_number?: string;
  affiliation?: string;
  role?: string;
}

export interface ResearchItem {
  id: string;
  title: string;
  slug: string;
  abstract: string;
  authors: ResearchAuthor[];
  category: ResearchCategory;
  methodology?: string;
  publication_url?: string;
  repository_url?: string;
  dataset_url?: string;
  linked_event_id?: string;
  linked_event_title?: string;
  linked_project_id?: string;
  linked_project_title?: string;
  visibility: ResearchVisibility;
  status: ResearchStatus;
  created_by?: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ResearchItemCreatePayload {
  title: string;
  slug?: string;
  abstract: string;
  authors?: ResearchAuthor[];
  category?: ResearchCategory;
  methodology?: string;
  publication_url?: string;
  repository_url?: string;
  dataset_url?: string;
  linked_event_id?: string;
  linked_project_id?: string;
  visibility?: ResearchVisibility;
  status?: ResearchStatus;
}

export interface ResearchItemUpdatePayload {
  title?: string;
  slug?: string;
  abstract?: string;
  authors?: ResearchAuthor[];
  category?: ResearchCategory;
  methodology?: string;
  publication_url?: string;
  repository_url?: string;
  dataset_url?: string;
  linked_event_id?: string;
  linked_project_id?: string;
  visibility?: ResearchVisibility;
  status?: ResearchStatus;
}

// --- Learning Resources ---
export type LearningResourceType =
  | 'NOTEBOOK'
  | 'TUTORIAL'
  | 'WORKSHOP_MATERIAL'
  | 'RECORDING'
  | 'DATASET'
  | 'SLIDES'
  | 'DOCUMENTATION';

export type LearningDifficultyLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

export type LearningResourceVisibility = 'PUBLIC' | 'AUTHENTICATED' | 'HIDDEN';

export interface LearningResource {
  id: string;
  title: string;
  slug: string;
  resource_type: LearningResourceType;
  difficulty_level: LearningDifficultyLevel;
  description?: string;
  url: string;
  cover_media_id?: string;
  cover_media_url?: string;
  linked_event_id?: string;
  linked_event_title?: string;
  visibility: LearningResourceVisibility;
  created_by?: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export interface LearningResourceCreatePayload {
  title: string;
  slug?: string;
  resource_type: LearningResourceType;
  difficulty_level?: LearningDifficultyLevel;
  description?: string;
  url: string;
  cover_media_id?: string;
  linked_event_id?: string;
  visibility?: LearningResourceVisibility;
}

export interface LearningResourceUpdatePayload {
  title?: string;
  slug?: string;
  resource_type?: LearningResourceType;
  difficulty_level?: LearningDifficultyLevel;
  description?: string;
  url?: string;
  cover_media_id?: string;
  linked_event_id?: string;
  visibility?: LearningResourceVisibility;
}


