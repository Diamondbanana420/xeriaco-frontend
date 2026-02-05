import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { adminApi } from "@/lib/adminApi";
import { toast } from "sonner";

export default function AdminSettings() {
  const [markup, setMarkup] = useState("45");
  const [minProfit, setMinProfit] = useState("8.00");
  const [usdToAud, setUsdToAud] = useState("1.55");

  const updatePricing = useMutation({
    mutationFn: (config: any) => adminApi.updatePricingConfig(config),
    onSuccess: () => toast.success("Pricing updated!"),
  });

  const handleSavePricing = () => {
    updatePricing.mutate({
      markupPercent: Number(markup),
      minProfitMarginAud: Number(minProfit),
      usdToAudRate: Number(usdToAud),
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-gray-500 mt-1">Configure your store automation</p>
        </div>

        <Tabs defaultValue="pricing" className="w-full">
          <TabsList>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="automation">Automation</TabsTrigger>
          </TabsList>

          <TabsContent value="pricing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Pricing Configuration</CardTitle>
                <CardDescription>
                  Set your markup percentages and profit margins
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="markup">Default Markup Percentage</Label>
                  <Input
                    id="markup"
                    type="number"
                    value={markup}
                    onChange={(e) => setMarkup(e.target.value)}
                  />
                  <p className="text-sm text-gray-500">
                    Products will be marked up by this percentage above cost
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minProfit">Minimum Profit Margin (AUD)</Label>
                  <Input
                    id="minProfit"
                    type="number"
                    step="0.01"
                    value={minProfit}
                    onChange={(e) => setMinProfit(e.target.value)}
                  />
                  <p className="text-sm text-gray-500">
                    Products must have at least this profit margin in AUD
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="usdToAud">USD to AUD Exchange Rate</Label>
                  <Input
                    id="usdToAud"
                    type="number"
                    step="0.01"
                    value={usdToAud}
                    onChange={(e) => setUsdToAud(e.target.value)}
                  />
                  <p className="text-sm text-gray-500">
                    Current exchange rate for price calculations
                  </p>
                </div>

                <Button onClick={handleSavePricing} disabled={updatePricing.isPending}>
                  Save Pricing Configuration
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Shopify Integration</CardTitle>
                <CardDescription>Manage your Shopify store connection</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-semibold">Shopify Store</p>
                      <p className="text-sm text-gray-500">Connected via Clawdbot</p>
                    </div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>AI Services</CardTitle>
                <CardDescription>Configure AI content generation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-semibold">Anthropic Claude</p>
                      <p className="text-sm text-gray-500">For product descriptions</p>
                    </div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="automation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Pipeline Automation</CardTitle>
                <CardDescription>Configure when and how the pipeline runs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg bg-blue-50">
                    <p className="font-semibold text-blue-900">Scheduled Runs</p>
                    <p className="text-sm text-blue-700 mt-1">
                      Pipeline runs daily at 8:00 AM AEST
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="font-semibold">Auto-Approve Products</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Currently: Manual approval required
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
