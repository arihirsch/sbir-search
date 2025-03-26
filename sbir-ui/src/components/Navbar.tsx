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
import { useState } from 'react';

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
    setIsAmountRangeActive
  } = useNavbar();
  
  // Local state for slider value before committing
  const [localAmountRange, setLocalAmountRange] = useState<number[]>(awardAmountRange);
  
  const isTopicsRoute = location.pathname.startsWith('/topics');
  const isAwardsRoute = location.pathname.startsWith('/awards');
  //const isCompaniesRoute = location.pathname.startsWith('/companies');
  
  // Format currency for display
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  // Determine current section based on route
  const getCurrentSection = () => {
    // Extract the first part of the path (e.g., "topics" from "/topics/123")
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const mainSection = pathSegments[0] || '';
    
    if (mainSection === 'topics') return 'topics';
    if (mainSection === 'awards') return 'awards';
    if (mainSection === 'companies') return 'companies';
    return ''; // Return empty string for home page or unknown routes
  };
  
  const handleSectionChange = (value: string) => {
    navigate(`/${value}`);
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
  
  return (
    <div className="fixed top-14 left-0 right-0 h-14 bg-white z-40">
      <div className="max-w-7xl mx-auto px-4 h-full border-b border-gray-200">
        {/* Scrollable container for mobile */}
        <div className="h-full overflow-x-auto scrollbar-hide">
          <div className="h-full flex items-center justify-between min-w-max">
            {/* Left side with main navigation and filters */}
            <div className="flex items-center">
              <Select value={getCurrentSection()} onValueChange={handleSectionChange}>
                <SelectTrigger className="w-36 text-sm bg-white">
                  <SelectValue placeholder="Category..." />
                </SelectTrigger>
                <SelectContent className="bg-white">
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
                      <SelectTrigger className="w-32 text-sm bg-white">
                        <SelectValue placeholder="Status..." />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="ml-4">
                    <Select value={phaseFilter} onValueChange={handlePhaseChange}>
                      <SelectTrigger className="w-32 text-sm bg-white">
                        <SelectValue placeholder="Phase..." />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="phase1">Phase I</SelectItem>
                        <SelectItem value="phase2">Phase II</SelectItem>
                        <SelectItem value="both">Both</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="ml-4">
                    <Select value={programFilter} onValueChange={handleProgramChange}>
                      <SelectTrigger className="w-32 text-sm bg-white">
                        <SelectValue placeholder="Program..." />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="sbir">SBIR</SelectItem>
                        <SelectItem value="sttr">STTR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="ml-4">
                    <Select value={agencyFilter} onValueChange={handleAgencyChange}>
                      <SelectTrigger className="w-32 text-sm bg-white">
                        <SelectValue placeholder="Agency..." />
                      </SelectTrigger>
                      <SelectContent className="bg-white max-h-60">
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
              
              {/* Award filters (except slider) - shown inline when on awards route */}
              {isAwardsRoute && (
                <>
                  {/* Year filter - first */}
                  <div className="ml-4">
                    <Select value={awardYearFilter} onValueChange={handleAwardYearChange}>
                      <SelectTrigger className="w-32 text-sm bg-white">
                        <SelectValue placeholder="Year..." />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
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
                      <SelectTrigger className="w-32 text-sm bg-white">
                        <SelectValue placeholder="Phase..." />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="Phase I">Phase I</SelectItem>
                        <SelectItem value="Phase II">Phase II</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Program filter - third */}
                  <div className="ml-4">
                    <Select value={awardProgramFilter} onValueChange={handleAwardProgramChange}>
                      <SelectTrigger className="w-32 text-sm bg-white">
                        <SelectValue placeholder="Program..." />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="SBIR">SBIR</SelectItem>
                        <SelectItem value="STTR">STTR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Agency filter - fourth */}
                  <div className="ml-4">
                    <Select value={awardAgencyFilter} onValueChange={handleAwardAgencyChange}>
                      <SelectTrigger className="w-32 text-sm bg-white">
                        <SelectValue placeholder="Agency..." />
                      </SelectTrigger>
                      <SelectContent className="bg-white max-h-60">
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
            </div>
            
            {/* Right side with slider (only shown on awards route) */}
            {isAwardsRoute && (
              <div className="flex items-center">
                {/* Amount Range Slider */}
                <div className="flex items-center">
                  {/* Min value label with fixed width */}
                  <div className="w-20 text-right">
                    <span className="text-sm text-gray-500 mr-2">
                      {formatCurrency(localAmountRange[0])}
                    </span>
                  </div>
                  
                  {/* Slider - update max to 2,500,000 */}
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
                  
                  {/* Max value label with fixed width */}
                  <div className="w-20">
                    <span className="text-sm text-gray-500">
                      {formatCurrency(localAmountRange[1])}
                    </span>
                  </div>
                  
                  {/* Reset button container with fixed width */}
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
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 