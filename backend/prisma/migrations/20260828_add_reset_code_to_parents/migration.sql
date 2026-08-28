-- Migration: add reset_code fields to parents table
-- Run this directly in Supabase SQL Editor

ALTER TABLE "parents"
ADD COLUMN IF NOT EXISTS "reset_code" TEXT,
ADD COLUMN IF NOT EXISTS "reset_code_expires" TIMESTAMPTZ;
