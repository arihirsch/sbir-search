import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from './ui/select';
import { useNavbar } from '../contexts/NavbarContext';

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
    setAwardAgencyFilter
  } = useNavbar();
  
  const isTopicsRoute = location.pathname.startsWith('/topics');
  const isAwardsRoute = location.pathname.startsWith('/awards');
  const isCompaniesRoute = location.pathname.startsWith('/companies');
  
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
  
  return (
    <div className="fixed top-14 left-0 right-0 h-14 bg-white z-40">
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center border-b border-gray-200">
        {/* Main navigation select */}
        <div className="flex items-center">
          <Select value={getCurrentSection()} onValueChange={handleSectionChange}>
            <SelectTrigger className="w-40 text-sm bg-white">
              <SelectValue placeholder="Browse..." />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="topics">Topics</SelectItem>
              <SelectItem value="awards">Awards</SelectItem>
              <SelectItem value="companies">Companies</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Topic filter select - shown inline when on topics route */}
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
              
              {/* Phase filter select - also shown inline when on topics route */}
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
              
              {/* Program filter select - also shown inline when on topics route */}
              <div className="ml-4">
                <Select value={programFilter} onValueChange={handleProgramChange}>
                  <SelectTrigger className="w-32 text-sm bg-white">
                    <SelectValue placeholder="Program..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="sbir">SBIR</SelectItem>
                    <SelectItem value="sttr">STTR</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Agency filter select - also shown inline when on topics route */}
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
          
          {/* Award filters - shown inline when on awards route */}
          {isAwardsRoute && (
            <>
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
      </div>
    </div>
  );
} 