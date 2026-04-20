import { i18n } from '@infra/i18n'

/**
 * Stable API error codes from backend `handleServiceError` / handlers (`{ error: "<code>" }`).
 * @see backend/internal/interface/http/context.go
 */
const CODE_TO_KEY: Record<string, string> = {
  user_not_found: 'errors.userNotFound',
  task_not_found: 'errors.taskNotFound',
  project_not_found: 'errors.projectNotFound',
  subtask_not_found: 'errors.subtaskNotFound',
  report_not_found: 'errors.reportNotFound',
  note_not_found: 'errors.noteNotFound',
  not_member: 'errors.notMember',
  section_not_found: 'errors.sectionNotFound',
  task_section_not_found: 'errors.taskSectionNotFound',
  session_not_found: 'errors.sessionNotFound',
  session_expired: 'errors.sessionExpired',
  session_revoked: 'errors.sessionRevoked',
  forbidden: 'errors.forbidden',
  personal_no_members: 'errors.personalNoMembers',
  team_project_not_allowed: 'errors.teamProjectNotAllowed',
  invalid_input: 'errors.invalidInput',
  invalid_report_format: 'errors.invalidReportFormat',
  invalid_pdf_layout: 'errors.invalidPdfLayout',
  invalid_group_by: 'errors.invalidGroupBy',
  invalid_report_fields: 'errors.invalidReportFields',
  reports_dir_unset: 'errors.reportsDirUnset',
  assignee_not_project_member: 'errors.assigneeNotProjectMember',
  invalid_title: 'errors.invalidTitle',
  invalid_status: 'errors.invalidStatus',
  invalid_priority: 'errors.invalidPriority',
  title_required: 'errors.titleRequired',
  task_other_project: 'errors.taskOtherProject',
  cannot_remove_owner: 'errors.cannotRemoveOwner',
  cannot_change_own_role: 'errors.cannotChangeOwnRole',
  invalid_global_role: 'errors.invalidGlobalRole',
  invalid_email: 'errors.invalidEmail',
  invalid_locale: 'errors.invalidLocale',
  invalid_password: 'errors.invalidPassword',
  cannot_transfer_to_self: 'errors.cannotTransferToSelf',
  target_not_project_member: 'errors.targetNotProjectMember',
  invalid_task_transfer: 'errors.invalidTaskTransfer',
  duplicate_task_transfer: 'errors.duplicateTaskTransfer',
  cannot_transfer_to_same_member: 'errors.cannotTransferToSameMember',
  invalid_assignee: 'errors.invalidAssignee',
  incomplete_task_transfer: 'errors.incompleteTaskTransfer',
  invalid_reorder: 'errors.invalidReorder',
  ownership_unchanged: 'errors.ownershipUnchanged',
  invalid_project_name: 'errors.invalidProjectName',
  invalid_member_role: 'errors.invalidMemberRole',
  invalid_section_name: 'errors.invalidSectionName',
  cannot_delete_self: 'errors.cannotDeleteSelf',
  already_member: 'errors.alreadyMember',
  link_already_exists: 'errors.linkAlreadyExists',
  email_taken: 'errors.emailTaken',
  invalid_credentials: 'errors.invalidCredentials',
  invalid_refresh_token: 'errors.invalidRefreshToken',
  internal_error: 'errors.internalError',
  foreign_key_violation: 'errors.foreignKeyViolation',
  unique_violation: 'errors.uniqueViolation',
  not_null_violation: 'errors.notNullViolation',
}

/**
 * Maps API error response to a localized message, or falls back to `fallbackKey` (i18n key).
 */
export function mapApiError(e: unknown, fallbackKey: string): string {
  const err = e as { response?: { data?: { error?: string } } }
  const code = err?.response?.data?.error
  const t = i18n.global.t as (key: string) => string
  if (typeof code === 'string' && code in CODE_TO_KEY) {
    return t(CODE_TO_KEY[code])
  }
  return t(fallbackKey)
}
