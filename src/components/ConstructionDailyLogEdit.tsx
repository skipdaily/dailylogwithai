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
  contractors: ContractorEntry[];
  delays: TextItem[];
  tradesOnsite: TextItem[];
  meetings: TextItem[];
  outOfScope: TextItem[];
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

interface TextItem {
  id: string;
  text: string;
}

interface ContractorEntry {
  id: string;
  subcontractorId: string;
  name: string;
  crewCount: number;
  crewNames: string;
  workPerformed: string;
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

// New ContractorsManager (same implementation concept as in create file)
const ContractorsManager = ({
  contractors,
  setContractors,
  availableSubcontractors
}: {
  contractors: ContractorEntry[];
  setContractors: (c: ContractorEntry[]) => void;
  availableSubcontractors: Subcontractor[];
}) => {
  const [selected, setSelected] = useState('');
  const add = () => {
    if (!selected) return;
    const sub = availableSubcontractors.find(s => s.id === selected);
    if (!sub) return;
    if (contractors.find(c => c.subcontractorId === sub.id)) return;
    // Add new contractor to the top of the list
    setContractors([
      {
        id: generateId(),
        subcontractorId: sub.id,
        name: sub.name,
        crewCount: 0,
        crewNames: '',
        workPerformed: ''
      },
      ...contractors
    ]);
    setSelected('');
  };
  const update = (id: string, patch: Partial<ContractorEntry>) =>
    setContractors(contractors.map(c => c.id === id ? { ...c, ...patch } : c));
  const remove = (id: string) => setContractors(contractors.filter(c => c.id !== id));
  return (
    <div>
      <div className="flex gap-2 mb-4">
        <select
          value={selected}
          onChange={e => setSelected(e.target.value)}
          className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Select contractor...</option>
          {availableSubcontractors
            .filter(s => !contractors.find(c => c.subcontractorId === s.id))
            .map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <button
          onClick={add}
          disabled={!selected}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          type="button"
        >
          Add
        </button>
      </div>
      {contractors.length === 0 && <p className="text-gray-500 italic">No contractors added</p>}
      <div className="space-y-4">
        {contractors.map(c => (
          <div key={c.id} className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-3">
            <div className="flex justify-between">
              <h4 className="font-semibold text-sm">{c.name}</h4>
              <button
                onClick={() => remove(c.id)}
                className="text-red-600 hover:text-red-800 text-sm"
                type="button"
              >
                Remove
              </button>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Crew Count</label>
                <input
                  type="number"
                  min={0}
                  value={c.crewCount}
                  onChange={e => update(c.id, { crewCount: parseInt(e.target.value || '0', 10) })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Crew Names (optional)</label>
                <textarea
                  rows={2}
                  value={c.crewNames}
                  onChange={e => update(c.id, { crewNames: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="List crew members..."
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs font-medium text-gray-600 mb-1">Work Performed</label>
                <textarea
                  rows={3}
                  value={c.workPerformed}
                  onChange={e => update(c.id, { workPerformed: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe work performed..."
                />
              </div>
            </div>
          </div>
        ))}
      </div>
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

  // Helper to get local date in YYYY-MM-DD format (avoids UTC timezone issues)
  const getLocalDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Initialize state with unique IDs for all items
  const [logData, setLogData] = useState<DailyLogData>({
    id: logId,
    date: getLocalDateString(),
    superintendentName: '',
    projectId: null,
    projectName: '',
    contractors: [],
    delays: createDefaultArray(),
    tradesOnsite: createDefaultArray(),
    meetings: createDefaultArray(),
    outOfScope: createDefaultArray(),
    nextDayPlan: createDefaultArray(),
    notes: createDefaultArray(),
  });

  // Additional state for Supabase integration
  const [projects, setProjects] = useState<Project[]>([]);
  const [availableSubcontractors, setAvailableSubcontractors] = useState<Subcontractor[]>([]);
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
          log_subcontractors(subcontractor_id, subcontractors(id, name))
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
          contractors: [],
          delays: createDefaultArray(),
          tradesOnsite: createDefaultArray(),
          meetings: createDefaultArray(),
          outOfScope: createDefaultArray(),
          nextDayPlan: [],
          notes: [],
        };

        // Parse log sections into their respective arrays
        // Group all sections by type to handle multiple rows per section type
        if (logData.log_sections) {
          const sections = logData.log_sections.sort((a: any, b: any) => a.order_num - b.order_num);

          sections.forEach((section: any) => {
            // Each section content may contain multiple newline-separated items
            const items = section.content.split('\n').filter((text: string) => text.trim()).map((text: string) => ({
              id: generateId(),
              text: text.trim()
            }));

            // Append items to existing array instead of overwriting
            switch (section.section_type) {
              case 'delays':
                transformedLogData.delays.push(...items);
                break;
              case 'trades_onsite':
                transformedLogData.tradesOnsite.push(...items);
                break;
              case 'meetings':
                transformedLogData.meetings.push(...items);
                break;
              case 'out_of_scope':
                transformedLogData.outOfScope.push(...items);
                break;
              case 'next_day_plan':
                transformedLogData.nextDayPlan.push(...items);
                break;
              case 'notes':
                transformedLogData.notes.push(...items);
                break;
            }
          });
          
          // Ensure each array has at least one empty item if empty
          if (transformedLogData.delays.length === 0) transformedLogData.delays = createDefaultArray();
          if (transformedLogData.tradesOnsite.length === 0) transformedLogData.tradesOnsite = createDefaultArray();
          if (transformedLogData.meetings.length === 0) transformedLogData.meetings = createDefaultArray();
          if (transformedLogData.outOfScope.length === 0) transformedLogData.outOfScope = createDefaultArray();
          if (transformedLogData.nextDayPlan.length === 0) transformedLogData.nextDayPlan = createDefaultArray();
          if (transformedLogData.notes.length === 0) transformedLogData.notes = createDefaultArray();
        }

        const contractorWorkSections = (logData.log_sections || []).filter((s: any) => s.section_type === 'contractor_work');
        const contractorsMap: ContractorEntry[] = contractorWorkSections.map((s: any) => {
          try {
            const parsed = JSON.parse(s.content);
            const subRel = (logData.log_subcontractors || []).find((ls: any) => ls.subcontractor_id === parsed.subcontractor_id);
            const name = subRel?.subcontractors?.name || 'Unknown';
            return {
              id: generateId(),
              subcontractorId: parsed.subcontractor_id,
              name,
              crewCount: parsed.crewCount ?? 0,
              crewNames: parsed.crewNames ?? '',
              workPerformed: parsed.workPerformed ?? ''
            };
          } catch {
            return null;
          }
        }).filter(Boolean);
        transformedLogData.contractors = contractorsMap.length > 0 ? contractorsMap : [];

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
        { type: 'delays', items: logData.delays },
        { type: 'trades_onsite', items: logData.tradesOnsite },
        { type: 'meetings', items: logData.meetings },
        { type: 'out_of_scope', items: logData.outOfScope },
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

      // ADD contractor_work rows BEFORE insertion (was after insert previously -> bug)
      for (const contractor of logData.contractors) {
        const payload = {
          subcontractor_id: contractor.subcontractorId,
          crewCount: contractor.crewCount,
          crewNames: contractor.crewNames,
          workPerformed: contractor.workPerformed
        };
        logSections.push({
          log_id: logId,
          section_type: 'contractor_work',
          content: JSON.stringify(payload),
          order_num: orderNum++
        });
      }

      // Single insert including contractor_work
      if (logSections.length > 0) {
        const { error: sectionsError } = await supabase
          .from('log_sections')
          .insert(logSections);

        if (sectionsError) throw sectionsError;
      }

      // Reset subcontractor associations
      const { error: deleteSubsError } = await supabase
        .from('log_subcontractors')
        .delete()
        .eq('log_id', logId);

      if (deleteSubsError) throw deleteSubsError;

      // Save subcontractor associations
      const subcontractorAssociations = logData.contractors.map(c => ({
        log_id: logId,
        subcontractor_id: c.subcontractorId
      }));

      if (subcontractorAssociations.length > 0) {
        const { error: subsError } = await supabase
          .from('log_subcontractors')
          .insert(subcontractorAssociations);

        if (subsError) throw subsError;
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

        {/* Manage Subcontractors */}
        <Section title="1. Contractors (Crew & Work Performed)" icon={Users}>
          <ContractorsManager
            contractors={logData.contractors}
            setContractors={(c: ContractorEntry[]) => setLogData(prev => ({ ...prev, contractors: c }))}
            availableSubcontractors={availableSubcontractors}
          />
        </Section>

        <Section title="2. Visitors on site" icon={Users}>
          <TradesList
            trades={logData.tradesOnsite || createDefaultArray()}
            setTrades={(newTrades: TextItem[]) => setLogData(prev => ({ ...prev, tradesOnsite: newTrades }))}
          />
        </Section>

        <Section
          title="3. Meetings / Discussions"
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

        <Section
          title="4. Out-of-Scope / Extra Work Identified"
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

        <Section title="5. Delays / Disruptions" icon={AlertTriangle}>
          <TextItemsList
            items={logData.delays || createDefaultArray()}
            setItems={(newItems: TextItem[]) => setLogData(prev => ({ ...prev, delays: newItems }))}
            placeholder="Describe delays or disruptions..."
          />
        </Section>

        <Section
          title="6. Notes / Observations"
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

        <Section title="7. Plan for Next Day/Week (All Trades)" icon={Calendar}>
          <TextItemsList
            items={logData.nextDayPlan || createDefaultArray()}
            setItems={(newItems: TextItem[]) => setLogData(prev => ({ ...prev, nextDayPlan: newItems }))}
            placeholder="Describe plan for next day/week..."
          />
        </Section>
      </div>
    </div>
  );
};

export default ConstructionDailyLogEdit;
