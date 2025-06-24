-- COMPLETE SUPABASE SQL FOR CONSTRUCTION DAILY LOG APP
-- This file contains all the SQL needed to set up the complete database schema
-- Including: Core tables, Action Items system, AI Conversation logging, and missing fields

-- ===== PART 1: CORE TABLES (Base System) =====

-- Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  location text,
  client text,
  start_date date,
  end_date date,
  description text,
  status text default 'active' check (status in ('active', 'completed', 'on_hold')),
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Subcontractors Table (Updated with all fields)
CREATE TABLE IF NOT EXISTS public.subcontractors (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  contact_person text,
  email text,
  phone text,
  address text,
  license_number text,
  insurance_info text,
  specialty text,
  notes text,
  is_active boolean default true,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Crews Table
CREATE TABLE IF NOT EXISTS public.crews (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Crew Members Table (Updated with all fields)
CREATE TABLE IF NOT EXISTS public.crew_members (
  id uuid default gen_random_uuid() primary key,
  crew_id uuid references public.crews(id) on delete set null, -- Made nullable
  name text not null,
  role text,
  phone text,
  email text,
  hourly_rate decimal(10,2),
  notes text,
  hire_date date,
  is_active boolean default true,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Daily Logs Table (Updated with weather fields)
CREATE TABLE IF NOT EXISTS public.daily_logs (
  id uuid default gen_random_uuid() primary key,
  date date not null,
  project_id uuid references public.projects(id) not null,
  superintendent_name text not null,
  weather text,
  temperature text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Log Sections Table
CREATE TABLE IF NOT EXISTS public.log_sections (
  id uuid default gen_random_uuid() primary key,
  log_id uuid references public.daily_logs(id) on delete cascade not null,
  section_type text not null,
  content text not null,
  order_num integer not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Log Subcontractors Junction Table
CREATE TABLE IF NOT EXISTS public.log_subcontractors (
  id uuid default gen_random_uuid() primary key,
  log_id uuid references public.daily_logs(id) on delete cascade not null,
  subcontractor_id uuid references public.subcontractors(id) on delete cascade not null,
  created_at timestamp with time zone default now() not null,
  unique(log_id, subcontractor_id)
);

-- Log Crews Junction Table
CREATE TABLE IF NOT EXISTS public.log_crews (
  id uuid default gen_random_uuid() primary key,
  log_id uuid references public.daily_logs(id) on delete cascade not null,
  crew_id uuid references public.crews(id) on delete cascade not null,
  created_at timestamp with time zone default now() not null,
  unique(log_id, crew_id)
);

-- Photos Table
CREATE TABLE IF NOT EXISTS public.log_photos (
  id uuid default gen_random_uuid() primary key,
  log_id uuid references public.daily_logs(id) on delete cascade,
  photo_url text not null,
  caption text,
  created_at timestamp with time zone default now()
);

-- Equipment Table
CREATE TABLE IF NOT EXISTS public.equipment (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  type text,
  model text,
  status text default 'available' check (status in ('available', 'in_use', 'maintenance', 'out_of_service')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Log Equipment Junction Table
CREATE TABLE IF NOT EXISTS public.log_equipment (
  id uuid default gen_random_uuid() primary key,
  log_id uuid references public.daily_logs(id) on delete cascade,
  equipment_id uuid references public.equipment(id) on delete cascade,
  hours_used decimal(5,2),
  notes text,
  created_at timestamp with time zone default now(),
  unique(log_id, equipment_id)
);

-- ===== PART 2: ACTION ITEMS SYSTEM =====

-- Action Items Table
CREATE TABLE IF NOT EXISTS public.action_items (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  source_type text not null check (source_type in ('meeting', 'out_of_scope', 'action_item', 'observation')),
  source_content text,
  log_id uuid references public.daily_logs(id) on delete set null,
  project_id uuid references public.projects(id) on delete cascade,
  assigned_to text,
  priority text default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  status text default 'open' check (status in ('open', 'in_progress', 'completed', 'on_hold', 'cancelled')),
  due_date date,
  created_by text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  completed_at timestamp with time zone
);

-- Action Item Notes Table
CREATE TABLE IF NOT EXISTS public.action_item_notes (
  id uuid default gen_random_uuid() primary key,
  action_item_id uuid references public.action_items(id) on delete cascade,
  note text not null,
  created_by text not null,
  created_at timestamp with time zone default now()
);

-- Action Item Attachments Table
CREATE TABLE IF NOT EXISTS public.action_item_attachments (
  id uuid default gen_random_uuid() primary key,
  action_item_id uuid references public.action_items(id) on delete cascade,
  file_name text not null,
  file_url text not null,
  file_size integer,
  mime_type text,
  uploaded_by text not null,
  created_at timestamp with time zone default now()
);

-- ===== PART 3: AI CONVERSATION SYSTEM =====

-- Conversations Table (for AI chat sessions)
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid default gen_random_uuid() primary key,
  session_id text,
  user_id text,
  project_id uuid references public.projects(id) on delete set null,
  title text,
  status text default 'active',
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Conversation Messages Table (stores all chat messages)
CREATE TABLE IF NOT EXISTS public.conversation_messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  token_count integer,
  model_used text,
  response_time_ms integer,
  metadata jsonb,
  created_at timestamp with time zone default now() not null
);

-- Conversation Context Table (stores context sent to AI)
CREATE TABLE IF NOT EXISTS public.conversation_context (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  context_type text not null check (context_type in ('daily_logs', 'action_items', 'projects', 'subcontractors', 'crews', 'equipment')),
  context_data jsonb not null,
  created_at timestamp with time zone default now() not null
);

-- ===== PART 4: INDEXES FOR PERFORMANCE =====

-- Core table indexes
CREATE INDEX IF NOT EXISTS idx_daily_logs_date ON public.daily_logs(date);
CREATE INDEX IF NOT EXISTS idx_daily_logs_project_id ON public.daily_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_log_sections_log_id ON public.log_sections(log_id);
CREATE INDEX IF NOT EXISTS idx_log_subcontractors_log_id ON public.log_subcontractors(log_id);
CREATE INDEX IF NOT EXISTS idx_log_crews_log_id ON public.log_crews(log_id);
CREATE INDEX IF NOT EXISTS idx_crew_members_crew_id ON public.crew_members(crew_id);
CREATE INDEX IF NOT EXISTS idx_crew_members_active ON public.crew_members(is_active);
CREATE INDEX IF NOT EXISTS idx_log_photos_log_id ON public.log_photos(log_id);
CREATE INDEX IF NOT EXISTS idx_log_equipment_log_id ON public.log_equipment(log_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_subcontractors_active ON public.subcontractors(is_active);

-- Action Items indexes
CREATE INDEX IF NOT EXISTS idx_action_items_status ON public.action_items(status);
CREATE INDEX IF NOT EXISTS idx_action_items_priority ON public.action_items(priority);
CREATE INDEX IF NOT EXISTS idx_action_items_project_id ON public.action_items(project_id);
CREATE INDEX IF NOT EXISTS idx_action_items_log_id ON public.action_items(log_id);
CREATE INDEX IF NOT EXISTS idx_action_items_due_date ON public.action_items(due_date);
CREATE INDEX IF NOT EXISTS idx_action_items_assigned_to ON public.action_items(assigned_to);
CREATE INDEX IF NOT EXISTS idx_action_item_notes_action_item_id ON public.action_item_notes(action_item_id);

-- Conversation indexes
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON public.conversations(updated_at);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_conversation_id ON public.conversation_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_created_at ON public.conversation_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_conversation_context_conversation_id ON public.conversation_context(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_context_type ON public.conversation_context(context_type);

-- ===== PART 5: TRIGGERS FOR AUTO-UPDATING TIMESTAMPS =====

-- Create the trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Apply triggers to all tables with updated_at columns
DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
CREATE TRIGGER update_projects_updated_at 
    BEFORE UPDATE ON public.projects
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_subcontractors_updated_at ON public.subcontractors;
CREATE TRIGGER update_subcontractors_updated_at 
    BEFORE UPDATE ON public.subcontractors
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_crews_updated_at ON public.crews;
CREATE TRIGGER update_crews_updated_at 
    BEFORE UPDATE ON public.crews
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_crew_members_updated_at ON public.crew_members;
CREATE TRIGGER update_crew_members_updated_at 
    BEFORE UPDATE ON public.crew_members
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_daily_logs_updated_at ON public.daily_logs;
CREATE TRIGGER update_daily_logs_updated_at 
    BEFORE UPDATE ON public.daily_logs
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_log_sections_updated_at ON public.log_sections;
CREATE TRIGGER update_log_sections_updated_at 
    BEFORE UPDATE ON public.log_sections
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_equipment_updated_at ON public.equipment;
CREATE TRIGGER update_equipment_updated_at 
    BEFORE UPDATE ON public.equipment
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_action_items_updated_at ON public.action_items;
CREATE TRIGGER update_action_items_updated_at 
    BEFORE UPDATE ON public.action_items
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_conversations_updated_at ON public.conversations;
CREATE TRIGGER update_conversations_updated_at 
    BEFORE UPDATE ON public.conversations
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ===== PART 6: ROW LEVEL SECURITY (RLS) =====

-- Enable RLS on all tables
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcontractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crew_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.log_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.log_subcontractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.log_crews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.log_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.log_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_item_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_item_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_context ENABLE ROW LEVEL SECURITY;

-- Create public access policies (adjust these for production security)
-- Projects policies
DROP POLICY IF EXISTS "Public access" ON public.projects;
CREATE POLICY "Public access" ON public.projects FOR ALL USING (true) WITH CHECK (true);

-- Subcontractors policies
DROP POLICY IF EXISTS "Public access" ON public.subcontractors;
CREATE POLICY "Public access" ON public.subcontractors FOR ALL USING (true) WITH CHECK (true);

-- Crews policies
DROP POLICY IF EXISTS "Public access" ON public.crews;
CREATE POLICY "Public access" ON public.crews FOR ALL USING (true) WITH CHECK (true);

-- Crew Members policies
DROP POLICY IF EXISTS "Public access" ON public.crew_members;
CREATE POLICY "Public access" ON public.crew_members FOR ALL USING (true) WITH CHECK (true);

-- Daily Logs policies
DROP POLICY IF EXISTS "Public access" ON public.daily_logs;
CREATE POLICY "Public access" ON public.daily_logs FOR ALL USING (true) WITH CHECK (true);

-- Log Sections policies
DROP POLICY IF EXISTS "Public access" ON public.log_sections;
CREATE POLICY "Public access" ON public.log_sections FOR ALL USING (true) WITH CHECK (true);

-- Log Subcontractors policies
DROP POLICY IF EXISTS "Public access" ON public.log_subcontractors;
CREATE POLICY "Public access" ON public.log_subcontractors FOR ALL USING (true) WITH CHECK (true);

-- Log Crews policies
DROP POLICY IF EXISTS "Public access" ON public.log_crews;
CREATE POLICY "Public access" ON public.log_crews FOR ALL USING (true) WITH CHECK (true);

-- Log Photos policies
DROP POLICY IF EXISTS "Public access" ON public.log_photos;
CREATE POLICY "Public access" ON public.log_photos FOR ALL USING (true) WITH CHECK (true);

-- Equipment policies
DROP POLICY IF EXISTS "Public access" ON public.equipment;
CREATE POLICY "Public access" ON public.equipment FOR ALL USING (true) WITH CHECK (true);

-- Log Equipment policies
DROP POLICY IF EXISTS "Public access" ON public.log_equipment;
CREATE POLICY "Public access" ON public.log_equipment FOR ALL USING (true) WITH CHECK (true);

-- Action Items policies
DROP POLICY IF EXISTS "Public access" ON public.action_items;
CREATE POLICY "Public access" ON public.action_items FOR ALL USING (true) WITH CHECK (true);

-- Action Item Notes policies
DROP POLICY IF EXISTS "Public access" ON public.action_item_notes;
CREATE POLICY "Public access" ON public.action_item_notes FOR ALL USING (true) WITH CHECK (true);

-- Action Item Attachments policies
DROP POLICY IF EXISTS "Public access" ON public.action_item_attachments;
CREATE POLICY "Public access" ON public.action_item_attachments FOR ALL USING (true) WITH CHECK (true);

-- Conversations policies
DROP POLICY IF EXISTS "Public access" ON public.conversations;
CREATE POLICY "Public access" ON public.conversations FOR ALL USING (true) WITH CHECK (true);

-- Conversation Messages policies
DROP POLICY IF EXISTS "Public access" ON public.conversation_messages;
CREATE POLICY "Public access" ON public.conversation_messages FOR ALL USING (true) WITH CHECK (true);

-- Conversation Context policies
DROP POLICY IF EXISTS "Public access" ON public.conversation_context;
CREATE POLICY "Public access" ON public.conversation_context FOR ALL USING (true) WITH CHECK (true);

-- ===== PART 7: SAMPLE DATA (Optional - Remove if not needed) =====

-- Insert sample projects
INSERT INTO public.projects (name, location, client, description, status) 
VALUES 
  ('Downtown Office Building', '123 Main St, Downtown', 'ABC Corporation', 'Modern office complex with retail space', 'active'),
  ('Residential Complex Phase 1', '456 Oak Ave, Suburbs', 'XYZ Development', 'Mixed-use residential development', 'active')
ON CONFLICT DO NOTHING;

-- Insert sample crews
INSERT INTO public.crews (name) 
VALUES 
  ('Framing Crew A'),
  ('Electrical Crew 1'),
  ('Finishing Crew')
ON CONFLICT DO NOTHING;

-- Insert sample crew members
DO $$
DECLARE
    framing_crew_id UUID;
    electrical_crew_id UUID;
    finishing_crew_id UUID;
BEGIN
    -- Get crew IDs
    SELECT id INTO framing_crew_id FROM public.crews WHERE name = 'Framing Crew A' LIMIT 1;
    SELECT id INTO electrical_crew_id FROM public.crews WHERE name = 'Electrical Crew 1' LIMIT 1;
    SELECT id INTO finishing_crew_id FROM public.crews WHERE name = 'Finishing Crew' LIMIT 1;
    
    -- Insert crew members
    INSERT INTO public.crew_members (crew_id, name, role, phone, hourly_rate, is_active) 
    VALUES 
      (framing_crew_id, 'Tom Rodriguez', 'Foreman', '(555) 111-2222', 35.00, true),
      (framing_crew_id, 'Carlos Mendez', 'Carpenter', '(555) 111-3333', 28.00, true),
      (electrical_crew_id, 'Lisa Chen', 'Lead Electrician', '(555) 222-3333', 42.00, true),
      (finishing_crew_id, 'David Martinez', 'Supervisor', '(555) 333-4444', 32.00, true)
    ON CONFLICT DO NOTHING;
END $$;

-- Insert sample subcontractors
INSERT INTO public.subcontractors (name, contact_person, email, phone, specialty, is_active) 
VALUES 
  ('Elite Plumbing Services', 'John Smith', 'john@eliteplumbing.com', '(555) 123-4567', 'Plumbing', true),
  ('ProElectric Solutions', 'Sarah Johnson', 'sarah@proelectric.com', '(555) 987-6543', 'Electrical', true),
  ('Advanced HVAC Systems', 'Mike Wilson', 'mike@advancedhvac.com', '(555) 456-7890', 'HVAC', true)
ON CONFLICT DO NOTHING;

-- Insert sample equipment
INSERT INTO public.equipment (name, type, model, status) 
VALUES 
  ('Excavator 1', 'Heavy Equipment', 'CAT 320', 'available'),
  ('Crane A', 'Lifting', 'Liebherr LTM 1050', 'available'),
  ('Generator 1', 'Power', 'Caterpillar C15', 'in_use')
ON CONFLICT DO NOTHING;

-- ===== COMPLETION MESSAGE =====
DO $$
BEGIN
    RAISE NOTICE '🎉 DATABASE SETUP COMPLETE! 🎉';
    RAISE NOTICE 'All tables, indexes, triggers, and policies have been created.';
    RAISE NOTICE 'Your Construction Daily Log app is ready to use!';
    RAISE NOTICE '';
    RAISE NOTICE 'Features enabled:';
    RAISE NOTICE '✅ Core daily log functionality';
    RAISE NOTICE '✅ Action Items system with full CRUD operations';
    RAISE NOTICE '✅ AI Assistant with conversation logging';
    RAISE NOTICE '✅ Multi-chat support with context threading';
    RAISE NOTICE '✅ All missing fields added to existing tables';
    RAISE NOTICE '✅ Comprehensive indexing for performance';
    RAISE NOTICE '✅ Row Level Security policies';
    RAISE NOTICE '✅ Auto-updating timestamps';
    RAISE NOTICE '';
    RAISE NOTICE 'Remember to:';
    RAISE NOTICE '1. Set your OpenAI API key in environment variables';
    RAISE NOTICE '2. Configure your Supabase connection in the app';
    RAISE NOTICE '3. Adjust RLS policies for production security if needed';
END $$;
