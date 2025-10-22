'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useHomeScreenContext } from '../context/HomeScreenContext';

export function SearchBar() {
  const { setSearchKeyword, openSearchModal } = useHomeScreenContext();
  const [inputValue, setInputValue] = useState('');

  const handleSearch = () => {
    if (inputValue.trim().length === 0) return;
    setSearchKeyword(inputValue.trim());
    openSearchModal();
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="absolute left-1/2 top-4 z-10 w-full max-w-md -translate-x-1/2 px-4">
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="¥Œ…D €ÉX8”"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          className="bg-white shadow-lg"
        />
        <Button onClick={handleSearch} className="shadow-lg">
          <Search className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
