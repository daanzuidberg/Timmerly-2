import { pgEnum } from 'drizzle-orm/pg-core';
import {
  ACCOUNT_STATUSES, APPLICATION_STAGES, AVAILABILITY_STATUSES, CERTIFICATE_TYPES, CONTRACT_TYPES, EXPERIENCE_BANDS,
  NOTIFICATION_TYPES, PROJECT_STATUSES, REPORT_REASONS, REVIEW_DIRECTIONS, TIMESHEET_STATUSES, USER_ROLES,
  VERIFICATION_KINDS, VERIFICATION_STATUSES, WORK_ARRANGEMENTS
} from '@timmerly/core';

/** Postgres-enums, afgeleid van de domeinlijsten in @timmerly/core. */
export const userRole = pgEnum('user_role', USER_ROLES);
export const accountStatus = pgEnum('account_status', ACCOUNT_STATUSES);
export const contractType = pgEnum('contract_type', CONTRACT_TYPES);
export const workArrangement = pgEnum('work_arrangement', WORK_ARRANGEMENTS);
export const certificateType = pgEnum('certificate_type', CERTIFICATE_TYPES);
export const verificationStatus = pgEnum('verification_status', VERIFICATION_STATUSES);
export const verificationKind = pgEnum('verification_kind', VERIFICATION_KINDS);
export const availabilityStatus = pgEnum('availability_status', AVAILABILITY_STATUSES);
export const projectStatus = pgEnum('project_status', PROJECT_STATUSES);
export const applicationStage = pgEnum('application_stage', APPLICATION_STAGES);
export const timesheetStatus = pgEnum('timesheet_status', TIMESHEET_STATUSES);
export const reviewDirection = pgEnum('review_direction', REVIEW_DIRECTIONS);
export const reportReason = pgEnum('report_reason', REPORT_REASONS);
export const notificationType = pgEnum('notification_type', NOTIFICATION_TYPES);
export const experienceBand = pgEnum('experience_band', EXPERIENCE_BANDS);
