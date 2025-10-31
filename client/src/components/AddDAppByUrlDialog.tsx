import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { insertProtocolSchema } from '@shared/schema';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Link as LinkIcon, Loader2, Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import { z } from 'zod';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

const addDAppSchema = insertProtocolSchema.pick({
  name: true,
  website: true,
  category: true,
  chains: true,
  description: true,
}).extend({
  url: z.string().min(1, 'Please enter a website URL or domain'),
});

type AddDAppFormData = z.infer<typeof addDAppSchema>;

interface ScanResult {
  address: string;
  chain: string;
  explorerUrl: string;
  scanResults: {
    isHoneypot: boolean;
    cannotBuy: boolean;
    cannotSell: boolean;
    buyTax: number;
    sellTax: number;
    hiddenOwner: boolean;
    isProxy: boolean;
    isOpenSource: boolean;
    threats: string[];
    riskScore: number;
    severity: 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  };
}

export default function AddDAppByUrlDialog() {
  const [open, setOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanResults, setScanResults] = useState<ScanResult[] | null>(null);
  const [scanMessage, setScanMessage] = useState<string>('');
  const { toast } = useToast();

  const form = useForm<AddDAppFormData>({
    resolver: zodResolver(addDAppSchema),
    defaultValues: {
      url: '',
      name: '',
      website: '',
      category: 'DeFi',
      chains: ['ethereum'],
      description: '',
    },
  });

  const addMutation = useMutation({
    mutationFn: async (data: AddDAppFormData) => {
      const protocol = {
        name: data.name,
        website: data.website || data.url,
        category: data.category,
        chains: data.chains,
        description: data.description || `${data.name} - A DeFi protocol on ${data.chains.join(', ')}`,
      };
      const res = await apiRequest('POST', '/api/protocols', protocol);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/protocols'] });
      toast({
        title: 'DApp Added',
        description: 'The DApp has been added successfully and will be scanned for security threats.',
      });
      setOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: 'Failed to Add DApp',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    },
  });

  const handleUrlPaste = async (url: string) => {
    if (!url) return;

    try {
      // Normalize URL: add https:// if missing
      let normalizedUrl = url.trim();
      if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
        normalizedUrl = 'https://' + normalizedUrl;
      }

      // Parse to extract domain and name
      const urlObj = new URL(normalizedUrl);
      const domain = urlObj.hostname.replace('www.', '');
      const name = domain.split('.')[0];
      
      form.setValue('name', name.charAt(0).toUpperCase() + name.slice(1));
      form.setValue('website', normalizedUrl);

      // Automatically scan the website for contracts
      setScanning(true);
      setScanResults(null);
      setScanMessage('');

      const response = await apiRequest('POST', '/api/scan-website', { url: normalizedUrl });
      const data = await response.json();

      if (data.success) {
        setScanResults(data.contracts || []);
        
        // Check if contracts were found but none were scanned successfully
        const foundButNotScanned = data.contractsFound > 0 && (!data.contracts || data.contracts.length === 0);
        
        if (foundButNotScanned) {
          setScanMessage('Found contract addresses but could not scan them. The contracts may be on unsupported chains or the scanning service is unavailable.');
        } else {
          setScanMessage(data.message || '');
        }
        
        // Auto-detect chain from first contract if found
        if (data.contracts && data.contracts.length > 0) {
          const chainMap: Record<string, string> = {
            'Ethereum': 'ethereum',
            'Binance': 'bsc',
            'Polygon': 'polygon',
            'Arbitrum': 'arbitrum',
            'Optimism': 'optimism',
            'Avalanche': 'avalanche',
            'Base': 'base',
          };
          const detectedChain = chainMap[data.contracts[0].chain] || 'ethereum';
          form.setValue('chains', [detectedChain]);
        }

        toast({
          title: data.contractsScanned > 0 ? 'Contracts Scanned' : 
                 data.contractsFound > 0 ? 'Contracts Found' : 
                 'No Contracts Found',
          description: data.message,
          variant: foundButNotScanned ? 'destructive' : 'default',
        });
      } else {
        setScanMessage(data.message || 'Failed to scan website');
      }
    } catch (error) {
      console.error('Error scanning URL:', error);
      setScanMessage(error instanceof Error ? error.message : 'Failed to scan website. Please check the URL and try again.');
      toast({
        title: 'Scan Failed',
        description: 'Unable to scan the website. Please verify the URL is correct.',
        variant: 'destructive',
      });
    } finally {
      setScanning(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" data-testid="button-add-dapp-url">
          <LinkIcon className="w-4 h-4 mr-2" />
          Add DApp by URL
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]" data-testid="dialog-add-dapp">
        <DialogHeader>
          <DialogTitle>Add DApp by URL</DialogTitle>
          <DialogDescription>
            Paste a DApp website URL to add it to the scanner. We'll detect and analyze it for security threats.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => addMutation.mutate(data))} className="space-y-4">
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>DApp URL *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="empower.cash or uniswap.org"
                      data-testid="input-dapp-url"
                      onBlur={(e) => handleUrlPaste(e.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {scanning && (
              <Alert data-testid="alert-scanning">
                <Loader2 className="w-4 h-4 animate-spin" />
                <AlertDescription>
                  Scanning website for smart contracts and security threats...
                </AlertDescription>
              </Alert>
            )}

            {!scanning && scanResults && scanResults.length > 0 && (
              <div className="space-y-2" data-testid="scan-results">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Discovered Contracts ({scanResults.length})
                </Label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {scanResults.map((result, index) => (
                    <div 
                      key={index}
                      className="p-3 border rounded-md bg-card space-y-2"
                      data-testid={`contract-result-${index}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-mono truncate" title={result.address}>
                            {result.address.slice(0, 10)}...{result.address.slice(-8)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {result.chain}
                          </p>
                        </div>
                        <Badge 
                          variant={
                            result.scanResults.severity === 'SAFE' ? 'default' :
                            result.scanResults.severity === 'LOW' ? 'secondary' :
                            result.scanResults.severity === 'MEDIUM' ? 'outline' :
                            'destructive'
                          }
                          data-testid={`badge-severity-${index}`}
                        >
                          {result.scanResults.severity}
                        </Badge>
                      </div>
                      {result.scanResults.threats.length > 0 && (
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-3 h-3 text-destructive mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-destructive">
                            {result.scanResults.threats.slice(0, 2).join(', ')}
                            {result.scanResults.threats.length > 2 && ` +${result.scanResults.threats.length - 2} more`}
                          </p>
                        </div>
                      )}
                      {result.scanResults.threats.length === 0 && (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-green-500" />
                          <p className="text-xs text-muted-foreground">No threats detected</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!scanning && scanMessage && (!scanResults || scanResults.length === 0) && (
              <Alert data-testid="alert-no-contracts">
                <AlertDescription className="text-sm">
                  {scanMessage}
                </AlertDescription>
              </Alert>
            )}
            
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>DApp Name *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Uniswap" data-testid="input-dapp-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="DeFi">DeFi</SelectItem>
                      <SelectItem value="DEX">DEX</SelectItem>
                      <SelectItem value="Lending">Lending</SelectItem>
                      <SelectItem value="Yield">Yield</SelectItem>
                      <SelectItem value="NFT">NFT</SelectItem>
                      <SelectItem value="Gaming">Gaming</SelectItem>
                      <SelectItem value="Bridge">Bridge</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="chains"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Blockchain *</FormLabel>
                  <Select onValueChange={(value) => field.onChange([value])} defaultValue={field.value[0]}>
                    <FormControl>
                      <SelectTrigger data-testid="select-chain">
                        <SelectValue placeholder="Select blockchain" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ethereum">Ethereum</SelectItem>
                      <SelectItem value="bsc">BSC</SelectItem>
                      <SelectItem value="polygon">Polygon</SelectItem>
                      <SelectItem value="arbitrum">Arbitrum</SelectItem>
                      <SelectItem value="optimism">Optimism</SelectItem>
                      <SelectItem value="avalanche">Avalanche</SelectItem>
                      <SelectItem value="solana">Solana</SelectItem>
                      <SelectItem value="base">Base</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Brief description of the DApp" data-testid="input-description" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={addMutation.isPending}
                data-testid="button-submit-dapp"
              >
                {addMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Add DApp
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
