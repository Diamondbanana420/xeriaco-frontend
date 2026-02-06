import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { OrderTrackingTimeline } from "@/components/account/OrderTrackingTimeline";
import { 
  User, 
  Package, 
  Heart, 
  LogOut, 
  Mail, 
  Calendar,
  ShoppingBag,
  Trash2,
  Loader2,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || 'https://xeriaco-backend-production.up.railway.app';

export default function Account() {
  const { user, loading, signOut } = useAuth();
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  // Fetch user profile
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      try {
        const response = await fetch(`${API_URL}/api/store/profile/${user.id}`);
        if (!response.ok) return { full_name: user.email?.split('@')[0] || 'User', avatar_url: null };
        const data = await response.json();
        return data.profile || { full_name: user.email?.split('@')[0] || 'User', avatar_url: null };
      } catch {
        return { full_name: user.email?.split('@')[0] || 'User', avatar_url: null };
      }
    },
    enabled: !!user?.id,
  });

  // Fetch orders with items and tracking
  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ["orders", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      try {
        const response = await fetch(`${API_URL}/api/store/orders?userId=${user.id}`);
        if (!response.ok) return [];
        const data = await response.json();
        return data.orders || [];
      } catch {
        return [];
      }
    },
    enabled: !!user?.id,
  });

  const toggleOrderExpanded = (orderId: string) => {
    setExpandedOrders((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };

  // Fetch wishlist
  const { data: wishlistItems, isLoading: wishlistLoading, refetch: refetchWishlist } = useQuery({
    queryKey: ["wishlist", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      try {
        const response = await fetch(`${API_URL}/api/store/wishlist?userId=${user.id}`);
        if (!response.ok) return [];
        const data = await response.json();
        return data.items || [];
      } catch {
        return [];
      }
    },
    enabled: !!user?.id,
  });

  const removeFromWishlist = async (wishlistId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/store/wishlist/${wishlistId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to remove");
      toast.success("Removed from wishlist");
      refetchWishlist();
    } catch {
      toast.error("Failed to remove from wishlist");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
      case "delivered":
        return "bg-primary/20 text-primary";
      case "shipped":
        return "bg-blue-500/20 text-blue-500";
      case "pending":
      case "processing":
        return "bg-yellow-500/20 text-yellow-500";
      case "cancelled":
        return "bg-destructive/20 text-destructive";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-background py-8">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">My Account</h1>
            <p className="text-muted-foreground mt-1">
              Manage your profile, orders, and wishlist
            </p>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="glass border border-border/50">
              <TabsTrigger value="profile" className="gap-2">
                <User className="h-4 w-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="orders" className="gap-2">
                <Package className="h-4 w-4" />
                Orders
              </TabsTrigger>
              <TabsTrigger value="wishlist" className="gap-2">
                <Heart className="h-4 w-4" />
                Wishlist
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <Card className="glass border-border/50">
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback className="text-2xl bg-primary/20 text-primary">
                        {profile?.full_name?.charAt(0) || user.email?.charAt(0)?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-xl font-semibold">
                        {profile?.full_name || "User"}
                      </h3>
                      <p className="text-muted-foreground">{user.email}</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Mail className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Member Since</p>
                        <p className="font-medium">
                          {new Date(user.created_at).toLocaleDateString("en-US", {
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => {
                      signOut();
                      navigate("/");
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Orders Tab */}
            <TabsContent value="orders">
              <Card className="glass border-border/50">
                <CardHeader>
                  <CardTitle>Order History</CardTitle>
                </CardHeader>
                <CardContent>
                  {ordersLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : orders && orders.length > 0 ? (
                    <div className="space-y-4">
                      {orders.map((order) => {
                        const isExpanded = expandedOrders.has(order.id);
                        return (
                          <Card key={order.id} className="bg-muted/30 border-border/30 overflow-hidden">
                            <CardContent className="p-4">
                              <div 
                                className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between cursor-pointer"
                                onClick={() => toggleOrderExpanded(order.id)}
                              >
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-semibold">
                                      Order #{order.id.slice(0, 8)}
                                    </p>
                                    <Badge className={getStatusColor(order.status)}>
                                      {order.status}
                                    </Badge>
                                    {order.tracking_number && (
                                      <Badge variant="outline" className="text-xs">
                                        Tracking Available
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {new Date(order.created_at).toLocaleDateString("en-US", {
                                      month: "long",
                                      day: "numeric",
                                      year: "numeric",
                                    })}
                                  </p>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="text-right">
                                    <p className="text-lg font-bold text-primary">
                                      ${order.total_amount.toFixed(2)}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {order.order_items?.length || 0} item(s)
                                    </p>
                                  </div>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    {isExpanded ? (
                                      <ChevronUp className="h-4 w-4" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                              </div>

                              {isExpanded && (
                                <>
                                  {/* Tracking Timeline */}
                                  <OrderTrackingTimeline
                                    status={order.status}
                                    trackingNumber={order.tracking_number}
                                    carrier={order.carrier}
                                    trackingUrl={order.tracking_url}
                                    createdAt={order.created_at}
                                    shippedAt={order.shipped_at}
                                    deliveredAt={order.delivered_at}
                                  />

                                  {/* Order Items */}
                                  {order.order_items && order.order_items.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-border/30">
                                      <p className="text-sm font-medium mb-3">Items</p>
                                      <div className="flex flex-wrap gap-2">
                                        {order.order_items.map((item: any) => (
                                          <div
                                            key={item.id}
                                            className="flex items-center gap-2 rounded-lg bg-background/50 p-2"
                                          >
                                            <div className="h-10 w-10 overflow-hidden rounded bg-muted">
                                              {item.products?.image_url ? (
                                                <img
                                                  src={item.products.image_url}
                                                  alt={item.products.name}
                                                  className="h-full w-full object-cover"
                                                />
                                              ) : (
                                                <div className="flex h-full items-center justify-center">
                                                  <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                                                </div>
                                              )}
                                            </div>
                                            <span className="text-sm font-medium">
                                              {item.products?.name || "Product"}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                        <Package className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="font-semibold">No orders yet</h3>
                      <p className="mt-1 text-muted-foreground">
                        Start shopping to see your orders here
                      </p>
                      <Button className="mt-4 neon-glow" asChild>
                        <Link to="/products">Browse Products</Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Wishlist Tab */}
            <TabsContent value="wishlist">
              <Card className="glass border-border/50">
                <CardHeader>
                  <CardTitle>My Wishlist</CardTitle>
                </CardHeader>
                <CardContent>
                  {wishlistLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : wishlistItems && wishlistItems.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {wishlistItems.map((item) => (
                        <Card key={item.id} className="overflow-hidden bg-muted/30 border-border/30">
                          <Link to={`/products/${item.products?.id}`}>
                            <div className="aspect-video overflow-hidden">
                              {item.products?.image_url ? (
                                <img
                                  src={item.products.image_url}
                                  alt={item.products.name}
                                  className="h-full w-full object-cover transition-transform hover:scale-105"
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center bg-muted">
                                  <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                          </Link>
                          <CardContent className="p-4">
                            <Link to={`/products/${item.products?.id}`}>
                              <h4 className="font-semibold hover:text-primary transition-colors line-clamp-1">
                                {item.products?.name}
                              </h4>
                            </Link>
                            {item.products?.platform && (
                              <Badge variant="secondary" className="mt-1">
                                {item.products.platform}
                              </Badge>
                            )}
                            <div className="mt-3 flex items-center justify-between">
                              <span className="text-lg font-bold text-primary">
                                ${item.products?.base_price.toFixed(2)}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => removeFromWishlist(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                        <Heart className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="font-semibold">Your wishlist is empty</h3>
                      <p className="mt-1 text-muted-foreground">
                        Save items you love to find them easily later
                      </p>
                      <Button className="mt-4 neon-glow" asChild>
                        <Link to="/products">Discover Products</Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}
