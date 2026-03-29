-- Create storage bucket for Excel uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES ('uploads', 'uploads', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for uploads bucket
CREATE POLICY "Allow public uploads" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'uploads');

CREATE POLICY "Allow public downloads" ON storage.objects 
FOR SELECT USING (bucket_id = 'uploads');

CREATE POLICY "Allow public deletes" ON storage.objects 
FOR DELETE USING (bucket_id = 'uploads');

-- Create courses table
CREATE TABLE public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  schedule TEXT,
  price NUMERIC(10,2),
  payment_link TEXT,
  instructor TEXT,
  max_participants INTEGER,
  age_group TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create shows table  
CREATE TABLE public.shows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  show_date TIMESTAMP WITH TIME ZONE,
  venue TEXT,
  price NUMERIC(10,2),
  vip_price NUMERIC(10,2),
  ticket_link TEXT,
  duration_minutes INTEGER,
  age_restriction TEXT,
  is_active BOOLEAN DEFAULT true,
  seats_available INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shows ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow all operations on courses" ON public.courses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on shows" ON public.shows FOR ALL USING (true) WITH CHECK (true);

-- Triggers for updated_at
CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shows_updated_at
  BEFORE UPDATE ON public.shows
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();