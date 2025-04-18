import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { parseTopic, Topic } from "@/types/topic";
import { useNavbar } from "@/contexts/NavbarContext";
import AgencyLogo from "@/components/AgencyLogo";
import posthog from 'posthog-js';
import { Loader2 } from "lucide-react";

export default function Topics() {
  const [searchParams] = useSearchParams();
  const [data, setData] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalTopics, setTotalTopics] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const pageSize = 50; // Match the backend default
  const { 
    topicFilter, 
    setTopicFilter, 
    phaseFilter, 
    setPhaseFilter,
    programFilter,
    setProgramFilter,
    agencyFilter,
    setAgencyFilter
  } = useNavbar();
  const navigate = useNavigate();

  // Get search term from URL params
  const searchTerm = searchParams.get("q") || '';

  // Sync URL filters with context on initial load
  useEffect(() => {
    const urlFilter = searchParams.get("filter");
    if (urlFilter && urlFilter !== topicFilter) {
      setTopicFilter(urlFilter);
      setCurrentPage(1); // Reset to first page when filter changes
    }
    
    const urlPhase = searchParams.get("phase");
    if (urlPhase && urlPhase !== phaseFilter) {
      setPhaseFilter(urlPhase);
      setCurrentPage(1); // Reset to first page when filter changes
    }
    
    const urlProgram = searchParams.get("program");
    if (urlProgram && urlProgram !== programFilter) {
      setProgramFilter(urlProgram);
      setCurrentPage(1); // Reset to first page when filter changes
    }
    
    const urlAgency = searchParams.get("agency");
    if (urlAgency && urlAgency !== agencyFilter) {
      setAgencyFilter(urlAgency);
      setCurrentPage(1); // Reset to first page when filter changes
    }
  }, [searchParams]);

  // Add effect to reset page when filters change
  useEffect(() => {
    // Skip the initial render
    if (topicFilter !== undefined || phaseFilter !== undefined || 
        programFilter !== undefined || agencyFilter !== undefined) {
      setCurrentPage(1);
    }
  }, [topicFilter, phaseFilter, programFilter, agencyFilter]);

  useEffect(() => {
    fetchData();
  }, [searchParams, topicFilter, phaseFilter, programFilter, agencyFilter, currentPage, searchTerm]);

  async function fetchData() {
    setLoading(true);
    try {
      // Track search initiated
      if (searchTerm) {
        posthog.capture('search_initiated', {
          search_term: searchTerm,
          search_type: 'topics',
          source: 'topics_page'
        });
      }

      // Build query parameters
      const queryParams = new URLSearchParams();
      
      // Add search query if present
      if (searchTerm) {
        queryParams.append('q', searchTerm);
      }
      
      // Add status filter if present
      if (topicFilter) {
        queryParams.append('status', topicFilter);
      }
      
      // Add phase filter if present
      if (phaseFilter) {
        queryParams.append('phase', phaseFilter);
      }
      
      // Add program filter if present
      if (programFilter) {
        queryParams.append('program', programFilter);
      }
      
      // Add agency filter if present
      if (agencyFilter) {
        queryParams.append('agency', agencyFilter);
      }
      
      // Add pagination parameters
      queryParams.append('limit', pageSize.toString());
      queryParams.append('offset', ((currentPage - 1) * pageSize).toString());
      
      // Construct the URL with query parameters
      let url = `${import.meta.env.VITE_API_BASE_URL}/topics`;
      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
      }
      
      const response = await fetch(url);
      const responseData = await response.json();
      setData(responseData.data.map(parseTopic));
      setTotalTopics(responseData.total);
      setHasMore(responseData.total > currentPage * pageSize);
      setSummary(responseData.summary);

      // Track search completed
      if (searchTerm) {
        posthog.capture('search_completed', {
          search_term: searchTerm,
          search_type: 'topics',
          result_count: responseData.total,
          source: 'topics_page'
        });
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      // Track search error
      if (searchTerm) {
        posthog.capture('search_error', {
          search_term: searchTerm,
          search_type: 'topics',
          error: error instanceof Error ? error.message : 'Unknown error',
          source: 'topics_page'
        });
      }
    } finally {
      setLoading(false);
    }
  }

  // Function to determine if a topic is open based on its close date
  const isTopicOpen = (closeDate: string | null): boolean => {
    if (!closeDate) return true; // If no close date, consider it open
    
    const today = new Date();
    const closeDateObj = new Date(closeDate);
    return today <= closeDateObj;
  };

  // Function to determine if a topic is pre-release based on its open date
  const isTopicPreRelease = (openDate: string): boolean => {
    const today = new Date();
    const todayNormalized = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    const openDateObj = new Date(openDate);
    const openNormalized = new Date(Date.UTC(openDateObj.getUTCFullYear(), openDateObj.getUTCMonth(), openDateObj.getUTCDate()));
    
    return todayNormalized < openNormalized;
  };

  // Function to get topic status text and color
  const getTopicStatus = (topic: Topic): { text: string; colorClasses: string } => {
    if (isTopicPreRelease(topic.topic_open_date)) {
      return { text: 'Pre-Release', colorClasses: 'bg-blue-100 text-blue-800' };
    }
    if (isTopicOpen(topic.topic_closed_date)) {
      return { text: 'Open', colorClasses: 'bg-green-100 text-green-800' };
    }
    return { text: 'Closed', colorClasses: 'bg-red-100 text-red-800' };
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
      <div>
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
            {totalTopics > data.length ? 
              `Showing topics ${(currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, totalTopics)} of ${totalTopics}` : 
              `Found ${totalTopics} topics`
            }
          </div>
        )}

        {/* Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {!loading && data.length > 0 ? (
            data.map(topic => (
              <Card 
                key={topic.topic_number}
                className="hover:shadow-lg transition-shadow"
                href={`/topics/${encodeURIComponent(topic.topic_number)}/${topic.solicitation_id}`}
              >
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div>
                    <CardTitle>{topic.topic_title}</CardTitle>
                    <CardDescription className="mt-2">Topic #{topic.topic_number}</CardDescription>
                  </div>
                  <div className="flex items-start gap-2">
                    <AgencyLogo agency={topic.branch} size="md" />
                    <div 
                      className={`px-3 py-1.5 mt-2 text-xs font-medium rounded-full whitespace-nowrap ${
                        getTopicStatus(topic).colorClasses
                      }`}
                    >
                      {getTopicStatus(topic).text}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {topic.branch && <p><strong>Branch:</strong> {topic.branch}</p>}
                  <p><strong>Open Date:</strong> {topic.topic_open_date ? new Date(topic.topic_open_date).toISOString().split('T')[0] : 'Not specified'}</p>
                  <p><strong>Close Date:</strong> {topic.topic_closed_date ? new Date(topic.topic_closed_date).toISOString().split('T')[0] : 'Not specified'}</p>
                </CardContent>
              </Card>
            ))
          ) : !loading && (
            <div className="col-span-2 text-center">
              No topics found
            </div>
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
      </div>
  );
} 