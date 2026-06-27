import type { EvaluateRequest, PublicRecordsFormInput } from './types'

/**
 * The screening XML for the sample record (Marcus Thompson). This is the raw
 * vendor payload the evaluation framework parses. Single quotes on attributes
 * are intentional — they match the source feed format.
 */
export const SAMPLE_XML = `<ScreeningResults><postResults  filledStatus='filled' order='72849305' subOrder='72849305' filledCode='hits'>  <case>     <case_comments/>    <case_number>T91</case_number>    <offense_date/>    <filing_date>03/22/2022</filing_date>    <disposition_date>09/15/2022</disposition_date>    <pending_date/>    <source>Arizona Administrative Office of Courts</source>    <defendant>      <name_first>Marcus</name_first>      <name_middle>R</name_middle>      <name_last>Thompson</name_last>      <name_suffix/>      <dob>3/14/1991</dob>      <ssn>445667890</ssn>      <gender>Male</gender>      <address>        <address>782 Elm Avenue</address>        <city>Portland</city>        <state>OR</state>        <zip>97205</zip>      </address>    </defendant>    <jurisdiction/>    <jurisdiction_state>AZ</jurisdiction_state>    <preformatted_textblock/>    <hidden>N</hidden>    <chargeinfo>      <charge>DUI LIQUOR/DRUGS/VAPORS 1ST</charge>      <statute/>      <charge_number/>      <crime_type>TRAFFIC</crime_type>      <disposition>PLEA OF GUILTY OR RESPONSIBLE, SENTENCE IMPOSED</disposition>      <plea/>      <arrest_date_freeformat/>      <sentencing_date_freeformat/>      <offense_date_freeformat/>      <filing_date_freeformat>06/08/2024</filing_date_freeformat>      <disposition_date_freeformat>07/23/2024</disposition_date_freeformat>      <charge_comments/>      <sentence_comments/>      <additionalInfo>          </additionalInfo>      <additionalInfo>        <title>Offense Class</title>        <value>MISDEMEANOR 1ST DEGREE</value>      </additionalInfo>      <additionalInfo>        <title>Offense Count</title>        <value>1</value>      </additionalInfo>      <additionalInfo>        <title>Offense Driver License State</title>        <value>AZ</value>      </additionalInfo>      <additionalInfo>        <title>Offense RecordURL</title>        <value>http://www.goodyearaz.gov/index.aspx?NID=699</value>      </additionalInfo>      <additionalInfo>        <title>Court Case Type</title>        <value>TRAFFIC</value>      </additionalInfo>      <additionalInfo>        <title>Court County</title>        <value>MARICOPA</value>      </additionalInfo>      <additionalInfo>        <title>Court Name</title>        <value>Goodyear Municipal</value>      </additionalInfo>    </chargeinfo>  </case>  <case>    <identified_by_name>Y</identified_by_name>    <identified_by_dob>Y</identified_by_dob>    <identified_by_ssn>Y</identified_by_ssn>    <identified_by_partial_ssn>N</identified_by_partial_ssn>    <additional_identifiers>DOB: (3/14/1991); NAME ON FILE: (Thompson, Marcus R); SSN ON FILE; Exact Name And DOB Match;</additional_identifiers>    <case_comments/>    <case_number>KXL308742</case_number>    <offense_date/>    <filing_date>05/03/2024</filing_date>    <disposition_date>06/19/2024</disposition_date>    <pending_date/>    <source>California Orange Superior Court</source>    <defendant>      <name_first>Marcus</name_first>      <name_middle>R</name_middle>      <name_last>Thompson</name_last>      <name_suffix/>      <dob>3/14/1991</dob>      <dobfreeform>3/14/1991</dobfreeform>      <ssn>445667890</ssn>      <gender>Male</gender>      <race/>      <height/>      <weight/>      <haircolor/>      <eyecolor/>      <imageURL/>      <persontype>D</persontype>      <address>        <address>782 Elm Avenue</address>        <city>Portland</city>        <state>OR</state>        <zip>97205</zip>      </address>    </defendant>    <jurisdiction>Orange</jurisdiction>    <jurisdiction_state>CA</jurisdiction_state>    <preformatted_textblock/>    <hidden>N</hidden>    <chargeinfo>      <charge>PETTY THEFT</charge>      <statute>PC 484(A)</statute>      <charge_number/>      <crime_type>MISDEMEANOR</crime_type>      <disposition>CONVICTED</disposition>      <plea>GUILTY</plea>      <arrest_date_freeformat/>      <sentencing_date_freeformat>06/19/2024</sentencing_date_freeformat>      <offense_date_freeformat/>      <filing_date_freeformat>05/03/2024</filing_date_freeformat>      <disposition_date_freeformat>06/19/2024</disposition_date_freeformat>      <charge_comments/>      <sentence_comments/>      <additionalInfo>        <title>Court Name</title>        <value>Superior</value>      </additionalInfo>    </chargeinfo>  </case>  <case>    <identified_by_name>Y</identified_by_name>    <identified_by_dob>Y</identified_by_dob>    <identified_by_ssn>Y</identified_by_ssn>    <identified_by_partial_ssn>N</identified_by_partial_ssn>    <additional_identifiers>DOB: (3/14/1991); NAME ON FILE: (Thompson, Marcus R); SSN ON FILE; Exact Name And DOB Match;</additional_identifiers>    <case_comments/>    <case_number>KXL309156</case_number>    <offense_date/>    <filing_date>05/18/2024</filing_date>    <disposition_date>06/19/2024</disposition_date>    <pending_date/>    <source>California Orange Superior Court</source>    <defendant>      <name_first>Marcus</name_first>      <name_middle>R</name_middle>      <name_last>Thompson</name_last>      <name_suffix/>      <dob>3/14/1991</dob>      <dobfreeform>3/14/1991</dobfreeform>      <ssn>445667890</ssn>      <gender>Male</gender>      <race/>      <height/>      <weight/>      <haircolor/>      <eyecolor/>      <imageURL/>      <persontype>D</persontype>      <address>        <address>782 Elm Avenue</address>        <city>Portland</city>        <state>OR</state>        <zip>97205</zip>      </address>    </defendant>    <jurisdiction>Orange</jurisdiction>    <jurisdiction_state>CA</jurisdiction_state>    <preformatted_textblock/>    <hidden>N</hidden>    <chargeinfo>      <charge>DISORDERLY CONDUCT</charge>      <statute>PC 647(F)</statute>      <charge_number/>      <crime_type>MISDEMEANOR</crime_type>      <disposition>DISMISSED</disposition>      <plea>NOT GUILTY</plea>      <arrest_date_freeformat/>      <sentencing_date_freeformat/>      <offense_date_freeformat/>      <filing_date_freeformat>05/18/2024</filing_date_freeformat>      <disposition_date_freeformat>06/19/2024</disposition_date_freeformat>      <charge_comments/>      <sentence_comments/>      <additionalInfo>        <title>Court Name</title>        <value>Superior</value>      </additionalInfo>    </chargeinfo>  </case>  <datasources/></postResults></ScreeningResults>`

/** Sensible, editable defaults so a client can submit in one click. */
export const SAMPLE_FORM: PublicRecordsFormInput = {
  searchId: '55788321',
  searchDate: '2026-04-10',
  applicantState: 'OR',
  offenseIds: '2050, 2051, 2052',
  candidate: {
    first_name: 'Marcus',
    middle_name: 'R',
    last_name: 'Thompson',
    date_of_birth: '1991-03-14',
    ssn: '445667890',
    address: '782 Elm Avenue, Portland, OR, 97205',
  },
  xml: SAMPLE_XML,
}

function clean<T extends object>(obj: T): T {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v === '' || v === undefined || v === null) continue
    out[k] = v
  }
  return out as T
}

/** Parse the comma/whitespace/newline separated offense id list into an array. */
export function parseOffenseIds(raw: string): string[] {
  return raw
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

/** Convert the flat form input into the `POST /evaluate` request body. */
export function buildEvaluateRequest(form: PublicRecordsFormInput): EvaluateRequest {
  return {
    record: {
      search_id: form.searchId,
      search_date: form.searchDate,
      applicant_state: form.applicantState,
      offense_ids: parseOffenseIds(form.offenseIds),
      candidate_info: clean({
        first_name: form.candidate.first_name,
        middle_name: form.candidate.middle_name,
        last_name: form.candidate.last_name,
        date_of_birth: form.candidate.date_of_birth,
        ssn: form.candidate.ssn,
        address: form.candidate.address,
      }),
      xml: form.xml,
    },
  }
}
