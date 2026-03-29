-- Create customers table
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES public.leads(id),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  total_purchases NUMERIC DEFAULT 0,
  notes TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create activities table for tracking all actions
CREATE TABLE public.activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES public.leads(id),
  customer_id UUID REFERENCES public.customers(id),
  type TEXT NOT NULL, -- 'message_sent', 'email_sent', 'call', 'note', 'status_change', 'lead_created', 'converted_to_customer'
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL, -- 'new_lead', 'follow_up', 'conversion', 'message_received'
  title TEXT NOT NULL,
  message TEXT,
  is_read BOOLEAN DEFAULT false,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create follow_ups table for scheduled messages
CREATE TABLE public.follow_ups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES public.leads(id),
  customer_id UUID REFERENCES public.customers(id),
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'whatsapp', -- 'whatsapp', 'email'
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'cancelled'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;

-- Create policies for customers
CREATE POLICY "Allow all operations on customers" 
ON public.customers 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create policies for activities
CREATE POLICY "Allow all operations on activities" 
ON public.activities 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create policies for notifications
CREATE POLICY "Allow all operations on notifications" 
ON public.notifications 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create policies for follow_ups
CREATE POLICY "Allow all operations on follow_ups" 
ON public.follow_ups 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Add triggers for updated_at
CREATE TRIGGER update_customers_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;