import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChevronDown, ChevronUp, ArrowRight, Search } from "lucide-react";
import { Topic, parseTopic } from "@/types/topic";
import { Award, parseAward } from "@/types/award";
import { Company, parseCompany } from "@/types/company";
import { useNavigate, Link } from "react-router-dom";
import AgencyLogo from "@/components/AgencyLogo";

// Configuration for featured items - just update these IDs to change what's displayed
const FEATURED_CONFIG = {
  topics: [
    { topicNumber: "A254-014", solicitationId: "1263" },
    { topicNumber: "A254-015", solicitationId: "1263" }
  ],
  awards: [
    { id: "202272" },
    { id: "207744" }
  ],
  companies: [
    { id: "12900" },
    { id: "67871" }
  ]
};

// Featured search examples
const FEATURED_SEARCHES = [
  "List all solicitations from the DOD",
  "List topics that are currently open",
  "Search for awards related to artificial intelligence",
  "Find companies in California with more than 3 awards",
];

export default function Home() {
  const [featuredTopics, setFeaturedTopics] = useState<Topic[]>([]);
  const [featuredAwards, setFeaturedAwards] = useState<Award[]>([]);
  const [featuredCompanies, setFeaturedCompanies] = useState<Company[]>([]);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Load featured data from the backend
    const fetchFeaturedData = async () => {
      setLoading(true);
      
      try {
        // Fetch featured topics
        const topicsPromises = FEATURED_CONFIG.topics.map(async ({ topicNumber, solicitationId }) => {
          const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/topics/${topicNumber}/${solicitationId}`);
          const data = await response.json();
          return parseTopic(data);
        });
        
        // Fetch featured awards
        const awardsPromises = FEATURED_CONFIG.awards.map(async ({ id }) => {
          const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/awards/${id}`);
          const data = await response.json();
          return parseAward(data);
        });
        
        // Fetch featured companies
        const companiesPromises = FEATURED_CONFIG.companies.map(async ({ id }) => {
          const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/companies/${id}`);
          const data = await response.json();
          return parseCompany(data.data);
        });
        
        // Wait for all fetches to complete
        const [topics, awards, companies] = await Promise.all([
          Promise.all(topicsPromises),
          Promise.all(awardsPromises),
          Promise.all(companiesPromises)
        ]);
        
        setFeaturedTopics(topics);
        setFeaturedAwards(awards);
        setFeaturedCompanies(companies);
      } catch (error) {
        console.error('Error fetching featured data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFeaturedData();
  }, []);

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

  // Function to navigate to search results with the given query
  const navigateToSearch = (query: string) => {
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <main className="ml-48 pt-24 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="space-y-6">
          {/* Featured Searches Section */}
          <div>
            <h2 className="text-2xl font-bold">Featured Intelligent Searches</h2>
            <Card className="mb-0 border-0 shadow-none">
              <CardContent className="p-0">
                <div className="grid grid-cols-1 gap-3">
                  {FEATURED_SEARCHES.map((query, index) => (
                    <div 
                      key={index}
                      onClick={() => navigateToSearch(query)}
                      className="flex items-center p-3 rounded-md hover:bg-gray-100 cursor-pointer transition-colors"
                    >
                      <Search className="h-5 w-5 text-gray-500 mr-3" />
                      <span>{query}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Featured Open Topics Section */}
          <div>
            <h2 className="text-2xl font-bold mb-6">Featured Open Topics</h2>
            {loading ? (
              <div className="text-center py-8">Loading featured topics...</div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {featuredTopics.map(topic => (
                    <Card 
                      key={topic.topic_number}
                      className="cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => navigate(`/topics/${encodeURIComponent(topic.topic_number)}/${topic.solicitation_id}`)}
                    >
                      <CardHeader>
                        <CardTitle>{topic.topic_title}</CardTitle>
                        <CardDescription>Topic #{topic.topic_number}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center mb-3">
                          <AgencyLogo agency={topic.branch} size="sm" className="mr-2" />
                          <p><strong>Branch:</strong> {topic.branch}</p>
                        </div>
                        <p>
                          <strong>Status:</strong>{' '}
                          <span className={isTopicOpen(topic.topic_closed_date) ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                            {isTopicOpen(topic.topic_closed_date) ? 'Open' : 'Closed'}
                          </span>
                        </p>
                        <p><strong>Close Date:</strong> {topic.topic_closed_date || 'Not specified'}</p>
                        
                        <div className="mt-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleDescription(topic.topic_number);
                            }}
                            className="flex items-center text-sm text-gray-500 hover:text-gray-700"
                          >
                            {expandedCards.has(topic.topic_number) ? (
                              <>Hide Description <ChevronUp className="ml-1 h-4 w-4" /></>
                            ) : (
                              <>Show Description <ChevronDown className="ml-1 h-4 w-4" /></>
                            )}
                          </button>
                          
                          {expandedCards.has(topic.topic_number) && (
                            <div className="mt-2 text-sm text-gray-600">
                              {topic.topic_description || "No description available"}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <div className="flex justify-end mt-4">
                  <Link to="/topics" className="text-sm font-medium flex items-center hover:underline">
                    See all topics <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* Featured Awards Section */}
          <div>
            <h2 className="text-2xl font-bold mb-6">Featured Awards</h2>
            {loading ? (
              <div className="text-center py-8">Loading featured awards...</div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {featuredAwards.map(award => (
                    <Card 
                      key={award.award_link}
                      className="cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => navigate(`/awards/${award.award_link}`)}
                    >
                      <CardHeader>
                        <CardTitle>{award.award_title}</CardTitle>
                        <CardDescription>Award #{award.award_link}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center mb-3">
                          <AgencyLogo agency={award.agency} size="sm" className="mr-2" />
                          <p><strong>Agency:</strong> {award.agency}</p>
                        </div>
                        <p><strong>Amount:</strong> ${award.award_amount.toLocaleString()}</p>
                        <p><strong>Phase:</strong> {award.phase}</p>
                        <p><strong>Award Date:</strong> {award.proposal_award_date}</p>
                        
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
                  ))}
                </div>
                <div className="flex justify-end mt-4">
                  <Link to="/awards" className="text-sm font-medium flex items-center hover:underline">
                    See all awards <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* Featured Companies Section */}
          <div>
            <h2 className="text-2xl font-bold mb-6">Featured Companies</h2>
            {loading ? (
              <div className="text-center py-8">Loading featured companies...</div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {featuredCompanies.map(company => (
                    <Card 
                      key={company.firm_nid}
                      className="cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => navigate(`/companies/${company.firm_nid}`)}
                    >
                      <CardHeader>
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
                  ))}
                </div>
                <div className="flex justify-end mt-4">
                  <Link to="/companies" className="text-sm font-medium flex items-center hover:underline">
                    See all companies <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
} 