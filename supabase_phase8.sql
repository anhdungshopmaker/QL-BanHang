-- PHASE 8: INVENTORY TRACKING & STOCK MANAGEMENT

-- 1. INVENTORY LOGS
CREATE TABLE IF NOT EXISTS public.inventory_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ingredient_id UUID REFERENCES public.ingredients(id) ON DELETE CASCADE NOT NULL,
    change_amount DECIMAL(12,2) NOT NULL, -- Positive for stock in, negative for usage
    reason TEXT, -- e.g., 'Stock In', 'Sales Deduction', 'Adjustment'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. AUTOMATIC STOCK DEDUCTION FUNCTION
-- Triggered when an 'order_items' entry is inserted
CREATE OR REPLACE FUNCTION public.deduct_stock_on_sale()
RETURNS TRIGGER AS $$
DECLARE
    recipe_record RECORD;
BEGIN
    -- Find all ingredients for the sold product
    FOR recipe_record IN 
        SELECT ingredient_id, quantity_used 
        FROM public.product_recipes 
        WHERE product_id = NEW.product_id
    LOOP
        -- 1. Deduct from main ingredients table
        UPDATE public.ingredients
        SET stock_quantity = stock_quantity - (recipe_record.quantity_used * NEW.quantity)
        WHERE id = recipe_record.ingredient_id;

        -- 2. Log the change
        INSERT INTO public.inventory_logs (ingredient_id, change_amount, reason)
        VALUES (
            recipe_record.ingredient_id, 
            -(recipe_record.quantity_used * NEW.quantity), 
            'Bán hàng đơn #' || NEW.order_id
        );
    END LOOP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. TRIGGER
CREATE TRIGGER on_order_item_inserted
  AFTER INSERT ON public.order_items
  FOR EACH ROW EXECUTE PROCEDURE public.deduct_stock_on_sale();

-- 4. RLS POLICIES
ALTER TABLE public.inventory_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see logs in their shop" ON public.inventory_logs
    FOR SELECT USING (
        ingredient_id IN (SELECT id FROM public.ingredients WHERE shop_id IN (SELECT shop_id FROM public.profiles WHERE id = auth.uid()))
    );
