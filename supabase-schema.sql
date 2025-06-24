-- Supabase Database Schema for Construction Daily Log Application
-- Updated to match actual database structure

-- Projects Table
create table public.projects (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  location text,
  client text,
  start_date date,
  end_date date,
  description text,
  status text default 'active',
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Subcontractors Table (Contractors)
create table public.subcontractors (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  contact_person text,
  email text,
  phone text,
  created_at timestamp with time zone default now() not null
);

-- Crews Table
create table public.crews (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Crew Members Table
create table public.crew_members (
  id uuid default gen_random_uuid() primary key,
  crew_id uuid references public.crews(id) on delete cascade,
  name text not null,
  role text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  phone text,
  email text,
  hourly_rate numeric,
  notes text,
  is_active boolean default true
);

-- Daily Logs Table
create table public.daily_logs (
  id uuid default gen_random_uuid() primary key,
  date date not null,
  project_id uuid references public.projects(id) not null,
  superintendent_name text not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  weather text,
  temperature text
);

-- Log Sections Table
create table public.log_sections (
  id uuid default gen_random_uuid() primary key,
  log_id uuid references public.daily_logs(id) on delete cascade not null,
  section_type text not null,
  content text not null,
  order_num integer not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Log Subcontractors Junction Table
create table public.log_subcontractors (
  id uuid default gen_random_uuid() primary key,
  log_id uuid references public.daily_logs(id) on delete cascade not null,
  subcontractor_id uuid references public.subcontractors(id) on delete cascade not null,
  created_at timestamp with time zone default now() not null,
  unique(log_id, subcontractor_id)
);

-- Log Crews Junction Table
create table public.log_crews (
  id uuid default gen_random_uuid() primary key,
  log_id uuid references public.daily_logs(id) on delete cascade not null,
  crew_id uuid references public.crews(id) on delete cascade not null,
  created_at timestamp with time zone default now() not null,
  unique(log_id, crew_id)
);

-- Photos Table
create table public.log_photos (
  id uuid default gen_random_uuid() primary key,
  log_id uuid references public.daily_logs(id) on delete cascade,
  photo_url text not null,
  caption text,
  created_at timestamp with time zone default now()
);

-- Equipment Table
create table public.equipment (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  type text,
  model text,
  status text default 'available',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Log Equipment Junction Table
create table public.log_equipment (
  id uuid default gen_random_uuid() primary key,
  log_id uuid references public.daily_logs(id) on delete cascade,
  equipment_id uuid references public.equipment(id) on delete cascade,
  hours_used numeric,
  notes text,
  created_at timestamp with time zone default now(),
  unique(log_id, equipment_id)
);

-- Action Items Table
create table public.action_items (
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
create table public.action_item_notes (
  id uuid default gen_random_uuid() primary key,
  action_item_id uuid references public.action_items(id) on delete cascade,
  note text not null,
  created_by text not null,
  created_at timestamp with time zone default now()
);

-- Action Item Attachments Table
create table public.action_item_attachments (
  id uuid default gen_random_uuid() primary key,
  action_item_id uuid references public.action_items(id) on delete cascade,
  file_name text not null,
  file_url text not null,
  file_size integer,
  mime_type text,
  uploaded_by text not null,
  created_at timestamp with time zone default now()
);

-- Row Level Security Policies
-- Enable Row Level Security
alter table public.projects enable row level security;
alter table public.subcontractors enable row level security;
alter table public.crews enable row level security;
alter table public.crew_members enable row level security;
alter table public.daily_logs enable row level security;
alter table public.log_sections enable row level security;
alter table public.log_subcontractors enable row level security;
alter table public.log_crews enable row level security;
alter table public.log_photos enable row level security;
alter table public.equipment enable row level security;
alter table public.log_equipment enable row level security;
alter table public.action_items enable row level security;
alter table public.action_item_notes enable row level security;
alter table public.action_item_attachments enable row level security;

-- Create policies for Projects
create policy "Public read access" on public.projects for select using (true);
create policy "Public insert access" on public.projects for insert with check (true);
create policy "Public update access" on public.projects for update using (true);
create policy "Public delete access" on public.projects for delete using (true);

-- Create policies for Subcontractors
create policy "Public read access" on public.subcontractors for select using (true);
create policy "Public insert access" on public.subcontractors for insert with check (true);
create policy "Public update access" on public.subcontractors for update using (true);
create policy "Public delete access" on public.subcontractors for delete using (true);

-- Create policies for Crews
create policy "Public read access" on public.crews for select using (true);
create policy "Public insert access" on public.crews for insert with check (true);
create policy "Public update access" on public.crews for update using (true);
create policy "Public delete access" on public.crews for delete using (true);

-- Create policies for Crew Members
create policy "Public read access" on public.crew_members for select using (true);
create policy "Public insert access" on public.crew_members for insert with check (true);
create policy "Public update access" on public.crew_members for update using (true);
create policy "Public delete access" on public.crew_members for delete using (true);

-- Create policies for Daily Logs
create policy "Public read access" on public.daily_logs for select using (true);
create policy "Public insert access" on public.daily_logs for insert with check (true);
create policy "Public update access" on public.daily_logs for update using (true);
create policy "Public delete access" on public.daily_logs for delete using (true);

-- Create policies for Log Sections
create policy "Public read access" on public.log_sections for select using (true);
create policy "Public insert access" on public.log_sections for insert with check (true);
create policy "Public update access" on public.log_sections for update using (true);
create policy "Public delete access" on public.log_sections for delete using (true);

-- Create policies for Log Subcontractors
create policy "Public read access" on public.log_subcontractors for select using (true);
create policy "Public insert access" on public.log_subcontractors for insert with check (true);
create policy "Public update access" on public.log_subcontractors for update using (true);
create policy "Public delete access" on public.log_subcontractors for delete using (true);

-- Create policies for Log Crews
create policy "Public read access" on public.log_crews for select using (true);
create policy "Public insert access" on public.log_crews for insert with check (true);
create policy "Public update access" on public.log_crews for update using (true);
create policy "Public delete access" on public.log_crews for delete using (true);

-- Create policies for Log Photos
create policy "Public read access" on public.log_photos for select using (true);
create policy "Public insert access" on public.log_photos for insert with check (true);
create policy "Public update access" on public.log_photos for update using (true);
create policy "Public delete access" on public.log_photos for delete using (true);

-- Create policies for Equipment
create policy "Public read access" on public.equipment for select using (true);
create policy "Public insert access" on public.equipment for insert with check (true);
create policy "Public update access" on public.equipment for update using (true);
create policy "Public delete access" on public.equipment for delete using (true);

-- Create policies for Log Equipment
create policy "Public read access" on public.log_equipment for select using (true);
create policy "Public insert access" on public.log_equipment for insert with check (true);
create policy "Public update access" on public.log_equipment for update using (true);
create policy "Public delete access" on public.log_equipment for delete using (true);

-- Create policies for Action Items
create policy "Public read access" on public.action_items for select using (true);
create policy "Public insert access" on public.action_items for insert with check (true);
create policy "Public update access" on public.action_items for update using (true);
create policy "Public delete access" on public.action_items for delete using (true);

-- Create policies for Action Item Notes
create policy "Public read access" on public.action_item_notes for select using (true);
create policy "Public insert access" on public.action_item_notes for insert with check (true);
create policy "Public update access" on public.action_item_notes for update using (true);
create policy "Public delete access" on public.action_item_notes for delete using (true);

-- Create policies for Action Item Attachments
create policy "Public read access" on public.action_item_attachments for select using (true);
create policy "Public insert access" on public.action_item_attachments for insert with check (true);
create policy "Public update access" on public.action_item_attachments for update using (true);
create policy "Public delete access" on public.action_item_attachments for delete using (true);

-- Indexes for better performance
create index idx_daily_logs_date on public.daily_logs(date);
create index idx_daily_logs_project_id on public.daily_logs(project_id);
create index idx_log_sections_log_id on public.log_sections(log_id);
create index idx_log_subcontractors_log_id on public.log_subcontractors(log_id);
create index idx_log_crews_log_id on public.log_crews(log_id);
create index idx_crew_members_crew_id on public.crew_members(crew_id);
create index idx_log_photos_log_id on public.log_photos(log_id);
create index idx_log_equipment_log_id on public.log_equipment(log_id);
create index idx_action_items_status on public.action_items(status);
create index idx_action_items_priority on public.action_items(priority);
create index idx_action_items_project_id on public.action_items(project_id);
create index idx_action_items_log_id on public.action_items(log_id);
create index idx_action_items_due_date on public.action_items(due_date);
create index idx_action_items_assigned_to on public.action_items(assigned_to);

-- Triggers for updated_at timestamps
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language 'plpgsql';

create trigger update_projects_updated_at before update on public.projects
    for each row execute procedure update_updated_at_column();

create trigger update_crews_updated_at before update on public.crews
    for each row execute procedure update_updated_at_column();

create trigger update_crew_members_updated_at before update on public.crew_members
    for each row execute procedure update_updated_at_column();

create trigger update_daily_logs_updated_at before update on public.daily_logs
    for each row execute procedure update_updated_at_column();

create trigger update_log_sections_updated_at before update on public.log_sections
    for each row execute procedure update_updated_at_column();

create trigger update_equipment_updated_at before update on public.equipment
    for each row execute procedure update_updated_at_column();

create trigger update_action_items_updated_at before update on public.action_items
    for each row execute procedure update_updated_at_column();

-- Note: In a production environment, you would want to restrict access based on authenticated users
-- and potentially organizational boundaries rather than making everything publicly readable.

-- Sample data (optional - remove if not needed)
-- Insert sample projects
insert into public.projects (name, location, client, description, status) values 
('Downtown Office Building', '123 Main St, Downtown', 'ABC Corporation', 'Modern office complex with retail space', 'active'),
('Residential Complex Phase 1', '456 Oak Ave, Suburbs', 'XYZ Development', 'Mixed-use residential development', 'active');

-- Insert sample crews
insert into public.crews (name) values 
('Framing Crew A'),
('Electrical Crew 1'),
('Finishing Crew');

-- Insert sample crew members
insert into public.crew_members (crew_id, name, role, phone, hourly_rate, is_active) values 
((select id from public.crews where name = 'Framing Crew A' limit 1), 'Tom Rodriguez', 'Foreman', '(555) 111-2222', 35.00, true),
((select id from public.crews where name = 'Framing Crew A' limit 1), 'Carlos Mendez', 'Carpenter', '(555) 111-3333', 28.00, true),
((select id from public.crews where name = 'Electrical Crew 1' limit 1), 'Lisa Chen', 'Lead Electrician', '(555) 222-3333', 42.00, true),
((select id from public.crews where name = 'Finishing Crew' limit 1), 'David Martinez', 'Supervisor', '(555) 333-4444', 32.00, true);

-- Insert sample subcontractors
insert into public.subcontractors (name, contact_person, email, phone) values 
('Elite Plumbing Services', 'John Smith', 'john@eliteplumbing.com', '(555) 123-4567'),
('ProElectric Solutions', 'Sarah Johnson', 'sarah@proelectric.com', '(555) 987-6543'),
('Advanced HVAC Systems', 'Mike Wilson', 'mike@advancedhvac.com', '(555) 456-7890');
