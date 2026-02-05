-- Add tracking fields to orders table
ALTER TABLE public.orders 
ADD COLUMN tracking_number text,
ADD COLUMN carrier text,
ADD COLUMN tracking_url text,
ADD COLUMN shipped_at timestamp with time zone,
ADD COLUMN delivered_at timestamp with time zone;

-- Add comment for clarity
COMMENT ON COLUMN public.orders.tracking_number IS 'Shipping tracking number';
COMMENT ON COLUMN public.orders.carrier IS 'Shipping carrier name (e.g., USPS, FedEx, DHL)';
COMMENT ON COLUMN public.orders.tracking_url IS 'Direct URL to track the shipment';
COMMENT ON COLUMN public.orders.shipped_at IS 'Timestamp when order was shipped';
COMMENT ON COLUMN public.orders.delivered_at IS 'Timestamp when order was delivered';