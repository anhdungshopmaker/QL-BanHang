-- Refine Super Admin policies for full control
DROP POLICY IF EXISTS "Super Admin can view all shops" ON public.shops;
CREATE POLICY "Super Admin full control on shops" ON public.shops
FOR ALL TO authenticated
USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin')
WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin');

DROP POLICY IF EXISTS "Super Admin full control on profiles" ON public.profiles;
CREATE POLICY "Super Admin full control on profiles" ON public.profiles
FOR ALL TO authenticated
USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin')
WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin');
