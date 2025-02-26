import { Link, useLocation } from 'react-router-dom';
import { Button } from './ui/button';

export default function Navbar() {
  const location = useLocation();
  
  return (
    <nav className="fixed top-0 left-0 w-48 h-screen bg-gray-100 p-4 flex flex-col gap-2">
      <Link to="/">
        <Button
          variant={location.pathname === '/' ? 'default' : 'outline'}
          className="w-full justify-start"
        >
          Home
        </Button>
      </Link>
      <Link to="/topics">
        <Button
          variant={location.pathname.startsWith('/topics') ? 'default' : 'outline'}
          className="w-full justify-start"
        >
          Topics
        </Button>
      </Link>
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