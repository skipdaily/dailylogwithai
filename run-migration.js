const { createClient } = require('@supabase/supabase-js');

// You'll need to add your actual Supabase URL and service role key here
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role key for admin operations

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('Running project_subcontractors table migration...');
  
  const migrationSQL = `
    -- Create project_subcontractors junction table
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
    );

    -- Create indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_project_subcontractors_project_id ON public.project_subcontractors USING btree (project_id);
    CREATE INDEX IF NOT EXISTS idx_project_subcontractors_subcontractor_id ON public.project_subcontractors USING btree (subcontractor_id);
    CREATE INDEX IF NOT EXISTS idx_project_subcontractors_status ON public.project_subcontractors USING btree (status);
  `;

  try {
    const { error } = await supabase.rpc('exec', { sql: migrationSQL });
    
    if (error) {
      console.error('Migration failed:', error);
      return;
    }
    
    console.log('Migration completed successfully!');
    console.log('✅ project_subcontractors table created');
    console.log('✅ Indexes created');
    console.log('✅ Foreign key constraints added');
    
  } catch (error) {
    console.error('Error running migration:', error);
  }
}

runMigration();
