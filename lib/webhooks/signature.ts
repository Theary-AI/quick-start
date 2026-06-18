import crypto from 'node:crypto'

/**
 * Verify an HMAC-SHA256 webhook signature.
 *
 * The platform signs the raw request body and sends the result in the
 * `X-Webhook-Signature` header as `sha256=<hex>`. Always verify against the
 * raw body bytes, not re-serialized JSON.
 */
export function verifyWebhookSignature(rawBody: string, signatureHeader: string | null, secret: string): boolean {
  if (!secret) return false
  if (!signatureHeader) return false

  const provided = signatureHeader.replace(/^sha256=/, '')
  const expected = crypto.createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex')

  const providedBuf = Buffer.from(provided, 'hex')
  const expectedBuf = Buffer.from(expected, 'hex')
  if (providedBuf.length !== expectedBuf.length) return false

  return crypto.timingSafeEqual(providedBuf, expectedBuf)
}
