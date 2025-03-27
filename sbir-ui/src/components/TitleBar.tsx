import { Link, useNavigate } from 'react-router-dom';
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
    <div className="fixed top-0 left-0 right-0 h-14 bg-background z-50">
      <div className="max-w-7xl mx-auto px-4 h-full border-b border-border flex items-center justify-between">
        <div className="flex-1 flex justify-start">
          <Link to="/">
            <h2 className="text-2xl font-semibold text-black dark:text-white cursor-pointer">SBIRSpy</h2>
          </Link>
        </div>
        
        <form onSubmit={handleSearch} className="flex-1 max-w-xl">
          <div className="relative">
            <Input
              type="search"
              placeholder="Search for topics, awards, or companies..."
              className="w-full pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
        </form>
        
        <div className="flex-1 flex justify-end">
          <Link to="/about">
            <span className="text-base text-black dark:text-white hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer">
              About
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
} 