import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle2, Loader2, X, Plus } from "lucide-react";

const submissionSchema = z.object({
  submitterEmail: z.string().email("Please enter a valid email address"),
  submitterName: z.string().min(1, "Name is required"),
  protocolName: z.string().min(1, "Protocol name is required"),
  website: z.string().url("Please enter a valid URL").min(1, "Website is required"),
  chains: z.array(z.string()).min(1, "Select at least one blockchain"),
  category: z.string().min(1, "Category is required"),
  description: z.string().min(50, "Description must be at least 50 characters"),
  logo: z.string().url("Please enter a valid logo URL").optional().or(z.literal("")),
  twitter: z.string().url("Please enter a valid Twitter URL").optional().or(z.literal("")),
  github: z.string().url("Please enter a valid GitHub URL").optional().or(z.literal("")),
  telegram: z.string().url("Please enter a valid Telegram URL").optional().or(z.literal("")),
  discord: z.string().url("Please enter a valid Discord URL").optional().or(z.literal("")),
  auditLinks: z.array(z.string().url()).optional(),
  contractAddresses: z.record(z.string()).optional(),
});

type SubmissionFormData = z.infer<typeof submissionSchema>;

const BLOCKCHAIN_OPTIONS = [
  "Ethereum", "BSC", "Polygon", "Arbitrum", "Optimism", "Avalanche", "Fantom", "Base",
  "Solana", "Cardano", "Polkadot", "Near", "Aptos", "Sui", "Cosmos", "Osmosis"
];

const CATEGORY_OPTIONS = [
  "Dexes", "Lending", "Liquid Staking", "Yield", "Bridge", "Derivatives", "CDP",
  "Services", "Insurance", "Options", "Synthetics", "Indexes", "Gaming", "NFT Marketplace",
  "Launchpad", "Privacy", "Payments", "RWA", "Prediction Market", "Reserve Currency"
];

export default function SubmitProtocol() {
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [newChain, setNewChain] = useState("");
  const [newAuditLink, setNewAuditLink] = useState("");
  const [newContractChain, setNewContractChain] = useState("");
  const [newContractAddress, setNewContractAddress] = useState("");

  const form = useForm<SubmissionFormData>({
    resolver: zodResolver(submissionSchema),
    defaultValues: {
      submitterEmail: "",
      submitterName: "",
      protocolName: "",
      website: "",
      chains: [],
      category: "",
      description: "",
      logo: "",
      twitter: "",
      github: "",
      telegram: "",
      discord: "",
      auditLinks: [],
      contractAddresses: {},
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: SubmissionFormData) => {
      return await apiRequest("POST", "/api/protocol-submissions", data);
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast({
        title: "Protocol Submitted Successfully!",
        description: "Our team will review your submission and get back to you via email.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SubmissionFormData) => {
    submitMutation.mutate(data);
  };

  const addChain = () => {
    if (newChain && !form.getValues("chains").includes(newChain)) {
      const currentChains = form.getValues("chains");
      form.setValue("chains", [...currentChains, newChain]);
      setNewChain("");
    }
  };

  const removeChain = (chain: string) => {
    const currentChains = form.getValues("chains");
    form.setValue("chains", currentChains.filter(c => c !== chain));
  };

  const addAuditLink = () => {
    if (newAuditLink) {
      try {
        new URL(newAuditLink);
        const currentLinks = form.getValues("auditLinks") || [];
        form.setValue("auditLinks", [...currentLinks, newAuditLink]);
        setNewAuditLink("");
      } catch {
        toast({
          title: "Invalid URL",
          description: "Please enter a valid audit report URL",
          variant: "destructive",
        });
      }
    }
  };

  const removeAuditLink = (index: number) => {
    const currentLinks = form.getValues("auditLinks") || [];
    form.setValue("auditLinks", currentLinks.filter((_, i) => i !== index));
  };

  const addContractAddress = () => {
    if (newContractChain && newContractAddress) {
      const currentAddresses = form.getValues("contractAddresses") || {};
      form.setValue("contractAddresses", {
        ...currentAddresses,
        [newContractChain]: newContractAddress,
      });
      setNewContractChain("");
      setNewContractAddress("");
    }
  };

  const removeContractAddress = (chain: string) => {
    const currentAddresses = form.getValues("contractAddresses") || {};
    const { [chain]: _, ...rest } = currentAddresses;
    form.setValue("contractAddresses", rest);
  };

  if (isSubmitted) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="h-10 w-10 text-primary" data-testid="icon-success" />
            </div>
            <CardTitle className="text-2xl">Submission Received!</CardTitle>
            <CardDescription className="text-base mt-2">
              Thank you for submitting your protocol to JERUSALEM DeFi Security Scanner
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Our security team will review your submission and perform an automated security scan.
              You'll receive an email notification once the review is complete.
            </p>
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <p className="font-medium flex items-center justify-center gap-2">
                <Shield className="h-5 w-5" />
                What happens next?
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 text-left max-w-md mx-auto">
                <li>• Automated security scan (5-10 minutes)</li>
                <li>• Manual review by our team (1-2 business days)</li>
                <li>• Email notification with results</li>
                <li>• If approved, your protocol will appear in our directory</li>
              </ul>
            </div>
            <Button
              onClick={() => setIsSubmitted(false)}
              variant="outline"
              data-testid="button-submit-another"
            >
              Submit Another Protocol
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-4">Submit Your Protocol</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Get listed on JERUSALEM DeFi Security Scanner - the only DApp repository that protects users from scams.
          All submissions undergo automated security scanning and manual review.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>
                We'll use this to contact you about your submission
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="submitterEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="your@email.com"
                        data-testid="input-submitter-email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="submitterName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Your name or organization"
                        data-testid="input-submitter-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Protocol Details</CardTitle>
              <CardDescription>
                Basic information about your protocol
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="protocolName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Protocol Name *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., Uniswap"
                        data-testid="input-protocol-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="url"
                        placeholder="https://yourprotocol.com"
                        data-testid="input-website"
                      />
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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-category">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORY_OPTIONS.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
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
                    <FormLabel>Description *</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Describe your protocol, what it does, and its key features (minimum 50 characters)"
                        rows={5}
                        data-testid="input-description"
                      />
                    </FormControl>
                    <FormDescription>
                      {field.value?.length || 0} / 50 characters minimum
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="chains"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Blockchains *</FormLabel>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Select value={newChain} onValueChange={setNewChain}>
                          <SelectTrigger className="flex-1" data-testid="select-chain">
                            <SelectValue placeholder="Select blockchain" />
                          </SelectTrigger>
                          <SelectContent>
                            {BLOCKCHAIN_OPTIONS.filter(
                              (chain) => !field.value?.includes(chain)
                            ).map((chain) => (
                              <SelectItem key={chain} value={chain}>
                                {chain}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          onClick={addChain}
                          disabled={!newChain}
                          data-testid="button-add-chain"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {field.value?.map((chain) => (
                          <Badge key={chain} variant="secondary" className="gap-1">
                            {chain}
                            <X
                              className="h-3 w-3 cursor-pointer hover:text-destructive"
                              onClick={() => removeChain(chain)}
                              data-testid={`button-remove-chain-${chain}`}
                            />
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Smart Contracts (Optional)</CardTitle>
              <CardDescription>
                Add contract addresses for automated security scanning
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Select value={newContractChain} onValueChange={setNewContractChain}>
                    <SelectTrigger className="flex-1" data-testid="select-contract-chain">
                      <SelectValue placeholder="Select blockchain" />
                    </SelectTrigger>
                    <SelectContent>
                      {BLOCKCHAIN_OPTIONS.map((chain) => (
                        <SelectItem key={chain} value={chain}>
                          {chain}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Contract address (0x...)"
                    value={newContractAddress}
                    onChange={(e) => setNewContractAddress(e.target.value)}
                    className="flex-1"
                    data-testid="input-contract-address"
                  />
                  <Button
                    type="button"
                    onClick={addContractAddress}
                    disabled={!newContractChain || !newContractAddress}
                    data-testid="button-add-contract"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {Object.entries(form.getValues("contractAddresses") || {}).map(([chain, address]) => (
                    <div key={chain} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                      <Badge variant="outline">{chain}</Badge>
                      <code className="flex-1 text-xs">{address}</code>
                      <X
                        className="h-4 w-4 cursor-pointer hover:text-destructive"
                        onClick={() => removeContractAddress(chain)}
                        data-testid={`button-remove-contract-${chain}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Social Links & Additional Info (Optional)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="logo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Logo URL</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="url"
                        placeholder="https://yourprotocol.com/logo.png"
                        data-testid="input-logo"
                      />
                    </FormControl>
                    <FormDescription>Direct link to your protocol's logo image</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="twitter"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Twitter</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="url"
                          placeholder="https://twitter.com/yourprotocol"
                          data-testid="input-twitter"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="github"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GitHub</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="url"
                          placeholder="https://github.com/yourprotocol"
                          data-testid="input-github"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="telegram"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telegram</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="url"
                          placeholder="https://t.me/yourprotocol"
                          data-testid="input-telegram"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="discord"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discord</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="url"
                          placeholder="https://discord.gg/yourprotocol"
                          data-testid="input-discord"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="auditLinks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Audit Reports</FormLabel>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="https://link-to-audit-report.pdf"
                          value={newAuditLink}
                          onChange={(e) => setNewAuditLink(e.target.value)}
                          data-testid="input-audit-link"
                        />
                        <Button
                          type="button"
                          onClick={addAuditLink}
                          disabled={!newAuditLink}
                          data-testid="button-add-audit"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="space-y-1">
                        {(field.value || []).map((link, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                            <span className="flex-1 text-sm truncate">{link}</span>
                            <X
                              className="h-4 w-4 cursor-pointer hover:text-destructive"
                              onClick={() => removeAuditLink(index)}
                              data-testid={`button-remove-audit-${index}`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                    <FormDescription>
                      Add links to any third-party security audits
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex gap-4 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => form.reset()}
              disabled={submitMutation.isPending}
              data-testid="button-reset"
            >
              Reset Form
            </Button>
            <Button
              type="submit"
              disabled={submitMutation.isPending}
              data-testid="button-submit"
            >
              {submitMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Submit Protocol
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
