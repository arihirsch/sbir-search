import { Link } from 'react-router-dom';
import { Button } from './ui/button';

export default function TitleBar() {
  return (
    <div className="fixed top-0 left-0 right-0 h-14 bg-white border-b flex items-center justify-between px-4 z-50">
      <Link to="/">
        <Button variant="ghost" className="text-lg font-semibold">
          SBIR Search
        </Button>
      </Link>
      <Link to="/about">
        <Button variant="ghost">
          About
        </Button>
      </Link>
    </div>
  );
} 