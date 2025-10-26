import StatsCard from '../StatsCard';
import { Database, Shield, TrendingUp, AlertCircle } from 'lucide-react';

export default function StatsCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6 bg-background">
      <StatsCard label="Total Protocols" value="1,247" icon={Database} trend={{ value: 12.5, isPositive: true }} />
      <StatsCard label="Chains Supported" value="126" icon={TrendingUp} />
      <StatsCard label="Audited" value="68%" icon={Shield} trend={{ value: 5.2, isPositive: true }} />
      <StatsCard label="Blacklisted" value="23" icon={AlertCircle} />
    </div>
  );
}
