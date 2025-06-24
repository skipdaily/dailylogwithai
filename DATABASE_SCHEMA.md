# Supabase Database Schema Documentation
## Construction Daily Log Application

This document provides a comprehensive overview of all tables, fields, and relationships in the Supabase database for AI reference.

---

## Core Tables

### 1. **projects**
**Purpose**: Store project information
```sql
id: UUID (Primary Key)
name: TEXT (Required) - Project name
location: TEXT - Project address/location
client: TEXT - Client company name
start_date: DATE - Project start date
end_date: DATE - Project end date
created_at: TIMESTAMP - Record creation time
updated_at: TIMESTAMP - Last update time
```

### 2. **subcontractors**
**Purpose**: Store subcontractor information
```sql
id: UUID (Primary Key)
name: TEXT (Required) - Company name
contact_person: TEXT - Primary contact name
contact_email: TEXT - Contact email
contact_phone: TEXT - Contact phone number
address: TEXT - Company address
license_number: TEXT - Business license
insurance_info: TEXT - Insurance details
specialty: TEXT - Area of expertise
notes: TEXT - Additional notes
created_at: TIMESTAMP - Record creation time
updated_at: TIMESTAMP - Last update time
```

### 3. **crews**
**Purpose**: Store crew information
```sql
id: UUID (Primary Key)
name: TEXT (Required) - Crew name/identifier
supervisor: TEXT - Crew supervisor name
description: TEXT - Crew description
created_at: TIMESTAMP - Record creation time
updated_at: TIMESTAMP - Last update time
```

### 4. **crew_members**
**Purpose**: Store individual crew member details
```sql
id: UUID (Primary Key)
crew_id: UUID (Foreign Key → crews.id)
name: TEXT (Required) - Member name
role: TEXT - Job role/position
phone: TEXT - Phone number
email: TEXT - Email address
hourly_rate: DECIMAL(10,2) - Hourly pay rate
notes: TEXT - Additional notes
hire_date: DATE - Date hired
is_active: BOOLEAN - Active status (default: true)
created_at: TIMESTAMP - Record creation time
updated_at: TIMESTAMP - Last update time
```

### 5. **daily_logs**
**Purpose**: Store daily construction log entries
```sql
id: UUID (Primary Key)
date: DATE (Required) - Log date
project_id: UUID (Required, Foreign Key → projects.id)
superintendent_name: TEXT (Required) - Person creating log
weather_conditions: TEXT - Weather description
temperature_high: INTEGER - High temperature
temperature_low: INTEGER - Low temperature
total_workers: INTEGER - Number of workers on site
total_hours: DECIMAL(10,2) - Total hours worked
created_at: TIMESTAMP - Record creation time
updated_at: TIMESTAMP - Last update time
```

### 6. **log_sections**
**Purpose**: Store different sections of daily logs
```sql
id: UUID (Primary Key)
log_id: UUID (Required, Foreign Key → daily_logs.id)
section_type: TEXT (Required) - Type of section
    Values: 'work_completed', 'materials_received', 'equipment_on_site', 
            'weather_conditions', 'safety_notes', 'issues_delays', 
            'visitors', 'notes'
content: TEXT (Required) - Section content
order_num: INTEGER (Required) - Display order
created_at: TIMESTAMP - Record creation time
updated_at: TIMESTAMP - Last update time
```

---

## Action Items System

### 7. **action_items**
**Purpose**: Store action items from daily logs
```sql
id: UUID (Primary Key)
title: TEXT (Required) - Action item title
description: TEXT - Detailed description
source_type: TEXT (Required) - Source section type
    Values: 'meeting', 'out_of_scope', 'action_item', 'observation'
source_content: TEXT - Original content from daily log
log_id: UUID (Foreign Key → daily_logs.id) - Source log
project_id: UUID (Foreign Key → projects.id) - Related project
assigned_to: TEXT - Person/role responsible
priority: TEXT - Priority level (default: 'medium')
    Values: 'low', 'medium', 'high', 'urgent'
status: TEXT - Current status (default: 'open')
    Values: 'open', 'in_progress', 'completed', 'on_hold', 'cancelled'
due_date: DATE - Due date
created_by: TEXT - Person who created the action item
created_at: TIMESTAMP - Creation time
updated_at: TIMESTAMP - Last update time
completed_at: TIMESTAMP - Completion time
```

### 8. **action_item_notes**
**Purpose**: Store progress notes for action items
```sql
id: UUID (Primary Key)
action_item_id: UUID (Required, Foreign Key → action_items.id)
note: TEXT (Required) - Progress note content
created_by: TEXT (Required) - Note author
created_at: TIMESTAMP - Note creation time
```

### 9. **action_item_attachments**
**Purpose**: Store file attachments for action items
```sql
id: UUID (Primary Key)
action_item_id: UUID (Required, Foreign Key → action_items.id)
file_name: TEXT (Required) - Original file name
file_url: TEXT (Required) - Storage URL
file_size: INTEGER - File size in bytes
mime_type: TEXT - File MIME type
uploaded_by: TEXT (Required) - Uploader name
created_at: TIMESTAMP - Upload time
```

---

## Junction Tables (Many-to-Many Relationships)

### 10. **log_subcontractors**
**Purpose**: Link daily logs to subcontractors present on site
```sql
id: UUID (Primary Key)
log_id: UUID (Required, Foreign Key → daily_logs.id)
subcontractor_id: UUID (Required, Foreign Key → subcontractors.id)
created_at: TIMESTAMP - Record creation time
UNIQUE(log_id, subcontractor_id) - Prevent duplicates
```

### 11. **log_crews**
**Purpose**: Link daily logs to crews working on site
```sql
id: UUID (Primary Key)
log_id: UUID (Required, Foreign Key → daily_logs.id)
crew_id: UUID (Required, Foreign Key → crews.id)
created_at: TIMESTAMP - Record creation time
UNIQUE(log_id, crew_id) - Prevent duplicates
```

---

## Future/Optional Tables

### 12. **log_photos**
**Purpose**: Store photos attached to daily logs
```sql
id: UUID (Primary Key)
log_id: UUID (Required, Foreign Key → daily_logs.id)
file_url: TEXT (Required) - Photo storage URL
file_name: TEXT - Original file name
caption: TEXT - Photo description
uploaded_by: TEXT - Uploader name
created_at: TIMESTAMP - Upload time
```

### 13. **equipment**
**Purpose**: Store equipment information
```sql
id: UUID (Primary Key)
name: TEXT (Required) - Equipment name
type: TEXT - Equipment type/category
model: TEXT - Equipment model
serial_number: TEXT - Serial number
rental_company: TEXT - Rental company name
daily_rate: DECIMAL(10,2) - Daily rental cost
status: TEXT - Equipment status (default: 'available')
    Values: 'available', 'on_site', 'maintenance', 'out_of_service'
created_at: TIMESTAMP - Record creation time
updated_at: TIMESTAMP - Last update time
```

### 14. **log_equipment**
**Purpose**: Link daily logs to equipment used
```sql
id: UUID (Primary Key)
log_id: UUID (Required, Foreign Key → daily_logs.id)
equipment_id: UUID (Required, Foreign Key → equipment.id)
hours_used: DECIMAL(10,2) - Hours equipment was used
created_at: TIMESTAMP - Record creation time
UNIQUE(log_id, equipment_id) - Prevent duplicates
```

---

## Key Relationships

1. **Projects → Daily Logs**: One-to-Many (project can have multiple logs)
2. **Daily Logs → Log Sections**: One-to-Many (log has multiple sections)
3. **Daily Logs → Action Items**: One-to-Many (log can create multiple action items)
4. **Action Items → Action Item Notes**: One-to-Many (item can have multiple notes)
5. **Action Items → Action Item Attachments**: One-to-Many (item can have multiple files)
6. **Crews → Crew Members**: One-to-Many (crew has multiple members)
7. **Daily Logs ↔ Subcontractors**: Many-to-Many (via log_subcontractors)
8. **Daily Logs ↔ Crews**: Many-to-Many (via log_crews)
9. **Daily Logs ↔ Equipment**: Many-to-Many (via log_equipment)

---

## Indexes for Performance

- `idx_daily_logs_date` on daily_logs(date)
- `idx_daily_logs_project_id` on daily_logs(project_id)
- `idx_log_sections_log_id` on log_sections(log_id)
- `idx_log_subcontractors_log_id` on log_subcontractors(log_id)
- `idx_log_crews_log_id` on log_crews(log_id)
- `idx_crew_members_crew_id` on crew_members(crew_id)
- `idx_action_items_status` on action_items(status)
- `idx_action_items_priority` on action_items(priority)
- `idx_action_items_project_id` on action_items(project_id)
- `idx_action_items_log_id` on action_items(log_id)
- `idx_action_items_due_date` on action_items(due_date)
- `idx_action_items_assigned_to` on action_items(assigned_to)

---

## Row Level Security (RLS)

All tables have RLS enabled with public access policies for development. In production, these should be restricted based on authentication and organization membership.

---

## Application Context for AI

### Primary Use Cases:
1. **Daily Log Creation** - Creating comprehensive daily construction reports
2. **Action Item Management** - Tracking and managing action items from daily activities
3. **Project Tracking** - Monitoring project progress and resources
4. **Team Management** - Managing crews, subcontractors, and personnel
5. **Historical Analysis** - Reviewing past logs and tracking trends

### Key Data Flows:
1. **Daily Log → Action Items**: Actions created from log sections (meetings, out-of-scope work, observations)
2. **Action Items → Notes**: Progress tracking through notes
3. **Projects → All Activities**: All logs and action items tied to specific projects
4. **Crews/Subcontractors → Daily Presence**: Tracking who worked when

This schema supports a complete construction project management system with robust action item tracking and AI integration capabilities.
