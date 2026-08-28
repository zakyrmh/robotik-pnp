-- Migration: Update v_user_discipline_summary to separate legacy/manual penalty points from goro reduction points
DROP VIEW IF EXISTS "public"."v_user_discipline_summary" CASCADE;

CREATE VIEW "public"."v_user_discipline_summary"
WITH (security_invoker = true) AS
SELECT 
    "p"."id" AS "profile_id",
    "p"."full_name",
    "p"."nim",
    COALESCE("att"."total_attendance_points", (0)::bigint) AS "total_attendance_points",
    COALESCE("legacy"."total_legacy_points", (0)::bigint) AS "total_legacy_points",
    COALESCE("goro"."total_goro_points", (0)::bigint) AS "total_goro_points",
    COALESCE("log"."total_log_points", (0)::bigint) AS "total_log_points",
    (
        COALESCE("att"."total_attendance_points", (0)::bigint) + 
        COALESCE("legacy"."total_legacy_points", (0)::bigint) + 
        COALESCE("goro"."total_goro_points", (0)::bigint)
    ) AS "net_points"
FROM "public"."profiles" "p"
LEFT JOIN (
    SELECT "attendances"."profile_id",
           "sum"("attendances"."points_awarded") AS "total_attendance_points"
    FROM "public"."attendances"
    GROUP BY "attendances"."profile_id"
) "att" ON (("p"."id" = "att"."profile_id"))
LEFT JOIN (
    SELECT "discipline_point_logs"."profile_id",
           "sum"("discipline_point_logs"."points") AS "total_legacy_points"
    FROM "public"."discipline_point_logs"
    WHERE "discipline_point_logs"."points" > 0
    GROUP BY "discipline_point_logs"."profile_id"
) "legacy" ON (("p"."id" = "legacy"."profile_id"))
LEFT JOIN (
    SELECT "discipline_point_logs"."profile_id",
           "sum"("discipline_point_logs"."points") AS "total_goro_points"
    FROM "public"."discipline_point_logs"
    WHERE "discipline_point_logs"."points" < 0
    GROUP BY "discipline_point_logs"."profile_id"
) "goro" ON (("p"."id" = "goro"."profile_id"))
LEFT JOIN (
    SELECT "discipline_point_logs"."profile_id",
           "sum"("discipline_point_logs"."points") AS "total_log_points"
    FROM "public"."discipline_point_logs"
    GROUP BY "discipline_point_logs"."profile_id"
) "log" ON (("p"."id" = "log"."profile_id"));

ALTER VIEW "public"."v_user_discipline_summary" OWNER TO "postgres";

GRANT ALL ON TABLE "public"."v_user_discipline_summary" TO "anon";
GRANT ALL ON TABLE "public"."v_user_discipline_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."v_user_discipline_summary" TO "service_role";
