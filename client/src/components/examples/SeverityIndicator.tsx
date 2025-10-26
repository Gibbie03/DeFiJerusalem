import SeverityIndicator from '../SeverityIndicator';

export default function SeverityIndicatorExample() {
  return (
    <div className="flex flex-wrap gap-4 p-6 bg-background">
      <SeverityIndicator severity="CRITICAL" />
      <SeverityIndicator severity="HIGH" />
      <SeverityIndicator severity="MEDIUM" />
      <SeverityIndicator severity="LOW" />
    </div>
  );
}
