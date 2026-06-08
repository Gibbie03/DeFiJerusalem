import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Shield, AlertTriangle, CheckCircle2, Upload, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

const reportFormSchema = z.object({
  reporterName: z.string().optional(),
  reporterEmail: z.string().email("Invalid email address").or(z.literal("")).optional(),
  reportType: z.enum(["protocol", "wallet", "website", "contract"]),
  targetId: z.string().min(1, "Target ID is required"),
  targetName: z.string().min(1, "Target name is required"),
  title: z.string().min(10, "Title must be at least 10 characters").max(200),
  description: z.string().min(50, "Description must be at least 50 characters"),
  category: z.string().min(1, "Category is required"),
  severity: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]),
});

type ReportFormValues = z.infer<typeof reportFormSchema>;

export default function ReportScam() {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState<string>("protocol");

  const { data: reportStats } = useQuery<{ totalSubmitted: number; verifiedScams: number; pendingReports: number }>({
    queryKey: ['/api/reports/stats'],
  });

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: {
      reportType: "protocol",
      severity: "HIGH",
      reporterName: "",
      reporterEmail: "",
      targetId: "",
      targetName: "",
      title: "",
      description: "",
      category: "drainer",
    },
  });

  const reportMutation = useMutation({
    mutationFn: async (data: ReportFormValues) => {
      return await apiRequest("POST", "/api/reports", data);
    },
    onSuccess: () => {
      toast({
        title: "Report Submitted Successfully",
        description: "Thank you for helping keep DeFi safe! Your report will be reviewed by our team.",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error Submitting Report",
        description: error.message || "Failed to submit report. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ReportFormValues) => {
    reportMutation.mutate(data);
  };

  const handleTabChange = (value: string) => {
    setSelectedTab(value);
    form.setValue("reportType", value as any);
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-destructive/10 rounded-lg">
          <Shield className="w-6 h-6 text-destructive" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Report a Scam</h1>
          <p className="text-muted-foreground">
            Help protect the DeFi community by reporting suspicious protocols, wallets, or websites
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card data-testid="stat-card-reports-submitted">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Community Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportStats?.totalSubmitted ?? '—'}</div>
            <p className="text-xs text-muted-foreground mt-1">Total submissions</p>
          </CardContent>
        </Card>

        <Card data-testid="stat-card-verified">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Verified Scams</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{reportStats?.verifiedScams ?? '—'}</div>
            <p className="text-xs text-muted-foreground mt-1">Confirmed threats</p>
          </CardContent>
        </Card>

        <Card data-testid="stat-card-response-time">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportStats?.pendingReports ?? '—'}</div>
            <p className="text-xs text-muted-foreground mt-1">Pending review</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Submit a Security Report</CardTitle>
          <CardDescription>
            All fields are required unless marked optional. Provide as much detail as possible.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTab} onValueChange={handleTabChange} className="mb-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="protocol" data-testid="tab-protocol">Protocol</TabsTrigger>
              <TabsTrigger value="wallet" data-testid="tab-wallet">Wallet Address</TabsTrigger>
              <TabsTrigger value="website" data-testid="tab-website">Website</TabsTrigger>
              <TabsTrigger value="contract" data-testid="tab-contract">Smart Contract</TabsTrigger>
            </TabsList>
          </Tabs>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="reporterName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Name (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Anonymous Reporter" data-testid="input-reporter-name" {...field} />
                      </FormControl>
                      <FormDescription>Optional - for reputation tracking</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reporterEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Email (Optional)</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="reporter@example.com" data-testid="input-reporter-email" {...field} />
                      </FormControl>
                      <FormDescription>For updates on your report</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {selectedTab === "protocol" && (
                <>
                  <FormField
                    control={form.control}
                    name="targetId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Protocol ID or Slug</FormLabel>
                        <FormControl>
                          <Input placeholder="uniswap-v3, aave-v2" data-testid="input-target-id" {...field} />
                        </FormControl>
                        <FormDescription>DeFiLlama protocol slug or identifier</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="targetName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Protocol Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Uniswap V3" data-testid="input-target-name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {selectedTab === "wallet" && (
                <>
                  <FormField
                    control={form.control}
                    name="targetId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Wallet Address</FormLabel>
                        <FormControl>
                          <Input placeholder="0x..." data-testid="input-target-id" {...field} />
                        </FormControl>
                        <FormDescription>Full wallet address (Ethereum, Solana, etc.)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="targetName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Wallet Label/Description</FormLabel>
                        <FormControl>
                          <Input placeholder="Suspicious Drainer Wallet" data-testid="input-target-name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {selectedTab === "website" && (
                <>
                  <FormField
                    control={form.control}
                    name="targetId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://suspicious-site.com" data-testid="input-target-id" {...field} />
                        </FormControl>
                        <FormDescription>Full URL including https://</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="targetName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Fake Uniswap Clone" data-testid="input-target-name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {selectedTab === "contract" && (
                <>
                  <FormField
                    control={form.control}
                    name="targetId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contract Address</FormLabel>
                        <FormControl>
                          <Input placeholder="0x..." data-testid="input-target-id" {...field} />
                        </FormControl>
                        <FormDescription>Smart contract address</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="targetName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contract Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Malicious Token Contract" data-testid="input-target-name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Report Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Drainer wallet targeting Uniswap users" data-testid="input-title" {...field} />
                    </FormControl>
                    <FormDescription>Clear, concise summary (10-200 characters)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Threat Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-category">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="drainer">Wallet Drainer</SelectItem>
                          <SelectItem value="phishing">Phishing Attack</SelectItem>
                          <SelectItem value="rugpull">Rug Pull</SelectItem>
                          <SelectItem value="ponzi">Ponzi Scheme</SelectItem>
                          <SelectItem value="honeypot">Honeypot Contract</SelectItem>
                          <SelectItem value="imposter">Imposter/Fake Protocol</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="severity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Severity Level</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-severity">
                            <SelectValue placeholder="Select severity" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="CRITICAL">
                            <Badge variant="destructive" className="mr-2">CRITICAL</Badge>
                            Active exploitation
                          </SelectItem>
                          <SelectItem value="HIGH">
                            <Badge className="mr-2 bg-orange-500">HIGH</Badge>
                            High risk threat
                          </SelectItem>
                          <SelectItem value="MEDIUM">
                            <Badge className="mr-2 bg-yellow-500">MEDIUM</Badge>
                            Moderate risk
                          </SelectItem>
                          <SelectItem value="LOW">
                            <Badge variant="secondary" className="mr-2">LOW</Badge>
                            Low risk concern
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Detailed Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Provide detailed information about the threat, including how it works, evidence, affected users, timeline, and any other relevant details. The more information you provide, the faster we can verify and act on your report."
                        className="min-h-[200px]"
                        data-testid="textarea-description"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Minimum 50 characters - include evidence and timeline</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={reportMutation.isPending}
                  className="flex-1"
                  data-testid="button-submit-report"
                >
                  {reportMutation.isPending ? "Submitting..." : "Submit Report"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => form.reset()}
                  disabled={reportMutation.isPending}
                  data-testid="button-reset"
                >
                  Reset
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            Reporting Guidelines
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Provide Evidence</p>
              <p className="text-sm text-muted-foreground">
                Include transaction hashes, screenshots, URLs, and any verifiable proof
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Be Specific</p>
              <p className="text-sm text-muted-foreground">
                Clear, detailed descriptions help us verify threats faster
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Accuracy Matters</p>
              <p className="text-sm text-muted-foreground">
                False reports harm legitimate projects and waste review resources
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Build Reputation</p>
              <p className="text-sm text-muted-foreground">
                Verified reports earn reputation points and priority review status
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
