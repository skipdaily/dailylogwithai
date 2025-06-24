-- Sample data for testing the application
-- Run this after running the migration to add test data

-- Insert sample projects
INSERT INTO projects (name, description, location, client, start_date, end_date, status) VALUES
('Downtown Office Complex', 'Construction of a 15-story office building with underground parking', '123 Main St, Downtown', 'ABC Corporation', '2024-01-15', '2025-06-30', 'active'),
('Residential Towers', 'Two 20-story residential towers with amenities', '456 Oak Ave, Midtown', 'XYZ Developers', '2024-03-01', '2025-12-15', 'active'),
('Shopping Center Renovation', 'Complete renovation of existing shopping center', '789 Commerce Blvd', 'Retail Holdings LLC', '2024-02-01', '2024-08-31', 'completed')
ON CONFLICT (id) DO NOTHING;

-- Insert sample crews
INSERT INTO crews (name) VALUES
('Concrete Crew Alpha'),
('Framing Crew Beta'),
('Electrical Crew Gamma'),
('Plumbing Crew Delta')
ON CONFLICT (id) DO NOTHING;

-- Get crew IDs for crew members (using names since IDs are auto-generated)
-- Insert sample crew members
WITH crew_data AS (
  SELECT id, name FROM crews WHERE name IN ('Concrete Crew Alpha', 'Framing Crew Beta', 'Electrical Crew Gamma', 'Plumbing Crew Delta')
)
INSERT INTO crew_members (crew_id, name, role, phone, email, hourly_rate, is_active) 
SELECT 
  c.id,
  member_data.name,
  member_data.role,
  member_data.phone,
  member_data.email,
  member_data.hourly_rate,
  true
FROM crew_data c
CROSS JOIN (
  VALUES 
    ('Concrete Crew Alpha', 'John Smith', 'Foreman', '555-0101', 'john.smith@example.com', 35.00),
    ('Concrete Crew Alpha', 'Mike Johnson', 'Concrete Finisher', '555-0102', 'mike.johnson@example.com', 28.50),
    ('Concrete Crew Alpha', 'Steve Wilson', 'Laborer', '555-0103', 'steve.wilson@example.com', 22.00),
    ('Framing Crew Beta', 'David Brown', 'Lead Carpenter', '555-0201', 'david.brown@example.com', 32.00),
    ('Framing Crew Beta', 'Tom Davis', 'Carpenter', '555-0202', 'tom.davis@example.com', 28.00),
    ('Framing Crew Beta', 'Rick Miller', 'Apprentice', '555-0203', 'rick.miller@example.com', 18.50),
    ('Electrical Crew Gamma', 'Paul Garcia', 'Master Electrician', '555-0301', 'paul.garcia@example.com', 42.00),
    ('Electrical Crew Gamma', 'Mark Rodriguez', 'Journeyman Electrician', '555-0302', 'mark.rodriguez@example.com', 35.00),
    ('Plumbing Crew Delta', 'Chris Martinez', 'Master Plumber', '555-0401', 'chris.martinez@example.com', 40.00),
    ('Plumbing Crew Delta', 'Alex Anderson', 'Plumber', '555-0402', 'alex.anderson@example.com', 32.00)
) AS member_data(crew_name, name, role, phone, email, hourly_rate)
WHERE c.name = member_data.crew_name
ON CONFLICT DO NOTHING;

-- Insert sample subcontractors
INSERT INTO subcontractors (name, contact_person, phone, email, address, specialty, is_active) VALUES
('Elite Roofing Solutions', 'Sarah Thompson', '555-1001', 'sarah@eliteroofing.com', '100 Industrial Way, Suite 200', 'Commercial Roofing', true),
('Metro HVAC Systems', 'Robert Chen', '555-1002', 'robert@metrohvac.com', '250 Tech Park Dr', 'HVAC Installation', true),
('Precision Glass & Glazing', 'Jennifer Williams', '555-1003', 'jennifer@precisionglass.com', '75 Glass Works Blvd', 'Curtain Wall Systems', true),
('Foundation Masters', 'Michael Taylor', '555-1004', 'michael@foundationmasters.com', '500 Heavy Equipment Rd', 'Foundation & Excavation', true),
('Steel Works Pro', 'Amanda Jones', '555-1005', 'amanda@steelworkspro.com', '300 Fabrication Ave', 'Structural Steel', true)
ON CONFLICT (id) DO NOTHING;

-- Insert sample equipment
INSERT INTO equipment (name, type, model, status) VALUES
('Tower Crane TC-1000', 'Heavy Equipment', 'Liebherr 1000 EC-H', 'available'),
('Excavator CAT 320', 'Heavy Equipment', 'Caterpillar 320', 'in_use'),
('Concrete Mixer CM-500', 'Construction Equipment', 'Oshkosh S-Series', 'available'),
('Forklift Toyota 8FGU25', 'Material Handling', 'Toyota 8FGU25', 'available'),
('Scissor Lift JLG 2646ES', 'Aerial Equipment', 'JLG 2646ES', 'maintenance'),
('Compactor CP-132', 'Compaction Equipment', 'Caterpillar CP-132', 'available')
ON CONFLICT (id) DO NOTHING;

-- Insert a sample daily log
WITH project_data AS (
  SELECT id FROM projects WHERE name = 'Downtown Office Complex' LIMIT 1
),
crew_data AS (
  SELECT id FROM crews WHERE name = 'Concrete Crew Alpha' LIMIT 1
),
subcontractor_data AS (
  SELECT id FROM subcontractors WHERE name = 'Elite Roofing Solutions' LIMIT 1
)
INSERT INTO daily_logs (date, project_id, superintendent_name, weather, temperature)
SELECT 
  CURRENT_DATE - INTERVAL '1 day',
  p.id,
  'James Wilson',
  'Partly Cloudy',
  '72°F'
FROM project_data p
ON CONFLICT DO NOTHING;

-- Insert sample log sections for the daily log
WITH log_data AS (
  SELECT id FROM daily_logs WHERE superintendent_name = 'James Wilson' LIMIT 1
)
INSERT INTO log_sections (log_id, section_type, content, order_num)
SELECT 
  l.id,
  section_data.section_type,
  section_data.content,
  section_data.order_num
FROM log_data l
CROSS JOIN (
  VALUES 
    ('work_performed', 'Poured concrete for basement level foundation. Completed forms for elevator shaft. Started preparation for first floor slab.', 1),
    ('safety_notes', 'All workers attended morning safety meeting. No incidents reported. Fall protection equipment inspected and verified.', 2),
    ('quality_notes', 'Concrete samples taken for testing. Forms inspected and approved by engineer. All work meets specifications.', 3),
    ('delays', 'Minor delay due to concrete truck arriving 30 minutes late. Recovered time by extending work day.', 4),
    ('materials_delivered', 'Rebar for first floor (50 tons), Concrete forms (200 linear feet), Safety equipment resupply', 5),
    ('visitors', 'City inspector at 10:00 AM for foundation inspection (passed), Client representative walkthrough at 2:00 PM', 6)
) AS section_data(section_type, content, order_num)
ON CONFLICT DO NOTHING;

-- Link the sample log with crews and subcontractors
WITH log_data AS (
  SELECT id FROM daily_logs WHERE superintendent_name = 'James Wilson' LIMIT 1
),
crew_data AS (
  SELECT id FROM crews WHERE name = 'Concrete Crew Alpha' LIMIT 1
),
subcontractor_data AS (
  SELECT id FROM subcontractors WHERE name = 'Elite Roofing Solutions' LIMIT 1
)
INSERT INTO log_crews (log_id, crew_id)
SELECT l.id, c.id
FROM log_data l, crew_data c
ON CONFLICT DO NOTHING;

WITH log_data AS (
  SELECT id FROM daily_logs WHERE superintendent_name = 'James Wilson' LIMIT 1
),
subcontractor_data AS (
  SELECT id FROM subcontractors WHERE name = 'Elite Roofing Solutions' LIMIT 1
)
INSERT INTO log_subcontractors (log_id, subcontractor_id)
SELECT l.id, s.id
FROM log_data l, subcontractor_data s
ON CONFLICT DO NOTHING;
