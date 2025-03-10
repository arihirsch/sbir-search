import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Company, parseCompany } from "@/types/company";

export default function Companies() {
  const [searchParams] = useSearchParams();
  const [data, setData] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, [searchParams]);

  async function fetchData() {
    setLoading(true);
    try {
      let url = `${import.meta.env.VITE_API_BASE_URL}/companies`;
      const response = await fetch(url);
      const responseData = await response.json();
      setData(responseData.data.map(parseCompany));
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="ml-48 pt-24 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8 text-gray-600">
          {loading ? "Loading companies..." : `Found ${data.length} companies`}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {loading ? (
            <div className="col-span-2 text-center">Loading...</div>
          ) : data.length > 0 ? (
            data.map((company) => (
              <Card 
                key={company.firm_nid}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(`/companies/${company.firm_nid}`)}
              >
                <CardHeader>
                  <CardTitle>{company.company_name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p><strong>Location:</strong> {company.city}, {company.state}</p>
                  <p><strong>Number of Awards:</strong> {company.number_awards}</p>
                  {company.hubzone_owned === "Yes" && (
                    <p><strong>HUBZone Owned</strong></p>
                  )}
                  {company.woman_owned === "Yes" && (
                    <p><strong>Woman Owned</strong></p>
                  )}
                  {company.company_url && (
                    <p>
                      <strong>Website:</strong>{" "}
                      <a 
                        href={company.company_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {company.company_url}
                      </a>
                    </p>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-2 text-center">No companies found</div>
          )}
        </div>
      </div>
    </main>
  );
} 