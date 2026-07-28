export type Role = "Admin" | "Doctor" | "Receptionist" | "Patient";

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  roles: Role[];
  mfaEnabled: boolean;
}

export interface LoginResult {
  mfaRequired: boolean;
  mfaChallengeToken: string | null;
  accessToken: string | null;
  accessTokenExpiresAtUtc: string | null;
  user: UserProfile | null;
}

export interface RefreshResult {
  accessToken: string;
  accessTokenExpiresAtUtc: string;
}

export interface MfaSetup {
  secret: string;
  otpAuthUri: string;
}

export type AppointmentStatus =
  | "Requested"
  | "Confirmed"
  | "CheckedIn"
  | "Completed"
  | "Cancelled"
  | "NoShow";

export interface Appointment {
  id: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string;
  patientId: string;
  patientName: string;
  scheduledStartUtc: string;
  scheduledEndUtc: string;
  status: AppointmentStatus;
  reason: string;
  notes: string | null;
  createdAtUtc: string;
}

export interface Doctor {
  id: string;
  fullName: string;
  specialty: string;
  bio: string | null;
  isActive: boolean;
}

export interface Patient {
  id: string;
  fullName: string;
  dateOfBirth: string;
  phoneNumber: string;
}

export interface FreeSlot {
  startUtc: string;
  endUtc: string;
}

export interface ApiErrorShape {
  title: string;
  status: number;
  detail?: string;
  errors?: Record<string, string[]>;
}

export interface AdminStats {
  totalUsers: number;
  totalDoctors: number;
  totalPatients: number;
  usersByRole: Record<string, number>;
  appointmentsByStatus: Record<string, number>;
  appointmentsToday: number;
}

export interface UserSummary {
  id: string;
  email: string;
  fullName: string;
  roles: Role[];
  mfaEnabled: boolean;
  lockedOut: boolean;
}

export type AuditAction =
  | "Create"
  | "Update"
  | "Delete"
  | "Login"
  | "LoginFailed"
  | "Logout"
  | "TokenRefresh"
  | "MfaEnabled"
  | "MfaChallenge";

export interface AuditLogEntry {
  id: string;
  userId: string | null;
  userEmail: string | null;
  action: AuditAction;
  entityName: string;
  entityId: string | null;
  oldValues: string | null;
  newValues: string | null;
  ipAddress: string;
  createdAtUtc: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  relatedAppointmentId: string | null;
  isRead: boolean;
  createdAtUtc: string;
}
