import { useState } from 'react';
import SearchBar from '../SearchBar';

export default function SearchBarExample() {
  const [value, setValue] = useState('');

  return (
    <div className="p-6 bg-background max-w-xl">
      <SearchBar value={value} onChange={setValue} />
      {value && (
        <p className="mt-4 text-sm text-muted-foreground">
          Searching for: <span className="text-foreground font-medium">{value}</span>
        </p>
      )}
    </div>
  );
}
