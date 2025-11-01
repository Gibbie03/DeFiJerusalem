import { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import WalletScannerContent from '@/components/scanners/WalletScannerContent';
import WebsiteScannerContent from '@/components/scanners/WebsiteScannerContent';

export default function SecurityScanner() {
  const [activeTab, setActiveTab] = useState('wallet');

  useEffect(() => {
    document.title = 'Security Scanner - JERUSALEM';
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Comprehensive security scanner for crypto wallets and websites. Detect drainer addresses, phishing sites, and malicious smart contracts across Ethereum and Solana.');
    }
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Hero Section */}
      <div className="text-center space-y-4 mb-8">
        <div className="flex items-center justify-center gap-3">
          <Shield className="w-12 h-12 text-primary" />
          <h1 className="text-4xl font-bold">Security Scanner</h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          Comprehensive security analysis for wallet addresses and websites. Detect drainer operations, 
          phishing sites, and malicious smart contracts across multiple blockchains.
        </p>
      </div>

      {/* Main Scanner Card */}
      <Card>
        <CardHeader>
          <CardTitle>Multi-Chain Security Analysis</CardTitle>
          <CardDescription>
            Choose your scan type below to analyze wallet addresses or websites for security threats
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="wallet" data-testid="tab-wallet-scanner">
                Wallet Address Scanner
              </TabsTrigger>
              <TabsTrigger value="website" data-testid="tab-website-scanner">
                Website Security Scanner
              </TabsTrigger>
            </TabsList>

            <TabsContent value="wallet" className="space-y-6">
              <WalletScannerContent />
            </TabsContent>

            <TabsContent value="website" className="space-y-6">
              <WebsiteScannerContent />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
