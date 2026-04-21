-- PHASE 7: CRM & LOYALTY SYSTEM

-- 1. CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(shop_id, phone) -- Customer unique per shop by phone
);

-- 2. POINT LOGS
CREATE TABLE IF NOT EXISTS public.point_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
    points_change INTEGER NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. LINK ORDERS TO CUSTOMERS
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL;

-- 4. RLS POLICIES
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see customers in their shop" ON public.customers
    FOR SELECT USING (shop_id IN (SELECT shop_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Staff manage customers" ON public.customers
    FOR ALL USING (shop_id IN (SELECT shop_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users see point logs in their shop" ON public.point_logs
    FOR SELECT USING (
        customer_id IN (SELECT id FROM public.customers WHERE shop_id IN (SELECT shop_id FROM public.profiles WHERE id = auth.uid()))
    );
