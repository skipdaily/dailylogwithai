# AI Context: Construction Daily Log Database Schema

## Overview
This construction daily log application uses Supabase PostgreSQL with a comprehensive schema for managing:
- Daily construction logs and reports
- Action items tracking and management  
- Project, crew, and subcontractor management
- Equipment and resource tracking

## Database Tables Summary

### Core Business Tables
1. **`projects`** - Construction projects
2. **`subcontractors`** - Subcontractor companies
3. **`crews`** - Work crews
4. **`crew_members`** - Individual crew members
5. **`daily_logs`** - Daily construction reports
6. **`log_sections`** - Sections within daily logs

### Action Items System
7. **`action_items`** - Action items from daily logs
8. **`action_item_notes`** - Progress notes on action items
9. **`action_item_attachments`** - File attachments for action items

### Junction Tables
10. **`log_subcontractors`** - Links logs to subcontractors
11. **`log_crews`** - Links logs to crews

### Optional/Future Tables
12. **`log_photos`** - Photo attachments for logs
13. **`equipment`** - Equipment inventory
14. **`log_equipment`** - Equipment usage in logs

## Key Entity Relationships

```
projects (1) → (many) daily_logs
daily_logs (1) → (many) log_sections
daily_logs (1) → (many) action_items
action_items (1) → (many) action_item_notes
action_items (1) → (many) action_item_attachments
crews (1) → (many) crew_members
daily_logs (many) ↔ (many) subcontractors [via log_subcontractors]
daily_logs (many) ↔ (many) crews [via log_crews]
```

## Action Items Workflow
1. **Creation**: Action items created from daily log sections (meetings, out-of-scope work, observations, notes)
2. **Tracking**: Each action item has status, priority, assignee, due date
3. **Progress**: Notes track progress and updates
4. **Completion**: Status changes from open → in_progress → completed

## Critical Fields for AI

### action_items table:
- `source_type`: 'meeting' | 'out_of_scope' | 'action_item' | 'observation'
- `status`: 'open' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled'
- `priority`: 'low' | 'medium' | 'high' | 'urgent'
- `source_content`: Original text from daily log section
- `assigned_to`: Person/role responsible
- `due_date`: When action should be completed

### daily_logs table:
- `date`: Log date
- `project_id`: Associated project
- `superintendent_name`: Person creating log

### log_sections table:
- `section_type`: Type of log section
- `content`: Actual content text
- `log_id`: Parent daily log

## Application Context

### Primary Data Flow:
1. **Daily Log Creation** → Creates daily_logs record
2. **Section Content** → Creates log_sections records  
3. **Action Item Creation** → User clicks action button on sections 4, 5, 6, 8
4. **Action Tracking** → Updates status, adds notes, manages completion

### Section Types That Generate Action Items:
- Section 4: "Meetings / Discussions" (`source_type: 'meeting'`)
- Section 5: "Out-of-Scope / Extra Work" (`source_type: 'out_of_scope'`)
- Section 6: "Action Items" (`source_type: 'action_item'`)
- Section 8: "Notes / Observations" (`source_type: 'observation'`)

### Key Queries for AI:
1. **Active Action Items**: `SELECT * FROM action_items WHERE status IN ('open', 'in_progress')`
2. **Overdue Items**: `SELECT * FROM action_items WHERE due_date < CURRENT_DATE AND status != 'completed'`
3. **Project Actions**: `SELECT * FROM action_items WHERE project_id = $1`
4. **Recent Activity**: `SELECT * FROM action_items ORDER BY updated_at DESC`

### Status Workflow:
- **open** → **in_progress** → **completed**
- Alternative paths: **on_hold**, **cancelled**

### Priority Levels:
- **urgent**: Immediate attention required
- **high**: Important, needs quick action
- **medium**: Standard priority (default)
- **low**: Can be addressed when time permits

## AI Integration Points

1. **Action Item Analysis**: AI can analyze action items to identify:
   - Overdue items needing attention
   - Resource bottlenecks (same person assigned multiple urgent items)
   - Pattern recognition in types of issues
   - Project health indicators

2. **Daily Log Context**: AI can reference:
   - Historical daily logs for project context
   - Weather patterns affecting work
   - Recurring issues or delays
   - Team composition and performance

3. **Recommendation Engine**: AI can suggest:
   - Action item priorities based on project timeline
   - Resource allocation adjustments
   - Risk mitigation strategies
   - Process improvements

## Sample Queries for AI Context

```sql
-- Get all open action items with project context
SELECT ai.*, p.name as project_name, p.location 
FROM action_items ai 
LEFT JOIN projects p ON ai.project_id = p.id 
WHERE ai.status = 'open' 
ORDER BY ai.priority DESC, ai.due_date ASC;

-- Get recent daily log activity
SELECT dl.date, dl.superintendent_name, p.name as project_name,
       COUNT(ai.id) as action_items_created
FROM daily_logs dl
LEFT JOIN projects p ON dl.project_id = p.id
LEFT JOIN action_items ai ON ai.log_id = dl.id
WHERE dl.date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY dl.id, dl.date, dl.superintendent_name, p.name
ORDER BY dl.date DESC;

-- Get action item progress notes
SELECT ai.title, ai.status, ai.priority, 
       ain.note, ain.created_by, ain.created_at
FROM action_items ai
LEFT JOIN action_item_notes ain ON ai.id = ain.action_item_id
WHERE ai.id = $1
ORDER BY ain.created_at DESC;
```

This schema provides comprehensive tracking of construction project activities with robust action item management that enables AI to provide intelligent insights and recommendations.
