import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { adminApi } from "@/lib/adminApi";
import { toast } from "sonner";
import {
  Search,
  Filter,
  Upload,
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
} from "lucide-react";

export default function AdminProducts() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  // Fetch products
  const { data, isLoading } = useQuery({
    queryKey: ["admin-products", searchTerm, statusFilter],
    queryFn: () => adminApi.getProducts({
      search: searchTerm,
      status: statusFilter !== "all" ? statusFilter : undefined,
    }),
  });

  // Bulk sync mutation
  const bulkSync = useMutation({
    mutationFn: (ids: string[]) => adminApi.bulkSync(ids),
    onSuccess: () => {
      toast.success("Products synced to Shopify successfully!");
      setSelectedProducts([]);
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    },
    onError: () => toast.error("Failed to sync products"),
  });

  // Approve product mutation
  const approveProduct = useMutation({
    mutationFn: (id: string) => adminApi.approveProduct(id),
    onSuccess: () => {
      toast.success("Product approved!");
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    },
  });

  const products = data?.products || [];

  const getProfitColor = (margin: number) => {
    if (margin >= 35) return "bg-green-100 text-green-700 border-green-200";
    if (margin >= 20) return "bg-orange-100 text-orange-700 border-orange-200";
    return "bg-red-100 text-red-700 border-red-200";
  };

  const handleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map((p: any) => p._id));
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Products</h1>
            <p className="text-gray-500 mt-1">
              Manage your product catalog and sync to Shopify
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {selectedProducts.length > 0 && (
              <Button
                onClick={() => bulkSync.mutate(selectedProducts)}
                disabled={bulkSync.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {bulkSync.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Sync {selectedProducts.length} to Shopify
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending_approval">Pending Approval</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="synced">Synced to Shopify</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Products Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Product Catalog</CardTitle>
              <span className="text-sm text-gray-500">
                {products.length} products
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedProducts.length === products.length}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Margin</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product: any) => (
                      <TableRow key={product._id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedProducts.includes(product._id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedProducts([...selectedProducts, product._id]);
                              } else {
                                setSelectedProducts(
                                  selectedProducts.filter((id) => id !== product._id)
                                );
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0" />
                            <div>
                              <p className="font-semibold text-sm">{product.title}</p>
                              <p className="text-xs text-gray-500">
                                SKU: {product.sku || "N/A"}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{product.category}</Badge>
                        </TableCell>
                        <TableCell>
                          ${product.costPriceUsd?.toFixed(2)} USD
                        </TableCell>
                        <TableCell className="font-semibold">
                          ${product.sellingPriceAud?.toFixed(2)} AUD
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={getProfitColor(product.profitMarginPercent)}
                          >
                            {product.profitMarginPercent?.toFixed(0)}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {product.status === "pending_approval" && (
                            <Badge className="bg-yellow-100 text-yellow-700">
                              Pending
                            </Badge>
                          )}
                          {product.status === "active" && product.shopifyProductId && (
                            <Badge className="bg-green-100 text-green-700">
                              Synced
                            </Badge>
                          )}
                          {product.status === "active" && !product.shopifyProductId && (
                            <Badge className="bg-blue-100 text-blue-700">
                              Active
                            </Badge>
                          )}
                          {product.status === "rejected" && (
                            <Badge className="bg-red-100 text-red-700">
                              Rejected
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {product.status === "pending_approval" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => approveProduct.mutate(product._id)}
                              >
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                              </Button>
                            )}
                            {product.shopifyProductId && (
                              <Button size="sm" variant="ghost" asChild>
                                <a
                                  href={`https://admin.shopify.com/store/your-store/products/${product.shopifyProductId}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
