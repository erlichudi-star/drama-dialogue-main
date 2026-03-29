
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS year integer,
  ADD COLUMN IF NOT EXISTS semester text,
  ADD COLUMN IF NOT EXISTS track text;

ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS discount numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS student_notes text;
