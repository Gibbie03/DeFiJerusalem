import { useState } from 'react';
import FilterChips from '../FilterChips';

export default function FilterChipsExample() {
  const [selected, setSelected] = useState('all');
  const chains = ['all', 'ethereum', 'polygon', 'bsc', 'arbitrum', 'optimism', 'avalanche'];

  return (
    <div className="p-6 bg-background">
      <FilterChips 
        options={chains}
        selected={selected}
        onSelect={setSelected}
        label="Filter by Chain"
      />
      <p className="mt-4 text-sm text-muted-foreground">
        Selected: <span className="text-foreground font-medium capitalize">{selected}</span>
      </p>
    </div>
  );
}
