
-- 1. ea_events
CREATE TABLE public.ea_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cpt_type TEXT NOT NULL DEFAULT 'event',
  title TEXT NOT NULL,
  event_date TIMESTAMP WITH TIME ZONE,
  location TEXT,
  price NUMERIC,
  early_bird_price NUMERIC,
  url TEXT,
  image_url TEXT,
  extra_fields JSONB DEFAULT '{}'::jsonb,
  synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.ea_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on ea_events" ON public.ea_events FOR ALL USING (true) WITH CHECK (true);

-- 2. ea_campaign_templates
CREATE TABLE public.ea_campaign_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cpt_type TEXT NOT NULL,
  name TEXT NOT NULL,
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.ea_campaign_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on ea_campaign_templates" ON public.ea_campaign_templates FOR ALL USING (true) WITH CHECK (true);

-- 3. ea_campaigns
CREATE TABLE public.ea_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.ea_events(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.ea_campaign_templates(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.ea_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on ea_campaigns" ON public.ea_campaigns FOR ALL USING (true) WITH CHECK (true);

-- 4. ea_scheduled_posts
CREATE TABLE public.ea_scheduled_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES public.ea_campaigns(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.ea_events(id) ON DELETE CASCADE,
  target_date DATE NOT NULL,
  phase TEXT,
  platforms TEXT[] DEFAULT '{}',
  content_email TEXT,
  content_facebook TEXT,
  content_instagram TEXT,
  content_whatsapp TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  approved_at TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.ea_scheduled_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on ea_scheduled_posts" ON public.ea_scheduled_posts FOR ALL USING (true) WITH CHECK (true);

-- 5. ea_logs
CREATE TABLE public.ea_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  log_type TEXT NOT NULL DEFAULT 'system',
  level TEXT NOT NULL DEFAULT 'info',
  source TEXT,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.ea_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on ea_logs" ON public.ea_logs FOR ALL USING (true) WITH CHECK (true);
