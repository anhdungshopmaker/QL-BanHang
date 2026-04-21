-- PHASE 1: NỀN TẢNG (FOUNDATION)
-- Database structure for multi-tenant retail management system

-- 1. SHOPS TABLE
-- Central table for all retail stores
CREATE TABLE IF NOT EXISTS public.shops (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL, -- Short public code like 'S001'
    status TEXT CHECK (status IN ('active', 'locked')) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. USERS / PROFILES TABLE
-- Extends Supabase Auth users with roles and shop context
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    shop_id UUID REFERENCES public.shops(id) ON DELETE SET NULL,
    role TEXT CHECK (role IN ('super_admin', 'shop_admin', 'staff')) DEFAULT 'staff',
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. SHOP INVITES TABLE
-- For joining existing shops via code
CREATE TABLE IF NOT EXISTS public.shop_invites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE NOT NULL,
    invite_code TEXT UNIQUE NOT NULL,
    role TEXT CHECK (role IN ('shop_admin', 'staff')) NOT NULL,
    is_used BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. ROW LEVEL SECURITY (RLS)
-- Ensuring strict data isolation between shops

ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_invites ENABLE ROW LEVEL SECURITY;

-- 4.1 Shops Policies
CREATE POLICY "Super Admins see all shops" ON public.shops
    FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin'));

CREATE POLICY "Users see their own shop" ON public.shops
    FOR SELECT USING (id IN (SELECT shop_id FROM public.profiles WHERE id = auth.uid()));

-- 4.2 Profiles Policies
CREATE POLICY "Super Admins see all profiles" ON public.profiles
    FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin'));

CREATE POLICY "Shop Admins see their team" ON public.profiles
    FOR ALL USING (shop_id IN (SELECT shop_id FROM public.profiles WHERE id = auth.uid() AND role = 'shop_admin'));

CREATE POLICY "Users see themselves" ON public.profiles
    FOR SELECT USING (id = auth.uid());

-- 4.3 Invites Policies (Internal or SuperAdmin managed)
CREATE POLICY "Admin can manage invites" ON public.shop_invites
    FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'shop_admin')));

-- 5. TRIGGER: Create profile after Auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', 'staff');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
