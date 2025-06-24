'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Building2, 
  Users, 
  Wrench, 
  AlertTriangle, 
  MessageSquare, 
  FileText, 
  CheckSquare, 
  Calendar, 
  Eye, 
  Plus, 
  Save, 
  ArrowLeft, 
  Download, 
  AlertCircle,
  X
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

// Simple function to generate IDs without requiring uuid
const generateId = () => {
  return Math.random().toString(36).substring(2, 15);
};

// Define types for our data model
interface DailyLogData {
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

interface Project {
  id: string;
  name: string;
  location?: string;
  client?: string;
}

interface Subcontractor {
  id: string;
  name: string;
}

interface Crew {
  id: string;
  name: string;
  members: CrewMember[];
}

interface CrewMember {
  id: string;
  name: string;
}

interface TextItem {
  id: string;
  text: string;
}

interface SectionProps {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  showActionButton?: boolean;
  onCreateActionItem?: (sectionType: string, content: string) => void;
  sectionType?: string;
}

// Section component for consistent UI sections
const Section: React.FC<SectionProps> = ({ title, icon: Icon, children, showActionButton, onCreateActionItem, sectionType }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
      </div>
      {showActionButton && onCreateActionItem && sectionType && (
        <button
          onClick={() => {
            const textItems = document.querySelectorAll(`[data-section="${sectionType}"] textarea`);
            const content = Array.from(textItems).map((textarea: any) => textarea.value).filter(text => text.trim()).join('\n');
            if (content.trim()) {
              onCreateActionItem(sectionType, content);
            }
          }}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Create Action Item
        </button>
      )}
    </div>
    <div data-section={sectionType}>
      {children}
    </div>
  </div>
);

// Text items list component
const TextItemsList = ({ 
  items, 
  setItems, 
  placeholder,
  rows = 3
}: { 
  items: TextItem[], 
  setItems: (items: TextItem[]) => void,
  placeholder: string,
  rows?: number
}) => {
  // Ensure items is always an array
  const safeItems = Array.isArray(items) ? items : [{ id: generateId(), text: '' }];
  
  const addItem = () => {
    setItems([...safeItems, { id: generateId(), text: '' }]);
  };

  const updateItem = (id: string, text: string) => {
    setItems(safeItems.map(item => 
      item.id === id ? { ...item, text } : item
    ));
  };

  const removeItem = (id: string) => {
    if (safeItems.length <= 1) return;
    setItems(safeItems.filter(item => item.id !== id));
  };

  return (
    <div>
      {safeItems.map(item => (
        <div key={item.id} className="flex gap-2 mb-3">
          <textarea
            value={item.text}
            onChange={(e) => updateItem(item.id, e.target.value)}
            placeholder={placeholder}
            rows={rows}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
          {safeItems.length > 1 && (
            <button
              onClick={() => removeItem(item.id)}
              className="flex items-center justify-center w-10 h-10 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      ))}
      <button
        onClick={addItem}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        type="button"
      >
        <Plus className="h-4 w-4" />
        Add Item
      </button>
    </div>
  );
};

// Subcontractors management component
const SubcontractorManager = ({ 
  subcontractors, 
  setSubcontractors,
  availableSubcontractors 
}: { 
  subcontractors: Subcontractor[], 
  setSubcontractors: (subs: Subcontractor[]) => void,
  availableSubcontractors: Subcontractor[]
}) => {
  const [selectedSubcontractorId, setSelectedSubcontractorId] = useState('');

  const addSubcontractor = () => {
    if (!selectedSubcontractorId) return;
    
    const subcontractor = availableSubcontractors.find(s => s.id === selectedSubcontractorId);
    if (!subcontractor) return;
    
    // Check if already added
    if (subcontractors.find(s => s.id === subcontractor.id)) return;
    
    setSubcontractors([...subcontractors, subcontractor]);
    setSelectedSubcontractorId('');
  };

  const removeSubcontractor = (id: string) => {
    setSubcontractors(subcontractors.filter(sub => sub.id !== id));
  };

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <select
          value={selectedSubcontractorId}
          onChange={(e) => setSelectedSubcontractorId(e.target.value)}
          className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Select subcontractor...</option>
          {availableSubcontractors
            .filter(sub => !subcontractors.find(s => s.id === sub.id))
            .map(sub => (
              <option key={sub.id} value={sub.id}>{sub.name}</option>
            ))}
        </select>
        <button
          onClick={addSubcontractor}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          type="button"
        >
          Add
        </button>
      </div>
      <div className="space-y-2">
        {subcontractors.map(sub => (
          <div key={sub.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
            <span className="text-sm font-medium">{sub.name}</span>
            <button
              onClick={() => removeSubcontractor(sub.id)}
              className="text-red-600 hover:text-red-800"
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// Crews management component
const CrewManager = ({ 
  crews, 
  setCrews,
  availableCrews 
}: { 
  crews: Crew[], 
  setCrews: (crews: Crew[]) => void,
  availableCrews: Crew[]
}) => {
  const [selectedCrewId, setSelectedCrewId] = useState('');
  
  const addCrew = () => {
    if (!selectedCrewId) return;
    
    const crew = availableCrews.find(c => c.id === selectedCrewId);
    if (!crew) return;
    
    // Check if already added
    if (crews.find(c => c.id === crew.id)) return;
    
    setCrews([...crews, crew]);
    setSelectedCrewId('');
  };

  const removeCrew = (crewId: string) => {
    setCrews(crews.filter(crew => crew.id !== crewId));
  };

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <select
          value={selectedCrewId}
          onChange={(e) => setSelectedCrewId(e.target.value)}
          className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Select crew...</option>
          {availableCrews
            .filter(crew => !crews.find(c => c.id === crew.id))
            .map(crew => (
              <option key={crew.id} value={crew.id}>{crew.name}</option>
            ))}
        </select>
        <button
          onClick={addCrew}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          type="button"
        >
          Add
        </button>
      </div>
      <div className="space-y-4">
        {crews.map(crew => (
          <div key={crew.id} className="p-3 bg-gray-50 rounded-md">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">{crew.name}</span>
              <button
                onClick={() => removeCrew(crew.id)}
                className="text-red-600 hover:text-red-800"
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="text-sm text-gray-600">
              Members: {crew.members.map(member => member.name).join(', ')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Trades list component
const TradesList = ({ 
  trades, 
  setTrades 
}: { 
  trades: TextItem[], 
  setTrades: (trades: TextItem[]) => void
}) => {
  // Ensure trades is always an array
  const safeTrades = Array.isArray(trades) ? trades : [{ id: generateId(), text: '' }];
  
  const addTrade = () => {
    setTrades([...safeTrades, { id: generateId(), text: '' }]);
  };

  const updateTrade = (id: string, text: string) => {
    setTrades(safeTrades.map(trade => 
      trade.id === id ? { ...trade, text } : trade
    ));
  };

  const removeTrade = (id: string) => {
    if (safeTrades.length <= 1) return;
    setTrades(safeTrades.filter(trade => trade.id !== id));
  };

  return (
    <div>
      {safeTrades.map(trade => (
        <div key={trade.id} className="flex gap-2 mb-3">
          <input
            type="text"
            value={trade.text}
            onChange={(e) => updateTrade(trade.id, e.target.value)}
            placeholder="Enter trade name (e.g., JLS, HTI - windows and sliders, OJV - Sheet Metal)"
            className="flex-1 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {safeTrades.length > 1 && (
            <button
              onClick={() => removeTrade(trade.id)}
              className="flex items-center justify-center w-10 h-10 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      ))}
      <button
        onClick={addTrade}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        type="button"
      >
        <Plus className="h-4 w-4" />
        Add Trade
      </button>
    </div>
  );
};

// Main ConstructionDailyLogEdit component
interface ConstructionDailyLogEditProps {
  logId: string;
}

const ConstructionDailyLogEdit: React.FC<ConstructionDailyLogEditProps> = ({ logId }) => {
  const router = useRouter();
  
  // Ensure all items have default arrays with at least one item
  const createDefaultItem = () => ({ id: generateId(), text: '' });
  const createDefaultArray = () => [createDefaultItem()];
  
  const createDefaultCrewMember = (name: string) => ({ id: generateId(), name });
  const createDefaultCrew = (name: string, members: string[] = []) => ({
    id: generateId(),
    name,
    members: members.map(name => createDefaultCrewMember(name))
  });
  
  // Initialize state with unique IDs for all items
  const [logData, setLogData] = useState<DailyLogData>({
    id: logId,
    date: new Date().toISOString().split('T')[0],
    superintendentName: '',
    projectId: null,
    projectName: '',
    subcontractors: [],
    crews: [],
    workItems: createDefaultArray(),
    delays: createDefaultArray(),
    tradesOnsite: createDefaultArray(),
    meetings: createDefaultArray(),
    outOfScope: createDefaultArray(),
    actionItems: createDefaultArray(),
    nextDayPlan: createDefaultArray(),
    notes: createDefaultArray(),
  });

  // Additional state for Supabase integration
  const [projects, setProjects] = useState<Project[]>([]);
  const [availableSubcontractors, setAvailableSubcontractors] = useState<Subcontractor[]>([]);
  const [availableCrews, setAvailableCrews] = useState<Crew[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const printRef = React.useRef<HTMLDivElement>(null);

  // Fetch data from Supabase on component mount
  useEffect(() => {
    fetchInitialData();
    fetchLogData();
  }, [logId]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      
      // Fetch projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('id, name, location, client')
        .order('name');
      
      if (projectsError) throw projectsError;
      setProjects(projectsData || []);

      // Fetch subcontractors
      const { data: subcontractorsData, error: subcontractorsError } = await supabase
        .from('subcontractors')
        .select('id, name')
        .order('name');
      
      if (subcontractorsError) throw subcontractorsError;
      setAvailableSubcontractors(subcontractorsData || []);

      // Fetch crews with members
      const { data: crewsData, error: crewsError } = await supabase
        .from('crews')
        .select(`
          id,
          name,
          crew_members(id, name, role)
        `)
        .order('name');
      
      if (crewsError) throw crewsError;
      
      // Transform crew data to match our interface
      const transformedCrews = (crewsData || []).map(crew => ({
        id: crew.id,
        name: crew.name,
        members: (crew.crew_members || []).map((member: any) => ({
          id: member.id,
          name: member.name
        }))
      }));
      
      setAvailableCrews(transformedCrews);
      
    } catch (error: any) {
      console.error('Error fetching initial data:', error);
      setError(error.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchLogData = async () => {
    try {
      setLoading(true);
      
      // Fetch the daily log
      const { data: logData, error: logError } = await supabase
        .from('daily_logs')
        .select(`
          *,
          projects(id, name, location, client),
          log_sections(id, section_type, content, order_num),
          log_subcontractors(subcontractor_id, subcontractors(id, name)),
          log_crews(crew_id, crews(id, name, crew_members(id, name, role)))
        `)
        .eq('id', logId)
        .single();

      if (logError) throw logError;

      if (logData) {
        // Transform the data to match our component structure
        const transformedLogData: DailyLogData = {
          id: logData.id,
          date: logData.date,
          superintendentName: logData.superintendent_name || '',
          projectId: logData.project_id,
          projectName: logData.projects?.name || '',
          subcontractors: (logData.log_subcontractors || []).map((item: any) => ({
            id: item.subcontractors.id,
            name: item.subcontractors.name
          })),
          crews: (logData.log_crews || []).map((item: any) => ({
            id: item.crews.id,
            name: item.crews.name,
            members: (item.crews.crew_members || []).map((member: any) => ({
              id: member.id,
              name: member.name
            }))
          })),
          workItems: createDefaultArray(),
          delays: createDefaultArray(),
          tradesOnsite: createDefaultArray(),
          meetings: createDefaultArray(),
          outOfScope: createDefaultArray(),
          actionItems: createDefaultArray(),
          nextDayPlan: createDefaultArray(),
          notes: createDefaultArray(),
        };

        // Parse log sections into their respective arrays
        if (logData.log_sections) {
          const sections = logData.log_sections.sort((a: any, b: any) => a.order_num - b.order_num);
          
          sections.forEach((section: any) => {
            const items = section.content.split('\n').filter((text: string) => text.trim()).map((text: string) => ({
              id: generateId(),
              text: text.trim()
            }));
            
            switch (section.section_type) {
              case 'work_performed':
                transformedLogData.workItems = items.length > 0 ? items : createDefaultArray();
                break;
              case 'delays':
                transformedLogData.delays = items.length > 0 ? items : createDefaultArray();
                break;
              case 'trades_onsite':
                transformedLogData.tradesOnsite = items.length > 0 ? items : createDefaultArray();
                break;
              case 'meetings':
                transformedLogData.meetings = items.length > 0 ? items : createDefaultArray();
                break;
              case 'out_of_scope':
                transformedLogData.outOfScope = items.length > 0 ? items : createDefaultArray();
                break;
              case 'action_items':
                transformedLogData.actionItems = items.length > 0 ? items : createDefaultArray();
                break;
              case 'next_day_plan':
                transformedLogData.nextDayPlan = items.length > 0 ? items : createDefaultArray();
                break;
              case 'notes':
                transformedLogData.notes = items.length > 0 ? items : createDefaultArray();
                break;
            }
          });
        }

        setLogData(transformedLogData);
      }
      
    } catch (error: any) {
      console.error('Error fetching log data:', error);
      setError(error.message || 'Failed to load log data');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLogData(prev => ({ ...prev, date: e.target.value }));
  };

  const handleSuperintendentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLogData(prev => ({ ...prev, superintendentName: e.target.value }));
  };

  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedProject = projects.find(p => p.id === e.target.value);
    setLogData(prev => ({ 
      ...prev, 
      projectId: e.target.value || null,
      projectName: selectedProject?.name || ''
    }));
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      // Validation
      if (!logData.date || !logData.superintendentName || !logData.projectId) {
        setError('Please fill in all required fields (Date, Superintendent, Project)');
        return;
      }

      // Update daily log
      const { error: dailyLogError } = await supabase
        .from('daily_logs')
        .update({
          date: logData.date,
          project_id: logData.projectId,
          superintendent_name: logData.superintendentName
        })
        .eq('id', logId);

      if (dailyLogError) throw dailyLogError;

      // Delete existing log sections
      const { error: deleteSectionsError } = await supabase
        .from('log_sections')
        .delete()
        .eq('log_id', logId);

      if (deleteSectionsError) throw deleteSectionsError;

      // Prepare log sections
      const logSections = [];
      let orderNum = 1;

      // Add all sections with content
      const sectionMap = [
        { type: 'work_performed', items: logData.workItems },
        { type: 'delays', items: logData.delays },
        { type: 'trades_onsite', items: logData.tradesOnsite },
        { type: 'meetings', items: logData.meetings },
        { type: 'out_of_scope', items: logData.outOfScope },
        { type: 'action_items', items: logData.actionItems },
        { type: 'next_day_plan', items: logData.nextDayPlan },
        { type: 'notes', items: logData.notes }
      ];

      for (const section of sectionMap) {
        const content = section.items
          .filter(item => item.text.trim())
          .map(item => item.text.trim())
          .join('\n');
        
        if (content) {
          logSections.push({
            log_id: logId,
            section_type: section.type,
            content,
            order_num: orderNum++
          });
        }
      }

      // Save log sections
      if (logSections.length > 0) {
        const { error: sectionsError } = await supabase
          .from('log_sections')
          .insert(logSections);

        if (sectionsError) throw sectionsError;
      }

      // Delete existing subcontractor associations
      const { error: deleteSubsError } = await supabase
        .from('log_subcontractors')
        .delete()
        .eq('log_id', logId);

      if (deleteSubsError) throw deleteSubsError;

      // Save subcontractor associations
      const subcontractorAssociations = logData.subcontractors.map(sub => ({
        log_id: logId,
        subcontractor_id: sub.id
      }));

      if (subcontractorAssociations.length > 0) {
        const { error: subsError } = await supabase
          .from('log_subcontractors')
          .insert(subcontractorAssociations);

        if (subsError) throw subsError;
      }

      // Delete existing crew associations
      const { error: deleteCrewsError } = await supabase
        .from('log_crews')
        .delete()
        .eq('log_id', logId);

      if (deleteCrewsError) throw deleteCrewsError;

      // Save crew associations
      const crewAssociations = logData.crews.map(crew => ({
        log_id: logId,
        crew_id: crew.id
      }));

      if (crewAssociations.length > 0) {
        const { error: crewsError } = await supabase
          .from('log_crews')
          .insert(crewAssociations);

        if (crewsError) throw crewsError;
      }

      setSuccess('Daily log updated successfully!');
      
      // Redirect back to view page after a short delay
      setTimeout(() => {
        router.push(`/logs/${logId}`);
      }, 1000);
      
    } catch (error: any) {
      console.error('Error updating daily log:', error);
      setError(error.message || 'Failed to update daily log');
    } finally {
      setSaving(false);
    }
  };

  const createActionItem = async (sectionType: string, content: string) => {
    try {
      // Map section types to source types
      const sourceTypeMap: { [key: string]: string } = {
        'meetings': 'meeting',
        'outOfScope': 'out_of_scope', 
        'actionItems': 'action_item',
        'notes': 'observation'
      };

      const sourceType = sourceTypeMap[sectionType] || 'action_item';

      // Create action item data
      const actionItemData = {
        title: content.length > 50 ? content.substring(0, 50) + '...' : content,
        description: content,
        source_type: sourceType,
        source_content: content,
        project_id: logData.projectId,
        priority: 'medium',
        status: 'open',
        created_by: logData.superintendentName || 'Unknown'
      };

      // Insert into action_items table
      const { error } = await supabase
        .from('action_items')
        .insert([actionItemData]);

      if (error) throw error;

      setSuccess('Action item created successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (error: any) {
      console.error('Error creating action item:', error);
      setError(error.message || 'Failed to create action item');
      
      // Clear error message after 5 seconds
      setTimeout(() => setError(''), 5000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">Loading log data...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-800">Edit Daily Log</h1>
            </div>
            <div className="flex gap-3">
              <Link 
                href={`/logs/${logId}`}
                className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Cancel
              </Link>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                type="button"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>

          {/* Error and Success Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
              {success}
            </div>
          )}

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
              <input
                type="date"
                value={logData.date}
                onChange={handleDateChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Superintendent Name *</label>
              <input
                type="text"
                value={logData.superintendentName}
                onChange={handleSuperintendentChange}
                placeholder="Enter your name"
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Project *</label>
              <select
                value={logData.projectId || ''}
                onChange={handleProjectChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select a project</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name} {project.location && `- ${project.location}`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Manage Subcontractors and Crews */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Section title="Manage Subcontractors" icon={Users}>
            <SubcontractorManager 
              subcontractors={logData.subcontractors} 
              setSubcontractors={(newSubs: Subcontractor[]) => setLogData(prev => ({ ...prev, subcontractors: newSubs }))}
              availableSubcontractors={availableSubcontractors}
            />
          </Section>

          <Section title="Manage Crews" icon={Users}>
            <CrewManager 
              crews={logData.crews} 
              setCrews={(newCrews: Crew[]) => setLogData(prev => ({ ...prev, crews: newCrews }))}
              availableCrews={availableCrews}
            />
          </Section>
        </div>

        {/* Work Performed */}
        <Section title="1. Work Performed (All Trades)" icon={Wrench}>
          <TextItemsList 
            items={logData.workItems || createDefaultArray()} 
            setItems={(newItems: TextItem[]) => setLogData(prev => ({ ...prev, workItems: newItems }))} 
            placeholder="Describe work performed..."
          />
        </Section>

        {/* Delays */}
        <Section title="2. Delays / Disruptions" icon={AlertTriangle}>
          <TextItemsList 
            items={logData.delays || createDefaultArray()} 
            setItems={(newItems: TextItem[]) => setLogData(prev => ({ ...prev, delays: newItems }))} 
            placeholder="Describe delays or disruptions..."
          />
        </Section>

        {/* Trades Onsite */}
        <Section title="3. Trades Onsite" icon={Users}>
          <TradesList 
            trades={logData.tradesOnsite || createDefaultArray()} 
            setTrades={(newTrades: TextItem[]) => setLogData(prev => ({ ...prev, tradesOnsite: newTrades }))} 
          />
        </Section>

        {/* Meetings */}
        <Section 
          title="4. Meetings / Discussions" 
          icon={MessageSquare}
          showActionButton={true}
          onCreateActionItem={createActionItem}
          sectionType="meetings"
        >
          <TextItemsList 
            items={logData.meetings || createDefaultArray()} 
            setItems={(newItems: TextItem[]) => setLogData(prev => ({ ...prev, meetings: newItems }))} 
            placeholder="Describe meetings and discussions..."
            rows={4}
          />
        </Section>

        {/* Out of Scope */}
        <Section 
          title="5. Out-of-Scope / Extra Work Identified" 
          icon={FileText}
          showActionButton={true}
          onCreateActionItem={createActionItem}
          sectionType="outOfScope"
        >
          <TextItemsList 
            items={logData.outOfScope || createDefaultArray()} 
            setItems={(newItems: TextItem[]) => setLogData(prev => ({ ...prev, outOfScope: newItems }))} 
            placeholder="Describe out-of-scope or extra work..."
          />
        </Section>

        {/* Action Items */}
        <Section 
          title="6. Action Items" 
          icon={CheckSquare}
          showActionButton={true}
          onCreateActionItem={createActionItem}
          sectionType="actionItems"
        >
          <TextItemsList 
            items={logData.actionItems || createDefaultArray()} 
            setItems={(newItems: TextItem[]) => setLogData(prev => ({ ...prev, actionItems: newItems }))} 
            placeholder="Describe action items..."
          />
        </Section>

        {/* Next Day Plan */}
        <Section title="7. Plan for Next Day (All Trades)" icon={Calendar}>
          <TextItemsList 
            items={logData.nextDayPlan || createDefaultArray()} 
            setItems={(newItems: TextItem[]) => setLogData(prev => ({ ...prev, nextDayPlan: newItems }))} 
            placeholder="Describe tomorrow's plan..."
          />
        </Section>

        {/* Notes */}
        <Section 
          title="8. Notes / Observations" 
          icon={Eye}
          showActionButton={true}
          onCreateActionItem={createActionItem}
          sectionType="notes"
        >
          <TextItemsList 
            items={logData.notes || createDefaultArray()} 
            setItems={(newItems: TextItem[]) => setLogData(prev => ({ ...prev, notes: newItems }))} 
            placeholder="Add notes and observations..."
          />
        </Section>
      </div>
    </div>
  );
};

export default ConstructionDailyLogEdit;
