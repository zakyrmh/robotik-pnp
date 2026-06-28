ALTER TABLE "public"."organizational_histories" ADD COLUMN IF NOT EXISTS "role_name" text NOT NULL DEFAULT 'Anggota'::text;
ALTER TABLE "public"."organizational_histories" RENAME COLUMN "member_sort_order" TO "sort_order";
