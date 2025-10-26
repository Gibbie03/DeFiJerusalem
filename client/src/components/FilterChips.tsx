import { Badge } from '@/components/ui/badge';

interface FilterChipsProps {
  options: string[];
  selected: string;
  onSelect: (option: string) => void;
  label?: string;
}

export default function FilterChips({ options, selected, onSelect, label }: FilterChipsProps) {
  return (
    <div className="space-y-2">
      {label && (
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = selected === option;
          return (
            <Badge
              key={option}
              variant={isSelected ? 'default' : 'outline'}
              className={`cursor-pointer transition-colors capitalize ${
                isSelected ? 'bg-primary text-primary-foreground' : 'hover-elevate'
              }`}
              onClick={() => onSelect(option)}
              data-testid={`chip-${option.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {option}
            </Badge>
          );
        })}
      </div>
    </div>
  );
}
