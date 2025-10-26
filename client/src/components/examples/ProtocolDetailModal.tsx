import { useState } from 'react';
import ProtocolDetailModal from '../ProtocolDetailModal';
import { Button } from '@/components/ui/button';

export default function ProtocolDetailModalExample() {
  const [isOpen, setIsOpen] = useState(false);

  const mockProtocol = {
    id: 'uniswap',
    name: 'Uniswap',
    chains: ['Ethereum', 'Polygon', 'Arbitrum', 'Optimism'],
    category: 'DEX',
    tvl: 5000000000,
    change24h: 2.5,
    securityScore: 95,
    logo: 'https://avatars.githubusercontent.com/u/38646891?v=4',
    website: 'https://uniswap.org',
    twitter: 'Uniswap',
    github: 'Uniswap/uniswap-v3-core',
    audited: true,
    age: 365,
    description: 'Decentralized trading protocol on Ethereum and multiple Layer 2 networks'
  };

  const mockScanResult = {
    severity: 'LOW' as const,
    threats: [],
    score: 5
  };

  return (
    <div className="p-6 bg-background">
      <Button onClick={() => setIsOpen(true)}>Open Protocol Details</Button>
      <ProtocolDetailModal
        protocol={mockProtocol}
        scanResult={mockScanResult}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </div>
  );
}
