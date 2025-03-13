import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Award, parseAward } from "@/types/award";
import { useNavbar } from "@/contexts/NavbarContext";

export default function Awards() {
  const [searchParams] = useSearchParams();
  const [data, setData] = useState<Award[]>([]);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const { 
    awardAgencyFilter, 
    setAwardAgencyFilter,
    awardProgramFilter,
    setAwardProgramFilter,
    awardPhaseFilter,
    setAwardPhaseFilter,
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
    }
    
    const urlProgram = searchParams.get("program");
    if (urlProgram && urlProgram !== awardProgramFilter) {
      setAwardProgramFilter(urlProgram);
    }
    
    const urlPhase = searchParams.get("phase");
    if (urlPhase && urlPhase !== awardPhaseFilter) {
      setAwardPhaseFilter(urlPhase);
    }
    
    const urlMinAmount = searchParams.get("minAmount");
    const urlMaxAmount = searchParams.get("maxAmount");
    if (urlMinAmount && urlMaxAmount) {
      const minAmount = parseInt(urlMinAmount);
      const maxAmount = parseInt(urlMaxAmount);
      setAwardAmountRange([minAmount, maxAmount]);
      setIsAmountRangeActive(true);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [searchParams, awardAgencyFilter, awardProgramFilter, awardPhaseFilter, awardAmountRange, isAmountRangeActive]);

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
      
      // Add amount range filter if active
      if (isAmountRangeActive) {
        queryParams.append('minAmount', awardAmountRange[0].toString());
        queryParams.append('maxAmount', awardAmountRange[1].toString());
      }
      
      // Construct the URL with query parameters
      let url = `${import.meta.env.VITE_API_BASE_URL}/awards`;
      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
      }
      
      const response = await fetch(url);
      const responseData = await response.json();
      setData(responseData.data.map(parseAward));
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

  return (
    <main>
      <div className="text-center mb-8 text-gray-600">
        {loading ? "Loading awards..." : `Found ${data.length} awards`}
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
                <p><strong>Branch:</strong> {award.branch}</p>
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
    </main>
  );
} 