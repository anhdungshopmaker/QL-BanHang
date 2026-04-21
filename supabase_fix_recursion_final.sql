-- TẮT TOÀN BỘ CÁC POLICY CŨ GÂY ĐỆ QUY
DROP POLICY IF EXISTS "Super Admins see all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Shop Admins see their team" ON public.profiles;
DROP POLICY IF EXISTS "Users see themselves" ON public.profiles;
DROP POLICY IF EXISTS "Super Admins access everything" ON public.profiles;
DROP POLICY IF EXISTS "Users see their own shop" ON public.shops;
DROP POLICY IF EXISTS "Super Admins see all shops" ON public.shops;
DROP POLICY IF EXISTS "Super Admins manage all shops" ON public.shops;

-- 1. TẠO HÀM ĐỌC DỮ LIỆU "VƯỢT" RLS (SECURITY DEFINER)
-- Bằng cách này PostgreSQL sẽ không tự gọi lại RLS gây đệ quy vô hạn
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_my_shop()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT shop_id FROM profiles WHERE id = auth.uid();
$$;


-- 2. TẠO LẠI POLICY CHUẨN KHÔNG ĐỆ QUY CHO BẢNG PROFILES
-- Ai cũng xem được profile của chính mình
CREATE POLICY "Users see themselves" ON public.profiles
    FOR SELECT USING (id = auth.uid());

-- Trưởng cửa hàng thấy nhân viên trong cửa hàng của họ
CREATE POLICY "Shop Admins see their team" ON public.profiles
    FOR SELECT USING (shop_id = public.get_my_shop());

-- Super Admin xem và quản lý tất cả
CREATE POLICY "Super Admins access everything" ON public.profiles
    FOR ALL USING (public.get_my_role() = 'super_admin');


-- 3. TẠO LẠI POLICY KHÔNG ĐỆ QUY CHO BẢNG SHOPS
CREATE POLICY "Users see their own shop" ON public.shops
    FOR SELECT USING (id = public.get_my_shop());

CREATE POLICY "Super Admins manage all shops" ON public.shops
    FOR ALL USING (public.get_my_role() = 'super_admin');
