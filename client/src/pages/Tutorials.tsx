import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { insertTutorialVideoSchema } from '@shared/schema';
import { Video, Upload, Play, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import TrendingTicker from '@/components/TrendingTicker';
import AdSpace from '@/components/AdSpace';
import type { TutorialVideo, InsertTutorialVideo } from '@shared/schema';

export default function Tutorials() {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const { toast } = useToast();

  const { data: tutorials = [], isLoading } = useQuery<TutorialVideo[]>({
    queryKey: ['/api/tutorials'],
  });

  const form = useForm<InsertTutorialVideo>({
    resolver: zodResolver(insertTutorialVideoSchema),
    defaultValues: {
      title: '',
      description: '',
      videoUrl: '',
      thumbnailUrl: null,
      category: 'Getting Started',
      duration: null,
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: InsertTutorialVideo) => {
      const res = await apiRequest('POST', '/api/tutorials', data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tutorials'] });
      setIsUploadOpen(false);
      form.reset();
      toast({
        title: "Tutorial Uploaded",
        description: "Your tutorial video has been added successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload tutorial",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: InsertTutorialVideo) => {
    uploadMutation.mutate(data);
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <AdSpace position="top" />
      
      <TrendingTicker />
      
      <div className="max-w-screen-2xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Tutorial Videos</h1>
            <p className="text-muted-foreground">
              Learn how to use DeFi protocols and decentralized applications safely
            </p>
          </div>
          <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-upload-tutorial">
                <Upload className="w-4 h-4 mr-2" />
                Upload Tutorial
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Upload Tutorial Video</DialogTitle>
                <DialogDescription>
                  Add a new tutorial video to help users learn how to use DeFi protocols
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="How to swap tokens on Uniswap"
                            data-testid="input-title"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Learn how to swap tokens safely using the Uniswap DEX interface..."
                            rows={3}
                            data-testid="input-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="videoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Video URL</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="url"
                            placeholder="https://youtube.com/watch?v=..."
                            data-testid="input-video-url"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="thumbnailUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Thumbnail URL (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ''}
                            type="url"
                            placeholder="https://example.com/thumbnail.jpg"
                            data-testid="input-thumbnail-url"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Getting Started"
                              data-testid="input-category"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration (seconds)</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                              placeholder="300"
                              data-testid="input-duration"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsUploadOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={uploadMutation.isPending} data-testid="button-submit-tutorial">
                      {uploadMutation.isPending ? 'Uploading...' : 'Upload'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading tutorials...</p>
          </div>
        ) : tutorials.length === 0 ? (
          <div className="text-center py-12">
            <Video className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No tutorials available yet</p>
            <Button onClick={() => setIsUploadOpen(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Upload First Tutorial
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tutorials.map((tutorial) => (
              <Card key={tutorial.id} className="hover-elevate" data-testid={`card-tutorial-${tutorial.id}`}>
                <CardHeader className="space-y-0 pb-4">
                  <div className="aspect-video bg-muted rounded-md mb-4 flex items-center justify-center overflow-hidden">
                    {tutorial.thumbnailUrl ? (
                      <img src={tutorial.thumbnailUrl} alt={tutorial.title} className="w-full h-full object-cover" />
                    ) : (
                      <Video className="w-12 h-12 text-muted-foreground" />
                    )}
                  </div>
                  <CardTitle className="text-lg">{tutorial.title}</CardTitle>
                  <CardDescription className="line-clamp-2">{tutorial.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(tutorial.uploadedAt).toLocaleDateString()}
                    </span>
                    <span className="text-muted-foreground">{formatDuration(tutorial.duration)}</span>
                  </div>
                  <Button 
                    className="w-full" 
                    variant="default"
                    onClick={() => window.open(tutorial.videoUrl, '_blank')}
                    data-testid={`button-watch-${tutorial.id}`}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Watch Tutorial
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AdSpace position="bottom" />
    </div>
  );
}
