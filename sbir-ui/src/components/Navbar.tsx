import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { Button } from './ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from './ui/select';

export default function Navbar() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const topicFilter = searchParams.get("filter") || '';
  
  const isTopicsRoute = location.pathname.startsWith('/topics');
  
  const handleFilterChange = (value: string) => {
    setSearchParams(params => {
      if (value) {
        params.set("filter", value);
      } else {
        params.delete("filter");
      }
      return params;
    });
  };
  
  return (
    <nav className="fixed top-14 left-0 w-48 h-[calc(100vh-3.5rem)] bg-gray-100 p-4 flex flex-col gap-2">
      <Link to="/topics">
        <Button
          variant={location.pathname.startsWith('/topics') ? 'default' : 'outline'}
          className="w-full justify-start"
        >
          Topics
        </Button>
      </Link>
      
      {/* Show topic filter select only when on topics route */}
      {isTopicsRoute && (
        <div className="pl-4 mt-2">
          <Select value={topicFilter} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-full text-sm">
              <SelectValue placeholder="Status..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open Topics</SelectItem>
              <SelectItem value="closed">Closed Topics</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <Link to="/awards">
        <Button
          variant={location.pathname.startsWith('/awards') ? 'default' : 'outline'}
          className="w-full justify-start"
        >
          Awards
        </Button>
      </Link>
      <Link to="/companies">
        <Button
          variant={location.pathname.startsWith('/companies') ? 'default' : 'outline'}
          className="w-full justify-start"
        >
          Companies
        </Button>
      </Link>
    </nav>
  );
} 