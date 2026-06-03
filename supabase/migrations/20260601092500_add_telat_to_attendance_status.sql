-- Migration: Add 'telat' to public.attendance_status ENUM
ALTER TYPE public.attendance_status ADD VALUE IF NOT EXISTS 'telat';
