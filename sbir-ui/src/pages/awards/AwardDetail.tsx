import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Award, parseAward } from "@/types/award";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AgencyLogo from "@/components/AgencyLogo";
import { Separator } from "@/components/ui/separator.tsx";
import { useNavbar } from "@/contexts/NavbarContext";

export default function AwardDetail() {
  const { id } = useParams();
  const [award, setAward] = useState<Award | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { 
    awardAgencyFilter, 
    awardProgramFilter, 
    awardPhaseFilter, 
    awardYearFilter,
    awardAmountRange,
    isAmountRangeActive,
    searchTerm
  } = useNavbar();

  // Track previous filter values
  const prevFilters = useRef({
    awardAgencyFilter,
    awardProgramFilter,
    awardPhaseFilter,
    awardYearFilter,
    awardAmountRange,
    isAmountRangeActive,
    searchTerm
  });

  // Effect to handle filter changes
  useEffect(() => {
    // Check if any filter has actually changed
    const hasFilterChanged = 
      prevFilters.current.awardAgencyFilter !== awardAgencyFilter ||
      prevFilters.current.awardProgramFilter !== awardProgramFilter ||
      prevFilters.current.awardPhaseFilter !== awardPhaseFilter ||
      prevFilters.current.awardYearFilter !== awardYearFilter ||
      prevFilters.current.isAmountRangeActive !== isAmountRangeActive ||
      prevFilters.current.searchTerm !== searchTerm ||
      (isAmountRangeActive && (
        prevFilters.current.awardAmountRange[0] !== awardAmountRange[0] ||
        prevFilters.current.awardAmountRange[1] !== awardAmountRange[1]
      ));

    if (hasFilterChanged) {
      const queryParams = new URLSearchParams();
      if (searchTerm) queryParams.append('q', searchTerm);
      if (awardAgencyFilter) queryParams.append('agency', awardAgencyFilter);
      if (awardProgramFilter) queryParams.append('program', awardProgramFilter);
      if (awardPhaseFilter) queryParams.append('phase', awardPhaseFilter);
      if (awardYearFilter) queryParams.append('year', awardYearFilter);
      if (isAmountRangeActive) {
        queryParams.append('min_amount', awardAmountRange[0].toString());
        queryParams.append('max_amount', awardAmountRange[1].toString());
      }
      
      navigate(`/awards?${queryParams.toString()}`);
    }

    // Update previous filter values
    prevFilters.current = {
      awardAgencyFilter,
      awardProgramFilter,
      awardPhaseFilter,
      awardYearFilter,
      awardAmountRange,
      isAmountRangeActive,
      searchTerm
    };
  }, [awardAgencyFilter, awardProgramFilter, awardPhaseFilter, awardYearFilter, awardAmountRange, isAmountRangeActive, searchTerm, navigate]);

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
    <main>
      {/* Basic Award Information */}
      <Card className="mb-4">
        <CardHeader>
          <div className="flex flex-row items-center justify-between">
            <CardTitle className="text-2xl font-bold">{award.award_title}</CardTitle>
            <AgencyLogo agency={award.agency} size="lg" className="ml-4" />
          </div>
        </CardHeader>
        <Separator />
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
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Company Information</CardTitle>
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
            <p><strong>Address:</strong> {award.address1}{award.address2 ? `, ${award.address2}` : ''}, {award.city}, {award.state} {award.zip}</p>
          </div>
          <div>
            <p><strong>HUBZone Owned:</strong> {award.hubzone_owned || 'N/A'}</p>
            <p><strong>Socially/Economically Disadvantaged:</strong> {award.socially_economically_disadvantaged || 'N/A'}</p>
            <p><strong>Women Owned:</strong> {award.women_owned || 'N/A'}</p>
          </div>
        </CardContent>
        <CardContent>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Point of Contact</h4>
              <p><strong>Name:</strong> {award.poc_name || 'N/A'}</p>
              <p><strong>Title:</strong> {award.poc_title || 'N/A'}</p>
              <p><strong>Phone:</strong> {award.poc_phone || 'N/A'}</p>
              <p><strong>Email:</strong> {award.poc_email || 'N/A'}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Principal Investigator</h4>
              <p><strong>Name:</strong> {award.pi_name || 'N/A'}</p>
              <p><strong>Title:</strong> {award.pi_title || 'N/A'}</p>
              <p><strong>Phone:</strong> {award.pi_phone || 'N/A'}</p>
              <p><strong>Email:</strong> {award.pi_email || 'N/A'}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Research Institution</h4>
              <p><strong>Name:</strong> {award.ri_name || 'N/A'}</p>
              <p><strong>POC Name:</strong> {award.ri_poc_name || 'N/A'}</p>
              <p><strong>POC Phone:</strong> {award.ri_poc_phone || 'N/A'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Solicitation Information */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Solicitation Details</CardTitle>
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
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Research Information</CardTitle>
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
    </main>
  );
} 