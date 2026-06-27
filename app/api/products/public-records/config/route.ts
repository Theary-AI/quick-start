import { NextResponse } from 'next/server'
import { checkPublicRecordsHealth, getPublicRecordsConfigStatus } from '@/lib/products/public-records/client'

export const dynamic = 'force-dynamic'

/**
 * Returns the (redacted) setup status the Public Records UI needs: CRA API
 * config, resolved-token info (subject/tier), and a live health probe. The
 * token and API key themselves are never sent to the browser.
 */
export async function GET() {
  const config = await getPublicRecordsConfigStatus()
  const health = await checkPublicRecordsHealth()

  return NextResponse.json({ config, health })
}
