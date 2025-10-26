import { AlertCircle, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import SeverityIndicator from './SeverityIndicator';

interface Threat {
  type: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  message: string;
}

interface ThreatAlertProps {
  threat: Threat;
  protocolName: string;
  onDismiss?: () => void;
  expandable?: boolean;
}

export default function ThreatAlert({ threat, protocolName, onDismiss, expandable = false }: ThreatAlertProps) {
  return (
    <Card className="p-4 border-l-4 border-l-destructive" data-testid={`alert-threat-${threat.type.toLowerCase()}`}>
      <div className="flex items-start gap-3">
        <div className="p-2 bg-destructive/10 rounded-lg">
          <AlertCircle className="w-5 h-5 text-destructive" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1">
              <h4 className="font-semibold text-foreground mb-1" data-testid="text-protocol-name">
                {protocolName}
              </h4>
              <SeverityIndicator severity={threat.severity} />
            </div>
            {onDismiss && (
              <Button 
                size="icon" 
                variant="ghost"
                onClick={onDismiss}
                data-testid="button-dismiss"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
          
          <p className="text-sm text-muted-foreground mb-2">
            <span className="font-medium text-foreground">{threat.type.replace(/_/g, ' ')}:</span> {threat.message}
          </p>
        </div>
      </div>
    </Card>
  );
}
