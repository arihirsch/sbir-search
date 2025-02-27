import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { parseTopic, Topic } from "@/types/topic";
import { ChevronDown, ChevronUp } from "lucide-react";

type TopicFilter = 'open' | 'closed';

export default function Topics() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState<Topic[]>([]);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || '');
  const topicFilter = (searchParams.get("filter") as TopicFilter) || 'open';
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, [searchParams]);

  async function fetchData() {
    setLoading(true);
    try {
      let url = `${import.meta.env.VITE_API_BASE_URL}/topics/${topicFilter}`;
      if (searchTerm) {
        url = `${import.meta.env.VITE_API_BASE_URL}/topics/search?q=${searchTerm}`;
      }
      const response = await fetch(url);
      const responseData = await response.json();
      setData(responseData.data.map(parseTopic));
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(formData: FormData) {
    const searchTermValue = formData.get("searchTerm") as string;
    setSearchTerm(searchTermValue);
    setSearchParams(params => {
      if (searchTermValue) {
        params.set("q", searchTermValue);
      } else {
        params.delete("q");
      }
      return params;
    });
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
    <main className="ml-48 pt-24 p-8">
      <div className="max-w-5xl mx-auto">
        <form
          action={handleSearch}
          className="flex w-full max-w-xl mx-auto mb-8"
        >
          <Input
            type="search"
            name="searchTerm"
            placeholder="Search topics..."
            className="flex-grow mr-2"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button type="submit">Search</Button>
        </form>

        <div className="text-center mb-8 text-gray-600">
          {loading ? (
            "Loading topics..."
          ) : (
            `Found ${data.length} topics`
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {loading ? (
            <div className="col-span-2 text-center">Loading...</div>
          ) : data.length > 0 ? (
            data.map(topic => (
              <Card 
                key={topic.topic_number}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(`/topics/${topic.topic_number}`)}
              >
                <CardHeader>
                  <CardTitle>{topic.topic_title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p><strong>Topic Number:</strong> {topic.topic_number}</p>
                  <p><strong>Branch:</strong> {topic.branch}</p>
                  <p><strong>Open Date:</strong> {topic.topic_open_date}</p>
                  <p><strong>Close Date:</strong> {topic.topic_closed_date || 'Not specified'}</p>
                  
                  <div className="mt-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleDescription(topic.topic_number.toString());
                      }}
                      className="flex items-center text-sm text-gray-500 hover:text-gray-700"
                    >
                      {expandedCards.has(topic.topic_number.toString()) ? (
                        <>Hide Description <ChevronUp className="ml-1 h-4 w-4" /></>
                      ) : (
                        <>Show Description <ChevronDown className="ml-1 h-4 w-4" /></>
                      )}
                    </button>
                    
                    {expandedCards.has(topic.topic_number.toString()) && (
                      <div className="mt-2 text-sm text-gray-600">
                        {topic.topic_description || "No description available"}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-2 text-center">
              No topics found
            </div>
          )}
        </div>
      </div>
    </main>
  );
} 