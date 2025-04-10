import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Topic, parseTopic } from "@/types/topic";
import { Award, parseAward } from "@/types/award";
import { Company, parseCompany } from "@/types/company";
import AgencyLogo from "@/components/AgencyLogo";
import posthog from 'posthog-js';

type SearchResult = {
  type: 'topic' | 'award' | 'company';
  data: Topic | Award | Company;
  similarity_score?: number;
};

type SearchResponse = {
  results: Topic[] | Award[] | Company[];
  summary: string;
  count: number;
  database?: 'db1' | 'db2' | 'db3';
};

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchResponse, setSearchResponse] = useState<SearchResponse | null>(null);
  
  // Get search term from URL params
  const searchTerm = searchParams.get("q") || '';

  useEffect(() => {
    if (searchTerm) {
      const startTime = performance.now();
      fetchResults().finally(() => {
        const duration = performance.now() - startTime;
        // Track search completed
        posthog.capture('search_completed', {
          search_term: searchTerm,
          duration_ms: Math.round(duration),
          result_count: searchResponse?.count || 0,
          has_results: (searchResponse?.count || 0) > 0,
          database: searchResponse?.database || null
        });
      });
    } else {
      setResults([]);
      setLoading(false);
    }
  }, [searchParams]);

  async function fetchResults() {
    setLoading(true);
    // Clear previous search response when starting new search
    setSearchResponse(null);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/search?q=${encodeURIComponent(searchTerm)}`);
      const data = await response.json();
      
      if (data.error) {
        console.error("Search error:", data.error);
        // Track search error
        posthog.capture('search_error', {
          search_term: searchTerm,
          error: data.error
        });
      } else {
        setSearchResponse(data);
        
        // Process results
        const processedResults: SearchResult[] = data.results.map((row: Record<string, unknown>) => {
          // Determine type based on database response
          if (data.database === 'db1') {
            return {
              type: 'topic',
              data: parseTopic(row),
            };
          } else if (data.database === 'db2') {
            return {
              type: 'award',
              data: parseAward(row),
            };
          } else if (data.database === 'db3') {
            return {
              type: 'company',
              data: parseCompany(row),
            };
          }
        });
        
        setResults(processedResults);
      }
    } catch (error) {
      console.error("Error fetching results:", error);
      // Track search failure
      posthog.capture('search_error', {
        search_term: searchTerm,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
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

  // Render different card types based on result type
  const renderResultCard = (result: SearchResult) => {
    switch (result.type) {
      case 'topic': {
        const topic = result.data as Topic;
        return (
          <Card 
            key={`topic-${topic.topic_number}`}
            className="hover:shadow-lg transition-shadow"
            href={`/topics/${encodeURIComponent(topic.topic_number)}/${topic.solicitation_id}`}
            onClick={() => handleResultClick(result)}
          >
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-sm text-blue-600 font-medium mb-1">Topic</div>
                  <CardTitle>{topic.topic_title}</CardTitle>
                </div>
                <div 
                  className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap ${
                    getTopicStatus(topic).colorClasses
                  }`}
                >
                  {getTopicStatus(topic).text}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center mb-3">
                <AgencyLogo agency={topic.branch} size="sm" className="mr-2" />
                <p><strong>Branch:</strong> {topic.branch}</p>
              </div>
              <p><strong>Topic Number:</strong> {topic.topic_number}</p>
              <p><strong>Close Date:</strong> {topic.topic_closed_date ? new Date(topic.topic_closed_date).toISOString().split('T')[0] : 'Not specified'}</p>
            </CardContent>
          </Card>
        );
      }
      
      case 'award': {
        const award = result.data as Award;
        return (
          <Card 
            key={`award-${award.award_link}`}
            className="hover:shadow-lg transition-shadow"
            href={`/awards/${award.award_link}`}
            onClick={() => handleResultClick(result)}
          >
            <CardHeader>
              <div className="text-sm text-purple-600 font-medium mb-1">Award</div>
              <CardTitle>{award.award_title}</CardTitle>
              <CardDescription>Award #{award.award_link}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center mb-3">
                <AgencyLogo agency={award.agency} size="sm" className="mr-2" />
                <p><strong>Agency:</strong> {award.agency}</p>
              </div>
              <p><strong>Company:</strong> {award.firm}</p>
              <p><strong>Amount:</strong> ${award.award_amount.toLocaleString()}</p>
              <p><strong>Phase:</strong> {award.phase}</p>
            </CardContent>
          </Card>
        );
      }
      
      case 'company': {
        const company = result.data as Company;
        return (
          <Card 
            key={`company-${company.firm_nid}`}
            className="hover:shadow-lg transition-shadow"
            href={`/companies/${company.firm_nid}`}
            onClick={() => handleResultClick(result)}
          >
            <CardHeader>
              <div className="text-sm text-green-600 font-medium mb-1">Company</div>
              <CardTitle>{company.company_name}</CardTitle>
              <CardDescription>
                {company.woman_owned === "Yes" ? "Woman-Owned Business" : 
                 company.hubzone_owned === "Yes" ? "HUBZone Business" : 
                 company.socially_economically_disadvantaged === "Yes" ? "Socially/Economically Disadvantaged" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p><strong>Location:</strong> {company.city}, {company.state}</p>
              <p><strong>Total SBIR Awards:</strong> {company.number_awards}</p>
              {company.company_url && (
                <p>
                  <strong>Website:</strong>{" "}
                  <a 
                    href={company.company_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Visit Website
                  </a>
                </p>
              )}
            </CardContent>
          </Card>
        );
      }
      
      default:
        return null;
    }
  };

  // Also track when users click on results
  const handleResultClick = (result: SearchResult) => {
    posthog.capture('search_result_click', {
      search_term: searchTerm,
      result_type: result.type,
      result_id: result.type === 'topic' ? (result.data as Topic).topic_number :
                result.type === 'award' ? (result.data as Award).award_link :
                (result.data as Company).firm_nid
    });
  };

  return (
    <main>
      {searchTerm && (
        <div className="text-center mb-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-2"></div>
              <p className="text-gray-600 dark:text-gray-200">Searching with AI...</p>
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-200">
              Found {searchResponse?.count !== undefined && searchResponse.count >= 100 ? "100+" : searchResponse?.count || 0} results for &quot;{searchTerm}&quot;
            </p>
          )}
        </div>
      )}

      {/* AI Summary */}
      {searchResponse?.summary && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Search Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-200">{searchResponse.summary}</p>
          </CardContent>
        </Card>
      )}

      {/* Search Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {!loading && results.length > 0 ? (
          results.map(result => renderResultCard(result))
        ) : !loading && searchTerm ? (
          <div className="col-span-2 text-center py-12">
            <p className="text-gray-600 dark:text-gray-200">No results found. Try a different search term.</p>
          </div>
        ) : null}
      </div>
    </main>
  );
} 