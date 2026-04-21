-- PHASE 4: QR MENU & ORDERING AT TABLE

-- 1. TABLES (Phòng / Bàn)
CREATE TABLE IF NOT EXISTS public.tables (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE NOT NULL,
    table_number TEXT NOT NULL,
    status TEXT CHECK (status IN ('available', 'occupied', 'ordered')) DEFAULT 'available',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(shop_id, table_number) -- One shop can't have duplicate table numbers
);

-- 2. UPDATE ORDERS FOR TABLE CONTEXT
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS table_id UUID REFERENCES public.tables(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_source TEXT CHECK (order_source IN ('pos', 'qr_menu')) DEFAULT 'pos';

-- 3. RLS POLICIES
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see tables in their shop" ON public.tables
    FOR SELECT USING (shop_id IN (SELECT shop_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Admins can manage tables" ON public.tables
    FOR ALL USING (shop_id IN (SELECT shop_id FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'shop_admin')));

-- ALLOW PUBLIC ACCESS FOR QR ORDERING (Filtered by shop visibility)
CREATE POLICY "Public can see products of a shop" ON public.products
    FOR SELECT USING (is_active = true); -- In production, filter by shop_id from URL

CREATE POLICY "Public can see tables" ON public.tables
    FOR SELECT USING (true); -- In production, strictly restrict
