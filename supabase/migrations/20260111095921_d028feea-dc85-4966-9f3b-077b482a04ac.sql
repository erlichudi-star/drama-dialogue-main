-- Add source_url column to knowledge_base table
ALTER TABLE public.knowledge_base 
ADD COLUMN IF NOT EXISTS source_url TEXT DEFAULT NULL;