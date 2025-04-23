import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Company, parseCompany } from "@/types/company";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavbar } from "@/contexts/NavbarContext";

function formatValue(value: string | null): string {
  return value || 'N/A';
}

export default function CompanyDetail() {
  const { id } = useParams();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { 
    companyStateFilter, 
    companyAwardsRange, 
    isAwardsRangeActive,
    searchTerm
  } = useNavbar();

  // Track previous filter values
  const prevFilters = useRef({
    companyStateFilter,
    companyAwardsRange,
    isAwardsRangeActive,
    searchTerm
  });

  // Effect to handle filter changes
  useEffect(() => {
    // Check if any filter has actually changed
    const hasFilterChanged = 
      prevFilters.current.companyStateFilter !== companyStateFilter ||
      prevFilters.current.isAwardsRangeActive !== isAwardsRangeActive ||
      prevFilters.current.searchTerm !== searchTerm ||
      (isAwardsRangeActive && (
        prevFilters.current.companyAwardsRange[0] !== companyAwardsRange[0] ||
        prevFilters.current.companyAwardsRange[1] !== companyAwardsRange[1]
      ));

    if (hasFilterChanged) {
      const queryParams = new URLSearchParams();
      if (searchTerm) queryParams.append('q', searchTerm);
      if (companyStateFilter) queryParams.append('state', companyStateFilter);
      if (isAwardsRangeActive) {
        queryParams.append('min_awards', companyAwardsRange[0].toString());
        queryParams.append('max_awards', companyAwardsRange[1].toString());
      }
      
      navigate(`/companies?${queryParams.toString()}`);
    }

    // Update previous filter values
    prevFilters.current = {
      companyStateFilter,
      companyAwardsRange,
      isAwardsRangeActive,
      searchTerm
    };
  }, [companyStateFilter, companyAwardsRange, isAwardsRangeActive, searchTerm, navigate]);

  useEffect(() => {
    async function fetchCompany() {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/companies/${id}`);
        const responseData = await response.json();
        if (responseData.data) {
          setCompany(parseCompany(responseData.data));
        } else {
          setCompany(null);
        }
      } catch (error) {
        console.error('Failed to fetch company:', error);
        setCompany(null);
      } finally {
        setLoading(false);
      }
    }
    fetchCompany();
  }, [id]);

  if (loading) {
    return <div className="text-center mt-8">Loading...</div>;
  }

  if (!company) {
    return <div className="text-center mt-8">Company not found</div>;
  }

  return (
    <main >
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">{company.company_name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Contact Information */}
          <section className="space-y-2">
            <h3 className="text-lg font-semibold">Contact Information</h3>
            <div className="grid grid-cols-1 gap-2">
              <p><strong>Address:</strong> {company.address1}
                {company.address2 && <span><br />{company.address2}</span>}
              </p>
              <p><strong>Location:</strong> {company.city}, {company.state} {company.zip}</p>
              {company.company_url && (
                <p>
                  <strong>Website:</strong>{" "}
                  <a 
                    href={company.company_url.startsWith('http') ? company.company_url : `http://${company.company_url}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {company.company_url.replace(/^https?:\/\//, '').replace(/^www\./, '')}
                  </a>
                </p>
              )}
              {company.sbir_url && (
                <p>
                  <strong>SBIR Profile:</strong>{" "}
                  <a 
                    href={company.sbir_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    View on SBIR.gov
                  </a>
                </p>
              )}
            </div>
          </section>

          {/* Business Details */}
          <section className="space-y-2">
            <h3 className="text-lg font-semibold">Business Details</h3>
            <div className="grid grid-cols-1 gap-2">
              <p><strong>Total SBIR/STTR Awards:</strong> {company.number_awards}</p>
              <p><strong>UEI:</strong> {formatValue(company.uei)}</p>
              <p><strong>DUNS:</strong> {formatValue(company.duns)}</p>
            </div>
          </section>

          {/* Business Classifications */}
          <section className="space-y-2">
            <h3 className="text-lg font-semibold">Business Classifications</h3>
            <div className="grid grid-cols-1 gap-2">
              <p>
                <strong>HUBZone Owned:</strong>{" "}
                <span className={company.hubzone_owned === "Yes" ? "text-green-600 font-medium" : ""}>
                  {company.hubzone_owned || "No"}
                </span>
              </p>
              <p>
                <strong>Woman Owned:</strong>{" "}
                <span className={company.woman_owned === "Yes" ? "text-green-600 font-medium" : ""}>
                  {company.woman_owned || "No"}
                </span>
              </p>
              <p>
                <strong>Socially/Economically Disadvantaged:</strong>{" "}
                <span className={company.socially_economically_disadvantaged === "Yes" ? "text-green-600 font-medium" : ""}>
                  {company.socially_economically_disadvantaged || "No"}
                </span>
              </p>
            </div>
          </section>
        </CardContent>
      </Card>
    </main>
  );
} 