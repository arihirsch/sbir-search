import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Topic, parseTopic } from "@/types/topic";
import { Award, parseAward } from "@/types/award";
import { Company, parseCompany } from "@/types/company";
import AgencyLogo from "@/components/AgencyLogo";

type SearchResult = {
  type: 'topic' | 'award' | 'company';
  data: Topic | Award | Company;
  similarity_score?: number;
};

type VectorSearchResponse = {
  topics: {
    results: Topic[];
    summary: string;
  };
  awards: {
    results: Award[];
    summary: string;
  };
};

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [sqlQuery, setSqlQuery] = useState<string>('');
  const [database, setDatabase] = useState<string>('');
  const [vectorResults, setVectorResults] = useState<VectorSearchResponse | null>(null);
  const navigate = useNavigate();
  
  // Get search term from URL params
  const searchTerm = searchParams.get("q") || '';

  useEffect(() => {
    if (searchTerm) {
      fetchResults();
    } else {
      setResults([]);
      setLoading(false);
    }
  }, [searchParams]);

  async function fetchResults() {
    setLoading(true);
    try {
      // Fetch both traditional and vector search results
      const [llmResponse, vectorResponse] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_BASE_URL}/llmsearch?q=${encodeURIComponent(searchTerm)}`),
        fetch(`${import.meta.env.VITE_API_BASE_URL}/vectorsearch?q=${encodeURIComponent(searchTerm)}`)
      ]);
      
      const llmData = await llmResponse.json();
      const vectorData = await vectorResponse.json();
      
      if (llmData.error) {
        console.error("LLM search error:", llmData.error);
      } else {
        // Store the SQL query and database for display
        setSqlQuery(llmData.sql_query || '');
        setDatabase(llmData.database || '');
        
        // Process traditional search results
        const processedResults: SearchResult[] = [];
        if (llmData.results) {
          for (const row of llmData.results) {
            if (llmData.database === 'db1') {
              processedResults.push({
                type: 'topic',
                data: parseTopic(row)
              });
            } else if (llmData.database === 'db2') {
              processedResults.push({
                type: 'award',
                data: parseAward(row)
              });
            } else if (llmData.database === 'db3') {
              processedResults.push({
                type: 'company',
                data: parseCompany(row)
              });
            }
          }
        }
        setResults(processedResults);
      }
      
      if (vectorData.error) {
        console.error("Vector search error:", vectorData.error);
      } else {
        setVectorResults(vectorData);
      }
      
    } catch (error) {
      console.error("Error fetching results:", error);
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
              Found {results.length >= 100 ? '100+' : results.length} results for &quot;{searchTerm}&quot;
            </p>
          )}
        </div>
      )}

      {/* Vector Search Results */}
      {vectorResults && (
        <div className="mb-8">
          {/* AI Summary */}
          {vectorResults.topics?.summary && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Related Topics Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-200">{vectorResults.topics.summary}</p>
              </CardContent>
            </Card>
          )}
          
          {/* Vector Search Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {vectorResults.topics?.results?.map((topic) => (
              renderResultCard({
                type: 'topic',
                data: topic
              })
            ))}
          </div>
        </div>
      )}

      {/* Separator */}
      {vectorResults && results.length > 0 && (
        <div className="my-8 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center -mt-3">
            <span className="bg-white dark:bg-gray-900 px-4 text-sm text-gray-500">LLM Search Results</span>
          </div>
        </div>
      )}

      {/* LLM Search Results */}
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