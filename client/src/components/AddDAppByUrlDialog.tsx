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
import { Link as LinkIcon, Loader2 } from 'lucide-react';
import { z } from 'zod';

const addDAppSchema = insertProtocolSchema.pick({
  name: true,
  website: true,
  category: true,
  chains: true,
  description: true,
}).extend({
  url: z.string().url('Please enter a valid URL'),
});

type AddDAppFormData = z.infer<typeof addDAppSchema>;

export default function AddDAppByUrlDialog() {
  const [open, setOpen] = useState(false);
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
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.replace('www.', '');
      const name = domain.split('.')[0];
      
      form.setValue('name', name.charAt(0).toUpperCase() + name.slice(1));
      form.setValue('website', url);
    } catch (error) {
      console.error('Invalid URL:', error);
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
                      placeholder="https://example.com"
                      data-testid="input-dapp-url"
                      onBlur={(e) => handleUrlPaste(e.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
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
