-- Current Database Schema (matches existing structure)
-- This represents the actual state of your database

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT,
    client TEXT,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Crews table
CREATE TABLE IF NOT EXISTS crews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Crew members table
CREATE TABLE IF NOT EXISTS crew_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    crew_id UUID NOT NULL REFERENCES crews(id),
    name TEXT NOT NULL,
    role TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Subcontractors table
CREATE TABLE IF NOT EXISTS subcontractors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    contact_name TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Daily logs table
CREATE TABLE IF NOT EXISTS daily_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL,
    project_id UUID NOT NULL REFERENCES projects(id),
    superintendent_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Log sections table (for storing different sections of the daily log)
CREATE TABLE IF NOT EXISTS log_sections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    log_id UUID NOT NULL REFERENCES daily_logs(id) ON DELETE CASCADE,
    section_type TEXT NOT NULL,
    content TEXT NOT NULL,
    order_num INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Log crews junction table (many-to-many between logs and crews)
CREATE TABLE IF NOT EXISTS log_crews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    log_id UUID NOT NULL REFERENCES daily_logs(id) ON DELETE CASCADE,
    crew_id UUID NOT NULL REFERENCES crews(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Log subcontractors junction table (many-to-many between logs and subcontractors)
CREATE TABLE IF NOT EXISTS log_subcontractors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    log_id UUID NOT NULL REFERENCES daily_logs(id) ON DELETE CASCADE,
    subcontractor_id UUID NOT NULL REFERENCES subcontractors(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_daily_logs_project_id ON daily_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_daily_logs_date ON daily_logs(date);
CREATE INDEX IF NOT EXISTS idx_crew_members_crew_id ON crew_members(crew_id);
CREATE INDEX IF NOT EXISTS idx_log_sections_log_id ON log_sections(log_id);
CREATE INDEX IF NOT EXISTS idx_log_crews_log_id ON log_crews(log_id);
CREATE INDEX IF NOT EXISTS idx_log_crews_crew_id ON log_crews(crew_id);
CREATE INDEX IF NOT EXISTS idx_log_subcontractors_log_id ON log_subcontractors(log_id);
CREATE INDEX IF NOT EXISTS idx_log_subcontractors_subcontractor_id ON log_subcontractors(subcontractor_id);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE crews ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcontractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE log_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE log_crews ENABLE ROW LEVEL SECURITY;
ALTER TABLE log_subcontractors ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allowing all operations for now - adjust as needed)
-- Projects policies
DROP POLICY IF EXISTS "Users can view all projects" ON projects;
CREATE POLICY "Users can view all projects" ON projects FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert projects" ON projects;
CREATE POLICY "Users can insert projects" ON projects FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update projects" ON projects;
CREATE POLICY "Users can update projects" ON projects FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Users can delete projects" ON projects;
CREATE POLICY "Users can delete projects" ON projects FOR DELETE USING (true);

-- Crews policies
DROP POLICY IF EXISTS "Users can view all crews" ON crews;
CREATE POLICY "Users can view all crews" ON crews FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert crews" ON crews;
CREATE POLICY "Users can insert crews" ON crews FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update crews" ON crews;
CREATE POLICY "Users can update crews" ON crews FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Users can delete crews" ON crews;
CREATE POLICY "Users can delete crews" ON crews FOR DELETE USING (true);

-- Crew members policies
DROP POLICY IF EXISTS "Users can view all crew members" ON crew_members;
CREATE POLICY "Users can view all crew members" ON crew_members FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert crew members" ON crew_members;
CREATE POLICY "Users can insert crew members" ON crew_members FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update crew members" ON crew_members;
CREATE POLICY "Users can update crew members" ON crew_members FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Users can delete crew members" ON crew_members;
CREATE POLICY "Users can delete crew members" ON crew_members FOR DELETE USING (true);

-- Subcontractors policies
DROP POLICY IF EXISTS "Users can view all subcontractors" ON subcontractors;
CREATE POLICY "Users can view all subcontractors" ON subcontractors FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert subcontractors" ON subcontractors;
CREATE POLICY "Users can insert subcontractors" ON subcontractors FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update subcontractors" ON subcontractors;
CREATE POLICY "Users can update subcontractors" ON subcontractors FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Users can delete subcontractors" ON subcontractors;
CREATE POLICY "Users can delete subcontractors" ON subcontractors FOR DELETE USING (true);

-- Daily logs policies
DROP POLICY IF EXISTS "Users can view all daily logs" ON daily_logs;
CREATE POLICY "Users can view all daily logs" ON daily_logs FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert daily logs" ON daily_logs;
CREATE POLICY "Users can insert daily logs" ON daily_logs FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update daily logs" ON daily_logs;
CREATE POLICY "Users can update daily logs" ON daily_logs FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Users can delete daily logs" ON daily_logs;
CREATE POLICY "Users can delete daily logs" ON daily_logs FOR DELETE USING (true);

-- Log sections policies
DROP POLICY IF EXISTS "Users can view all log sections" ON log_sections;
CREATE POLICY "Users can view all log sections" ON log_sections FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert log sections" ON log_sections;
CREATE POLICY "Users can insert log sections" ON log_sections FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update log sections" ON log_sections;
CREATE POLICY "Users can update log sections" ON log_sections FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Users can delete log sections" ON log_sections;
CREATE POLICY "Users can delete log sections" ON log_sections FOR DELETE USING (true);

-- Log crews policies
DROP POLICY IF EXISTS "Users can view all log crews" ON log_crews;
CREATE POLICY "Users can view all log crews" ON log_crews FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert log crews" ON log_crews;
CREATE POLICY "Users can insert log crews" ON log_crews FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update log crews" ON log_crews;
CREATE POLICY "Users can update log crews" ON log_crews FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Users can delete log crews" ON log_crews;
CREATE POLICY "Users can delete log crews" ON log_crews FOR DELETE USING (true);

-- Log subcontractors policies
DROP POLICY IF EXISTS "Users can view all log subcontractors" ON log_subcontractors;
CREATE POLICY "Users can view all log subcontractors" ON log_subcontractors FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert log subcontractors" ON log_subcontractors;
CREATE POLICY "Users can insert log subcontractors" ON log_subcontractors FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update log subcontractors" ON log_subcontractors;
CREATE POLICY "Users can update log subcontractors" ON log_subcontractors FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Users can delete log subcontractors" ON log_subcontractors;
CREATE POLICY "Users can delete log subcontractors" ON log_subcontractors FOR DELETE USING (true);
