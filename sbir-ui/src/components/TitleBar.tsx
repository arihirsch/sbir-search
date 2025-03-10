import { Link, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useState } from 'react';
import { Search } from 'lucide-react';

export default function TitleBar() {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 h-14 bg-white border-b flex items-center justify-between px-4 z-50">
      <Link to="/">
        <Button variant="ghost" className="text-lg font-semibold">
          SBIR Search
        </Button>
      </Link>
      
      <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-4">
        <div className="relative">
          <Input
            type="search"
            placeholder="Search for topics, awards, or companies..."
            className="w-full pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>
      </form>
      
      <Link to="/about">
        <Button variant="ghost">
          About
        </Button>
      </Link>
    </div>
  );
} 