/**
 * Types for the verification product, mirroring the public Create Order API
 * (`POST /background-check/v1/orders`). Only the fields exercised by this
 * quickstart are modeled; see the API reference for the full schema.
 */

export type SearchType = 'EMPLOYMENT' | 'EDUCATION'

export interface ApplicantInput {
  firstName: string
  lastName: string
  ssn: string
  email?: string
  phone?: string
  birthday?: string
}

export interface BusinessContextInput {
  entityName: string
  appliedJobTitle: string
  worksiteCity: string
  worksiteState: string
  proposedSalary: number
}

export interface EmploymentHistoryInput {
  employerName: string
  position: string
  employerLocation?: string
  employerEmail?: string
  employerPhone?: string
  startDate?: string
  endDate?: string
}

/**
 * Per-search QA destination overrides. Outside production the platform redirects
 * ALL outbound email / voice / fax for the search to these test destinations
 * instead of the real (or tenant-level QA) contacts — handy for exercising the
 * full outbound flow without contacting a real employer. Ignored in production.
 */
export interface QaDestinationsInput {
  email?: string
  phone?: string
  fax?: string
}

/** The flat shape collected by the order form in the UI. */
export interface VerificationFormInput {
  externalSearchId: string
  applicant: ApplicantInput
  businessContext: BusinessContextInput
  employment: EmploymentHistoryInput
  qaDestinations: QaDestinationsInput
}

/** Webhook event types delivered by the platform. */
export type WebhookEventType =
  | 'verification.completed'
  | 'verification.action_required'
  | 'verification.notification'

/**
 * A single webhook destination. Supplying `events` is important: a target with
 * no `events` is treated by the platform as `verification.completed` only, so
 * progress/notification and action-required events would never be delivered.
 */
export interface WebhookTarget {
  url: string
  events?: WebhookEventType[]
  secret?: string
}

/** Webhook target config, attached server-side from env + tunnel detection. */
export interface WebhookConfig {
  enabled: boolean
  secret?: string
  retryAttempts?: number
  fallbackEndpoint?: string | WebhookTarget
}

/**
 * Per-search overrides. We use `notifications.webhookOverride` so that
 * `verification.notification` and `verification.action_required` events route to
 * our endpoint — the top-level `webhookConfig` only governs
 * `verification.completed`.
 */
export interface SearchConfig {
  notifications?: {
    webhookOverride?: WebhookConfig
  }
  /**
   * Non-production only. When set, every outbound attempt for this search is
   * redirected to these test destinations rather than the real contacts. Each
   * key maps to a channel: `email` → EMAIL, `phone` → VOICE, `fax` → FAX.
   * In production these are ignored and the researched destinations are used.
   */
  qaDestinations?: QaDestinationsInput
}

/** The request body sent to the platform. */
export interface VerificationOrderRequest {
  searchTypes: Array<{ searchType: SearchType; externalSearchId?: string; searchConfig?: SearchConfig }>
  applicant: {
    firstName: string
    lastName: string
    ssn: string
    email?: string
    phone?: string
    birthday?: string
  }
  businessContext: BusinessContextInput
  history: {
    employment: EmploymentHistoryInput[]
  }
  webhookConfig?: WebhookConfig
}

export interface VerificationOrderResponse {
  verificationOrderId: string
  searchIds: string[]
}
