import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { MetricCard, RevenueChart, RecentOrders, PipelineStatus, TopProducts } from "@/components/admin";
import { adminApi } from "@/lib/adminApi";
import { DollarSign, TrendingUp, ShoppingBag, Package } from "lucide-react";
import { toast } from "sonner";

export default function AdminDashboard() {
  const navigate = useNavigate();

  // Check admin authentication
  useEffect(() => {
    const adminPassword = localStorage.getItem("adminPassword");
    if (!adminPassword) {
      navigate("/admin/login");
    }
  }, [navigate]);

  // Fetch dashboard data
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: adminApi.getDashboard,
    refetchInterval: 60000, // Refresh every minute
  });

  const { data: todayStats } = useQuery({
    queryKey: ["admin-today"],
    queryFn: adminApi.getTodayStats,
    refetchInterval: 30000,
  });

  const { data: chartData } = useQuery({
    queryKey: ["admin-chart"],
    queryFn: () => adminApi.getAnalytics(30),
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Welcome back. Here's what's happening with your business today.
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Revenue"
            value={`$${todayStats?.revenue?.toLocaleString() || "0"}`}
            trend={{ value: 12.5, direction: "up" }}
            icon={DollarSign}
            color="green"
          />
          <MetricCard
            title="Total Profit"
            value={`$${todayStats?.profit?.toLocaleString() || "0"}`}
            trend={{ value: 8.2, direction: "up" }}
            icon={TrendingUp}
            color="blue"
          />
          <MetricCard
            title="Total Orders"
            value={dashboardData?.orders?.today || 0}
            trend={{ value: 2.1, direction: "down" }}
            icon={ShoppingBag}
            color="purple"
          />
          <MetricCard
            title="Active Products"
            value={dashboardData?.products?.active || 0}
            subtitle={`${dashboardData?.products?.pendingApproval || 0} pending approval`}
            icon={Package}
            color="orange"
          />
        </div>

        {/* Charts & Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RevenueChart data={chartData} />
          </div>
          <PipelineStatus data={dashboardData?.pipeline} />
        </div>

        {/* Activity Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentOrders />
          <TopProducts />
        </div>
      </div>
    </AdminLayout>
  );
}
