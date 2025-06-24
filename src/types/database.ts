// Database Types for Construction Daily Log Application
// This file defines TypeScript interfaces that match the Supabase database schema exactly

// ===== CORE BUSINESS ENTITIES =====

export interface Project {
  id: string;
  name: string;
  location?: string;
  client?: string;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Subcontractor {
  id: string;
  name: string;
  contact_person?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  license_number?: string;
  insurance_info?: string;
  specialty?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Crew {
  id: string;
  name: string;
  supervisor?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface CrewMember {
  id: string;
  crew_id: string;
  name: string;
  role?: string;
  phone?: string;
  email?: string;
  hourly_rate?: number;
  notes?: string;
  hire_date?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Relations
  crew?: Crew;
}

// ===== DAILY LOG SYSTEM =====

export interface DailyLog {
  id: string;
  date: string;
  project_id: string;
  superintendent_name: string;
  weather_conditions?: string;
  temperature_high?: number;
  temperature_low?: number;
  total_workers?: number;
  total_hours?: number;
  created_at: string;
  updated_at: string;
  // Relations
  project?: Project;
  log_sections?: LogSection[];
  log_subcontractors?: LogSubcontractor[];
  log_crews?: LogCrew[];
  log_photos?: LogPhoto[];
  log_equipment?: LogEquipment[];
  action_items?: ActionItem[];
}

export interface LogSection {
  id: string;
  log_id: string;
  section_type: 'work_completed' | 'materials_received' | 'equipment_on_site' | 
                'weather_conditions' | 'safety_notes' | 'issues_delays' | 
                'visitors' | 'notes';
  content: string;
  order_num: number;
  created_at: string;
  updated_at: string;
  // Relations
  daily_log?: DailyLog;
}

// ===== ACTION ITEMS SYSTEM =====

export interface ActionItem {
  id: string;
  title: string;
  description?: string;
  source_type: 'meeting' | 'out_of_scope' | 'action_item' | 'observation';
  source_content?: string;
  log_id?: string;
  project_id?: string;
  assigned_to?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled';
  due_date?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  // Relations
  project?: Project;
  daily_log?: DailyLog;
  action_item_notes?: ActionItemNote[];
  action_item_attachments?: ActionItemAttachment[];
}

export interface ActionItemNote {
  id: string;
  action_item_id: string;
  note: string;
  created_by: string;
  created_at: string;
  // Relations
  action_item?: ActionItem;
}

export interface ActionItemAttachment {
  id: string;
  action_item_id: string;
  file_name: string;
  file_url: string;
  file_size?: number;
  mime_type?: string;
  uploaded_by: string;
  created_at: string;
  // Relations
  action_item?: ActionItem;
}

// ===== JUNCTION TABLES =====

export interface LogSubcontractor {
  id: string;
  log_id: string;
  subcontractor_id: string;
  created_at: string;
  // Relations
  daily_log?: DailyLog;
  subcontractor?: Subcontractor;
}

export interface LogCrew {
  id: string;
  log_id: string;
  crew_id: string;
  created_at: string;
  // Relations
  daily_log?: DailyLog;
  crew?: Crew;
}

// ===== FUTURE/OPTIONAL ENTITIES =====

export interface LogPhoto {
  id: string;
  log_id: string;
  file_url: string;
  file_name?: string;
  caption?: string;
  uploaded_by?: string;
  created_at: string;
  // Relations
  daily_log?: DailyLog;
}

export interface Equipment {
  id: string;
  name: string;
  type?: string;
  model?: string;
  serial_number?: string;
  rental_company?: string;
  daily_rate?: number;
  status: 'available' | 'on_site' | 'maintenance' | 'out_of_service';
  created_at: string;
  updated_at: string;
}

export interface LogEquipment {
  id: string;
  log_id: string;
  equipment_id: string;
  hours_used?: number;
  created_at: string;
  // Relations
  daily_log?: DailyLog;
  equipment?: Equipment;
}

// ===== APPLICATION-SPECIFIC TYPES =====

// Types used in the ConstructionDailyLog component
export interface TextItem {
  id: string;
  text: string;
}

// Form data for creating action items
export interface ActionItemFormData {
  title: string;
  description: string;
  source_type: 'meeting' | 'out_of_scope' | 'action_item' | 'observation';
  project_id: string;
  assigned_to: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled';
  due_date: string;
  created_by: string;
}

// Daily log data structure used in the frontend
export interface DailyLogData {
  id: string;
  date: string;
  superintendentName: string;
  projectId: string | null;
  projectName: string;
  subcontractors: Subcontractor[];
  crews: Crew[];
  workItems: TextItem[];
  delays: TextItem[];
  tradesOnsite: TextItem[];
  meetings: TextItem[];
  outOfScope: TextItem[];
  actionItems: TextItem[];
  nextDayPlan: TextItem[];
  notes: TextItem[];
}

// ===== API RESPONSE TYPES =====

// Supabase query responses with relations
export interface ActionItemWithRelations extends ActionItem {
  projects?: { name: string };
  daily_logs?: { date: string; superintendent_name: string };
}

export interface DailyLogWithRelations extends DailyLog {
  project: Project;
  log_subcontractors: (LogSubcontractor & { subcontractor: Subcontractor })[];
  log_crews: (LogCrew & { crew: Crew })[];
}

// ===== UTILITY TYPES =====

// For filtering and search
export interface ActionItemFilters {
  searchTerm: string;
  status: string;
  priority: string;
  projectId: string;
}

// For statistics and analytics
export interface ActionItemStats {
  total: number;
  open: number;
  in_progress: number;
  completed: number;
  overdue: number;
  by_priority: {
    low: number;
    medium: number;
    high: number;
    urgent: number;
  };
}

// ===== CONSTANTS =====

export const ACTION_ITEM_STATUSES = ['open', 'in_progress', 'completed', 'on_hold', 'cancelled'] as const;
export const ACTION_ITEM_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
export const ACTION_ITEM_SOURCE_TYPES = ['meeting', 'out_of_scope', 'action_item', 'observation'] as const;
export const EQUIPMENT_STATUSES = ['available', 'on_site', 'maintenance', 'out_of_service'] as const;

export const LOG_SECTION_TYPES = [
  'work_completed',
  'materials_received', 
  'equipment_on_site',
  'weather_conditions',
  'safety_notes',
  'issues_delays',
  'visitors',
  'notes'
] as const;
