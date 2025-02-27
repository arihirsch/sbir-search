export type Company = {
  firm_nid: number;
  company_name: string;
  sbir_url: string | null;
  uei: string | null;
  duns: string | null;
  address1: string | null;
  address2: string | null;
  city: string;
  state: string;
  zip: string | null;
  company_url: string | null;
  hubzone_owned: string;
  socially_economically_disadvantaged: string;
  woman_owned: string;
  number_awards: number;
};

export function parseCompany(data: any): Company {
  return {
    firm_nid: data.firm_nid,
    company_name: data.company_name,
    sbir_url: data.sbir_url || null,
    uei: data.uei || null,
    duns: data.duns || null,
    address1: data.address1 || null,
    address2: data.address2 || null,
    city: data.city,
    state: data.state,
    zip: data.zip || null,
    company_url: data.company_url || null,
    hubzone_owned: data.hubzone_owned,
    socially_economically_disadvantaged: data.socially_economically_disadvantaged,
    woman_owned: data.woman_owned,
    number_awards: parseInt(data.number_awards),
  };
} 