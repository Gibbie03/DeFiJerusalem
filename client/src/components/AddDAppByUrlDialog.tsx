import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  url: z.string().min(1, 'Please enter a website URL or domain'),
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
        description: data.description || `${data.name} — A DeFi protocol on ${data.chains.join(', ')}`,
      };
      const res = await apiRequest('POST', '/api/protocols', protocol);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/protocols'] });
      toast({ title: 'Protocol Added', description: 'The protocol has been added and queued for security analysis.' });
      setOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: 'Failed to Add Protocol',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    },
  });

  const handleUrlBlur = (url: string) => {
    if (!url) return;
    try {
      let normalizedUrl = url.trim();
      if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
        normalizedUrl = 'https://' + normalizedUrl;
      }
      const urlObj = new URL(normalizedUrl);
      const domain = urlObj.hostname.replace('www.', '');
      const name = domain.split('.')[0];
      form.setValue('name', name.charAt(0).toUpperCase() + name.slice(1));
      form.setValue('website', normalizedUrl);
    } catch {
      // invalid URL, ignore
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" data-testid="button-add-dapp">
          <LinkIcon className="w-4 h-4 mr-2" />
          + Protocol
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Add Protocol</DialogTitle>
          <DialogDescription>
            Submit a DeFi protocol to be tracked and security-scored.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((d) => addMutation.mutate(d))} className="space-y-4">
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website URL</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="https://app.uniswap.org"
                      onBlur={(e) => { field.onBlur(); handleUrlBlur(e.target.value); }}
                      data-testid="input-url"
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
                  <FormLabel>Protocol Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Uniswap" data-testid="input-name" />
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
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {['DEX', 'Lending', 'Yield', 'Bridge', 'Derivatives', 'Liquid Staking', 'DeFi', 'Other'].map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
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
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Brief description of the protocol" data-testid="input-description" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} data-testid="button-cancel">
                Cancel
              </Button>
              <Button type="submit" disabled={addMutation.isPending} data-testid="button-submit-dapp">
                {addMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Add Protocol
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
