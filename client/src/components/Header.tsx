import { Shield, Wifi, WifiOff, RefreshCw, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  isOnline: boolean;
  lastUpdate: Date | null;
  onRefresh: () => void;
  onAdd?: () => void;
  isRefreshing?: boolean;
}

export default function Header({ isOnline, lastUpdate, onRefresh, onAdd, isRefreshing = false }: HeaderProps) {
  return (
    <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-screen-2xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary via-accent to-primary rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-2xl">🏛️</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                JERUSALEM
              </h1>
              <span className="flex items-center gap-1 text-xs text-green-400">
                <Shield className="w-3 h-3" />
                AI Security Scanner
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 text-xs ${isOnline ? 'text-green-400' : 'text-red-400'}`}>
              {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              <span className="hidden sm:inline">{isOnline ? 'Online' : 'Offline'}</span>
            </div>

            {lastUpdate && (
              <p className="hidden md:block text-xs text-muted-foreground">
                Updated: {lastUpdate.toLocaleTimeString()}
              </p>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={onRefresh}
              disabled={isRefreshing}
              data-testid="button-refresh"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>

            {onAdd && (
              <Button
                size="sm"
                onClick={onAdd}
                data-testid="button-add"
              >
                <Plus className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Add</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
