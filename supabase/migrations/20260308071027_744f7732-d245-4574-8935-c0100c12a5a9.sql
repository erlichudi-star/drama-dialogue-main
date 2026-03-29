
-- Create automation_rules table
CREATE TABLE public.automation_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  trigger_type TEXT NOT NULL, -- 'new_lead', 'no_response', 'enrollment', 'status_change'
  condition JSONB NOT NULL DEFAULT '{}'::jsonb, -- e.g. {"hours": 48, "source": "Facebook", "status": "New"}
  action_type TEXT NOT NULL DEFAULT 'send_message', -- 'send_message', 'create_follow_up', 'notify'
  template_id UUID REFERENCES public.message_templates(id) ON DELETE SET NULL,
  custom_message TEXT,
  delay_minutes INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_run_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;

-- Allow all operations (no auth in this project)
CREATE POLICY "Allow all operations on automation_rules" ON public.automation_rules FOR ALL USING (true) WITH CHECK (true);

-- Enable pg_cron and pg_net extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
