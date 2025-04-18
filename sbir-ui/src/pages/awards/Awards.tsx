import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, parseAward } from "@/types/award";
import { useNavbar } from "@/contexts/NavbarContext";
import { Button } from "@/components/ui/button";
import posthog from 'posthog-js';
import { Loader2 } from "lucide-react";

export default function Awards() {
  const [searchParams] = useSearchParams();
  const [data, setData] = useState<Award[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalAwards, setTotalAwards] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const pageSize = 50; // Match the backend default
  const { 
    awardAgencyFilter, 
    setAwardAgencyFilter,
    awardProgramFilter,
    setAwardProgramFilter,
    awardPhaseFilter,
    setAwardPhaseFilter,
    awardYearFilter,
    setAwardYearFilter,
    awardAmountRange,
    setAwardAmountRange,
    isAmountRangeActive,
    setIsAmountRangeActive
  } = useNavbar();
  const navigate = useNavigate();

  // Get search term from URL params
  const searchTerm = searchParams.get("q") || '';

  // Sync URL filters with context on initial load
  useEffect(() => {
    const urlAgency = searchParams.get("agency");
    if (urlAgency && urlAgency !== awardAgencyFilter) {
      setAwardAgencyFilter(urlAgency);
      setCurrentPage(1); // Reset to first page when filter changes
    }
    
    const urlProgram = searchParams.get("program");
    if (urlProgram && urlProgram !== awardProgramFilter) {
      setAwardProgramFilter(urlProgram);
      setCurrentPage(1); // Reset to first page when filter changes
    }
    
    const urlPhase = searchParams.get("phase");
    if (urlPhase && urlPhase !== awardPhaseFilter) {
      setAwardPhaseFilter(urlPhase);
      setCurrentPage(1); // Reset to first page when filter changes
    }
    
    const urlYear = searchParams.get("year");
    if (urlYear && urlYear !== awardYearFilter) {
      setAwardYearFilter(urlYear);
      setCurrentPage(1); // Reset to first page when filter changes
    }
    
    const urlMinAmount = searchParams.get("minAmount");
    const urlMaxAmount = searchParams.get("maxAmount");
    if (urlMinAmount && urlMaxAmount) {
      const minAmount = parseInt(urlMinAmount);
      const maxAmount = parseInt(urlMaxAmount);
      setAwardAmountRange([minAmount, maxAmount]);
      setIsAmountRangeActive(true);
      setCurrentPage(1); // Reset to first page when filter changes
    }
  }, [searchParams]);

  // Add effect to reset page when filters change
  useEffect(() => {
    // Skip the initial render
    if (awardAgencyFilter !== undefined || awardProgramFilter !== undefined || 
        awardPhaseFilter !== undefined || awardYearFilter !== undefined ||
        isAmountRangeActive !== undefined) {
      setCurrentPage(1);
    }
  }, [awardAgencyFilter, awardProgramFilter, awardPhaseFilter, awardYearFilter, awardAmountRange, isAmountRangeActive]);

  useEffect(() => {
    fetchData();
  }, [searchParams, awardAgencyFilter, awardProgramFilter, awardPhaseFilter, awardYearFilter, awardAmountRange, isAmountRangeActive, currentPage, searchTerm]);

  async function fetchData() {
    setLoading(true);
    try {
      // Track search initiated
      if (searchTerm) {
        posthog.capture('search_initiated', {
          search_term: searchTerm,
          search_type: 'awards',
          source: 'awards_page'
        });
      }

      // Build query parameters
      const queryParams = new URLSearchParams();
      
      // Add search query if present
      if (searchTerm) {
        queryParams.append('q', searchTerm);
      }
      
      // Add agency filter if present
      if (awardAgencyFilter) {
        queryParams.append('agency', awardAgencyFilter);
      }
      
      // Add program filter if present
      if (awardProgramFilter) {
        queryParams.append('program', awardProgramFilter);
      }
      
      // Add phase filter if present
      if (awardPhaseFilter) {
        queryParams.append('phase', awardPhaseFilter);
      }
      
      // Add year filter if present
      if (awardYearFilter) {
        queryParams.append('year', awardYearFilter);
      }
      
      // Add amount range filter if active
      if (isAmountRangeActive) {
        queryParams.append('minAmount', awardAmountRange[0].toString());
        queryParams.append('maxAmount', awardAmountRange[1].toString());
      }
      
      // Add pagination parameters
      queryParams.append('limit', pageSize.toString());
      queryParams.append('offset', ((currentPage - 1) * pageSize).toString());
      
      // Construct the URL with query parameters
      let url = `${import.meta.env.VITE_API_BASE_URL}/awards`;
      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
      }
      
      const response = await fetch(url);
      const responseData = await response.json();
      setData(responseData.data.map(parseAward));
      setTotalAwards(responseData.total);
      setHasMore(responseData.total > currentPage * pageSize);
      setSummary(responseData.summary);

      // Track search completed
      if (searchTerm) {
        posthog.capture('search_completed', {
          search_term: searchTerm,
          search_type: 'awards',
          result_count: responseData.total,
          source: 'awards_page'
        });
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      // Track search error
      if (searchTerm) {
        posthog.capture('search_error', {
          search_term: searchTerm,
          search_type: 'awards',
          error: error instanceof Error ? error.message : 'Unknown error',
          source: 'awards_page'
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
      {loading && (
        <div className="flex flex-col items-center justify-center py-8 gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          <p className="text-gray-600 dark:text-gray-300">
            {searchTerm ? "Searching with AI..." : "Loading..."}
          </p>
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
          {totalAwards > data.length ? 
            `Showing awards ${(currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, totalAwards)} of ${totalAwards}` : 
            `Found ${totalAwards} awards`
          }
        </div>
      )}

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {!loading && data.length > 0 ? (
          data.map((award) => (
            <Card 
              key={award.award_link}
              className="hover:shadow-lg transition-shadow"
              href={`/awards/${award.award_link}`}
            >
              <CardHeader>
                <CardTitle>{award.award_title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p><strong>Company:</strong> {award.firm}</p>
                <p><strong>Amount:</strong> ${award.award_amount.toLocaleString()}</p>
                <p><strong>Year:</strong> {award.award_year}</p>
                <p><strong>Agency:</strong> {award.agency}</p>
                {award.branch && award.branch.trim() !== "" && (
                  <p><strong>Branch:</strong> {award.branch}</p>
                )}
                <p><strong>Phase:</strong> {award.phase}</p>
                <p><strong>Program:</strong> {award.program}</p>
              </CardContent>
            </Card>
          ))
        ) : !loading && (
          <div className="col-span-2 text-center">No awards found</div>
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