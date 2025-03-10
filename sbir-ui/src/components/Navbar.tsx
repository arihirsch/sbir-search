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
  const { topicFilter, setTopicFilter } = useNavbar();
  
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
  
  return (
    <nav className="fixed top-20 left-0 w-48 h-[calc(100vh-3.5rem)] p-4 flex flex-col gap-4">
      {/* Main navigation select */}
      <Select value={getCurrentSection()} onValueChange={handleSectionChange}>
        <SelectTrigger className="w-full text-sm bg-white">
          <SelectValue placeholder="Filter by..." />
        </SelectTrigger>
        <SelectContent className="bg-white">
          <SelectItem value="topics">Topics</SelectItem>
          <SelectItem value="awards">Awards</SelectItem>
          <SelectItem value="companies">Companies</SelectItem>
        </SelectContent>
      </Select>
      
      {/* Topic filter select - only shown when on topics route */}
      {isTopicsRoute && (
        <div className="pl-4 mt-2">
          <Select value={topicFilter} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-full text-sm bg-white">
              <SelectValue placeholder="Status..." />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </nav>
  );
} 