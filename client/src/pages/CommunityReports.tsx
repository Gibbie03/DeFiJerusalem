import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Shield, ThumbsUp, ThumbsDown, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";

interface UserReport {
  id: string;
  reporterName?: string;
  reportType: string;
  targetId: string;
  targetName: string;
  title: string;
  description: string;
  severity: string;
  category: string;
  status: string;
  upvotes: number;
  downvotes: number;
  verified: boolean;
  submittedAt: string;
}

export default function CommunityReports() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  const { data, isLoading } = useQuery<{ reports: UserReport[]; total: number }>({
    queryKey: ["/api/reports", statusFilter, severityFilter],
    queryFn: async () => {
      let url = "/api/reports?limit=100";
      if (statusFilter !== "all") url += `&status=${statusFilter}`;
      if (severityFilter !== "all") url += `&severity=${severityFilter}`;
      return fetch(url).then((res) => res.json());
    },
  });

  const reports = data?.reports || [];

  const voteMutation = useMutation({
    mutationFn: async ({ reportId, voteType }: { reportId: string; voteType: "upvote" | "downvote" }) => {
      return await apiRequest("POST", `/api/reports/${reportId}/vote`, { voteType });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      toast({
        title: "Vote Recorded",
        description: "Your vote has been counted.",
      });
    },
    onError: () => {
      toast({
        title: "Vote Failed",
        description: "Failed to record your vote. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleVote = (reportId: string, voteType: "upvote" | "downvote") => {
    voteMutation.mutate({ reportId, voteType });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "bg-destructive text-destructive-foreground";
      case "HIGH":
        return "bg-orange-500 text-white";
      case "MEDIUM":
        return "bg-yellow-500 text-black";
      case "LOW":
        return "bg-blue-500 text-white";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "verified":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "investigating":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Shield className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Community Reports</h1>
          <p className="text-muted-foreground">
            User-submitted scam reports and security threats
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]" data-testid="select-status-filter">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="investigating">Investigating</SelectItem>
            <SelectItem value="dismissed">Dismissed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-[200px]" data-testid="select-severity-filter">
            <SelectValue placeholder="Filter by severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severities</SelectItem>
            <SelectItem value="CRITICAL">Critical</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reports List */}
      {isLoading ? (
        <div className="text-center py-12" data-testid="loading-reports">
          <p className="text-muted-foreground">Loading reports...</p>
        </div>
      ) : reports && reports.length > 0 ? (
        <div className="grid gap-4">
          {reports.map((report) => (
            <Card key={report.id} className="hover-elevate" data-testid={`card-report-${report.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getSeverityColor(report.severity)} data-testid={`badge-severity-${report.id}`}>
                        {report.severity}
                      </Badge>
                      <Badge variant="outline" data-testid={`badge-category-${report.id}`}>{report.category}</Badge>
                      <Badge variant="outline" data-testid={`badge-type-${report.id}`}>{report.reportType}</Badge>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(report.status)}
                        <span className="text-sm text-muted-foreground capitalize">{report.status}</span>
                      </div>
                    </div>
                    <CardTitle className="text-xl" data-testid={`text-title-${report.id}`}>{report.title}</CardTitle>
                    <CardDescription data-testid={`text-target-${report.id}`}>
                      Target: {report.targetName} ({report.targetId})
                    </CardDescription>
                  </div>
                  
                  {/* Voting Buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleVote(report.id, "upvote")}
                      disabled={voteMutation.isPending}
                      data-testid={`button-upvote-${report.id}`}
                      className="flex items-center gap-1"
                    >
                      <ThumbsUp className="w-4 h-4" />
                      <span data-testid={`text-upvotes-${report.id}`}>{report.upvotes}</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleVote(report.id, "downvote")}
                      disabled={voteMutation.isPending}
                      data-testid={`button-downvote-${report.id}`}
                      className="flex items-center gap-1"
                    >
                      <ThumbsDown className="w-4 h-4" />
                      <span data-testid={`text-downvotes-${report.id}`}>{report.downvotes}</span>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4" data-testid={`text-description-${report.id}`}>
                  {report.description}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span data-testid={`text-reporter-${report.id}`}>
                    Reported by: {report.reporterName || "Anonymous"}
                  </span>
                  <span data-testid={`text-date-${report.id}`}>
                    {format(new Date(report.submittedAt), "MMM dd, yyyy")}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12" data-testid="text-no-reports">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No reports found matching your filters.</p>
        </div>
      )}
    </div>
  );
}
