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
};

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [sqlQuery, setSqlQuery] = useState<string>('');
  const [database, setDatabase] = useState<string>('');
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
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/llmsearch?q=${encodeURIComponent(searchTerm)}`
      );
      
      const data = await response.json();
      
      if (data.error) {
        console.error("LLM search error:", data.error);
        setResults([]);
        return;
      }
      
      // Store the SQL query and database for display
      setSqlQuery(data.sql_query || '');
      setDatabase(data.database || '');
      
      // Log SQL query and database to console instead of displaying in UI
      console.log("Database:", data.database);
      console.log("SQL Query:", data.sql_query);
      
      // Process results based on the database type
      const processedResults: SearchResult[] = [];
      
      if (data.results && Array.isArray(data.results)) {
        data.results.forEach((item: any) => {
          try {
            if (data.database === 'db1') {
              processedResults.push({
                type: 'topic',
                data: parseTopic(item)
              });
            } else if (data.database === 'db2') {
              processedResults.push({
                type: 'award',
                data: parseAward(item)
              });
            } else if (data.database === 'db3') {
              processedResults.push({
                type: 'company',
                data: parseCompany(item)
              });
            }
          } catch (e) {
            console.error("Error parsing result:", e);
          }
        });
      }
      
      setResults(processedResults);
    } catch (error) {
      console.error('Failed to fetch search results:', error);
      setResults([]);
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
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    isTopicOpen(topic.topic_closed_date) 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {isTopicOpen(topic.topic_closed_date) ? 'Open' : 'Closed'}
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
            <p className="text-gray-600">Searching...</p>
          ) : (
            <p className="text-gray-600">
              Found {results.length >= 100 ? '100+' : results.length} results for "{searchTerm}"
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-2 text-gray-600">Searching with AI...</p>
          </div>
        ) : results.length > 0 ? (
          results.map(result => renderResultCard(result))
        ) : searchTerm ? (
          <div className="col-span-2 text-center py-12">
            <p className="text-gray-600">No results found. Try a different search term.</p>
          </div>
        ) : null}
      </div>
    </main>
  );
} 