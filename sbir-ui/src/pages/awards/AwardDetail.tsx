import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Award, parseAward } from "@/types/award";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AwardDetail() {
  const { id } = useParams();
  const [award, setAward] = useState<Award | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAward() {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/awards/${id}`);
        const data = await response.json();
        setAward(parseAward(data));
      } catch (error) {
        console.error('Failed to fetch award:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchAward();
  }, [id]);

  if (loading) {
    return <div className="text-center mt-8">Loading...</div>;
  }

  if (!award) {
    return <div className="text-center mt-8">Award not found</div>;
  }

  return (
    <main className="ml-48 pt-24 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Basic Award Information */}
        <Card>
          <CardHeader>
            <CardTitle>{award.award_title}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Award Details</h3>
              <p><strong>Award Link:</strong> {award.award_link}</p>
              <p><strong>Amount:</strong> ${award.award_amount.toLocaleString()}</p>
              <p><strong>Award Year:</strong> {award.award_year}</p>
              <p><strong>Phase:</strong> {award.phase}</p>
              <p><strong>Program:</strong> {award.program}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Agency Information</h3>
              <p><strong>Agency:</strong> {award.agency}</p>
              <p><strong>Branch:</strong> {award.branch}</p>
              <p><strong>Agency Tracking Number:</strong> {award.agency_tracking_number}</p>
              <p><strong>Contract:</strong> {award.contract}</p>
            </div>
          </CardContent>
        </Card>

        {/* Company Information */}
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <p><strong>Company:</strong> {award.firm}</p>
              <p><strong>DUNS:</strong> {award.duns || 'N/A'}</p>
              <p><strong>UEI:</strong> {award.uei || 'N/A'}</p>
              <p><strong>Employees:</strong> {award.number_employees || 'N/A'}</p>
              <p><strong>Website:</strong> {award.company_url ? (
                <a href={award.company_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  {award.company_url}
                </a>
              ) : 'N/A'}</p>
            </div>
            <div>
              <p><strong>HUBZone Owned:</strong> {award.hubzone_owned || 'N/A'}</p>
              <p><strong>Socially/Economically Disadvantaged:</strong> {award.socially_economically_disadvantaged || 'N/A'}</p>
              <p><strong>Women Owned:</strong> {award.women_owned || 'N/A'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <Card>
          <CardHeader>
            <CardTitle>Address</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{award.address1}</p>
            {award.address2 && <p>{award.address2}</p>}
            <p>{award.city}, {award.state} {award.zip}</p>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Point of Contact</h3>
              <p><strong>Name:</strong> {award.poc_name || 'N/A'}</p>
              <p><strong>Title:</strong> {award.poc_title || 'N/A'}</p>
              <p><strong>Phone:</strong> {award.poc_phone || 'N/A'}</p>
              <p><strong>Email:</strong> {award.poc_email || 'N/A'}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Principal Investigator</h3>
              <p><strong>Name:</strong> {award.pi_name || 'N/A'}</p>
              <p><strong>Title:</strong> {award.pi_title || 'N/A'}</p>
              <p><strong>Phone:</strong> {award.pi_phone || 'N/A'}</p>
              <p><strong>Email:</strong> {award.pi_email || 'N/A'}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Research Institution</h3>
              <p><strong>Name:</strong> {award.ri_name || 'N/A'}</p>
              <p><strong>POC Name:</strong> {award.ri_poc_name || 'N/A'}</p>
              <p><strong>POC Phone:</strong> {award.ri_poc_phone || 'N/A'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Solicitation Information */}
        <Card>
          <CardHeader>
            <CardTitle>Solicitation Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <p><strong>Solicitation Number:</strong> {award.solicitation_number}</p>
              <p><strong>Solicitation Year:</strong> {award.solicitation_year}</p>
              <p><strong>Topic Code:</strong> {award.topic_code}</p>
            </div>
            <div>
              <p><strong>Proposal Award Date:</strong> {award.proposal_award_date}</p>
              <p><strong>Contract End Date:</strong> {award.contract_end_date}</p>
            </div>
          </CardContent>
        </Card>

        {/* Research Information */}
        <Card>
          <CardHeader>
            <CardTitle>Research Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Keywords</h3>
              <p>{award.research_area_keywords || 'N/A'}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Abstract</h3>
              <p className="whitespace-pre-wrap">{award.abstract || 'N/A'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
} 