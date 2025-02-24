export type SolicitationResponse = {
  agency: string;
  application_due_dates: string;
  branch: string;
  close_date: string;
  current_status: string;
  open_date: string;
  phase: string;
  program: string;
  release_date: string;
  solicitation_agency_url: string;
  solicitation_id: number;
  solicitation_number: string;
  solicitation_title: string;
  solicitation_year: number;
  topic_description: string;
  topic_title: string;
};

export type Solicitation = {
  agency: string;
  application_due_dates: string[];
  branch: string;
  close_date: string;
  current_status: string;
  open_date: string;
  phase: string;
  program: string;
  release_date: string;
  solicitation_agency_url: string;
  solicitation_id: number;
  solicitation_number: string;
  solicitation_title: string;
  solicitation_year: number;
  topic_description: string;
  topic_title: string;
};

// Example of parsing `application_due_dates`
export const parseSolicitation = (
  data: SolicitationResponse
): Solicitation => ({
  ...data,
  application_due_dates: JSON.parse(data.application_due_dates),
});
