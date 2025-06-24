-- Action Items System for Construction Daily Logs
-- This creates a comprehensive action item tracking system

-- Create action_items table
CREATE TABLE IF NOT EXISTS action_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    source_type TEXT NOT NULL CHECK (source_type IN ('meeting', 'out_of_scope', 'action_item', 'observation')),
    source_content TEXT, -- Original content from daily log section
    log_id UUID REFERENCES daily_logs(id) ON DELETE SET NULL,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    assigned_to TEXT, -- Could be crew member name or role
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'on_hold', 'cancelled')),
    due_date DATE,
    created_by TEXT, -- Superintendent or user who created it
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create action_item_notes table for tracking progress
CREATE TABLE IF NOT EXISTS action_item_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    action_item_id UUID REFERENCES action_items(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    created_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create action_item_attachments table for future file uploads
CREATE TABLE IF NOT EXISTS action_item_attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    action_item_id UUID REFERENCES action_items(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    uploaded_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_action_items_status ON action_items(status);
CREATE INDEX IF NOT EXISTS idx_action_items_priority ON action_items(priority);
CREATE INDEX IF NOT EXISTS idx_action_items_project_id ON action_items(project_id);
CREATE INDEX IF NOT EXISTS idx_action_items_log_id ON action_items(log_id);
CREATE INDEX IF NOT EXISTS idx_action_items_due_date ON action_items(due_date);
CREATE INDEX IF NOT EXISTS idx_action_items_assigned_to ON action_items(assigned_to);
CREATE INDEX IF NOT EXISTS idx_action_item_notes_action_item_id ON action_item_notes(action_item_id);

-- Add function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_action_item_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    
    -- Set completed_at when status changes to completed
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        NEW.completed_at = now();
    ELSIF NEW.status != 'completed' THEN
        NEW.completed_at = NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
DROP TRIGGER IF EXISTS trigger_action_items_updated_at ON action_items;
CREATE TRIGGER trigger_action_items_updated_at
    BEFORE UPDATE ON action_items
    FOR EACH ROW
    EXECUTE FUNCTION update_action_item_updated_at();

-- Enable Row Level Security
ALTER TABLE action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_item_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_item_attachments ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies for action_items
DROP POLICY IF EXISTS "Users can view all action items" ON action_items;
CREATE POLICY "Users can view all action items" ON action_items FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert action items" ON action_items;
CREATE POLICY "Users can insert action items" ON action_items FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update action items" ON action_items;
CREATE POLICY "Users can update action items" ON action_items FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Users can delete action items" ON action_items;
CREATE POLICY "Users can delete action items" ON action_items FOR DELETE USING (true);

-- Create RLS Policies for action_item_notes
DROP POLICY IF EXISTS "Users can view all action item notes" ON action_item_notes;
CREATE POLICY "Users can view all action item notes" ON action_item_notes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert action item notes" ON action_item_notes;
CREATE POLICY "Users can insert action item notes" ON action_item_notes FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update action item notes" ON action_item_notes;
CREATE POLICY "Users can update action item notes" ON action_item_notes FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Users can delete action item notes" ON action_item_notes;
CREATE POLICY "Users can delete action item notes" ON action_item_notes FOR DELETE USING (true);

-- Create RLS Policies for action_item_attachments
DROP POLICY IF EXISTS "Users can view all action item attachments" ON action_item_attachments;
CREATE POLICY "Users can view all action item attachments" ON action_item_attachments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert action item attachments" ON action_item_attachments;
CREATE POLICY "Users can insert action item attachments" ON action_item_attachments FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update action item attachments" ON action_item_attachments;
CREATE POLICY "Users can update action item attachments" ON action_item_attachments FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Users can delete action item attachments" ON action_item_attachments;
CREATE POLICY "Users can delete action item attachments" ON action_item_attachments FOR DELETE USING (true);

COMMIT;
