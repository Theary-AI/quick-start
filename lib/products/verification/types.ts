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

/** The flat shape collected by the order form in the UI. */
export interface VerificationFormInput {
  externalSearchId: string
  applicant: ApplicantInput
  businessContext: BusinessContextInput
  employment: EmploymentHistoryInput
}

/** Webhook target config, attached server-side from env + tunnel detection. */
export interface WebhookConfig {
  enabled: boolean
  secret?: string
  retryAttempts?: number
  fallbackEndpoint?: string
}

/** The request body sent to the platform. */
export interface VerificationOrderRequest {
  searchTypes: Array<{ searchType: SearchType; externalSearchId?: string }>
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
