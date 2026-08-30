-- Migration: Add proof_image_before_url column to piket_logs for clean documentation storage
ALTER TABLE public.piket_logs 
ADD COLUMN IF NOT EXISTS proof_image_before_url text;
