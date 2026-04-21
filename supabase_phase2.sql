-- PHASE 2: SẢN PHẨM & BÁN HÀNG (POS)

-- 1. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    image_url TEXT,
    price DECIMAL(12,2) NOT NULL DEFAULT 0,
    discount_price DECIMAL(12,2),
    category TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE NOT NULL,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Employee who sold this
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    status TEXT CHECK (status IN ('pending', 'completed', 'cancelled')) DEFAULT 'completed',
    payment_method TEXT CHECK (payment_method IN ('cash', 'transfer', 'card')) DEFAULT 'cash',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. ORDER ITEMS TABLE (Relationship)
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    price DECIMAL(12,2) NOT NULL, -- Snapshot of price at sale
    discount_price DECIMAL(12,2)
);

-- 4. RLS POLICIES FOR DATA ISOLATION
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- 4.1 Products
CREATE POLICY "Users can see products in their shop" ON public.products
    FOR SELECT USING (shop_id IN (SELECT shop_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Admins can manage products" ON public.products
    FOR ALL USING (shop_id IN (SELECT shop_id FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'shop_admin')));

-- 4.2 Orders
CREATE POLICY "Users can see orders in their shop" ON public.orders
    FOR SELECT USING (shop_id IN (SELECT shop_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Staff can create orders" ON public.orders
    FOR INSERT WITH CHECK (shop_id IN (SELECT shop_id FROM public.profiles WHERE id = auth.uid()));

-- 4.3 Order Items
CREATE POLICY "Users can see order items in their shop" ON public.order_items
    FOR SELECT USING (
        order_id IN (SELECT id FROM public.orders WHERE shop_id IN (SELECT shop_id FROM public.profiles WHERE id = auth.uid()))
    );

CREATE POLICY "Staff can insert items" ON public.order_items
    FOR INSERT WITH CHECK (
        order_id IN (SELECT id FROM public.orders WHERE shop_id IN (SELECT shop_id FROM public.profiles WHERE id = auth.uid()))
    );
