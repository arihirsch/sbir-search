import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Company, parseCompany } from "@/types/company";
import { Button } from "@/components/ui/button";

export default function Companies() {
  const [searchParams] = useSearchParams();
  const [data, setData] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCompanies, setTotalCompanies] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const pageSize = 50; // Match the backend default
  const navigate = useNavigate();

  // Get search term from URL params
  const searchTerm = searchParams.get("q") || '';

  // Reset page when search params change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchParams]);

  useEffect(() => {
    fetchData();
  }, [searchParams, currentPage, searchTerm]);

  async function fetchData() {
    setLoading(true);
    try {
      // Build query parameters
      const queryParams = new URLSearchParams();
      
      // Add search query if present
      if (searchTerm) {
        queryParams.append('q', searchTerm);
      }
      
      // Add pagination parameters
      queryParams.append('limit', pageSize.toString());
      queryParams.append('offset', ((currentPage - 1) * pageSize).toString());
      
      // Construct the URL with query parameters
      let url = `${import.meta.env.VITE_API_BASE_URL}/companies`;
      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
      }
      
      const response = await fetch(url);
      const responseData = await response.json();
      setData(responseData.data.map(parseCompany));
      setTotalCompanies(responseData.total);
      setHasMore(responseData.total > currentPage * pageSize);
      setSummary(responseData.summary);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleNextPage = () => {
    setCurrentPage(prev => prev + 1);
    window.scrollTo(0, 0);
  };

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
    window.scrollTo(0, 0);
  };

  return (
    <main>
      {/* Add Summary Card */}
      {searchTerm && summary && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Search Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-200">
              {summary}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="text-center mb-8 text-gray-600 dark:text-gray-200">
        {loading ? (
          "Loading companies..."
        ) : (
          totalCompanies > data.length ? 
          `Showing companies ${(currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, totalCompanies)} of ${totalCompanies}` : 
          `Found ${totalCompanies} companies`
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 text-center">Loading...</div>
        ) : data.length > 0 ? (
          data.map((company) => (
            <Card 
              key={company.firm_nid}
              className="hover:shadow-lg transition-shadow"
              href={`/companies/${company.firm_nid}`}
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
                      href={company.company_url.startsWith('http') ? company.company_url : `http://${company.company_url}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {company.company_url.replace(/^https?:\/\//, '').replace(/^www\./, '')}
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

      {/* Pagination Controls */}
      {!loading && data.length > 0 && (
        <div className="flex justify-between items-center mt-8">
          <Button 
            onClick={handlePrevPage} 
            disabled={currentPage === 1}
            variant="outline"
          >
            Previous Page
          </Button>
          <div className="text-sm text-gray-600">
            Page {currentPage}
          </div>
          <Button 
            onClick={handleNextPage} 
            disabled={!hasMore}
            variant="outline"
          >
            Next Page
          </Button>
        </div>
      )}
    </main>
  );
} 