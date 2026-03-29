-- Add columns for smart intent recognition to leads table
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS ad_name TEXT,
ADD COLUMN IF NOT EXISTS interest TEXT,
ADD COLUMN IF NOT EXISTS campaign_id TEXT;

-- Add comment for clarity
COMMENT ON COLUMN public.leads.ad_name IS 'Name of the Facebook ad that generated this lead';
COMMENT ON COLUMN public.leads.interest IS 'Lead interest: course, show, general';
COMMENT ON COLUMN public.leads.campaign_id IS 'Facebook campaign ID for analytics';