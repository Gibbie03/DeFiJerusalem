import { useState, useRef, useCallback } from 'react';
import { Shield, AlertTriangle, CheckCircle, Upload, Image, Loader2, Info, X, Camera } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface VisualIndicator {
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  location: string;
}

interface VisualAnalysis {
  isScam: boolean;
  riskScore: number;
  severity: 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  summary: string;
  visualIndicators: VisualIndicator[];
  detectedProtocols: string[];
  recommendations: string[];
}

interface VisualScanResponse {
  success: boolean;
  url: string | null;
  analysis: VisualAnalysis;
  scannedAt: string;
}

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'CRITICAL': return 'bg-red-500 text-white';
    case 'HIGH': return 'bg-orange-500 text-white';
    case 'MEDIUM': return 'bg-yellow-500 text-black';
    case 'LOW': return 'bg-blue-500 text-white';
    case 'SAFE': return 'bg-green-500 text-white';
    default: return 'bg-muted';
  }
};

const getIndicatorIcon = (severity: string) => {
  switch (severity) {
    case 'CRITICAL':
    case 'HIGH':
      return <AlertTriangle className="w-4 h-4 text-destructive" />;
    case 'MEDIUM':
      return <Info className="w-4 h-4 text-yellow-500" />;
    case 'LOW':
      return <Info className="w-4 h-4 text-blue-500" />;
    default:
      return <CheckCircle className="w-4 h-4 text-green-500" />;
  }
};

export default function VisualScannerContent() {
  const [url, setUrl] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMediaType, setImageMediaType] = useState<string>('image/png');
  const [scanResult, setScanResult] = useState<VisualScanResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const scanMutation = useMutation({
    mutationFn: async ({ image, mediaType, websiteUrl }: { image: string; mediaType: string; websiteUrl: string }) => {
      const res = await apiRequest('POST', '/api/scan-visual-content', {
        image,
        mediaType,
        url: websiteUrl || undefined,
      });
      return await res.json();
    },
    onSuccess: (data: VisualScanResponse) => {
      if ('error' in data) {
        const err = data as any;
        if (err.requiresApiKey) {
          toast({
            title: 'API Key Required',
            description: 'Add ANTHROPIC_API_KEY to your environment to enable visual analysis.',
            variant: 'destructive',
          });
        } else {
          toast({ title: 'Scan Error', description: err.message, variant: 'destructive' });
        }
        return;
      }
      setScanResult(data);
      const { severity } = data.analysis;
      if (severity === 'CRITICAL' || severity === 'HIGH') {
        toast({
          title: 'Warning: Scam Detected',
          description: 'This screenshot shows signs of a scam. Do not connect your wallet!',
          variant: 'destructive',
        });
      } else if (severity === 'SAFE') {
        toast({ title: 'Appears Safe', description: 'No obvious scam patterns detected in the screenshot.' });
      }
    },
    onError: (error: any) => {
      const msg = error?.response?.message || (error instanceof Error ? error.message : 'Failed to analyze image');
      toast({ title: 'Analysis Failed', description: msg, variant: 'destructive' });
    },
  });

  const handleFileChange = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid File', description: 'Please select an image file (PNG, JPG, WEBP, GIF)', variant: 'destructive' });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'File Too Large', description: 'Please use an image under 10MB', variant: 'destructive' });
      return;
    }
    setImageMediaType(file.type);
    setScanResult(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImagePreview(result);
      // Strip the data URI prefix to get pure base64
      const base64 = result.split(',')[1];
      setImageBase64(base64);
    };
    reader.readAsDataURL(file);
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileChange(file);
  }, [handleFileChange]);

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items);
    const imageItem = items.find(item => item.type.startsWith('image/'));
    if (imageItem) {
      const file = imageItem.getAsFile();
      if (file) handleFileChange(file);
    }
  }, [handleFileChange]);

  const handleAnalyze = () => {
    if (!imageBase64) {
      toast({ title: 'No Image', description: 'Please upload or paste a screenshot first', variant: 'destructive' });
      return;
    }
    scanMutation.mutate({ image: imageBase64, mediaType: imageMediaType, websiteUrl: url });
  };

  const clearImage = () => {
    setImagePreview(null);
    setImageBase64(null);
    setScanResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6" data-testid="visual-scanner-content" onPaste={handlePaste}>
      {/* Info Banner */}
      <Alert>
        <Camera className="w-4 h-4" />
        <AlertTitle>Screenshot Analysis</AlertTitle>
        <AlertDescription>
          Upload or paste a screenshot of any suspicious DApp, website, or pop-up. Our AI will detect visual scam patterns, fake UIs, and brand impersonation.
        </AlertDescription>
      </Alert>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Screenshot</CardTitle>
          <CardDescription>
            Drag & drop, click to browse, or press Ctrl+V to paste a screenshot from your clipboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!imagePreview ? (
            <div
              className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-10 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              data-testid="drop-zone"
            >
              <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium text-sm">Drop screenshot here or click to upload</p>
              <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WEBP, GIF — max 10MB</p>
              <p className="text-xs text-muted-foreground mt-1">Or press Ctrl+V / Cmd+V to paste</p>
            </div>
          ) : (
            <div className="relative">
              <img
                src={imagePreview}
                alt="Screenshot to analyze"
                className="w-full max-h-80 object-contain rounded-lg border"
                data-testid="image-preview"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-7 w-7"
                onClick={clearImage}
                data-testid="button-clear-image"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
            data-testid="input-file-upload"
          />

          {/* Optional URL */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">
              Website URL (optional)
            </label>
            <Input
              placeholder="https://suspicious-dapp.xyz (optional context)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              data-testid="input-visual-url"
            />
          </div>

          <Button
            onClick={handleAnalyze}
            disabled={!imageBase64 || scanMutation.isPending}
            className="w-full"
            data-testid="button-analyze-visual"
          >
            {scanMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing Screenshot...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4 mr-2" />
                Analyze Screenshot
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {scanResult && (
        <div className="space-y-4">
          {/* Overall Risk */}
          <Card data-testid="visual-scan-result-card">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    <Image className="w-5 h-5" />
                    Visual Analysis Result
                  </CardTitle>
                  {scanResult.url && (
                    <CardDescription className="break-all mt-1">{scanResult.url}</CardDescription>
                  )}
                </div>
                <Badge className={getSeverityColor(scanResult.analysis.severity)} data-testid="badge-visual-severity">
                  {scanResult.analysis.severity}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Risk Score Bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Risk Score</span>
                  <span className="text-sm font-bold" data-testid="text-visual-risk-score">
                    {scanResult.analysis.riskScore}/100
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      scanResult.analysis.riskScore >= 70 ? 'bg-red-500' :
                      scanResult.analysis.riskScore >= 50 ? 'bg-orange-500' :
                      scanResult.analysis.riskScore >= 30 ? 'bg-yellow-500' :
                      scanResult.analysis.riskScore >= 10 ? 'bg-blue-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${scanResult.analysis.riskScore}%` }}
                  />
                </div>
              </div>

              <Alert>
                <AlertDescription className="text-base" data-testid="alert-visual-summary">
                  {scanResult.analysis.summary}
                </AlertDescription>
              </Alert>

              {scanResult.analysis.detectedProtocols.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-sm font-medium">Detected Protocols / Brands:</p>
                  <div className="flex flex-wrap gap-2">
                    {scanResult.analysis.detectedProtocols.map((p, i) => (
                      <Badge key={i} variant="outline" className="text-xs">{p}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {scanResult.analysis.recommendations.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Recommendations:</h4>
                  <ul className="space-y-1.5">
                    {scanResult.analysis.recommendations.map((rec, idx) => (
                      <li key={idx} className="text-sm flex items-start gap-2">
                        <span className="mt-0.5">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Visual Indicators */}
          {scanResult.analysis.visualIndicators.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Visual Threats Detected ({scanResult.analysis.visualIndicators.length})</CardTitle>
                <CardDescription>Scam patterns identified in the screenshot</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {scanResult.analysis.visualIndicators.map((indicator, idx) => (
                    <div key={idx} className="p-3 border rounded-md space-y-1.5" data-testid={`visual-indicator-${idx}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 flex-1">
                          {getIndicatorIcon(indicator.severity)}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{indicator.description}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Location: {indicator.location}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {indicator.severity}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* How It Works - shown when no result */}
      {!scanResult && (
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Camera className="w-4 h-4 text-primary" />
                Take a Screenshot
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Screenshot any suspicious DApp, pop-up, or wallet approval screen before connecting
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Upload className="w-4 h-4 text-primary" />
                Upload or Paste
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Upload from your device or paste directly from clipboard with Ctrl+V / Cmd+V
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                AI Visual Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Claude AI scans for brand impersonation, drainer UIs, fake approvals, and social engineering
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
