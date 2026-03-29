-- Create show_performances table
CREATE TABLE public.show_performances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id uuid NOT NULL REFERENCES public.shows(id) ON DELETE CASCADE,
  performance_date timestamptz NOT NULL,
  venue text,
  seats_available integer,
  ticket_link text,
  is_cancelled boolean DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.show_performances ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Allow all operations on show_performances" 
  ON public.show_performances 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.show_performances;

-- Create trigger for updated_at
CREATE TRIGGER update_show_performances_updated_at
  BEFORE UPDATE ON public.show_performances
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Migrate existing data from shows to show_performances
INSERT INTO public.show_performances (show_id, performance_date, venue, seats_available)
SELECT id, show_date, venue, seats_available 
FROM public.shows 
WHERE show_date IS NOT NULL;

-- Remove old columns from shows table
ALTER TABLE public.shows DROP COLUMN IF EXISTS show_date;
ALTER TABLE public.shows DROP COLUMN IF EXISTS seats_available;