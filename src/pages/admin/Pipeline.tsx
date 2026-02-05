import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { adminApi } from "@/lib/adminApi";
import { toast } from "sonner";
import { Play, Zap, Search, ShoppingCart, Sparkles, Target, Loader2, CheckCircle } from "lucide-react";

export default function AdminPipeline() {
  const queryClient = useQueryClient();

  const { data: status } = useQuery({
    queryKey: ["pipeline-status"],
    queryFn: adminApi.getPipelineStatus,
    refetchInterval: 5000,
  });

  const { data: history } = useQuery({
    queryKey: ["pipeline-history"],
    queryFn: () => adminApi.getPipelineHistory(1),
  });

  const runFullPipeline = useMutation({
    mutationFn: () => adminApi.runPipeline("full"),
    onSuccess: () => {
      toast.success("Full pipeline started!");
      queryClient.invalidateQueries({ queryKey: ["pipeline-status"] });
    },
  });

  const runTrendScout = useMutation({
    mutationFn: adminApi.runTrendScout,
    onSuccess: () => toast.success("Trend scout started!"),
  });

  const runSupplierSource = useMutation({
    mutationFn: () => adminApi.runSupplierSource(20),
    onSuccess: () => toast.success("Supplier sourcing started!"),
  });

  const runAIEnrich = useMutation({
    mutationFn: () => adminApi.runAIEnrich(10),
    onSuccess: () => toast.success("AI enrichment started!"),
  });

  const isRunning = status?.active?.status === "running";

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Automation Pipeline</h1>
            <p className="text-gray-500 mt-1">Manage product discovery and automation</p>
          </div>
          <Button
            onClick={() => runFullPipeline.mutate()}
            disabled={isRunning || runFullPipeline.isPending}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {runFullPipeline.isPending || isRunning ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Running Pipeline...
              </>
            ) : (
              <>
                <Play className="w-5 h-5 mr-2" />
                Run Full Pipeline
              </>
            )}
          </Button>
        </div>

        {/* Current Status */}
        {status?.active && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Pipeline Running</h3>
                    <p className="text-sm text-gray-600">
                      Current stage: {status.active.stage}
                    </p>
                  </div>
                </div>
                <Badge className="bg-yellow-100 text-yellow-700">In Progress</Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Individual Stage Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <Search className="w-6 h-6 text-blue-500" />
                <CardTitle>Trend Scout</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Discover trending products from AliExpress, TikTok, and Amazon
              </p>
              <Button
                onClick={() => runTrendScout.mutate()}
                disabled={runTrendScout.isPending}
                variant="outline"
                className="w-full"
              >
                {runTrendScout.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Search className="w-4 h-4 mr-2" />
                )}
                Run Trend Scout
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <ShoppingCart className="w-6 h-6 text-green-500" />
                <CardTitle>Supplier Source</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Find suppliers and pricing for discovered products
              </p>
              <Button
                onClick={() => runSupplierSource.mutate()}
                disabled={runSupplierSource.isPending}
                variant="outline"
                className="w-full"
              >
                {runSupplierSource.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <ShoppingCart className="w-4 h-4 mr-2" />
                )}
                Run Supplier Source
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <Sparkles className="w-6 h-6 text-purple-500" />
                <CardTitle>AI Content</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Generate product descriptions with AI
              </p>
              <Button
                onClick={() => runAIEnrich.mutate()}
                disabled={runAIEnrich.isPending}
                variant="outline"
                className="w-full"
              >
                {runAIEnrich.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                Run AI Enrichment
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <Target className="w-6 h-6 text-orange-500" />
                <CardTitle>Competitor Scan</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Analyze competitor pricing and strategies
              </p>
              <Button variant="outline" className="w-full" disabled>
                <Target className="w-4 h-4 mr-2" />
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Pipeline History */}
        <Card>
          <CardHeader>
            <CardTitle>Pipeline History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {history?.runs?.slice(0, 10).map((run: any) => (
                <div
                  key={run._id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      run.status === "completed" ? "bg-green-100" : "bg-red-100"
                    }`}>
                      {run.status === "completed" ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <Zap className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold">{run.stage || "Full Pipeline"}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(run.startedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">
                      {run.results?.productsDiscovered || 0} discovered
                    </p>
                    <p className="text-xs text-gray-500">
                      {Math.round((run.durationMs || 0) / 1000)}s duration
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
