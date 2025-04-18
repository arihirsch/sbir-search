import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from './ui/select';
import { Slider } from './ui/slider';
import { useNavbar } from '../contexts/NavbarContext';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { 
    topicFilter, 
    setTopicFilter, 
    phaseFilter, 
    setPhaseFilter,
    programFilter,
    setProgramFilter,
    agencyFilter,
    setAgencyFilter,
    awardAgencyFilter,
    setAwardAgencyFilter,
    awardProgramFilter,
    setAwardProgramFilter,
    awardPhaseFilter,
    setAwardPhaseFilter,
    awardYearFilter,
    setAwardYearFilter,
    awardAmountRange,
    setAwardAmountRange,
    isAmountRangeActive,
    setIsAmountRangeActive,
    currentSection,
    setCurrentSection,
    topicYearFilter,
    setTopicYearFilter,
    companyStateFilter,
    setCompanyStateFilter,
    companyAwardsRange,
    setCompanyAwardsRange,
    isAwardsRangeActive,
    setIsAwardsRangeActive
  } = useNavbar();
  
  // Local state for slider value before committing
  const [localAmountRange, setLocalAmountRange] = useState<number[]>(awardAmountRange);
  
  // Local state for company awards slider value
  const [localAwardsRange, setLocalAwardsRange] = useState<number[]>(companyAwardsRange);
  
  const isTopicsRoute = location.pathname.startsWith('/topics');
  const isAwardsRoute = location.pathname.startsWith('/awards');
  const isCompaniesRoute = location.pathname.startsWith('/companies');
  
  // Update currentSection based on route
  useEffect(() => {
    if (isTopicsRoute) {
      setCurrentSection('topics');
    } else if (isAwardsRoute) {
      setCurrentSection('awards');
    } else if (isCompaniesRoute) {
      setCurrentSection('companies');
    }
  }, [isTopicsRoute, isAwardsRoute, isCompaniesRoute, setCurrentSection]);
  
  // Update company filters from URL parameters
  useEffect(() => {
    if (isCompaniesRoute) {
      const state = searchParams.get('state');
      const minAwards = searchParams.get('minAwards');
      
      if (state) {
        setCompanyStateFilter(state);
      }
      
      if (minAwards) {
        const min = parseInt(minAwards, 10);
        if (!isNaN(min)) {
          setCompanyAwardsRange([min, 500]);
          setLocalAwardsRange([min, 500]);
          setIsAwardsRangeActive(true);
        }
      }
    }
  }, [isCompaniesRoute, searchParams, setCompanyStateFilter, setCompanyAwardsRange, setIsAwardsRangeActive]);
  
  // Format currency for display
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  const handleSectionChange = (value: string) => {
    setCurrentSection(value);
    // Get the current search term from URL
    const searchTerm = searchParams.get('q');
    // Navigate to the new section, preserving the search term if it exists
    navigate(`/${value}${searchTerm ? `?q=${searchTerm}` : ''}`);
  };
  
  const handleFilterChange = (value: string) => {
    setTopicFilter(value);
    
    // Also update URL params when on the main topics page
    if (location.pathname === '/topics') {
      setSearchParams(params => {
        if (value) {
          params.set("filter", value);
        } else {
          params.delete("filter");
        }
        return params;
      });
    }
  };
  
  const handlePhaseChange = (value: string) => {
    setPhaseFilter(value);
    
    // Also update URL params when on the main topics page
    if (location.pathname === '/topics') {
      setSearchParams(params => {
        if (value) {
          params.set("phase", value);
        } else {
          params.delete("phase");
        }
        return params;
      });
    }
  };
  
  const handleProgramChange = (value: string) => {
    setProgramFilter(value);
    
    // Also update URL params when on the main topics page
    if (location.pathname === '/topics') {
      setSearchParams(params => {
        if (value) {
          params.set("program", value);
        } else {
          params.delete("program");
        }
        return params;
      });
    }
  };
  
  const handleAgencyChange = (value: string) => {
    setAgencyFilter(value);
    
    // Also update URL params when on the main topics page
    if (location.pathname === '/topics') {
      setSearchParams(params => {
        if (value) {
          params.set("agency", value);
        } else {
          params.delete("agency");
        }
        return params;
      });
    }
  };
  
  const handleAwardAgencyChange = (value: string) => {
    setAwardAgencyFilter(value);
    
    // Also update URL params when on the main awards page
    if (location.pathname === '/awards') {
      setSearchParams(params => {
        if (value) {
          params.set("agency", value);
        } else {
          params.delete("agency");
        }
        return params;
      });
    }
  };
  
  const handleAwardProgramChange = (value: string) => {
    setAwardProgramFilter(value);
    
    // Also update URL params when on the main awards page
    if (location.pathname === '/awards') {
      setSearchParams(params => {
        if (value) {
          params.set("program", value);
        } else {
          params.delete("program");
        }
        return params;
      });
    }
  };
  
  const handleAwardPhaseChange = (value: string) => {
    setAwardPhaseFilter(value);
    
    // Also update URL params when on the main awards page
    if (location.pathname === '/awards') {
      setSearchParams(params => {
        if (value) {
          params.set("phase", value);
        } else {
          params.delete("phase");
        }
        return params;
      });
    }
  };
  
  const handleAwardYearChange = (value: string) => {
    setAwardYearFilter(value);
    
    // Also update URL params when on the main awards page
    if (location.pathname === '/awards') {
      setSearchParams(params => {
        if (value) {
          params.set("year", value);
        } else {
          params.delete("year");
        }
        return params;
      });
    }
  };
  
  const handleAmountRangeChange = (value: number[]) => {
    setLocalAmountRange(value);
  };
  
  const handleAmountRangeCommit = (value: number[]) => {
    setAwardAmountRange(value);
    setIsAmountRangeActive(true);
    
    // Also update URL params when on the main awards page
    if (location.pathname === '/awards') {
      setSearchParams(params => {
        params.set("minAmount", value[0].toString());
        params.set("maxAmount", value[1].toString());
        return params;
      });
    }
  };
  
  const handleResetAmountRange = () => {
    const defaultRange = [0, 2500000];
    setAwardAmountRange(defaultRange);
    setLocalAmountRange(defaultRange);
    setIsAmountRangeActive(false);
    
    // Also update URL params when on the main awards page
    if (location.pathname === '/awards') {
      setSearchParams(params => {
        params.delete("minAmount");
        params.delete("maxAmount");
        return params;
      });
    }
  };
  
  const handleTopicYearChange = (value: string) => {
    setTopicYearFilter(value);
    
    // Also update URL params when on the main topics page
    if (location.pathname === '/topics') {
      setSearchParams(params => {
        if (value) {
          params.set("year", value);
        } else {
          params.delete("year");
        }
        return params;
      });
    }
  };
  
  const handleCompanyStateChange = (value: string) => {
    setCompanyStateFilter(value);
    
    // Also update URL params when on the main companies page
    if (location.pathname === '/companies') {
      setSearchParams(params => {
        if (value) {
          params.set("state", value);
        } else {
          params.delete("state");
        }
        return params;
      });
    }
  };
  
  const handleAwardsRangeChange = (value: number[]) => {
    setLocalAwardsRange(value);
  };
  
  const handleAwardsRangeCommit = (value: number[]) => {
    setCompanyAwardsRange(value);
    setIsAwardsRangeActive(true);
    
    // Also update URL params when on the main companies page
    if (location.pathname === '/companies') {
      setSearchParams(params => {
        params.set("minAwards", value[0].toString());
        params.set("maxAwards", value[1].toString());
        return params;
      });
    }
  };
  
  const handleResetAwardsRange = () => {
    const defaultRange = [0, 500];
    setCompanyAwardsRange(defaultRange);
    setLocalAwardsRange(defaultRange);
    setIsAwardsRangeActive(false);
    
    // Also update URL params when on the main companies page
    if (location.pathname === '/companies') {
      setSearchParams(params => {
        params.delete("minAwards");
        params.delete("maxAwards");
        return params;
      });
    }
  };
  
  return (
    <div className="fixed top-14 left-0 right-0 h-14 bg-background z-40">
      <div className="max-w-7xl mx-auto px-4 h-full border-b border-gray-200 dark:border-gray-700">
        {/* Scrollable container for mobile */}
        <div className="h-full overflow-x-auto scrollbar-hide">
          <div className="h-full flex items-center justify-between min-w-max">
            {/* Left side with main navigation and filters */}
            <div className="flex items-center">
              <Select value={currentSection} onValueChange={handleSectionChange}>
                <SelectTrigger className="w-36 text-sm bg-background">
                  <SelectValue placeholder="Category..." />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-black">
                  <SelectItem value="topics">Topics</SelectItem>
                  <SelectItem value="awards">Awards</SelectItem>
                  <SelectItem value="companies">Companies</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Topic filters - shown inline when on topics route */}
              {isTopicsRoute && (
                <>
                  <div className="ml-4">
                    <Select value={topicFilter} onValueChange={handleFilterChange}>
                      <SelectTrigger className="min-w-[8rem] text-sm bg-background">
                        <SelectValue placeholder="Status..." />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-black">
                        <SelectItem value="prerelease">Pre-Release</SelectItem>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="ml-4">
                    <Select value={phaseFilter} onValueChange={handlePhaseChange}>
                      <SelectTrigger className="w-32 text-sm bg-background">
                        <SelectValue placeholder="Phase..." />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-black">
                        <SelectItem value="phase1">Phase I</SelectItem>
                        <SelectItem value="phase2">Phase II</SelectItem>
                        <SelectItem value="both">Both</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="ml-4">
                    <Select value={programFilter} onValueChange={handleProgramChange}>
                      <SelectTrigger className="w-32 text-sm bg-background">
                        <SelectValue placeholder="Program..." />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-black">
                        <SelectItem value="sbir">SBIR</SelectItem>
                        <SelectItem value="sttr">STTR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="ml-4">
                    <Select value={agencyFilter} onValueChange={handleAgencyChange}>
                      <SelectTrigger className="w-32 text-sm bg-background">
                        <SelectValue placeholder="Agency..." />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-black max-h-60">
                        <SelectItem value="HHS">HHS</SelectItem>
                        <SelectItem value="DOD">DOD</SelectItem>
                        <SelectItem value="NASA">NASA</SelectItem>
                        <SelectItem value="NSF">NSF</SelectItem>
                        <SelectItem value="USDA">USDA</SelectItem>
                        <SelectItem value="EPA">EPA</SelectItem>
                        <SelectItem value="ED">ED</SelectItem>
                        <SelectItem value="DHS">DHS</SelectItem>
                        <SelectItem value="DOT">DOT</SelectItem>
                        <SelectItem value="DOE">DOE</SelectItem>
                        <SelectItem value="DOC">DOC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="ml-4">
                    <Select value={topicYearFilter} onValueChange={handleTopicYearChange}>
                      <SelectTrigger className="w-32 text-sm bg-background">
                        <SelectValue placeholder="Year..." />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-black">
                        <SelectItem value="2025">2025</SelectItem>
                        <SelectItem value="2024">2024</SelectItem>
                        <SelectItem value="2023">2023</SelectItem>
                        <SelectItem value="2022">2022</SelectItem>
                        <SelectItem value="2021">2021</SelectItem>
                        <SelectItem value="2020">2020</SelectItem>
                        <SelectItem value="2019">2019</SelectItem>
                        <SelectItem value="2018">2018</SelectItem>
                        <SelectItem value="2017">2017</SelectItem>
                        <SelectItem value="2016">2016</SelectItem>
                        <SelectItem value="2015">2015</SelectItem>
                        <SelectItem value="2014">2014</SelectItem>
                        <SelectItem value="2013">2013</SelectItem>
                        <SelectItem value="2012">2012</SelectItem>
                        <SelectItem value="2011">2011</SelectItem>
                        <SelectItem value="2010">2010</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
              
              {/* Award filters (except slider) - shown inline when on awards route */}
              {isAwardsRoute && (
                <>
                  {/* Year filter - first */}
                  <div className="ml-4">
                    <Select value={awardYearFilter} onValueChange={handleAwardYearChange}>
                      <SelectTrigger className="w-32 text-sm bg-background">
                        <SelectValue placeholder="Year..." />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-black">
                        <SelectItem value="2025">2025</SelectItem>
                        <SelectItem value="2024">2024</SelectItem>
                        <SelectItem value="2023">2023</SelectItem>
                        <SelectItem value="2022">2022</SelectItem>
                        <SelectItem value="2021">2021</SelectItem>
                        <SelectItem value="2020">2020</SelectItem>
                        <SelectItem value="2019">2019</SelectItem>
                        <SelectItem value="2018">2018</SelectItem>
                        <SelectItem value="2017">2017</SelectItem>
                        <SelectItem value="2016">2016</SelectItem>
                        <SelectItem value="2015">2015</SelectItem>
                        <SelectItem value="2014">2014</SelectItem>
                        <SelectItem value="2013">2013</SelectItem>
                        <SelectItem value="2012">2012</SelectItem>
                        <SelectItem value="2011">2011</SelectItem>
                        <SelectItem value="2010">2010</SelectItem>
                        <SelectItem value="2009">2009</SelectItem>
                        <SelectItem value="2008">2008</SelectItem>
                        <SelectItem value="2007">2007</SelectItem>
                        <SelectItem value="2006">2006</SelectItem>
                        <SelectItem value="2005">2005</SelectItem>
                        <SelectItem value="2004">2004</SelectItem>
                        <SelectItem value="2003">2003</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Phase filter - second */}
                  <div className="ml-4">
                    <Select value={awardPhaseFilter} onValueChange={handleAwardPhaseChange}>
                      <SelectTrigger className="w-32 text-sm bg-background">
                        <SelectValue placeholder="Phase..." />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-black">
                        <SelectItem value="Phase I">Phase I</SelectItem>
                        <SelectItem value="Phase II">Phase II</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Program filter - third */}
                  <div className="ml-4">
                    <Select value={awardProgramFilter} onValueChange={handleAwardProgramChange}>
                      <SelectTrigger className="w-32 text-sm bg-background">
                        <SelectValue placeholder="Program..." />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-black">
                        <SelectItem value="SBIR">SBIR</SelectItem>
                        <SelectItem value="STTR">STTR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Agency filter - fourth */}
                  <div className="ml-4">
                    <Select value={awardAgencyFilter} onValueChange={handleAwardAgencyChange}>
                      <SelectTrigger className="w-32 text-sm bg-background">
                        <SelectValue placeholder="Agency..." />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-black max-h-60">
                        <SelectItem value="HHS">HHS</SelectItem>
                        <SelectItem value="DOD">DOD</SelectItem>
                        <SelectItem value="NASA">NASA</SelectItem>
                        <SelectItem value="NSF">NSF</SelectItem>
                        <SelectItem value="USDA">USDA</SelectItem>
                        <SelectItem value="EPA">EPA</SelectItem>
                        <SelectItem value="ED">ED</SelectItem>
                        <SelectItem value="DHS">DHS</SelectItem>
                        <SelectItem value="DOT">DOT</SelectItem>
                        <SelectItem value="DOE">DOE</SelectItem>
                        <SelectItem value="DOC">DOC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {/* Company filters - shown inline when on companies route */}
              {isCompaniesRoute && (
                <>
                  <div className="ml-4">
                    <Select value={companyStateFilter} onValueChange={handleCompanyStateChange}>
                      <SelectTrigger className="w-32 text-sm bg-background">
                        <SelectValue placeholder="State..." />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-black max-h-60">
                        <SelectItem value="AL">Alabama</SelectItem>
                        <SelectItem value="AK">Alaska</SelectItem>
                        <SelectItem value="AZ">Arizona</SelectItem>
                        <SelectItem value="AR">Arkansas</SelectItem>
                        <SelectItem value="CA">California</SelectItem>
                        <SelectItem value="CO">Colorado</SelectItem>
                        <SelectItem value="CT">Connecticut</SelectItem>
                        <SelectItem value="DE">Delaware</SelectItem>
                        <SelectItem value="FL">Florida</SelectItem>
                        <SelectItem value="GA">Georgia</SelectItem>
                        <SelectItem value="HI">Hawaii</SelectItem>
                        <SelectItem value="ID">Idaho</SelectItem>
                        <SelectItem value="IL">Illinois</SelectItem>
                        <SelectItem value="IN">Indiana</SelectItem>
                        <SelectItem value="IA">Iowa</SelectItem>
                        <SelectItem value="KS">Kansas</SelectItem>
                        <SelectItem value="KY">Kentucky</SelectItem>
                        <SelectItem value="LA">Louisiana</SelectItem>
                        <SelectItem value="ME">Maine</SelectItem>
                        <SelectItem value="MD">Maryland</SelectItem>
                        <SelectItem value="MA">Massachusetts</SelectItem>
                        <SelectItem value="MI">Michigan</SelectItem>
                        <SelectItem value="MN">Minnesota</SelectItem>
                        <SelectItem value="MS">Mississippi</SelectItem>
                        <SelectItem value="MO">Missouri</SelectItem>
                        <SelectItem value="MT">Montana</SelectItem>
                        <SelectItem value="NE">Nebraska</SelectItem>
                        <SelectItem value="NV">Nevada</SelectItem>
                        <SelectItem value="NH">New Hampshire</SelectItem>
                        <SelectItem value="NJ">New Jersey</SelectItem>
                        <SelectItem value="NM">New Mexico</SelectItem>
                        <SelectItem value="NY">New York</SelectItem>
                        <SelectItem value="NC">North Carolina</SelectItem>
                        <SelectItem value="ND">North Dakota</SelectItem>
                        <SelectItem value="OH">Ohio</SelectItem>
                        <SelectItem value="OK">Oklahoma</SelectItem>
                        <SelectItem value="OR">Oregon</SelectItem>
                        <SelectItem value="PA">Pennsylvania</SelectItem>
                        <SelectItem value="RI">Rhode Island</SelectItem>
                        <SelectItem value="SC">South Carolina</SelectItem>
                        <SelectItem value="SD">South Dakota</SelectItem>
                        <SelectItem value="TN">Tennessee</SelectItem>
                        <SelectItem value="TX">Texas</SelectItem>
                        <SelectItem value="UT">Utah</SelectItem>
                        <SelectItem value="VT">Vermont</SelectItem>
                        <SelectItem value="VA">Virginia</SelectItem>
                        <SelectItem value="WA">Washington</SelectItem>
                        <SelectItem value="WV">West Virginia</SelectItem>
                        <SelectItem value="WI">Wisconsin</SelectItem>
                        <SelectItem value="WY">Wyoming</SelectItem>
                        <SelectItem value="DC">District of Columbia</SelectItem>
                        <SelectItem value="PR">Puerto Rico</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>
            
            {/* Right side with slider (shown on awards and companies routes) */}
            {(isAwardsRoute || isCompaniesRoute) && (
              <div className="flex items-center">
                {/* Amount Range Slider for Awards */}
                {isAwardsRoute && (
                  <div className="flex items-center">
                    <div className="w-20 text-right">
                      <span className="text-sm text-gray-500 mr-2">
                        {formatCurrency(localAmountRange[0])}
                      </span>
                    </div>
                    
                    <div className="w-64 mx-2">
                      <Slider 
                        defaultValue={awardAmountRange}
                        value={localAmountRange}
                        min={0}
                        max={2500000}
                        step={25000}
                        onValueChange={handleAmountRangeChange}
                        onValueCommit={handleAmountRangeCommit}
                        className="w-full"
                      />
                    </div>
                    
                    <div className="w-20">
                      <span className="text-sm text-gray-500">
                        {formatCurrency(localAmountRange[1])}
                      </span>
                    </div>
                    
                    <div className="w-20">
                      {isAmountRangeActive && (
                        <button 
                          onClick={handleResetAmountRange}
                          className="text-xs text-gray-600"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Awards Range Slider for Companies */}
                {isCompaniesRoute && (
                  <div className="flex items-center">
                    <div className="text-sm text-gray-500">
                      Number of Awards:
                    </div>
                    <div className="w-10 text-right">
                      <span className="text-sm text-gray-500">
                        {localAwardsRange[0]}
                      </span>
                    </div>
                    
                    <div className="w-64 mx-2">
                      <Slider 
                        defaultValue={companyAwardsRange}
                        value={localAwardsRange}
                        min={0}
                        max={500}
                        step={5}
                        onValueChange={handleAwardsRangeChange}
                        onValueCommit={handleAwardsRangeCommit}
                        className="w-full"
                      />
                    </div>
                    
                    <div className="w-20">
                      <span className="text-sm text-gray-500">
                        {localAwardsRange[1] === 500 ? "500+" : localAwardsRange[1]}
                      </span>
                    </div>
                    
                    <div className="w-20">
                      {isAwardsRangeActive && (
                        <button 
                          onClick={handleResetAwardsRange}
                          className="text-xs text-gray-600"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 