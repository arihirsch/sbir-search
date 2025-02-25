export type Award = {
  award_link: number;
  firm: string;
  award_title: string;
  agency: string;
  branch: string;
  phase: string;
  award_amount: number;
  award_year: number;
  abstract: string;
};

export function parseAward(data: any): Award {
  return {
    award_link: data.award_link,
    firm: data.firm,
    award_title: data.award_title,
    agency: data.agency,
    branch: data.branch,
    phase: data.phase,
    award_amount: parseFloat(data.award_amount),
    award_year: parseInt(data.award_year),
    abstract: data.abstract,
  };
} 