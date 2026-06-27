/**
 * Types for the Public Records product, mirroring the CRA evaluation framework
 * (`POST /evaluate`). The endpoint synchronously evaluates a single criminal /
 * court record (supplied as the raw screening XML plus candidate identifiers)
 * and returns a compliance routing decision. Only the fields exercised by this
 * quickstart are modeled; see the API reference (`/docs`) for the full schema.
 */

/** Candidate identifiers used for identity matching against the record. */
export interface CandidateInfo {
  first_name: string
  middle_name?: string
  last_name: string
  date_of_birth: string
  ssn: string
  address: string
}

/** The record payload sent to `/evaluate`, wrapped under `record`. */
export interface EvaluateRecord {
  search_id: string
  search_date: string
  applicant_state: string
  offense_ids: string[]
  candidate_info: CandidateInfo
  xml: string
}

export interface EvaluateRequest {
  record: EvaluateRecord
}

/** The flat shape collected by the console form in the UI. */
export interface PublicRecordsFormInput {
  searchId: string
  searchDate: string
  applicantState: string
  offenseIds: string
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
  court_decisions: CourtDecision[]
}

export interface EvaluateValidation {
  issues?: unknown[]
}

export interface EvaluateTiming {
  xml_transformer_ms?: number
  compliance_ms?: number
  total_ms?: number
}

export interface EvaluateData {
  search_id: string
  correlation_id: string
  status: 'success' | 'partial' | 'failed' | string
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
