-- Add expiration date to shops table
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '1 year');

-- Add subscription_plan if needed (optional but good for SaaS)
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS plan TEXT CHECK (plan IN ('basic', 'pro', 'enterprise')) DEFAULT 'basic';

-- Re-verify RLS for shops to ensure Super Admin can manage expiration
-- (Already covered by "FOR ALL" policy in previous steps)
