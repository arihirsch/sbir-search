import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Topic, parseTopic } from "@/types/topic";
import { Award, parseAward } from "@/types/award";
import { Company, parseCompany } from "@/types/company";
import AgencyLogo from "@/components/AgencyLogo";
import posthog from 'posthog-js';
import { useNavbar } from "@/contexts/NavbarContext";

type SearchResult = {
  topic: string;
  data: Topic;
};

type SearchResponse = {
  data: Topic[];
  summary: string;
  total: number;
  limit: number;
  offset: number;
};

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const searchTerm = searchParams.get('q') || '';
  const searchType = searchParams.get('type') || 'topics';
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchResponse, setSearchResponse] = useState<SearchResponse | null>(null);
  const { topicFilter, phaseFilter, programFilter, agencyFilter } = useNavbar();

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        posthog.capture('search_initiated', {
          search_term: searchTerm,
          search_type: searchType,
          source: 'search_results'
        });

        const params = new URLSearchParams();
        if (searchTerm) params.append('search_query', searchTerm);
        if (topicFilter) params.append('status', topicFilter);
        if (phaseFilter) params.append('phase', phaseFilter);
        if (programFilter) params.append('program', programFilter);
        if (agencyFilter) params.append('agency', agencyFilter);

        const response = await fetch(`/api/topics?${params.toString()}`);
        const data = await response.json();

        setSearchResponse(data);
        setResults(
          data.data.map((topic: Topic) => ({
            topic: topic.title,
            data: topic
          }))
        );

        posthog.capture('search_completed', {
          search_term: searchTerm,
          search_type: searchType,
          result_count: data.total,
          source: 'search_results'
        });
      } catch (error) {
        console.error('Error fetching search results:', error);
        posthog.capture('search_error', {
          search_term: searchTerm,
          search_type: searchType,
          error: error instanceof Error ? error.message : 'Unknown error',
          source: 'search_results'
        });
      } finally {
        setLoading(false);
      }
    };

    if (searchTerm) {
      fetchResults();
    }
  }, [searchTerm, searchType, topicFilter, phaseFilter, programFilter, agencyFilter]);

  const getStatus = (topic: Topic) => {
    const now = new Date();
    const openDate = new Date(topic.open_date);
    const closeDate = new Date(topic.close_date);
    if (now < openDate) return 'Upcoming';
    if (now > closeDate) return 'Closed';
    return 'Open';
  };

  const handleResultClick = (result: SearchResult) => {
    posthog.capture('result_clicked', {
      search_term: searchTerm,
      search_type: searchType,
      result_id: result.data.id,
      result_type: 'topic',
      source: 'search_results'
    });
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Search Results</h1>
      {searchResponse?.summary && (
        <div className="mb-4 p-4 bg-gray-100 rounded">
          <p>{searchResponse.summary}</p>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {results.map((result) => (
          <Card key={result.data.id} onClick={() => handleResultClick(result)} className="cursor-pointer">
            <CardHeader>
              <CardTitle>{result.topic}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Status: {getStatus(result.data)}</p>
              <p>Phase: {result.data.phase}</p>
              <p>Program: {result.data.program}</p>
              <p>Agency: {result.data.agency}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      {searchResponse && (
        <div className="mt-4">
          <p>Showing {results.length} of {searchResponse.total} results</p>
        </div>
      )}
    </div>
  );
} 