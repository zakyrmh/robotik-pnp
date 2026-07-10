-- Create policies to allow administrative roles (super-admin, admin-or, admin-komdis) to manage files in the 'profiles' storage bucket.

create policy "Admins can upload any profile photo"
on "storage"."objects"
as permissive
for insert
to authenticated
with check (
  (bucket_id = 'profiles'::text) AND
  (public.get_my_role() = ANY (ARRAY['super-admin'::public.user_role, 'admin-or'::public.user_role, 'admin-komdis'::public.user_role]))
);

create policy "Admins can update any profile photo"
on "storage"."objects"
as permissive
for update
to authenticated
using (
  (bucket_id = 'profiles'::text) AND
  (public.get_my_role() = ANY (ARRAY['super-admin'::public.user_role, 'admin-or'::public.user_role, 'admin-komdis'::public.user_role]))
);

create policy "Admins can delete any profile photo"
on "storage"."objects"
as permissive
for delete
to authenticated
using (
  (bucket_id = 'profiles'::text) AND
  (public.get_my_role() = ANY (ARRAY['super-admin'::public.user_role, 'admin-or'::public.user_role, 'admin-komdis'::public.user_role]))
);
