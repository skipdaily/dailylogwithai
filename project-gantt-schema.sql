-- Project Gantt Chart Schema
-- Run this SQL to add Gantt chart functionality to your existing database

-- Project phases/tasks for Gantt chart
CREATE TABLE project_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  type TEXT DEFAULT 'task' CHECK (type IN ('task', 'milestone', 'project')),
  parent_id UUID REFERENCES project_tasks(id) ON DELETE CASCADE,
  dependencies TEXT[], -- Array of task IDs this task depends on
  assigned_to TEXT,
  notes TEXT,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for better performance
CREATE INDEX idx_project_tasks_project_id ON project_tasks(project_id);
CREATE INDEX idx_project_tasks_parent_id ON project_tasks(parent_id);

-- Sample data for testing (optional)
-- Replace 'your-project-id' with an actual project ID from your projects table
/*
INSERT INTO project_tasks (project_id, name, start_date, end_date, progress, type, color) VALUES 
('your-project-id', 'Foundation Work', '2025-01-15', '2025-02-28', 85, 'task', '#EF4444'),
('your-project-id', 'Framing', '2025-03-01', '2025-04-15', 60, 'task', '#F59E0B'),
('your-project-id', 'Electrical Rough-in', '2025-04-01', '2025-04-30', 30, 'task', '#10B981'),
('your-project-id', 'Plumbing Rough-in', '2025-04-01', '2025-05-15', 25, 'task', '#3B82F6'),
('your-project-id', 'Drywall', '2025-05-01', '2025-06-15', 0, 'task', '#8B5CF6'),
('your-project-id', 'Final Inspection', '2025-07-30', '2025-07-30', 0, 'milestone', '#EC4899');
*/
