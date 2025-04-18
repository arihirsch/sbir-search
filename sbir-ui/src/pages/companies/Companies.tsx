import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Company, parseCompany } from "@/types/company";
import { Button } from "@/components/ui/button";
import posthog from 'posthog-js';
import { Loader2 } from "lucide-react";

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
      // Track search initiated
      if (searchTerm) {
        posthog.capture('search_initiated', {
          search_term: searchTerm,
          search_type: 'companies',
          source: 'companies_page'
        });
      }

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

      // Track search completed
      if (searchTerm) {
        posthog.capture('search_completed', {
          search_term: searchTerm,
          search_type: 'companies',
          result_count: responseData.total,
          source: 'companies_page'
        });
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      // Track search error
      if (searchTerm) {
        posthog.capture('search_error', {
          search_term: searchTerm,
          search_type: 'companies',
          error: error instanceof Error ? error.message : 'Unknown error',
          source: 'companies_page'
        });
      }
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
      {/* Loading State */}
      {loading && searchTerm && (
        <div className="flex flex-col items-center justify-center py-8 gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          <p className="text-gray-600 dark:text-gray-300">Searching with AI...</p>
        </div>
      )}

      {/* Add Summary Card */}
      {searchTerm && summary && !loading && (
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

      {/* Results Count */}
      {!loading && (
        <div className="text-center mb-8 text-gray-600 dark:text-gray-200">
          {totalCompanies > data.length ? 
            `Showing companies ${(currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, totalCompanies)} of ${totalCompanies}` : 
            `Found ${totalCompanies} companies`
          }
        </div>
      )}

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {!loading && data.length > 0 ? (
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
        ) : !loading && (
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