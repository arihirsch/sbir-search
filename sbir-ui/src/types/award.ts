export type Award = {
  award_link: number;
  firm: string;
  award_title: string;
  agency: string;
  branch: string | null;
  phase: string;
  program: string;
  agency_tracking_number: string;
  contract: string;
  proposal_award_date: string;
  contract_end_date: string;
  solicitation_number: string;
  solicitation_year: number;
  topic_code: string;
  award_year: number;
  award_amount: number;
  duns: string | null;
  uei: string | null;
  hubzone_owned: string | null;
  socially_economically_disadvantaged: string | null;
  women_owned: string | null;
  number_employees: number | null;
  company_url: string | null;
  address1: string | null;
  address2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  poc_name: string | null;
  poc_title: string | null;
  poc_phone: string | null;
  poc_email: string | null;
  pi_name: string | null;
  pi_title: string | null;
  pi_phone: string | null;
  pi_email: string | null;
  ri_name: string | null;
  ri_poc_name: string | null;
  ri_poc_phone: string | null;
  research_area_keywords: string | null;
  abstract: string | null;
};

export function parseAward(data: any): Award {
  return {
    award_link: data.award_link,
    firm: data.firm,
    award_title: data.award_title,
    agency: data.agency,
    branch: data.branch,
    phase: data.phase,
    program: data.program,
    agency_tracking_number: data.agency_tracking_number,
    contract: data.contract,
    proposal_award_date: data.proposal_award_date,
    contract_end_date: data.contract_end_date,
    solicitation_number: data.solicitation_number,
    solicitation_year: parseInt(data.solicitation_year),
    topic_code: data.topic_code,
    award_year: parseInt(data.award_year),
    award_amount: parseFloat(data.award_amount),
    duns: data.duns,
    uei: data.uei,
    hubzone_owned: data.hubzone_owned,
    socially_economically_disadvantaged: data.socially_economically_disadvantaged,
    women_owned: data.women_owned,
    number_employees: data.number_employees ? parseInt(data.number_employees) : null,
    company_url: data.company_url,
    address1: data.address1,
    address2: data.address2,
    city: data.city,
    state: data.state,
    zip: data.zip,
    poc_name: data.poc_name,
    poc_title: data.poc_title,
    poc_phone: data.poc_phone,
    poc_email: data.poc_email,
    pi_name: data.pi_name,
    pi_title: data.pi_title,
    pi_phone: data.pi_phone,
    pi_email: data.pi_email,
    ri_name: data.ri_name,
    ri_poc_name: data.ri_poc_name,
    ri_poc_phone: data.ri_poc_phone,
    research_area_keywords: data.research_area_keywords,
    abstract: data.abstract,
  };
} 