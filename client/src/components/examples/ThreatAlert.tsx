import ThreatAlert from '../ThreatAlert';

export default function ThreatAlertExample() {
  const mockThreat = {
    type: 'NEW_CONTRACT',
    severity: 'HIGH' as const,
    message: 'Contract less than 7 days old - HIGH RISK'
  };

  return (
    <div className="space-y-4 p-6 bg-background max-w-2xl">
      <ThreatAlert 
        threat={mockThreat}
        protocolName="Suspicious Protocol"
        onDismiss={() => console.log('Dismissed')}
      />
      <ThreatAlert 
        threat={{
          type: 'NO_AUDIT',
          severity: 'CRITICAL',
          message: 'No security audit found'
        }}
        protocolName="Unaudited DeFi"
      />
    </div>
  );
}
