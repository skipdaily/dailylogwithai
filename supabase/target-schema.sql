-- Complete Target Schema - This is what your database should look like after migrations
-- This includes all current tables plus the additional fields needed for the app

-- Projects table (enhanced)
CREATE TABLE IF NOT EXISTS projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    location TEXT,
    client TEXT,
    start_date DATE,
    end_date DATE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'on_hold')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Crews table (unchanged)
CREATE TABLE IF NOT EXISTS crews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Crew members table (enhanced)
CREATE TABLE IF NOT EXISTS crew_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    crew_id UUID NOT NULL REFERENCES crews(id),
    name TEXT NOT NULL,
    role TEXT,
    phone TEXT,
    email TEXT,
    hourly_rate DECIMAL(10,2),
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Subcontractors table (enhanced with renamed fields)
CREATE TABLE IF NOT EXISTS subcontractors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    specialty TEXT,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Daily logs table (enhanced)
CREATE TABLE IF NOT EXISTS daily_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL,
    project_id UUID NOT NULL REFERENCES projects(id),
    superintendent_name TEXT NOT NULL,
    weather TEXT,
    temperature TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Log sections table (unchanged)
CREATE TABLE IF NOT EXISTS log_sections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    log_id UUID NOT NULL REFERENCES daily_logs(id) ON DELETE CASCADE,
    section_type TEXT NOT NULL,
    content TEXT NOT NULL,
    order_num INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Log crews junction table (unchanged)
CREATE TABLE IF NOT EXISTS log_crews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    log_id UUID NOT NULL REFERENCES daily_logs(id) ON DELETE CASCADE,
    crew_id UUID NOT NULL REFERENCES crews(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Log subcontractors junction table (unchanged)
CREATE TABLE IF NOT EXISTS log_subcontractors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    log_id UUID NOT NULL REFERENCES daily_logs(id) ON DELETE CASCADE,
    subcontractor_id UUID NOT NULL REFERENCES subcontractors(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Log photos table (new)
CREATE TABLE IF NOT EXISTS log_photos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    log_id UUID REFERENCES daily_logs(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    caption TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Equipment table (new)
CREATE TABLE IF NOT EXISTS equipment (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT,
    model TEXT,
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'in_use', 'maintenance', 'out_of_service')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Log equipment junction table (new)
CREATE TABLE IF NOT EXISTS log_equipment (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    log_id UUID REFERENCES daily_logs(id) ON DELETE CASCADE,
    equipment_id UUID REFERENCES equipment(id) ON DELETE CASCADE,
    hours_used DECIMAL(5,2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_daily_logs_project_id ON daily_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_daily_logs_date ON daily_logs(date);
CREATE INDEX IF NOT EXISTS idx_crew_members_crew_id ON crew_members(crew_id);
CREATE INDEX IF NOT EXISTS idx_crew_members_active ON crew_members(is_active);
CREATE INDEX IF NOT EXISTS idx_subcontractors_active ON subcontractors(is_active);
CREATE INDEX IF NOT EXISTS idx_log_sections_log_id ON log_sections(log_id);
CREATE INDEX IF NOT EXISTS idx_log_crews_log_id ON log_crews(log_id);
CREATE INDEX IF NOT EXISTS idx_log_crews_crew_id ON log_crews(crew_id);
CREATE INDEX IF NOT EXISTS idx_log_subcontractors_log_id ON log_subcontractors(log_id);
CREATE INDEX IF NOT EXISTS idx_log_subcontractors_subcontractor_id ON log_subcontractors(subcontractor_id);

-- Enable Row Level Security on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE crews ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcontractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE log_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE log_crews ENABLE ROW LEVEL SECURITY;
ALTER TABLE log_subcontractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE log_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE log_equipment ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allowing all operations for now - adjust as needed for your security requirements)
-- Projects
DROP POLICY IF EXISTS "Users can view all projects" ON projects;
CREATE POLICY "Users can view all projects" ON projects FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert projects" ON projects;
CREATE POLICY "Users can insert projects" ON projects FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update projects" ON projects;
CREATE POLICY "Users can update projects" ON projects FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Users can delete projects" ON projects;
CREATE POLICY "Users can delete projects" ON projects FOR DELETE USING (true);

-- Crews
DROP POLICY IF EXISTS "Users can view all crews" ON crews;
CREATE POLICY "Users can view all crews" ON crews FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert crews" ON crews;
CREATE POLICY "Users can insert crews" ON crews FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update crews" ON crews;
CREATE POLICY "Users can update crews" ON crews FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Users can delete crews" ON crews;
CREATE POLICY "Users can delete crews" ON crews FOR DELETE USING (true);

-- Crew members
DROP POLICY IF EXISTS "Users can view all crew members" ON crew_members;
CREATE POLICY "Users can view all crew members" ON crew_members FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert crew members" ON crew_members;
CREATE POLICY "Users can insert crew members" ON crew_members FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update crew members" ON crew_members;
CREATE POLICY "Users can update crew members" ON crew_members FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Users can delete crew members" ON crew_members;
CREATE POLICY "Users can delete crew members" ON crew_members FOR DELETE USING (true);

-- Subcontractors
DROP POLICY IF EXISTS "Users can view all subcontractors" ON subcontractors;
CREATE POLICY "Users can view all subcontractors" ON subcontractors FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert subcontractors" ON subcontractors;
CREATE POLICY "Users can insert subcontractors" ON subcontractors FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update subcontractors" ON subcontractors;
CREATE POLICY "Users can update subcontractors" ON subcontractors FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Users can delete subcontractors" ON subcontractors;
CREATE POLICY "Users can delete subcontractors" ON subcontractors FOR DELETE USING (true);

-- Daily logs
DROP POLICY IF EXISTS "Users can view all daily logs" ON daily_logs;
CREATE POLICY "Users can view all daily logs" ON daily_logs FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert daily logs" ON daily_logs;
CREATE POLICY "Users can insert daily logs" ON daily_logs FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update daily logs" ON daily_logs;
CREATE POLICY "Users can update daily logs" ON daily_logs FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Users can delete daily logs" ON daily_logs;
CREATE POLICY "Users can delete daily logs" ON daily_logs FOR DELETE USING (true);

-- Log sections
DROP POLICY IF EXISTS "Users can view all log sections" ON log_sections;
CREATE POLICY "Users can view all log sections" ON log_sections FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert log sections" ON log_sections;
CREATE POLICY "Users can insert log sections" ON log_sections FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update log sections" ON log_sections;
CREATE POLICY "Users can update log sections" ON log_sections FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Users can delete log sections" ON log_sections;
CREATE POLICY "Users can delete log sections" ON log_sections FOR DELETE USING (true);

-- Log crews
DROP POLICY IF EXISTS "Users can view all log crews" ON log_crews;
CREATE POLICY "Users can view all log crews" ON log_crews FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert log crews" ON log_crews;
CREATE POLICY "Users can insert log crews" ON log_crews FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update log crews" ON log_crews;
CREATE POLICY "Users can update log crews" ON log_crews FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Users can delete log crews" ON log_crews;
CREATE POLICY "Users can delete log crews" ON log_crews FOR DELETE USING (true);

-- Log subcontractors
DROP POLICY IF EXISTS "Users can view all log subcontractors" ON log_subcontractors;
CREATE POLICY "Users can view all log subcontractors" ON log_subcontractors FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert log subcontractors" ON log_subcontractors;
CREATE POLICY "Users can insert log subcontractors" ON log_subcontractors FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update log subcontractors" ON log_subcontractors;
CREATE POLICY "Users can update log subcontractors" ON log_subcontractors FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Users can delete log subcontractors" ON log_subcontractors;
CREATE POLICY "Users can delete log subcontractors" ON log_subcontractors FOR DELETE USING (true);

-- Log photos
DROP POLICY IF EXISTS "Users can view all log photos" ON log_photos;
CREATE POLICY "Users can view all log photos" ON log_photos FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert log photos" ON log_photos;
CREATE POLICY "Users can insert log photos" ON log_photos FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update log photos" ON log_photos;
CREATE POLICY "Users can update log photos" ON log_photos FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Users can delete log photos" ON log_photos;
CREATE POLICY "Users can delete log photos" ON log_photos FOR DELETE USING (true);

-- Equipment
DROP POLICY IF EXISTS "Users can view all equipment" ON equipment;
CREATE POLICY "Users can view all equipment" ON equipment FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert equipment" ON equipment;
CREATE POLICY "Users can insert equipment" ON equipment FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update equipment" ON equipment;
CREATE POLICY "Users can update equipment" ON equipment FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Users can delete equipment" ON equipment;
CREATE POLICY "Users can delete equipment" ON equipment FOR DELETE USING (true);

-- Log equipment
DROP POLICY IF EXISTS "Users can view all log equipment" ON log_equipment;
CREATE POLICY "Users can view all log equipment" ON log_equipment FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert log equipment" ON log_equipment;
CREATE POLICY "Users can insert log equipment" ON log_equipment FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update log equipment" ON log_equipment;
CREATE POLICY "Users can update log equipment" ON log_equipment FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Users can delete log equipment" ON log_equipment;
CREATE POLICY "Users can delete log equipment" ON log_equipment FOR DELETE USING (true);
