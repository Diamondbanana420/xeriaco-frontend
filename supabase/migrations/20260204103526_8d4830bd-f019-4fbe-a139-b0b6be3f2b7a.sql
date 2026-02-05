-- Update categories for physical products
DELETE FROM public.categories;
INSERT INTO public.categories (name, slug, icon) VALUES
  ('Fashion', 'fashion', 'Shirt'),
  ('Electronics', 'electronics', 'Laptop'),
  ('Home & Living', 'home-living', 'Home'),
  ('Sports', 'sports', 'Dumbbell');