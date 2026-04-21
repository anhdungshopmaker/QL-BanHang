-- FIX: INFINITE RECURSION IN PROFILES POLICY (RETRY VERSION)
-- We add DROP POLICY statements to ensure clean execution

-- 1. Drop existing policies to prevent "already exists" errors
DROP POLICY IF EXISTS "Shop Admins see their team" ON public.profiles;
DROP POLICY IF EXISTS "Users see themselves" ON public.profiles;
DROP POLICY IF EXISTS "Super Admins access everything" ON public.profiles;
DROP POLICY IF EXISTS "Super Admins see all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users see their own shop" ON public.shops;
DROP POLICY IF EXISTS "Super Admins see all shops" ON public.shops;

-- 2. Create non-recursive policies for Profiles
-- A: Users can always see their own profile
CREATE POLICY "Users see themselves" ON public.profiles
    FOR SELECT USING (id = auth.uid());

-- B: Shop Admins can see everyone in their shop
CREATE POLICY "Shop Admins see their team" ON public.profiles
    FOR SELECT USING (
        shop_id = (SELECT p.shop_id FROM public.profiles p WHERE p.id = auth.uid() LIMIT 1)
    );

-- 3. Create non-recursive policies for Shops
CREATE POLICY "Users see their own shop" ON public.shops
    FOR SELECT USING (
        id = (SELECT p.shop_id FROM public.profiles p WHERE p.id = auth.uid() LIMIT 1)
    );

-- 4. Super Admin Policy
CREATE POLICY "Super Admins access everything" ON public.profiles
    FOR ALL USING (
        (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid() LIMIT 1) = 'super_admin'
    );

CREATE POLICY "Super Admins manage all shops" ON public.shops
    FOR ALL USING (
        (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid() LIMIT 1) = 'super_admin'
    );
