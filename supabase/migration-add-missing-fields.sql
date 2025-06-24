-- Migration to add missing fields for app functionality
-- Based on inspection of your current database on 2025-06-20
-- Run this to add fields that the app expects but are missing from current database

-- Add missing fields to projects table
DO $$ 
BEGIN
    -- Add description column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'description') THEN
        ALTER TABLE projects ADD COLUMN description TEXT;
        RAISE NOTICE 'Added description column to projects table';
    ELSE
        RAISE NOTICE 'description column already exists in projects table';
    END IF;
    
    -- Add status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'status') THEN
        ALTER TABLE projects ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'on_hold'));
        RAISE NOTICE 'Added status column to projects table';
    ELSE
        RAISE NOTICE 'status column already exists in projects table';
    END IF;
END $$;

-- Add missing fields to daily_logs table for additional log sections
DO $$ 
BEGIN
    -- Add weather column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'daily_logs' AND column_name = 'weather') THEN
        ALTER TABLE daily_logs ADD COLUMN weather TEXT;
        RAISE NOTICE 'Added weather column to daily_logs table';
    ELSE
        RAISE NOTICE 'weather column already exists in daily_logs table';
    END IF;
    
    -- Add temperature column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'daily_logs' AND column_name = 'temperature') THEN
        ALTER TABLE daily_logs ADD COLUMN temperature TEXT;
        RAISE NOTICE 'Added temperature column to daily_logs table';
    ELSE
        RAISE NOTICE 'temperature column already exists in daily_logs table';
    END IF;
END $$;

-- Add missing fields to crew_members table
DO $$ 
BEGIN
    -- Add phone column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crew_members' AND column_name = 'phone') THEN
        ALTER TABLE crew_members ADD COLUMN phone TEXT;
        RAISE NOTICE 'Added phone column to crew_members table';
    ELSE
        RAISE NOTICE 'phone column already exists in crew_members table';
    END IF;
    
    -- Add email column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crew_members' AND column_name = 'email') THEN
        ALTER TABLE crew_members ADD COLUMN email TEXT;
        RAISE NOTICE 'Added email column to crew_members table';
    ELSE
        RAISE NOTICE 'email column already exists in crew_members table';
    END IF;
    
    -- Add hourly_rate column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crew_members' AND column_name = 'hourly_rate') THEN
        ALTER TABLE crew_members ADD COLUMN hourly_rate DECIMAL(10,2);
        RAISE NOTICE 'Added hourly_rate column to crew_members table';
    ELSE
        RAISE NOTICE 'hourly_rate column already exists in crew_members table';
    END IF;
    
    -- Add notes column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crew_members' AND column_name = 'notes') THEN
        ALTER TABLE crew_members ADD COLUMN notes TEXT;
        RAISE NOTICE 'Added notes column to crew_members table';
    ELSE
        RAISE NOTICE 'notes column already exists in crew_members table';
    END IF;
    
    -- Add is_active column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crew_members' AND column_name = 'is_active') THEN
        ALTER TABLE crew_members ADD COLUMN is_active BOOLEAN DEFAULT true;
        RAISE NOTICE 'Added is_active column to crew_members table';
    ELSE
        RAISE NOTICE 'is_active column already exists in crew_members table';
    END IF;
END $$;

-- Add missing fields to subcontractors table (rename existing fields to match app expectations)
DO $$ 
BEGIN
    -- Rename contact_name to contact_person if contact_person doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subcontractors' AND column_name = 'contact_person') 
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subcontractors' AND column_name = 'contact_name') THEN
        ALTER TABLE subcontractors RENAME COLUMN contact_name TO contact_person;
        RAISE NOTICE 'Renamed contact_name to contact_person in subcontractors table';
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subcontractors' AND column_name = 'contact_person') THEN
        RAISE NOTICE 'contact_person column already exists in subcontractors table';
    END IF;
    
    -- Rename contact_phone to phone if phone doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subcontractors' AND column_name = 'phone') 
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subcontractors' AND column_name = 'contact_phone') THEN
        ALTER TABLE subcontractors RENAME COLUMN contact_phone TO phone;
        RAISE NOTICE 'Renamed contact_phone to phone in subcontractors table';
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subcontractors' AND column_name = 'phone') THEN
        RAISE NOTICE 'phone column already exists in subcontractors table';
    END IF;
    
    -- Rename contact_email to email if email doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subcontractors' AND column_name = 'email') 
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subcontractors' AND column_name = 'contact_email') THEN
        ALTER TABLE subcontractors RENAME COLUMN contact_email TO email;
        RAISE NOTICE 'Renamed contact_email to email in subcontractors table';
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subcontractors' AND column_name = 'email') THEN
        RAISE NOTICE 'email column already exists in subcontractors table';
    END IF;
    
    -- Add address column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subcontractors' AND column_name = 'address') THEN
        ALTER TABLE subcontractors ADD COLUMN address TEXT;
        RAISE NOTICE 'Added address column to subcontractors table';
    ELSE
        RAISE NOTICE 'address column already exists in subcontractors table';
    END IF;
    
    -- Add specialty column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subcontractors' AND column_name = 'specialty') THEN
        ALTER TABLE subcontractors ADD COLUMN specialty TEXT;
        RAISE NOTICE 'Added specialty column to subcontractors table';
    ELSE
        RAISE NOTICE 'specialty column already exists in subcontractors table';
    END IF;
    
    -- Add notes column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subcontractors' AND column_name = 'notes') THEN
        ALTER TABLE subcontractors ADD COLUMN notes TEXT;
        RAISE NOTICE 'Added notes column to subcontractors table';
    ELSE
        RAISE NOTICE 'notes column already exists in subcontractors table';
    END IF;
    
    -- Add is_active column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subcontractors' AND column_name = 'is_active') THEN
        ALTER TABLE subcontractors ADD COLUMN is_active BOOLEAN DEFAULT true;
        RAISE NOTICE 'Added is_active column to subcontractors table';
    ELSE
        RAISE NOTICE 'is_active column already exists in subcontractors table';
    END IF;
END $$;

-- Create additional tables that the app might need
-- Log photos table if it doesn't exist
CREATE TABLE IF NOT EXISTS log_photos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    log_id UUID REFERENCES daily_logs(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    caption TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Equipment table if it doesn't exist
CREATE TABLE IF NOT EXISTS equipment (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT,
    model TEXT,
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'in_use', 'maintenance', 'out_of_service')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Log equipment table if it doesn't exist (many-to-many relationship)
CREATE TABLE IF NOT EXISTS log_equipment (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    log_id UUID REFERENCES daily_logs(id) ON DELETE CASCADE,
    equipment_id UUID REFERENCES equipment(id) ON DELETE CASCADE,
    hours_used DECIMAL(5,2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add additional indexes
DO $$
BEGIN
    -- Check and create index on projects.status
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_projects_status') THEN
        CREATE INDEX idx_projects_status ON projects(status);
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
DROP POLICY IF EXISTS "Users can view all log photos" ON log_photos;
CREATE POLICY "Users can view all log photos" ON log_photos FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert log photos" ON log_photos;
CREATE POLICY "Users can insert log photos" ON log_photos FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update log photos" ON log_photos;
CREATE POLICY "Users can update log photos" ON log_photos FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Users can delete log photos" ON log_photos;
CREATE POLICY "Users can delete log photos" ON log_photos FOR DELETE USING (true);

DROP POLICY IF EXISTS "Users can view all equipment" ON equipment;
CREATE POLICY "Users can view all equipment" ON equipment FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert equipment" ON equipment;
CREATE POLICY "Users can insert equipment" ON equipment FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update equipment" ON equipment;
CREATE POLICY "Users can update equipment" ON equipment FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Users can delete equipment" ON equipment;
CREATE POLICY "Users can delete equipment" ON equipment FOR DELETE USING (true);

DROP POLICY IF EXISTS "Users can view all log equipment" ON log_equipment;
CREATE POLICY "Users can view all log equipment" ON log_equipment FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert log equipment" ON log_equipment;
CREATE POLICY "Users can insert log equipment" ON log_equipment FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update log equipment" ON log_equipment;
CREATE POLICY "Users can update log equipment" ON log_equipment FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Users can delete log equipment" ON log_equipment;
CREATE POLICY "Users can delete log equipment" ON log_equipment FOR DELETE USING (true);

-- Update existing records to have default values for new columns
DO $$
BEGIN
    -- Set default status for existing projects
    UPDATE projects SET status = 'active' WHERE status IS NULL;
    RAISE NOTICE 'Set default status for existing projects';
    
    -- Set default is_active for existing crew members
    UPDATE crew_members SET is_active = true WHERE is_active IS NULL;
    RAISE NOTICE 'Set default is_active for existing crew members';
    
    -- Set default is_active for existing subcontractors
    UPDATE subcontractors SET is_active = true WHERE is_active IS NULL;
    RAISE NOTICE 'Set default is_active for existing subcontractors';
    
    RAISE NOTICE 'Migration completed successfully! 🎉';
    RAISE NOTICE 'Your database now has all the fields your app expects.';
END $$;

-- Fix crew_id constraint issue - make crew_id optional
DO $$ 
BEGIN
    -- Make crew_id nullable to allow crew members without assigned crews
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'crew_members' 
        AND column_name = 'crew_id' 
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE crew_members ALTER COLUMN crew_id DROP NOT NULL;
        RAISE NOTICE 'Made crew_id nullable in crew_members table - crew members can now exist without assigned crews';
    ELSE
        RAISE NOTICE 'crew_id column is already nullable in crew_members table';
    END IF;
END $$;

COMMIT;
