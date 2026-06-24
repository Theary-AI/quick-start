import type { VerificationFormInput, VerificationOrderRequest, WebhookConfig } from './types'

/** Sensible, editable defaults so a client can submit in one click. */
export const SAMPLE_FORM: VerificationFormInput = {
  externalSearchId: 'quickstart-emp-001',
  applicant: {
    firstName: 'John',
    lastName: 'Smith',
    ssn: '123-45-6789',
    email: 'john.smith@example.com',
    phone: '+1-555-123-4567',
    birthday: '1990-05-15',
  },
  businessContext: {
    entityName: 'Apple',
    appliedJobTitle: 'Senior Software Engineer',
    worksiteCity: 'San Francisco',
    worksiteState: 'CA',
    proposedSalary: 100000,
  },
  employment: {
    employerName: 'Tech Corp',
    position: 'Software Engineer',
    employerLocation: 'San Francisco, CA',
    employerEmail: 'hr@techcorp.com',
    employerPhone: '+1-555-123-4567',
    startDate: '2020-01-15',
    endDate: '2023-06-30',
  },
}

function clean<T extends object>(obj: T): T {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v === '' || v === undefined || v === null) continue
    out[k] = v
  }
  return out as T
}

/**
 * Convert the flat form input into the API request body. `webhookConfig` is
 * supplied separately by the server (it carries the secret + tunnel URL).
 */
export function buildOrderRequest(form: VerificationFormInput, webhookConfig?: WebhookConfig): VerificationOrderRequest {
  return {
    searchTypes: [
      {
        searchType: 'EMPLOYMENT',
        ...(form.externalSearchId ? { externalSearchId: form.externalSearchId } : {}),
        // The top-level webhookConfig only routes verification.completed. To also
        // receive notification and action_required events at our endpoint, mirror
        // the same config into the per-search notifications.webhookOverride.
        ...(webhookConfig ? { searchConfig: { notifications: { webhookOverride: webhookConfig } } } : {}),
      },
    ],
    applicant: clean({
      firstName: form.applicant.firstName,
      lastName: form.applicant.lastName,
      ssn: form.applicant.ssn,
      email: form.applicant.email,
      phone: form.applicant.phone,
      birthday: form.applicant.birthday,
    }),
    businessContext: {
      entityName: form.businessContext.entityName,
      appliedJobTitle: form.businessContext.appliedJobTitle,
      worksiteCity: form.businessContext.worksiteCity,
      worksiteState: form.businessContext.worksiteState,
      proposedSalary: Number(form.businessContext.proposedSalary) || 0,
    },
    history: {
      employment: [clean(form.employment)],
    },
    ...(webhookConfig ? { webhookConfig } : {}),
  }
}
