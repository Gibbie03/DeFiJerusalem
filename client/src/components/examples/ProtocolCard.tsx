import ProtocolCard from '../ProtocolCard';

export default function ProtocolCardExample() {
  const mockProtocol = {
    id: 'uniswap',
    name: 'Uniswap',
    chains: ['Ethereum', 'Polygon', 'Arbitrum'],
    category: 'DEX',
    tvl: 5000000000,
    change24h: 2.5,
    securityScore: 95,
    logo: 'https://avatars.githubusercontent.com/u/38646891?v=4',
    website: 'https://uniswap.org',
    twitter: 'Uniswap',
    audited: true,
    age: 365
  };

  return (
    <div className="p-6 bg-background max-w-md">
      <ProtocolCard 
        protocol={mockProtocol} 
        onViewDetails={(p) => console.log('View details:', p.name)}
        onScan={(p) => console.log('Scan protocol:', p.name)}
      />
    </div>
  );
}
