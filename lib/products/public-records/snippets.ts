/**
 * Copy-pasteable integration snippets for the Public Records (CRA) evaluation
 * API. These strings power the in-app Monaco code explorer (see
 * `components/CodeExplorer.tsx`) and intentionally mirror the real code in this
 * quickstart — from exchanging an API key for a token, to POSTing a record to
 * `/evaluate`, to reading the synchronous routing decision.
 *
 * Public Records is SYNCHRONOUS: unlike verification there are no webhooks —
 * the compliance routing decision comes back in the same response.
 */

export type SnippetLanguage = 'typescript' | 'json' | 'bash'

export interface CodeSnippet {
  id: string
  group: string
  title: string
  /** One-line summary shown above the editor. */
  summary: string
  language: SnippetLanguage
  /** Suggested filename / path, shown in the editor tab. */
  filename?: string
  code: string
}

export const SNIPPET_GROUPS = ['Call the API', 'Read the decision'] as const

/* -------------------------------------------------------------------------- */
/* 1. Call the API                                                            */
/* -------------------------------------------------------------------------- */

const GET_TOKEN: CodeSnippet = {
  id: 'pr-get-token',
  group: 'Call the API',
  title: 'Get an access token',
  summary: 'Exchange your API key for a short-lived CRA token. Public Records mints its own HS256 JWTs.',
  language: 'typescript',
  filename: 'lib/products/public-records/auth.ts',
  code: `// Public Records (CRA) is a SEPARATE API from verification and mints/validates
// its OWN short-lived JWTs (HS256). Exchange your API key for one at /auth/token,
// then send it as a Bearer token on every /evaluate call. A verification (Auth0
// RS256) token will be REJECTED here with "alg not allowed". Keep the key on the
// SERVER — never ship it to the browser.

interface AuthTokenResponse {
  access_token?: string
  token_type?: string
  expires_in?: number
  message?: string
}

const API_BASE_URL = process.env.PUBLIC_RECORDS_API_BASE_URL! // e.g. https://cra.pr.stg.snh-ai.com

export async function getPublicRecordsToken(): Promise<string> {
  // A pre-issued token (PUBLIC_RECORDS_TOKEN) is used as-is; otherwise exchange
  // the API key for one.
  if (process.env.PUBLIC_RECORDS_TOKEN) return process.env.PUBLIC_RECORDS_TOKEN

  const res = await fetch(\`\${API_BASE_URL}/auth/token\`, {
    method: 'POST',
    headers: { 'X-API-Key': process.env.PUBLIC_RECORDS_API_KEY!, accept: 'application/json' },
    cache: 'no-store',
  })

  const data = (await res.json()) as AuthTokenResponse
  if (!res.ok || !data.access_token) {
    throw new Error(data.message ?? \`token endpoint returned \${res.status}\`)
  }

  // Cache in memory until ~1 min before \`expires_in\` to avoid re-fetching.
  return data.access_token
}`,
}

const EVALUATE_RECORD: CodeSnippet = {
  id: 'pr-evaluate',
  group: 'Call the API',
  title: 'Evaluate a record',
  summary: 'POST /evaluate with the record wrapped under `record`. The decision returns synchronously.',
  language: 'typescript',
  filename: 'lib/products/public-records/client.ts',
  code: `import { getPublicRecordsToken } from './auth'
import type { EvaluateResponse } from './types'

const API_BASE_URL = process.env.PUBLIC_RECORDS_API_BASE_URL!
const EVALUATE_PATH = '/evaluate'

// The raw vendor screening XML for the record under review. The framework parses
// it, matches the candidate's identity, and routes each offense. (Truncated.)
const screeningXml = '<ScreeningResults>…</ScreeningResults>'

export async function evaluateRecord(): Promise<EvaluateResponse> {
  const token = await getPublicRecordsToken()

  // /evaluate is SYNCHRONOUS — no webhooks. The routing decision comes back in
  // this same response. The record is wrapped under \`record\`.
  // Omit cases[] on the first path — every offense in the XML is evaluated.
  const body = {
    record: {
      search_id: '55788321',
      search_date: '2026-04-10',
      order_id: '72849305',
      order_number: '72849305.1',
      applicant_state: 'OR',
      candidate_info: {
        first_name: 'Marcus',
        middle_name: 'R',
        last_name: 'Thompson',
        date_of_birth: '1991-03-14',
        ssn: '445667890',
        address: '782 Elm Avenue, Portland, OR, 97205',
      },
      xml: screeningXml,
    },
  }

  const res = await fetch(\`\${API_BASE_URL}\${EVALUATE_PATH}\`, {
    method: 'POST',
    headers: {
      Authorization: \`Bearer \${token}\`,
      'Content-Type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  })

  if (!res.ok) throw new Error(\`Evaluate failed (HTTP \${res.status}): \${await res.text()}\`)

  // => { success, data: { decision, validation, timing, … } }
  return (await res.json()) as EvaluateResponse
}`,
}

const EVALUATE_CURL: CodeSnippet = {
  id: 'pr-evaluate-curl',
  group: 'Call the API',
  title: 'Evaluate a record (curl)',
  summary: 'The same two calls as a terminal one-liner — handy for a quick smoke test.',
  language: 'bash',
  code: `# 1) Exchange your API key for a short-lived CRA token (HS256)
TOKEN=$(curl -s "$PUBLIC_RECORDS_API_BASE_URL/auth/token" \\
  -X POST \\
  -H "X-API-Key: $PUBLIC_RECORDS_API_KEY" \\
  -H 'accept: application/json' | jq -r .access_token)

# 2) Evaluate a record — the decision comes back synchronously
curl -s "$PUBLIC_RECORDS_API_BASE_URL/evaluate" \\
  -H "Authorization: Bearer $TOKEN" \\
  -H 'Content-Type: application/json' \\
  -d '{
    "record": {
      "search_id": "55788321",
      "search_date": "2026-04-10",
      "order_id": "72849305",
      "order_number": "72849305.1",
      "applicant_state": "OR",
      "candidate_info": {
        "first_name": "Marcus", "last_name": "Thompson",
        "date_of_birth": "1991-03-14", "ssn": "445667890",
        "address": "782 Elm Avenue, Portland, OR, 97205"
      },
      "xml": "<ScreeningResults>…</ScreeningResults>"
    }
  }' | jq`,
}

/* -------------------------------------------------------------------------- */
/* 2. Read the decision                                                       */
/* -------------------------------------------------------------------------- */

const DECISION_TYPES: CodeSnippet = {
  id: 'pr-decision-types',
  group: 'Read the decision',
  title: 'Decision response (types)',
  summary: 'The decision nests record → courts → cases → offenses. Leaf offenses carry the routing.',
  language: 'typescript',
  filename: 'lib/products/public-records/types.ts',
  code: `// Each level carries a routing "queue"; the leaf offenses also carry
// reportability + an identity match score.

export interface OffenseRouting {
  queue: string            // e.g. 'automation' | 'manual_review' | 'auditor'
  reportability: string    // e.g. 'reportable' | 'not_reportable'
  is_automatable: boolean
  identity_level: string   // strength of the identity match
  identity_score: number   // 0..1 confidence
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
  search_queue: string     // top-level routing for the whole search
  record_decision: string
  court_decisions: CourtDecision[]
}

export interface EvaluateResponse {
  success: boolean
  data?: {
    search_id: string
    correlation_id: string
    status: 'success' | 'partial' | 'failed' | string
    decision?: RecordDecision
    validation?: { issues?: unknown[] }
    timing?: { total_ms?: number }
  }
}`,
}

const READ_DECISION: CodeSnippet = {
  id: 'pr-read-decision',
  group: 'Read the decision',
  title: 'Route on the decision',
  summary: 'Walk the response: use search_queue for the whole search, then act per-offense.',
  language: 'typescript',
  filename: 'lib/decision.ts',
  code: `import type { EvaluateResponse } from '@/lib/products/public-records/types'

/**
 * Walk a /evaluate response and act on the routing decision. The top-level
 * \`search_queue\` tells you how to handle the search overall; drill into each
 * offense for per-charge reportability + identity confidence.
 */
export function routeDecision(res: EvaluateResponse) {
  if (!res.success || !res.data?.decision) {
    // status may be 'partial' | 'failed', or validation.issues may be present.
    console.warn('No decision — inspect res.data?.validation?.issues')
    return
  }

  const { search_queue, record_decision, court_decisions } = res.data.decision
  console.log('search →', search_queue, record_decision)

  for (const court of court_decisions ?? []) {
    for (const kase of court.case_decisions ?? []) {
      for (const offense of kase.offenses ?? []) {
        const { queue, reportability, is_automatable, identity_score } = offense.routing

        // Send automatable + reportable offenses straight through; route the
        // rest to a human queue for adjudication.
        if (is_automatable && reportability === 'reportable') {
          // autoReport(offense)
        } else {
          // enqueueForReview(offense, { queue, identity_score })
        }
      }
    }
  }
}`,
}

const DECISION_SAMPLE: CodeSnippet = {
  id: 'pr-decision-sample',
  group: 'Read the decision',
  title: 'Decision — sample response',
  summary: 'Example /evaluate response for the sample record (one AZ + two CA cases).',
  language: 'json',
  code: `{
  "success": true,
  "data": {
    "search_id": "55788321",
    "correlation_id": "c3f1a9e2-7b4d-4e10-9a5c-2d8f6b1e0a44",
    "status": "success",
    "decision": {
      "search_queue": "manual_review",
      "record_decision": "reportable",
      "court_decisions": [
        {
          "court_search_id": "AZ-MARICOPA-GOODYEAR",
          "court_queue": "automation",
          "case_decisions": [
            {
              "case_number": "T91",
              "case_queue": "automation",
              "offenses": [
                {
                  "offense_id": "2050",
                  "charge": "DUI LIQUOR/DRUGS/VAPORS 1ST",
                  "charge_decision": "reportable",
                  "routing": {
                    "queue": "automation",
                    "reportability": "reportable",
                    "is_automatable": true,
                    "identity_level": "exact_name_dob_ssn",
                    "identity_score": 0.98
                  }
                }
              ]
            }
          ]
        },
        {
          "court_search_id": "CA-ORANGE-SUPERIOR",
          "court_queue": "manual_review",
          "case_decisions": [
            {
              "case_number": "KXL308742",
              "case_queue": "automation",
              "offenses": [
                {
                  "offense_id": "2051",
                  "charge": "PETTY THEFT",
                  "charge_decision": "reportable",
                  "routing": {
                    "queue": "automation",
                    "reportability": "reportable",
                    "is_automatable": true,
                    "identity_level": "exact_name_dob_ssn",
                    "identity_score": 0.97
                  }
                }
              ]
            },
            {
              "case_number": "KXL309156",
              "case_queue": "manual_review",
              "offenses": [
                {
                  "offense_id": "2052",
                  "charge": "DISORDERLY CONDUCT",
                  "charge_decision": "not_reportable",
                  "routing": {
                    "queue": "manual_review",
                    "reportability": "not_reportable",
                    "is_automatable": false,
                    "identity_level": "exact_name_dob",
                    "identity_score": 0.82
                  }
                }
              ]
            }
          ]
        }
      ]
    },
    "validation": { "issues": [] },
    "timing": { "xml_transformer_ms": 84, "compliance_ms": 412, "total_ms": 512 }
  },
  "meta": { "api_version": "1.0.0", "process_time_ms": 531 }
}`,
}

/* -------------------------------------------------------------------------- */

export const SNIPPETS: CodeSnippet[] = [GET_TOKEN, EVALUATE_RECORD, EVALUATE_CURL, DECISION_TYPES, READ_DECISION, DECISION_SAMPLE]
