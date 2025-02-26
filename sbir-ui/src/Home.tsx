import { useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { parseTopic, Topic } from "@/types/topic";
import { parseAward, Award } from "@/types/award";
import { parseCompany, Company } from "@/types/company";
import { ChevronDown, ChevronUp, Check } from "lucide-react";

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
      
      switch (viewType) {
        case 'topics':
          setData(responseData.data.map(parseTopic));
          break;
        case 'awards':
          setData(responseData.data.map(parseAward));
          break;
        case 'companies':
          setData(responseData.data.map(parseCompany));
          break;
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function searchData(formData: FormData) {
    const searchTermValue = formData.get("searchTerm") as string;
    setSearchTerm(searchTermValue);
    if (!searchTermValue || searchTermValue === "") {
      await fetchData();
      return;
    }
    setLoading(true);
    try {
      let url = `${import.meta.env.VITE_API_BASE_URL}/${viewType}/search?q=${searchTermValue}`;
      const response = await fetch(url);
      const data = await response.json();
      setData(data.data.map(parseTopic));
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

  function renderCard(item: DataType) {
    if ('topic_number' in item) { // Topic
      return (
        <Card key={item.topic_number}>
          <CardHeader>
            <CardTitle>{item.topic_title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p><strong>Topic Number:</strong> {item.topic_number}</p>
            <p><strong>Branch:</strong> {item.branch}</p>
            <p><strong>Open Date:</strong> {item.topic_open_date}</p>
            <p><strong>Close Date:</strong> {item.topic_closed_date || 'Not specified'}</p>
            
            <div className="mt-4">
              <button
                onClick={() => toggleDescription(item.topic_number.toString())}
                className="flex items-center text-sm text-gray-500 hover:text-gray-700"
              >
                {expandedCards.has(item.topic_number.toString()) ? (
                  <>Hide Description <ChevronUp className="ml-1 h-4 w-4" /></>
                ) : (
                  <>Show Description <ChevronDown className="ml-1 h-4 w-4" /></>
                )}
              </button>
              
              {expandedCards.has(item.topic_number.toString()) && (
                <div className="mt-2 text-sm text-gray-600">
                  {item.topic_description || "No description available"}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      );
    } else if ('award_link' in item) { // Award
      return (
        <Card key={item.award_link}>
          <CardHeader>
            <CardTitle>{item.award_title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p><strong>Company:</strong> {item.firm}</p>
            <p><strong>Agency:</strong> {item.agency}</p>
            <p><strong>Phase:</strong> {item.phase}</p>
            <p><strong>Amount:</strong> ${item.award_amount.toLocaleString()}</p>
            <p><strong>Year:</strong> {item.award_year}</p>
            
            <div className="mt-4">
              <button
                onClick={() => toggleDescription(item.award_link.toString())}
                className="flex items-center text-sm text-gray-500 hover:text-gray-700"
              >
                {expandedCards.has(item.award_link.toString()) ? (
                  <>Hide Abstract <ChevronUp className="ml-1 h-4 w-4" /></>
                ) : (
                  <>Show Abstract <ChevronDown className="ml-1 h-4 w-4" /></>
                )}
              </button>
              
              {expandedCards.has(item.award_link.toString()) && (
                <div className="mt-2 text-sm text-gray-600">
                  {item.abstract || "No abstract available"}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      );
    } else { // Company
      return (
        <Card key={item.firm_nid}>
          <CardHeader>
            <CardTitle>{item.company_name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p><strong>Location:</strong> {item.city}, {item.state}</p>
            <p><strong>Number of Awards:</strong> {item.number_awards}</p>
            {item.hubzone_owned && (
              <p><strong>HUBZone:</strong> {item.hubzone_owned}</p>
            )}
            {item.woman_owned && (
              <p><strong>Woman-Owned:</strong> {item.woman_owned}</p>
            )}
            {item.company_url && (
              <p>
                <strong>Website:</strong>{' '}
                <a 
                  href={item.company_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-700"
                >
                  {item.company_url}
                </a>
              </p>
            )}
          </CardContent>
        </Card>
      );
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Fixed Sidebar */}
      <div className="fixed left-0 top-0 h-screen w-48 bg-gray-100 p-4 flex flex-col gap-2">
        {['topics', 'awards', 'companies'].map((type) => (
          <Button
            key={type}
            variant={viewType === type ? 'default' : 'outline'}
            className="w-full justify-start"
            onClick={() => handleViewTypeChange(type as ViewType)}
          >
            {viewType === type && <Check className="mr-2 h-4 w-4" />}
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </Button>
        ))}
        
        {viewType === 'topics' && (
          <div className="mt-2">
            {['open', 'closed'].map((filter) => (
              <Button
                key={filter}
                variant={topicFilter === filter ? 'default' : 'outline'}
                className="w-full justify-start mb-2"
                onClick={() => setTopicFilter(filter as TopicFilter)}
              >
                {topicFilter === filter && <Check className="mr-2 h-4 w-4" />}
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Main Content */}
      <main className="flex-1 ml-48 p-24">
        <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
          <h1 className="text-4xl font-bold text-center mb-8">SBIR Search</h1>

          <form
            action={searchData}
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
              "Counting results..."
            ) : (
              `Found ${data.length} ${viewType}`
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
            {loading ? (
              <div className="col-span-2 text-center">Loading...</div>
            ) : data.length > 0 ? (
              data.map(renderCard)
            ) : (
              <div className="col-span-2 text-center">
                No {viewType} found
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
