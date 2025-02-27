import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Topic } from "@/types/topic";
import { Award } from "@/types/award";
import { Company } from "@/types/company";

type ViewType = 'topics' | 'awards' | 'companies';
type TopicFilter = 'open' | 'closed';
type DataType = Topic | Award | Company;

export default function Home() {
  const [data, setData] = useState<DataType[]>([]);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [viewType, setViewType] = useState<ViewType>('topics');
  const [topicFilter, setTopicFilter] = useState<TopicFilter>('open');
  const [searchTerm, setSearchTerm] = useState('');

  const handleViewTypeChange = (type: ViewType) => {
    setViewType(type);
    setSearchTerm('');
    if (type === 'topics') {
      setTopicFilter(topicFilter);
    }
  };

  useEffect(() => {
    if (!searchTerm) {
      fetchData();
    }
  }, [viewType, topicFilter, searchTerm]);

  async function fetchData() {
    setLoading(true);
    try {
      let url = `${import.meta.env.VITE_API_BASE_URL}/`;
      switch (viewType) {
        case 'topics':
          url += `topics/${topicFilter}`;
          break;
        case 'awards':
          url += 'awards';
          break;
        case 'companies':
          url += 'companies';
          break;
      }
      const response = await fetch(url);
      const responseData = await response.json();
      setData(responseData.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(formData: FormData) {
    const searchTermValue = formData.get("searchTerm") as string;
    setSearchTerm(searchTermValue);

    if (!searchTermValue) {
      fetchData();
      return;
    }

    setLoading(true);
    try {
      const url = `${import.meta.env.VITE_API_BASE_URL}/${viewType}/search?q=${searchTermValue}`;
      const response = await fetch(url);
      const responseData = await response.json();
      setData(responseData.data);
    } catch (error) {
      console.error('Failed to search:', error);
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
    <main className="ml-48 p-24">
      <div className="max-w-5xl mx-auto">
        {viewType === 'topics' && (
          <div className="flex gap-4 mb-8">
            <Button
              variant={topicFilter === 'open' ? 'default' : 'outline'}
              onClick={() => setTopicFilter('open')}
            >
              Open Topics
            </Button>
            <Button
              variant={topicFilter === 'closed' ? 'default' : 'outline'}
              onClick={() => setTopicFilter('closed')}
            >
              Closed Topics
            </Button>
          </div>
        )}

        <form
          action={handleSearch}
          className="flex w-full max-w-xl mx-auto mb-8"
        >
          <Input
            type="search"
            name="searchTerm"
            placeholder={`Search ${viewType}...`}
            className="flex-grow mr-2"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button type="submit">Search</Button>
        </form>

        <div className="text-center mb-8 text-gray-600">
          {loading ? (
            `Loading ${viewType}...`
          ) : (
            `Found ${data.length} ${viewType}`
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {loading ? (
            <div className="col-span-2 text-center">Loading...</div>
          ) : data.length > 0 ? (
            data.map((item: any) => (
              <Card key={item.id || item.topic_number || item.award_link || item.firm_nid}>
                <CardHeader>
                  <CardTitle>
                    {item.topic_title || item.award_title || item.company_name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {viewType === 'topics' && (
                    <>
                      <p><strong>Topic Number:</strong> {item.topic_number}</p>
                      <p><strong>Branch:</strong> {item.branch}</p>
                      <p><strong>Open Date:</strong> {item.topic_open_date}</p>
                      <p><strong>Close Date:</strong> {item.topic_closed_date || 'Not specified'}</p>
                    </>
                  )}

                  {viewType === 'awards' && (
                    <>
                      <p><strong>Company:</strong> {item.firm}</p>
                      <p><strong>Amount:</strong> ${item.award_amount?.toLocaleString()}</p>
                      <p><strong>Year:</strong> {item.award_year}</p>
                    </>
                  )}

                  {viewType === 'companies' && (
                    <>
                      <p><strong>Location:</strong> {item.city}, {item.state}</p>
                      <p><strong>Awards:</strong> {item.number_awards}</p>
                      {item.company_url && (
                        <p><strong>Website:</strong> <a href={item.company_url} target="_blank" rel="noopener noreferrer">{item.company_url}</a></p>
                      )}
                    </>
                  )}

                  {(viewType === 'topics' || viewType === 'awards') && (
                    <div className="mt-4">
                      <button
                        onClick={() => toggleDescription(item.topic_number || item.award_link)}
                        className="flex items-center text-sm text-gray-500 hover:text-gray-700"
                      >
                        {expandedCards.has(item.topic_number || item.award_link) ? (
                          <>Hide Description <ChevronUp className="ml-1 h-4 w-4" /></>
                        ) : (
                          <>Show Description <ChevronDown className="ml-1 h-4 w-4" /></>
                        )}
                      </button>
                      
                      {expandedCards.has(item.topic_number || item.award_link) && (
                        <div className="mt-2 text-sm text-gray-600">
                          {item.topic_description || item.abstract || "No description available"}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-2 text-center">
              No {viewType} found
            </div>
          )}
        </div>
      </div>
    </main>
  );
} 