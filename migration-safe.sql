-- Safe Migration Script - Only adds new columns/features if they don't exist
-- Run this in your Supabase SQL editor

-- Add new columns to projects table if they don't exist
DO $$ 
BEGIN
    -- Add description column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'description') THEN
        ALTER TABLE projects ADD COLUMN description TEXT;
    END IF;
    
    -- Add location column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'location') THEN
        ALTER TABLE projects ADD COLUMN location TEXT;
    END IF;
    
    -- Add start_date column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'start_date') THEN
        ALTER TABLE projects ADD COLUMN start_date DATE;
    END IF;
    
    -- Add end_date column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'end_date') THEN
        ALTER TABLE projects ADD COLUMN end_date DATE;
    END IF;
    
    -- Add status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'status') THEN
        ALTER TABLE projects ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'on_hold'));
    END IF;
END $$;

-- Add new columns to daily_logs table if they don't exist
DO $$ 
BEGIN
    -- Add project_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'daily_logs' AND column_name = 'project_id') THEN
        ALTER TABLE daily_logs ADD COLUMN project_id UUID REFERENCES projects(id);
    END IF;
    
    -- Add safety_notes column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'daily_logs' AND column_name = 'safety_notes') THEN
        ALTER TABLE daily_logs ADD COLUMN safety_notes TEXT;
    END IF;
    
    -- Add quality_notes column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'daily_logs' AND column_name = 'quality_notes') THEN
        ALTER TABLE daily_logs ADD COLUMN quality_notes TEXT;
    END IF;
    
    -- Add delays column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'daily_logs' AND column_name = 'delays') THEN
        ALTER TABLE daily_logs ADD COLUMN delays TEXT;
    END IF;
    
    -- Add materials_delivered column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'daily_logs' AND column_name = 'materials_delivered') THEN
        ALTER TABLE daily_logs ADD COLUMN materials_delivered TEXT;
    END IF;
    
    -- Add visitors column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'daily_logs' AND column_name = 'visitors') THEN
        ALTER TABLE daily_logs ADD COLUMN visitors TEXT;
    END IF;
END $$;

-- Add new columns to crew_members table if they don't exist
DO $$ 
BEGIN
    -- Add phone column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crew_members' AND column_name = 'phone') THEN
        ALTER TABLE crew_members ADD COLUMN phone TEXT;
    END IF;
    
    -- Add email column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crew_members' AND column_name = 'email') THEN
        ALTER TABLE crew_members ADD COLUMN email TEXT;
    END IF;
    
    -- Add hourly_rate column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crew_members' AND column_name = 'hourly_rate') THEN
        ALTER TABLE crew_members ADD COLUMN hourly_rate DECIMAL(10,2);
    END IF;
    
    -- Add notes column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crew_members' AND column_name = 'notes') THEN
        ALTER TABLE crew_members ADD COLUMN notes TEXT;
    END IF;
    
    -- Add is_active column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crew_members' AND column_name = 'is_active') THEN
        ALTER TABLE crew_members ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Add new columns to subcontractors table if they don't exist
DO $$ 
BEGIN
    -- Add contact_person column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subcontractors' AND column_name = 'contact_person') THEN
        ALTER TABLE subcontractors ADD COLUMN contact_person TEXT;
    END IF;
    
    -- Add phone column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subcontractors' AND column_name = 'phone') THEN
        ALTER TABLE subcontractors ADD COLUMN phone TEXT;
    END IF;
    
    -- Add email column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subcontractors' AND column_name = 'email') THEN
        ALTER TABLE subcontractors ADD COLUMN email TEXT;
    END IF;
    
    -- Add address column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subcontractors' AND column_name = 'address') THEN
        ALTER TABLE subcontractors ADD COLUMN address TEXT;
    END IF;
    
    -- Add specialty column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subcontractors' AND column_name = 'specialty') THEN
        ALTER TABLE subcontractors ADD COLUMN specialty TEXT;
    END IF;
    
    -- Add notes column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subcontractors' AND column_name = 'notes') THEN
        ALTER TABLE subcontractors ADD COLUMN notes TEXT;
    END IF;
    
    -- Add is_active column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subcontractors' AND column_name = 'is_active') THEN
        ALTER TABLE subcontractors ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Create log_photos table if it doesn't exist
CREATE TABLE IF NOT EXISTS log_photos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    log_id UUID REFERENCES daily_logs(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    caption TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create equipment table if it doesn't exist
CREATE TABLE IF NOT EXISTS equipment (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT,
    model TEXT,
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'in_use', 'maintenance', 'out_of_service')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create log_equipment table if it doesn't exist (many-to-many relationship)
CREATE TABLE IF NOT EXISTS log_equipment (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    log_id UUID REFERENCES daily_logs(id) ON DELETE CASCADE,
    equipment_id UUID REFERENCES equipment(id) ON DELETE CASCADE,
    hours_used DECIMAL(5,2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Add indexes if they don't exist
DO $$
BEGIN
    -- Check and create index on projects.status
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_projects_status') THEN
        CREATE INDEX idx_projects_status ON projects(status);
    END IF;
    
    -- Check and create index on daily_logs.project_id
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_daily_logs_project_id') THEN
        CREATE INDEX idx_daily_logs_project_id ON daily_logs(project_id);
    END IF;
    
    -- Check and create index on daily_logs.date
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_daily_logs_date') THEN
        CREATE INDEX idx_daily_logs_date ON daily_logs(date);
    END IF;
    
    -- Check and create index on crew_members.is_active
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_crew_members_active') THEN
        CREATE INDEX idx_crew_members_active ON crew_members(is_active);
    END IF;
    
    -- Check and create index on subcontractors.is_active
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_subcontractors_active') THEN
        CREATE INDEX idx_subcontractors_active ON subcontractors(is_active);
    END IF;
END $$;

-- Enable RLS on new tables
ALTER TABLE log_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE log_equipment ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for new tables
CREATE POLICY "Users can view all log photos" ON log_photos FOR SELECT USING (true);
CREATE POLICY "Users can insert log photos" ON log_photos FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update log photos" ON log_photos FOR UPDATE USING (true);
CREATE POLICY "Users can delete log photos" ON log_photos FOR DELETE USING (true);

CREATE POLICY "Users can view all equipment" ON equipment FOR SELECT USING (true);
CREATE POLICY "Users can insert equipment" ON equipment FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update equipment" ON equipment FOR UPDATE USING (true);
CREATE POLICY "Users can delete equipment" ON equipment FOR DELETE USING (true);

CREATE POLICY "Users can view all log equipment" ON log_equipment FOR SELECT USING (true);
CREATE POLICY "Users can insert log equipment" ON log_equipment FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update log equipment" ON log_equipment FOR UPDATE USING (true);
CREATE POLICY "Users can delete log equipment" ON log_equipment FOR DELETE USING (true);

-- Add sample data only if tables are empty
DO $$
BEGIN
    -- Add sample equipment if equipment table is empty
    IF NOT EXISTS (SELECT 1 FROM equipment LIMIT 1) THEN
        INSERT INTO equipment (name, type, model, status) VALUES
        ('Excavator CAT 320', 'Heavy Equipment', 'CAT 320', 'available'),
        ('Concrete Mixer', 'Construction Equipment', 'CM-500', 'available'),
        ('Crane', 'Heavy Equipment', 'Tower Crane TC-100', 'in_use'),
        ('Forklift', 'Material Handling', 'Toyota 8FGU25', 'available');
    END IF;
END $$;

-- Update existing records to have default values for new columns (optional)
-- Uncomment these if you want to set default values for existing records

-- UPDATE projects SET status = 'active' WHERE status IS NULL;
-- UPDATE crew_members SET is_active = true WHERE is_active IS NULL;
-- UPDATE subcontractors SET is_active = true WHERE is_active IS NULL;

COMMIT;
