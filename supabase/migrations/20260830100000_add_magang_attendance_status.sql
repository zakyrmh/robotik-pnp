-- Migration: Add 'magang' value to public.attendance_status enum
-- For active members undergoing internship/PKL dispensations

ALTER TYPE "public"."attendance_status" ADD VALUE IF NOT EXISTS 'magang';
