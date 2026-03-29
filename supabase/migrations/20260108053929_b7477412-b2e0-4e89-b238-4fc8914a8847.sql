-- Create enrollments table for customer-course relationship
CREATE TABLE public.enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'enrolled', -- 'enrolled', 'completed', 'cancelled', 'pending_payment'
  payment_status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'refunded', 'partial'
  amount_paid NUMERIC DEFAULT 0,
  notes TEXT,
  enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(customer_id, course_id)
);

-- Create custom columns table for dynamic fields
CREATE TABLE public.custom_columns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type TEXT NOT NULL, -- 'customer', 'enrollment', 'lead'
  column_name TEXT NOT NULL,
  column_label TEXT NOT NULL,
  column_type TEXT NOT NULL DEFAULT 'text', -- 'text', 'number', 'date', 'select', 'boolean'
  options JSONB, -- for select type
  is_required BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create custom column values table
CREATE TABLE public.custom_column_values (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  custom_column_id UUID NOT NULL REFERENCES public.custom_columns(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL, -- customer_id, enrollment_id, or lead_id
  value TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(custom_column_id, entity_id)
);

-- Enable RLS
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_column_values ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow all operations on enrollments" 
ON public.enrollments FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on custom_columns" 
ON public.custom_columns FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on custom_column_values" 
ON public.custom_column_values FOR ALL USING (true) WITH CHECK (true);

-- Add trigger for updated_at
CREATE TRIGGER update_enrollments_updated_at
BEFORE UPDATE ON public.enrollments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_custom_column_values_updated_at
BEFORE UPDATE ON public.custom_column_values
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();