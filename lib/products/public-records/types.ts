/**
 * Types for the Public Records product, mirroring the CRA evaluation framework
 * (`POST /evaluate`). The endpoint synchronously evaluates a single criminal /
 * court record and returns a compliance routing decision.
 *
 * First-path tip: omit `cases` to evaluate every offense in the XML. Send
 * `cases` only when you need court/offense ID mapping or exclusions.
 */

/** Candidate identifiers used for identity matching against the record. */
export interface CandidateInfo {
  first_name: string
  middle_name?: string
  last_name: string
  date_of_birth: string
  ssn?: string
  address?: string
}

/** Optional charge mapping row. When used, every offense in the XML must appear. */
export interface CaseMapping {
  court_search_id: string
  offense_id: string
  is_excluded: boolean
}

/** The record payload sent to `/evaluate`, wrapped under `record`. */
export interface EvaluateRecord {
  search_id: string
  search_date: string
  order_id: string
  order_number: string
  applicant_state?: string
  candidate_info: CandidateInfo
  xml: string
  /** Optional — omit to evaluate all offenses. */
  cases?: CaseMapping[]
}

export interface EvaluateRequest {
  record: EvaluateRecord
}

/** The flat shape collected by the console form in the UI. */
export interface PublicRecordsFormInput {
  searchId: string
  searchDate: string
  orderId: string
  orderNumber: string
  applicantState: string
  candidate: CandidateInfo
  xml: string
}

/** Per-offense routing details returned in the decision. */
export interface OffenseRouting {
  queue: string
  reportability: string
  is_automatable: boolean
  identity_level: string
  identity_score: number
}

export interface OffenseDecision {
  offense_id: string
  charge: string
  charge_decision: string
  rationale?: string
  routing: OffenseRouting
}

export interface CaseDecision {
  case_number: string
  case_queue: string
  offenses: OffenseDecision[]
}

export interface CourtDecision {
  court_search_id: string
  court_queue: string
  case_decisions: CaseDecision[]
}

export interface RecordDecision {
  search_queue: string
  record_decision: string
  order_id?: string
  order_number?: string
  court_decisions: CourtDecision[]
}

export interface EvaluateValidation {
  status?: string
  issues?: {
    errors?: unknown[]
    warnings?: unknown[]
  }
}

export interface EvaluateTiming {
  xml_transformer_ms?: number
  compliance_ms?: number
  total_ms?: number
}

export interface EvaluateData {
  search_id: string
  correlation_id: string
  status: 'success' | 'partial' | 'failed' | 'validation_required' | string
  errors?: string[]
  decision?: RecordDecision
  validation?: EvaluateValidation
  timing?: EvaluateTiming
}

export interface EvaluateMeta {
  api_version?: string
  process_time_ms?: number
  correlation_id?: string
}

/** The response body returned by `/evaluate`. */
export interface EvaluateResponse {
  success: boolean
  data?: EvaluateData
  meta?: EvaluateMeta
}
