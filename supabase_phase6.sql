-- PHASE 6: INGREDIENTS, RECIPES & COST MANAGEMENT

-- 1. INGREDIENTS TABLE
CREATE TABLE IF NOT EXISTS public.ingredients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    unit TEXT NOT NULL, -- e.g., 'kg', 'liter', 'gram'
    unit_cost DECIMAL(12,2) NOT NULL DEFAULT 0, -- Cost per 1 unit
    stock_quantity DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. PRODUCT RECIPES / BOM (Bill of Materials)
-- Links products to their ingredients
CREATE TABLE IF NOT EXISTS public.product_recipes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    ingredient_id UUID REFERENCES public.ingredients(id) ON DELETE CASCADE NOT NULL,
    quantity_used DECIMAL(12,2) NOT NULL, -- Amount of ingredient per 1 product item
    UNIQUE(product_id, ingredient_id)
);

-- 3. RLS POLICIES
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see ingredients in their shop" ON public.ingredients
    FOR SELECT USING (shop_id IN (SELECT shop_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Admins manage ingredients" ON public.ingredients
    FOR ALL USING (shop_id IN (SELECT shop_id FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'shop_admin')));

CREATE POLICY "Users see recipes in their shop" ON public.product_recipes
    FOR SELECT USING (
        product_id IN (SELECT id FROM public.products WHERE shop_id IN (SELECT shop_id FROM public.profiles WHERE id = auth.uid()))
    );

CREATE POLICY "Admins manage recipes" ON public.product_recipes
    FOR ALL USING (
        product_id IN (SELECT id FROM public.products WHERE shop_id IN (SELECT shop_id FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'shop_admin')))
    );
