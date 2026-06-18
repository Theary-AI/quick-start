import { NextResponse } from 'next/server'
import { clearWebhookRecords, listWebhookRecords } from '@/lib/webhooks/store'

export const dynamic = 'force-dynamic'

/** List received webhook events (optionally filtered by ?product=). */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const product = searchParams.get('product') ?? undefined
  return NextResponse.json({ events: listWebhookRecords(product) })
}

/** Clear received webhook events (optionally filtered by ?product=). */
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const product = searchParams.get('product') ?? undefined
  clearWebhookRecords(product)
  return NextResponse.json({ ok: true })
}
