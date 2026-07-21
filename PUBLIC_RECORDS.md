# Public Records — first successful evaluate

Public Records is **synchronous**: you send one search’s record and get the compliance decision in the same response. No webhooks, no polling.

## Prerequisites

- Staging API key from SNH AI (`eval-api-key-…`)
- Node 20+

## 1. Configure credentials

```bash
cp .env.example .env.local
```

Set at least:

```env
PUBLIC_RECORDS_API_BASE_URL=https://cra.pr.stg.snh-ai.com
PUBLIC_RECORDS_API_KEY=eval-api-key-<your-key>
```

Verification credentials (`AUTH_CLIENT_ID` / etc.) are **not** used here. Public Records mints its own JWT at `/auth/token`.

## 2. Run the demo

```bash
npm install
npm run dev
```

Open [http://localhost:3000/public-records](http://localhost:3000/public-records).

## 3. Submit the sample

1. Confirm the connection panel shows credentials + healthy API.
2. Leave the pre-filled Marcus Thompson sample (or click **Reset sample**).
3. Click **Evaluate**.

You should get HTTP **200** with `data.decision` containing:

| Field | What to look at |
|-------|-----------------|
| `record_decision` | Overall reportability for the search |
| `search_queue` | `Automation` / `Auditor` / `Insufficient Data` |
| `court_decisions[].case_decisions[].offenses[]` | Per-charge `charge_decision`, `rationale`, `routing.queue` |

## 4. What to do with the result

Pick **queue** or **decision** (one is usually enough; both only if routing and report labeling are separate steps):

| Queue | Decision (rollup) | Customer action |
|-------|-------------------|-----------------|
| `Automation` | `NOT_REPORTABLE` | Auto-handle (usually exclude not-reportable charges) |
| `Auditor` | `REPORTABLE` | Send to human audit before reporting |
| `Insufficient Data` | `MANUAL_REVIEW` | Investigate missing data or resubmit corrected JSON |

Full guide: https://docs.pr.snh-ai.com/guides/queue-next-action

## Curl smoke test (no UI)

```bash
export PUBLIC_RECORDS_API_BASE_URL=https://cra.pr.stg.snh-ai.com
export PUBLIC_RECORDS_API_KEY=eval-api-key-<your-key>

TOKEN=$(curl -s "$PUBLIC_RECORDS_API_BASE_URL/auth/token" \
  -X POST \
  -H "X-API-Key: $PUBLIC_RECORDS_API_KEY" \
  -H 'accept: application/json' | jq -r .access_token)

curl -s "$PUBLIC_RECORDS_API_BASE_URL/evaluate" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d @- <<'EOF' | jq '.data.status, .data.decision.record_decision, .data.decision.search_queue'
{
  "record": {
    "search_id": "55788321",
    "search_date": "2026-04-10",
    "order_id": "72849305",
    "order_number": "72849305.1",
    "applicant_state": "OR",
    "candidate_info": {
      "first_name": "Marcus",
      "last_name": "Thompson",
      "date_of_birth": "1991-03-14",
      "ssn": "445667890",
      "address": "782 Elm Avenue, Portland, OR, 97205"
    },
    "xml": "<ScreeningResults><postResults filledStatus='filled' order='72849305'><case><case_number>T91</case_number><jurisdiction_state>AZ</jurisdiction_state><defendant><name_first>Marcus</name_first><name_last>Thompson</name_last><dob>3/14/1991</dob></defendant><chargeinfo><charge>DUI LIQUOR/DRUGS/VAPORS 1ST</charge><crime_type>TRAFFIC</crime_type><disposition>PLEA OF GUILTY OR RESPONSIBLE, SENTENCE IMPOSED</disposition></chargeinfo></case></postResults></ScreeningResults>"
  }
}
EOF
```

## Notes for the first path

- **One search per call** — there is no batch API. Same `order_id` across searches; unique `order_number` + `search_id` per call.
- **Omit `cases[]`** for the simplest path. When you need your own court/offense IDs, see `samples/with-cases-mapping.json` (1 charge) or `samples/with-cases-multi-charge.json` (full multi-charge mapping).
- Required on `record`: `search_id`, `search_date`, `order_id`, `order_number`, `candidate_info`, and `xml` (or `record_json` for resubmit).
- Full contract: [Order → Search → Evaluate](https://docs.pr.snh-ai.com/how-it-works#order--search--evaluate-contract)

## Sample pack

Copy-paste evaluate bodies (traffic, reportable, insufficient-data, resubmit, schemas, `with-cases-mapping`) live in:

- Repo: [`samples/`](./samples/)
- Docs: https://docs.pr.snh-ai.com/samples/overview

Example:

```bash
curl -s "$PUBLIC_RECORDS_API_BASE_URL/evaluate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  --data @samples/traffic-not-reportable.json
```

## Docs

- Product docs: https://docs.pr.snh-ai.com
- Evaluate API: https://docs.pr.snh-ai.com/api-reference/endpoints/evaluate
- Sample pack: https://docs.pr.snh-ai.com/samples/overview
