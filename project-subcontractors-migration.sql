-- Create project_subcontractors junction table to link projects with subcontractors
CREATE TABLE IF NOT EXISTS public.project_subcontractors (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  subcontractor_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'active',
  assigned_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT project_subcontractors_pkey PRIMARY KEY (id),
  CONSTRAINT project_subcontractors_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE,
  CONSTRAINT project_subcontractors_subcontractor_id_fkey FOREIGN KEY (subcontractor_id) REFERENCES public.subcontractors(id) ON DELETE CASCADE,
  CONSTRAINT project_subcontractors_status_check CHECK (status IN ('active', 'inactive', 'completed')),
  CONSTRAINT project_subcontractors_unique UNIQUE (project_id, subcontractor_id)
) TABLESPACE pg_default;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_project_subcontractors_project_id ON public.project_subcontractors USING btree (project_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_project_subcontractors_subcontractor_id ON public.project_subcontractors USING btree (subcontractor_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_project_subcontractors_status ON public.project_subcontractors USING btree (status) TABLESPACE pg_default;

-- Create trigger for updated_at (assuming you have the update_updated_at_column function)
CREATE TRIGGER update_project_subcontractors_updated_at 
  BEFORE UPDATE ON public.project_subcontractors 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS (Row Level Security) - adjust policies based on your auth setup
ALTER TABLE public.project_subcontractors ENABLE ROW LEVEL SECURITY;

-- Example RLS policy - uncomment and adjust based on your authentication system
-- CREATE POLICY "Enable all operations for authenticated users" ON public.project_subcontractors
--   FOR ALL USING (auth.role() = 'authenticated');
