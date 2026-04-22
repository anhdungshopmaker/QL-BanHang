-- UPDATE RLS FOR ORDERS: Restrict staff to today's orders only
DROP POLICY IF EXISTS "Users can see orders in their shop" ON public.orders;

CREATE POLICY "Shop Admins see all orders in shop" ON public.orders
    FOR SELECT USING (
        shop_id = (SELECT shop_id FROM public.profiles WHERE id = auth.uid()) 
        AND 
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'shop_admin'
    );

CREATE POLICY "Staff see only today's orders in shop" ON public.orders
    FOR SELECT USING (
        shop_id = (SELECT shop_id FROM public.profiles WHERE id = auth.uid()) 
        AND 
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'staff'
        AND
        created_at >= (timezone('utc'::text, now())::date)::timestamp with time zone
    );

-- Also ensure Staff can insert orders
-- (Existing insert policy might need update if it was too broad)
DROP POLICY IF EXISTS "Staff can create orders" ON public.orders;
CREATE POLICY "Staff can create orders" ON public.orders
    FOR INSERT WITH CHECK (shop_id = (SELECT shop_id FROM public.profiles WHERE id = auth.uid()));
