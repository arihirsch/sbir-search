import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowRight, Search } from "lucide-react";
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
  "List topics that are currently open",
  "List all solicitations from the DOD for 2024",
  "Search for awards related to artificial intelligence",
  "Find companies in California with more than 3 awards",
  "My company manufactures optical sensors, list the relevant topics to me",
];

export default function Home() {
  const [featuredTopics, setFeaturedTopics] = useState<Topic[]>([]);
  const [featuredAwards, setFeaturedAwards] = useState<Award[]>([]);
  const [featuredCompanies, setFeaturedCompanies] = useState<Company[]>([]);
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

  // Function to determine if a topic is open based on its close date
  const isTopicOpen = (closeDate: string | null): boolean => {
    if (!closeDate) {
      console.log('No close date provided, returning true');
      return true;
    }
    
    // Use UTC methods to avoid timezone issues
    const today = new Date();
    const todayNormalized = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    const closeDateObj = new Date(closeDate);
    const closeNormalized = new Date(Date.UTC(closeDateObj.getUTCFullYear(), closeDateObj.getUTCMonth(), closeDateObj.getUTCDate()));
    
    return todayNormalized <= closeNormalized;
  };

  // Function to navigate to search results with the given query
  const navigateToSearch = (query: string) => {
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
        <div className="space-y-2">
          {/* Featured Searches Section */}
          <div>
            <h2 className="text-2xl font-bold">Trending Intelligent Searches</h2>
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
            <h2 className="text-2xl font-bold mb-6">Trending Open Topics</h2>
            {loading ? (
              <div className="text-center py-8">Loading featured topics...</div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {featuredTopics.map(topic => (
                    <Card 
                      key={topic.topic_number}
                      className="hover:shadow-lg transition-shadow"
                      href={`/topics/${encodeURIComponent(topic.topic_number)}/${topic.solicitation_id}`}
                    >
                      <CardHeader className="flex flex-row items-start justify-between">
                        <div>
                          <CardTitle>{topic.topic_title}</CardTitle>
                          <CardDescription className="mt-2">Topic #{topic.topic_number}</CardDescription>
                        </div>
                        <AgencyLogo agency={topic.branch} size="md" />
                      </CardHeader>
                      <CardContent>
                        <p><strong>Branch:</strong> {topic.branch}</p>
                        <p>
                          <strong>Status:</strong>{' '}
                          <span className={isTopicOpen(topic.topic_closed_date) ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                            {isTopicOpen(topic.topic_closed_date) ? 'Open' : 'Closed'}
                          </span>
                        </p>
                        <p><strong>Close Date:</strong> {topic.topic_closed_date ? new Date(topic.topic_closed_date).toISOString().split('T')[0] : 'Not specified'}</p>
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
            <h2 className="text-2xl font-bold mb-6">Trending Awards</h2>
            {loading ? (
              <div className="text-center py-8">Loading featured awards...</div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {featuredAwards.map(award => (
                    <Card 
                      key={award.award_link}
                      className="hover:shadow-lg transition-shadow"
                      href={`/awards/${award.award_link}`}
                    >
                      <CardHeader className="flex flex-row items-start justify-between">
                        <div>
                          <CardTitle>{award.award_title}</CardTitle>
                          <CardDescription className="mt-2">Award #{award.award_link}</CardDescription>
                        </div>
                        <AgencyLogo agency={award.agency} size="md" />
                      </CardHeader>
                      <CardContent>
                        <p><strong>Agency:</strong> {award.agency}</p>
                        <p><strong>Amount:</strong> ${award.award_amount.toLocaleString()}</p>
                        <p><strong>Phase:</strong> {award.phase}</p>
                        <p><strong>Award Date:</strong> {award.proposal_award_date ? new Date(award.proposal_award_date).toISOString().split('T')[0] : 'Not specified'}</p>
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
            <h2 className="text-2xl font-bold mb-6">Trending Companies</h2>
            {loading ? (
              <div className="text-center py-8">Loading featured companies...</div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {featuredCompanies.map(company => (
                    <Card 
                      key={company.firm_nid}
                      className="hover:shadow-lg transition-shadow"
                      href={`/companies/${company.firm_nid}`}
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
  );
} 