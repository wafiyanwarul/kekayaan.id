-- Supabase Migration: Add mutasi_usage table for rate limiting
-- Run this in Supabase SQL Editor or via migration tool
-- Purpose: Track AI extraction usage per user per day (max 3/day)

CREATE TABLE IF NOT EXISTS public.mutasi_usage (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  used_at     timestamptz NOT NULL DEFAULT now(),
  pages_count int NOT NULL DEFAULT 1,
  bank        text NOT NULL DEFAULT 'bca',
  status      text NOT NULL DEFAULT 'success' -- 'success' | 'failed' | 'partial'
);

-- Index for fast daily count queries per user
CREATE INDEX IF NOT EXISTS idx_mutasi_usage_user_date
  ON public.mutasi_usage (user_id, used_at);

-- Enable RLS
ALTER TABLE public.mutasi_usage ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only insert their own usage records
CREATE POLICY "Users can insert own mutasi usage"
  ON public.mutasi_usage
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own usage records  
CREATE POLICY "Users can view own mutasi usage"
  ON public.mutasi_usage
  FOR SELECT
  USING (auth.uid() = user_id);
