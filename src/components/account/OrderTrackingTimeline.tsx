import { CheckCircle2, Circle, Package, Truck, MapPin, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface OrderTrackingTimelineProps {
  status: string;
  trackingNumber?: string | null;
  carrier?: string | null;
  trackingUrl?: string | null;
  createdAt: string;
  shippedAt?: string | null;
  deliveredAt?: string | null;
}

type TimelineStep = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  date?: string | null;
  isComplete: boolean;
  isCurrent: boolean;
};

export function OrderTrackingTimeline({
  status,
  trackingNumber,
  carrier,
  trackingUrl,
  createdAt,
  shippedAt,
  deliveredAt,
}: OrderTrackingTimelineProps) {
  const getTimelineSteps = (): TimelineStep[] => {
    const isCompleted = status === "completed" || status === "delivered";
    const isShipped = !!shippedAt || status === "shipped" || isCompleted;
    const isDelivered = !!deliveredAt || status === "delivered";
    const isCancelled = status === "cancelled";

    if (isCancelled) {
      return [
        {
          id: "ordered",
          label: "Order Placed",
          icon: Package,
          date: createdAt,
          isComplete: true,
          isCurrent: false,
        },
        {
          id: "cancelled",
          label: "Cancelled",
          icon: Circle,
          date: null,
          isComplete: true,
          isCurrent: true,
        },
      ];
    }

    return [
      {
        id: "ordered",
        label: "Order Placed",
        icon: Package,
        date: createdAt,
        isComplete: true,
        isCurrent: !isShipped && !isDelivered,
      },
      {
        id: "processing",
        label: "Processing",
        icon: Circle,
        date: null,
        isComplete: isShipped || isDelivered,
        isCurrent: false,
      },
      {
        id: "shipped",
        label: "Shipped",
        icon: Truck,
        date: shippedAt,
        isComplete: isShipped,
        isCurrent: isShipped && !isDelivered,
      },
      {
        id: "delivered",
        label: "Delivered",
        icon: MapPin,
        date: deliveredAt,
        isComplete: isDelivered,
        isCurrent: isDelivered,
      },
    ];
  };

  const steps = getTimelineSteps();

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="mt-4 space-y-4">
      {/* Tracking Info */}
      {trackingNumber && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg bg-primary/5 p-3">
          <Truck className="h-4 w-4 text-primary" />
          <span className="text-sm text-muted-foreground">
            {carrier && <span className="font-medium">{carrier}: </span>}
            <span className="font-mono">{trackingNumber}</span>
          </span>
          {trackingUrl && (
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto h-7 gap-1 text-xs"
              asChild
            >
              <a href={trackingUrl} target="_blank" rel="noopener noreferrer">
                Track Package
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          )}
        </div>
      )}

      {/* Timeline */}
      <div className="relative">
        <div className="flex justify-between">
          {steps.map((step, index) => {
            const Icon = step.isComplete ? CheckCircle2 : step.icon;
            return (
              <div
                key={step.id}
                className={cn(
                  "relative flex flex-col items-center",
                  index === 0 && "items-start",
                  index === steps.length - 1 && "items-end"
                )}
              >
                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "absolute top-3 h-0.5 w-full",
                      "left-1/2",
                      step.isComplete ? "bg-primary" : "bg-border"
                    )}
                    style={{ width: "calc(100% + 2rem)" }}
                  />
                )}
                
                {/* Icon */}
                <div
                  className={cn(
                    "relative z-10 flex h-6 w-6 items-center justify-center rounded-full",
                    step.isComplete
                      ? "bg-primary text-primary-foreground"
                      : step.isCurrent
                      ? "bg-primary/20 text-primary ring-2 ring-primary"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>

                {/* Label */}
                <span
                  className={cn(
                    "mt-2 text-xs font-medium",
                    step.isComplete || step.isCurrent
                      ? "text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>

                {/* Date */}
                {step.date && (
                  <span className="text-[10px] text-muted-foreground">
                    {formatDate(step.date)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
