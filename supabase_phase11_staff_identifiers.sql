-- Update profiles to support Staff Code and Username
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS staff_code TEXT;

-- Constraint: Staff code must be unique within a shop
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS unique_staff_code_per_shop;
ALTER TABLE public.profiles ADD CONSTRAINT unique_staff_code_per_shop UNIQUE (shop_id, staff_code);

-- Constraint: Username must be unique within a shop
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS unique_username_per_shop;
ALTER TABLE public.profiles ADD CONSTRAINT unique_username_per_shop UNIQUE (shop_id, username);
