// ============================================
// MetricCard.tsx
// ============================================
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { ArrowUp, ArrowDown } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: { value: number; direction: "up" | "down" };
  subtitle?: string;
  icon: LucideIcon;
  color: "green" | "blue" | "purple" | "orange" | "red";
}

const colorClasses = {
  green: "bg-green-100 text-green-600",
  blue: "bg-blue-100 text-blue-600",
  purple: "bg-purple-100 text-purple-600",
  orange: "bg-orange-100 text-orange-600",
  red: "bg-red-100 text-red-600",
};

export function MetricCard({ title, value, trend, subtitle, icon: Icon, color }: MetricCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <h3 className="text-3xl font-bold text-gray-900 mt-2">{value}</h3>
          </div>
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
        {trend && (
          <div className="flex items-center text-sm">
            {trend.direction === "up" ? (
              <ArrowUp className="w-4 h-4 text-green-500 mr-1" />
            ) : (
              <ArrowDown className="w-4 h-4 text-red-500 mr-1" />
            )}
            <span className={trend.direction === "up" ? "text-green-600" : "text-red-600"}>
              {trend.value}%
            </span>
            <span className="text-gray-500 ml-1">vs last month</span>
          </div>
        )}
        {subtitle && <p className="text-sm text-gray-500 mt-2">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

// ============================================
// RevenueChart.tsx
// ============================================
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";

interface RevenueChartProps {
  data?: any;
}

export function RevenueChart({ data }: RevenueChartProps) {
  const chartData = data || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Revenue Overview</CardTitle>
            <p className="text-sm text-gray-500 mt-1">Last 30 days performance</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#3b82f6"
                strokeWidth={3}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// PipelineStatus.tsx
// ============================================
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/adminApi";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface PipelineStatusProps {
  data?: any;
}

export function PipelineStatus({ data }: PipelineStatusProps) {
  const queryClient = useQueryClient();
  
  const runPipeline = useMutation({
    mutationFn: () => adminApi.runPipeline(),
    onSuccess: () => {
      toast.success("Pipeline started successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
    },
    onError: () => toast.error("Failed to start pipeline"),
  });

  const isRunning = data?.active?.status === "running";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Pipeline Status</CardTitle>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            isRunning ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"
          }`}>
            {isRunning ? "Running" : "Idle"}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {data?.last && (
          <>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Last Run</span>
                <span className="text-gray-500">
                  {new Date(data.last.completedAt).toLocaleTimeString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Products Discovered</span>
                <span className="font-semibold">{data.last.results?.productsDiscovered || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Products Listed</span>
                <span className="font-semibold">{data.last.results?.productsListed || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Duration</span>
                <span className="font-semibold">
                  {Math.round((data.last.durationMs || 0) / 1000)}s
                </span>
              </div>
            </div>
            <Button
              className="w-full"
              onClick={() => runPipeline.mutate()}
              disabled={isRunning || runPipeline.isPending}
            >
              {runPipeline.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Starting...
                </>
              ) : isRunning ? (
                "Pipeline Running..."
              ) : (
                "Run Pipeline"
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================
// RecentOrders.tsx
// ============================================
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/adminApi";
import { Link } from "react-router-dom";

export function RecentOrders() {
  const { data: orders } = useQuery({
    queryKey: ["admin-recent-orders"],
    queryFn: () => adminApi.getOrders({ limit: 5, sort: "-createdAt" }),
  });

  const statusColors: any = {
    new: "bg-blue-100 text-blue-700",
    processing: "bg-yellow-100 text-yellow-700",
    shipped: "bg-purple-100 text-purple-700",
    delivered: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Orders</CardTitle>
        <Link to="/admin/orders" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          View All →
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {orders?.orders?.slice(0, 5).map((order: any) => (
            <div
              key={order._id}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm">{order.shopifyOrderName}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                    {order.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{order.customer?.email}</span>
                  <span className="font-semibold">${order.financials?.totalAud?.toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// TopProducts.tsx
// ============================================
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/adminApi";
import { Link } from "react-router-dom";

export function TopProducts() {
  const { data: products } = useQuery({
    queryKey: ["admin-top-products"],
    queryFn: () => adminApi.getProducts({ sortBy: "analytics.revenue", limit: 5 }),
  });

  const getProfitColor = (margin: number) => {
    if (margin >= 35) return "bg-green-100 text-green-700";
    if (margin >= 20) return "bg-orange-100 text-orange-700";
    return "bg-red-100 text-red-700";
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Top Products</CardTitle>
        <Link to="/admin/products" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          View All →
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {products?.products?.slice(0, 5).map((product: any) => (
            <div
              key={product._id}
              className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-gray-900 truncate">
                  {product.title}
                </h4>
                <p className="text-xs text-gray-500 mt-1">{product.category}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm font-semibold">
                    ${product.sellingPriceAud?.toFixed(2)} AUD
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getProfitColor(product.profitMarginPercent)}`}>
                    {product.profitMarginPercent?.toFixed(0)}% margin
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
