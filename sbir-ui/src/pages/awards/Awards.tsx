import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Award, parseAward } from "@/types/award";
import { useNavbar } from "@/contexts/NavbarContext";
import { Button } from "@/components/ui/button";

export default function Awards() {
  const [searchParams] = useSearchParams();
  const [data, setData] = useState<Award[]>([]);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [totalAwards, setTotalAwards] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
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
  }, [searchParams, awardAgencyFilter, awardProgramFilter, awardPhaseFilter, awardYearFilter, awardAmountRange, isAmountRangeActive, currentPage]);

  async function fetchData() {
    setLoading(true);
    try {
      // Build query parameters
      const queryParams = new URLSearchParams();
      
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
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }

  const toggleDescription = (id: string) => {
    setExpandedCards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

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
      <div className="text-center mb-8 text-gray-600">
        {loading ? (
          "Loading awards..."
        ) : (
          totalAwards > data.length ? 
          `Showing awards ${(currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, totalAwards)} of ${totalAwards}` : 
          `Found ${totalAwards} awards`
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 text-center">Loading...</div>
        ) : data.length > 0 ? (
          data.map((award) => (
            <Card 
              key={award.award_link}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate(`/awards/${award.award_link}`)}
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

                <div className="mt-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleDescription(award.award_link.toString());
                    }}
                    className="flex items-center text-sm text-gray-500 hover:text-gray-700"
                  >
                    {expandedCards.has(award.award_link.toString()) ? (
                      <>Hide Abstract <ChevronUp className="ml-1 h-4 w-4" /></>
                    ) : (
                      <>Show Abstract <ChevronDown className="ml-1 h-4 w-4" /></>
                    )}
                  </button>
                  
                  {expandedCards.has(award.award_link.toString()) && (
                    <div className="mt-2 text-sm text-gray-600">
                      {award.abstract || "No abstract available"}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
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