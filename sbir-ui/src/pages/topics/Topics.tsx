import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { parseTopic, Topic } from "@/types/topic";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useNavbar } from "@/contexts/NavbarContext";

export default function Topics() {
  const [searchParams] = useSearchParams();
  const [data, setData] = useState<Topic[]>([]);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const { topicFilter, setTopicFilter, phaseFilter, setPhaseFilter } = useNavbar();
  const navigate = useNavigate();

  // Sync URL filters with context on initial load
  useEffect(() => {
    const urlFilter = searchParams.get("filter");
    if (urlFilter && urlFilter !== topicFilter) {
      setTopicFilter(urlFilter);
    }
    
    const urlPhase = searchParams.get("phase");
    if (urlPhase && urlPhase !== phaseFilter) {
      setPhaseFilter(urlPhase);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [searchParams, topicFilter, phaseFilter]);

  async function fetchData() {
    setLoading(true);
    try {
      // Build query parameters
      const queryParams = new URLSearchParams();
      
      // Add status filter if present
      if (topicFilter) {
        queryParams.append('status', topicFilter);
      }
      
      // Add phase filter if present
      if (phaseFilter) {
        queryParams.append('phase', phaseFilter);
      }
      
      // Construct the URL with query parameters
      let url = `${import.meta.env.VITE_API_BASE_URL}/topics`;
      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
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

  return (
      <div>
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
                onClick={() => navigate(`/topics/${encodeURIComponent(topic.topic_number)}/${topic.solicitation_id}`)}
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle>{topic.topic_title}</CardTitle>
                  <div 
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      isTopicOpen(topic.topic_closed_date) 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {isTopicOpen(topic.topic_closed_date) ? 'Open' : 'Closed'}
                  </div>
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
  );
} 