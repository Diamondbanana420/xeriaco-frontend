import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminApi } from "@/lib/adminApi";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle, Package, Truck, Loader2 } from "lucide-react";

export default function AdminOrders() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders", statusFilter],
    queryFn: () => adminApi.getOrders({
      status: statusFilter !== "all" ? statusFilter : undefined,
    }),
  });

  const reviewFraud = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "approve" | "cancel" }) =>
      adminApi.reviewFraud(id, action),
    onSuccess: () => {
      toast.success("Order reviewed successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    },
  });

  const orders = data?.orders || [];

  const statusColors: any = {
    new: "bg-blue-100 text-blue-700",
    processing: "bg-yellow-100 text-yellow-700",
    shipped: "bg-purple-100 text-purple-700",
    delivered: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };

  const getFraudColor = (score: number) => {
    if (score >= 60) return "text-red-600";
    if (score >= 30) return "text-orange-600";
    return "text-green-600";
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Orders</h1>
          <p className="text-gray-500 mt-1">Manage customer orders and fulfillment</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">New Orders</p>
                  <p className="text-2xl font-bold mt-1">
                    {orders.filter((o: any) => o.status === "new").length}
                  </p>
                </div>
                <Package className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Processing</p>
                  <p className="text-2xl font-bold mt-1">
                    {orders.filter((o: any) => o.status === "processing").length}
                  </p>
                </div>
                <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Shipped</p>
                  <p className="text-2xl font-bold mt-1">
                    {orders.filter((o: any) => o.status === "shipped").length}
                  </p>
                </div>
                <Truck className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Fraud Alerts</p>
                  <p className="text-2xl font-bold mt-1">
                    {orders.filter((o: any) => o.fraudAnalysis?.score >= 60).length}
                  </p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Fraud Score</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order: any) => (
                    <TableRow key={order._id}>
                      <TableCell className="font-semibold">
                        {order.shopifyOrderName}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.customer?.firstName} {order.customer?.lastName}</p>
                          <p className="text-xs text-gray-500">{order.customer?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        ${order.financials?.totalAud?.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[order.status]}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={`font-semibold ${getFraudColor(order.fraudAnalysis?.score || 0)}`}>
                          {order.fraudAnalysis?.score || 0}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {order.fraudAnalysis?.score >= 60 && !order.fraudAnalysis?.reviewedAt && (
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => reviewFraud.mutate({ id: order._id, action: "approve" })}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
