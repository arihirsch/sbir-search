export type Company = {
  firm_nid: number;
  company_name: string;
  city: string;
  state: string;
  number_awards: number;
  hubzone_owned: string;
  woman_owned: string;
  company_url: string;
};

export function parseCompany(data: any): Company {
  return {
    firm_nid: data.firm_nid,
    company_name: data.company_name,
    city: data.city,
    state: data.state,
    number_awards: parseInt(data.number_awards),
    hubzone_owned: data.hubzone_owned,
    woman_owned: data.woman_owned,
    company_url: data.company_url,
  };
} 