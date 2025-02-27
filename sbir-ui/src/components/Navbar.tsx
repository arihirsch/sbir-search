import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { Button } from './ui/button';

export default function Navbar() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const topicFilter = searchParams.get("filter") || 'open';
  
  const isTopicsRoute = location.pathname.startsWith('/topics');
  
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
      
      {/* Show topic filters only when on topics route */}
      {isTopicsRoute && (
        <div className="pl-4 flex flex-col gap-2">
          <Button
            variant={topicFilter === 'open' ? 'default' : 'outline'}
            className="w-full justify-start text-sm"
            onClick={() => setSearchParams(params => {
              params.set("filter", "open");
              return params;
            })}
          >
            Open Topics
          </Button>
          <Button
            variant={topicFilter === 'closed' ? 'default' : 'outline'}
            className="w-full justify-start text-sm"
            onClick={() => setSearchParams(params => {
              params.set("filter", "closed");
              return params;
            })}
          >
            Closed Topics
          </Button>
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