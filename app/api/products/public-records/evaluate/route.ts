import { NextResponse } from 'next/server'
import { evaluateRecord } from '@/lib/products/public-records/client'
import { buildEvaluateRequest } from '@/lib/products/public-records/sample'
import type { PublicRecordsFormInput } from '@/lib/products/public-records/types'

export const dynamic = 'force-dynamic'

/**
 * Evaluate a single public record.
 *
 * The browser posts the form fields here; the server resolves the CRA Bearer
 * token (pre-issued or exchanged from the API key) and forwards the request to
 * `POST /evaluate`. This keeps every credential on the server. The evaluation
 * is synchronous — the routing decision is returned in the response.
 */
export async function POST(request: Request) {
  const form = (await request.json()) as PublicRecordsFormInput
  const body = buildEvaluateRequest(form)
  const result = await evaluateRecord(body)

  return NextResponse.json(result, { status: result.ok ? 200 : result.status || 502 })
}
