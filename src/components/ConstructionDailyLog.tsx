'use client'

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Download, Save, Users, Building2, Calendar, FileText, AlertTriangle, MessageSquare, Wrench, CheckSquare, Eye, ArrowLeft, AlertCircle } from 'lucide-react';
import Link from 'next/link';
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
  contractors: ContractorEntry[]; // unified contractors + work performed
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
  id: string;               // internal uid for UI
  subcontractorId: string;  // FK to subcontractors table
  name: string;
  crewCount: number;
  crewNames: string;        // optional free text
  workPerformed: string;    // description
}

interface SectionProps {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  showActionButton?: boolean;
  onCreateActionItem?: (sectionType: string, title: string, details?: {
    description?: string;
    priority?: string;
    assignedTo?: string;
    dueDate?: string;
  }) => Promise<void>;
  sectionType?: string;
  crewMembers?: any[];
  subcontractors?: any[];
}

interface AutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  crewMembers: any[];
  subcontractors: any[];
  placeholder?: string;
}

interface AutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  crewMembers: any[];
  subcontractors: any[];
  placeholder?: string;
}

// AssignedToAutocomplete component - identical to action items page
function AssignedToAutocomplete({ value, onChange, crewMembers, subcontractors, placeholder }: AutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Combine crew members and subcontractors into assignee options
  const assigneeOptions = React.useMemo(() => {
    const options: Array<{ id: string; name: string; type: 'crew' | 'subcontractor'; details?: string }> = [];

    // Add crew members - flatten crew members from all crews
    crewMembers.forEach(crew => {
      if (crew.members) {
        crew.members.forEach((member: any) => {
          options.push({
            id: `crew_${member.id}`,
            name: member.name,
            type: 'crew',
            details: crew.name ? `(${crew.name})` : ''
          });
        });
      }
    });

    // Add subcontractors
    subcontractors.forEach(sub => {
      options.push({
        id: `sub_${sub.id}`,
        name: sub.name,
        type: 'subcontractor',
        details: ''
      });
    });

    return options;
  }, [crewMembers, subcontractors]);

  // Filter options based on input
  const filteredOptions = assigneeOptions.filter(option =>
    option.name.toLowerCase().includes(inputValue.toLowerCase()) ||
    (option.details && option.details.toLowerCase().includes(inputValue.toLowerCase()))
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
    setIsOpen(true);
  };

  const handleOptionClick = (option: typeof assigneeOptions[0]) => {
    setInputValue(option.name);
    onChange(option.name);
    setIsOpen(false);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleInputBlur = () => {
    // Delay closing to allow option clicks
    setTimeout(() => setIsOpen(false), 200);
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        placeholder={placeholder || "Type to search crew/contractors or enter custom name"}
      />

      {isOpen && (filteredOptions.length > 0 || inputValue.trim()) && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredOptions.length > 0 && (
            <>
              {filteredOptions.map((option) => (
                <div
                  key={option.id}
                  className="px-3 py-2 hover:bg-blue-50 cursor-pointer flex items-center justify-between"
                  onClick={() => handleOptionClick(option)}
                >
                  <div>
                    <span className="font-medium">{option.name}</span>
                    {option.details && (
                      <span className="text-sm text-gray-500 ml-2">{option.details}</span>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${option.type === 'crew'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-green-100 text-green-700'
                    }`}>
                    {option.type === 'crew' ? 'Crew' : 'Contractor'}
                  </span>
                </div>
              ))}
              {inputValue.trim() && !filteredOptions.some(opt => opt.name.toLowerCase() === inputValue.toLowerCase()) && (
                <div className="px-3 py-2 border-t border-gray-200">
                  <div
                    className="flex items-center justify-between hover:bg-gray-50 cursor-pointer p-2 rounded"
                    onClick={() => {
                      setInputValue(inputValue.trim());
                      onChange(inputValue.trim());
                      setIsOpen(false);
                    }}
                  >
                    <span>Use "{inputValue.trim()}" as custom assignee</span>
                    <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">Custom</span>
                  </div>
                </div>
              )}
            </>
          )}

          {filteredOptions.length === 0 && inputValue.trim() && (
            <div className="px-3 py-2">
              <div
                className="flex items-center justify-between hover:bg-gray-50 cursor-pointer p-2 rounded"
                onClick={() => {
                  setInputValue(inputValue.trim());
                  onChange(inputValue.trim());
                  setIsOpen(false);
                }}
              >
                <span>Add "{inputValue.trim()}" as assignee</span>
                <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">Custom</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Section component for consistent UI sections
const Section: React.FC<SectionProps> = ({ title, icon: Icon, children, showActionButton, onCreateActionItem, sectionType, crewMembers = [], subcontractors = [] }) => {
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionFormData, setActionFormData] = useState({
    title: '',
    description: '',
    source_type: 'action_item' as 'meeting' | 'out_of_scope' | 'action_item' | 'observation',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    status: 'open' as 'open' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled',
    assignedTo: '',
    dueDate: ''
  });

  const handleCreateAction = async () => {
    if (actionFormData.title.trim() && onCreateActionItem && sectionType) {
      try {
        // Call the parent function to handle the action item creation
        await onCreateActionItem(sectionType, actionFormData.title, {
          description: actionFormData.description,
          priority: actionFormData.priority,
          assignedTo: actionFormData.assignedTo,
          dueDate: actionFormData.dueDate
        });

        // Reset form and close modal
        setActionFormData({
          title: '',
          description: '',
          source_type: 'action_item',
          priority: 'medium',
          status: 'open',
          assignedTo: '',
          dueDate: ''
        });
        setShowActionModal(false);
      } catch (error) {
        console.error('Error creating action item:', error);
      }
    }
  };

  // Map section types to source types for display
  const getSourceType = () => {
    const sourceTypeMap: { [key: string]: string } = {
      'meetings': 'meeting',
      'outOfScope': 'out_of_scope',
      'workItems': 'action_item',
      'delays': 'observation',
      'tradesOnsite': 'observation',
      'nextDayPlan': 'action_item',
      'notes': 'observation'
    };
    return sourceTypeMap[sectionType || ''] || 'observation';
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Icon className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          </div>
        </div>
        {children}
      </div>

      {/* Full Action Item Creation Modal - Exact copy of action items page form */}
      {showActionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Add New Action Item</h2>

            <form onSubmit={(e) => { e.preventDefault(); handleCreateAction(); }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={actionFormData.title}
                    onChange={(e) => setActionFormData({ ...actionFormData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter action item title"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={actionFormData.description}
                    onChange={(e) => setActionFormData({ ...actionFormData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter detailed description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Source Type
                  </label>
                  <select
                    value={actionFormData.source_type}
                    onChange={(e) => setActionFormData({ ...actionFormData, source_type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="action_item">Action Item</option>
                    <option value="meeting">Meeting/Discussion</option>
                    <option value="out_of_scope">Out-of-Scope Work</option>
                    <option value="observation">Observation/Note</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project
                  </label>
                  <select
                    value=""
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                  >
                    <option value="">Will use current project</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assigned To
                  </label>
                  <AssignedToAutocomplete
                    value={actionFormData.assignedTo}
                    onChange={(value) => setActionFormData({ ...actionFormData, assignedTo: value })}
                    crewMembers={crewMembers}
                    subcontractors={subcontractors}
                    placeholder="Type to search crew/contractors or enter custom name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={actionFormData.priority}
                    onChange={(e) => setActionFormData({ ...actionFormData, priority: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={actionFormData.status}
                    onChange={(e) => setActionFormData({ ...actionFormData, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="on_hold">On Hold</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={actionFormData.dueDate}
                    onChange={(e) => setActionFormData({ ...actionFormData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowActionModal(false);
                    setActionFormData({
                      title: '',
                      description: '',
                      source_type: 'action_item',
                      priority: 'medium',
                      status: 'open',
                      assignedTo: '',
                      dueDate: ''
                    });
                  }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!actionFormData.title.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Add Action Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

// Text items list component
const TextItemsList = ({
  items,
  setItems,
  placeholder,
  rows = 3,
  onCreateActionItem,
  sectionType,
  crewMembers = [],
  subcontractors = []
}: {
  items: TextItem[],
  setItems: (items: TextItem[]) => void,
  placeholder: string,
  rows?: number,
  onCreateActionItem?: (sectionType: string, title: string, details?: {
    description?: string;
    priority?: string;
    assignedTo?: string;
    dueDate?: string;
  }) => Promise<void>,
  sectionType?: string,
  crewMembers?: any[],
  subcontractors?: any[]
}) => {
  // Ensure items is always an array
  const safeItems = Array.isArray(items) ? items : [{ id: generateId(), text: '' }];

  // Modal state for individual action items
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedItemText, setSelectedItemText] = useState('');
  const [actionFormData, setActionFormData] = useState({
    title: '',
    description: '',
    source_type: 'action_item' as 'meeting' | 'out_of_scope' | 'action_item' | 'observation',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    status: 'open' as 'open' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled',
    assignedTo: '',
    dueDate: ''
  });

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

  const handleCreateActionFromItem = (itemText: string) => {
    if (itemText.trim()) {
      // Create a concise title from the text (first sentence or up to 100 chars)
      let title = itemText.trim();
      const firstSentence = title.split(/[.!?]/)[0];
      if (firstSentence.length > 0 && firstSentence.length < 100) {
        title = firstSentence.trim();
      } else if (title.length > 100) {
        title = title.substring(0, 97) + '...';
      }

      // Map section types to source types
      const getSourceType = () => {
        const sourceTypeMap: { [key: string]: string } = {
          'meetings': 'meeting',
          'outOfScope': 'out_of_scope',
          'workItems': 'action_item',
          'delays': 'observation',
          'tradesOnsite': 'observation',
          'nextDayPlan': 'action_item',
          'notes': 'observation'
        };
        return sourceTypeMap[sectionType || ''] || 'observation';
      };

      setSelectedItemText(itemText);
      setActionFormData({
        title: title,
        description: itemText.trim(), // Full text goes in description
        source_type: getSourceType() as any,
        priority: 'medium',
        status: 'open',
        assignedTo: '',
        dueDate: ''
      });
      setShowActionModal(true);
    }
  };

  const handleCreateAction = async () => {
    if (actionFormData.title.trim() && onCreateActionItem && sectionType) {
      try {
        await onCreateActionItem(sectionType, actionFormData.title, {
          description: actionFormData.description,
          priority: actionFormData.priority,
          assignedTo: actionFormData.assignedTo,
          dueDate: actionFormData.dueDate
        });

        // Reset form and close modal
        setActionFormData({
          title: '',
          description: '',
          source_type: 'action_item',
          priority: 'medium',
          status: 'open',
          assignedTo: '',
          dueDate: ''
        });
        setShowActionModal(false);
      } catch (error) {
        console.error('Error creating action item:', error);
      }
    }
  };

  return (
    <>
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
            <div className="flex flex-col gap-1">
              {/* Action Item button - only show if there's text and we have the create function */}
              {item.text.trim() && onCreateActionItem && sectionType && (
                <button
                  onClick={() => handleCreateActionFromItem(item.text)}
                  className="bg-green-600 text-white px-2 py-2 rounded-md text-xs hover:bg-green-700 transition-colors flex items-center gap-1"
                  type="button"
                  title="Create Action Item from this note"
                >
                  <Plus className="h-3 w-3" />
                  Action
                </button>
              )}
              {/* Trash button */}
              <button
                onClick={() => removeItem(item.id)}
                className="text-red-600 hover:text-red-800 p-2"
                type="button"
                title="Remove item"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
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

      {/* Action Item Creation Modal */}
      {showActionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Add New Action Item</h2>

            <form onSubmit={(e) => { e.preventDefault(); handleCreateAction(); }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={actionFormData.title}
                    onChange={(e) => setActionFormData({ ...actionFormData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter action item title"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={actionFormData.description}
                    onChange={(e) => setActionFormData({ ...actionFormData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter detailed description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Source Type
                  </label>
                  <select
                    value={actionFormData.source_type}
                    onChange={(e) => setActionFormData({ ...actionFormData, source_type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="action_item">Action Item</option>
                    <option value="meeting">Meeting/Discussion</option>
                    <option value="out_of_scope">Out-of-Scope Work</option>
                    <option value="observation">Observation/Note</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project
                  </label>
                  <select
                    value=""
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                  >
                    <option value="">Will use current project</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assigned To
                  </label>
                  <AssignedToAutocomplete
                    value={actionFormData.assignedTo}
                    onChange={(value) => setActionFormData({ ...actionFormData, assignedTo: value })}
                    crewMembers={crewMembers}
                    subcontractors={subcontractors}
                    placeholder="Type to search crew/contractors or enter custom name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={actionFormData.priority}
                    onChange={(e) => setActionFormData({ ...actionFormData, priority: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={actionFormData.status}
                    onChange={(e) => setActionFormData({ ...actionFormData, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="on_hold">On Hold</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={actionFormData.dueDate}
                    onChange={(e) => setActionFormData({ ...actionFormData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowActionModal(false);
                    setActionFormData({
                      title: '',
                      description: '',
                      source_type: 'action_item',
                      priority: 'medium',
                      status: 'open',
                      assignedTo: '',
                      dueDate: ''
                    });
                  }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!actionFormData.title.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Add Action Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
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
          <option value="">Select a subcontractor</option>
          {availableSubcontractors
            .filter(sub => !subcontractors.find(s => s.id === sub.id))
            .map(sub => (
              <option key={sub.id} value={sub.id}>{sub.name}</option>
            ))
          }
        </select>
        <button
          onClick={addSubcontractor}
          className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          type="button"
          disabled={!selectedSubcontractorId}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <div className="space-y-2">
        {subcontractors.map(sub => (
          <div key={sub.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
            <span>{sub.name}</span>
            <button
              onClick={() => removeSubcontractor(sub.id)}
              className="text-red-600 hover:text-red-800"
              type="button"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        {subcontractors.length === 0 && (
          <p className="text-gray-500 italic">No subcontractors selected</p>
        )}
      </div>
    </div>
  );
};

// Trades list component
const TradesList = ({
  trades,
  setTrades,
  onCreateActionItem,
  sectionType,
  crewMembers = [],
  subcontractors = []
}: {
  trades: TextItem[],
  setTrades: (trades: TextItem[]) => void,
  onCreateActionItem?: (sectionType: string, title: string, details?: {
    description?: string;
    priority?: string;
    assignedTo?: string;
    dueDate?: string;
  }) => Promise<void>,
  sectionType?: string,
  crewMembers?: any[],
  subcontractors?: any[]
}) => {
  // Ensure trades is always an array
  const safeTrades = Array.isArray(trades) ? trades : [{ id: generateId(), text: '' }];

  // Modal state for individual action items
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedTradeText, setSelectedTradeText] = useState('');
  const [actionFormData, setActionFormData] = useState({
    title: '',
    description: '',
    source_type: 'action_item' as 'meeting' | 'out_of_scope' | 'action_item' | 'observation',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    status: 'open' as 'open' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled',
    assignedTo: '',
    dueDate: ''
  });

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

  const handleCreateActionFromTrade = (tradeText: string) => {
    if (tradeText.trim()) {
      // Create a concise title from the text
      let title = tradeText.trim();
      if (title.length > 100) {
        title = title.substring(0, 97) + '...';
      }

      setSelectedTradeText(tradeText);
      setActionFormData({
        title: title,
        description: tradeText.trim(), // Full text goes in description
        source_type: 'observation',
        priority: 'medium',
        status: 'open',
        assignedTo: '',
        dueDate: ''
      });
      setShowActionModal(true);
    }
  };

  const handleCreateAction = async () => {
    if (actionFormData.title.trim() && onCreateActionItem && sectionType) {
      try {
        await onCreateActionItem(sectionType, actionFormData.title, {
          description: actionFormData.description,
          priority: actionFormData.priority,
          assignedTo: actionFormData.assignedTo,
          dueDate: actionFormData.dueDate
        });

        // Reset form and close modal
        setActionFormData({
          title: '',
          description: '',
          source_type: 'action_item',
          priority: 'medium',
          status: 'open',
          assignedTo: '',
          dueDate: ''
        });
        setShowActionModal(false);
      } catch (error) {
        console.error('Error creating action item:', error);
      }
    }
  };

  return (
    <>
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
            <div className="flex flex-col gap-1">
              {/* Action Item button - only show if there's text and we have the create function */}
              {trade.text.trim() && onCreateActionItem && sectionType && (
                <button
                  onClick={() => handleCreateActionFromTrade(trade.text)}
                  className="bg-green-600 text-white px-2 py-2 rounded-md text-xs hover:bg-green-700 transition-colors flex items-center gap-1"
                  type="button"
                  title="Create Action Item from this trade"
                >
                  <Plus className="h-3 w-3" />
                  Action
                </button>
              )}
              {/* Trash button */}
              <button
                onClick={() => removeTrade(trade.id)}
                className="text-red-600 hover:text-red-800 p-2"
                type="button"
                title="Remove trade"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
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

      {/* Action Item Creation Modal */}
      {showActionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Add New Action Item</h2>

            <form onSubmit={(e) => { e.preventDefault(); handleCreateAction(); }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={actionFormData.title}
                    onChange={(e) => setActionFormData({ ...actionFormData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter action item title"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={actionFormData.description}
                    onChange={(e) => setActionFormData({ ...actionFormData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter detailed description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Source Type
                  </label>
                  <select
                    value={actionFormData.source_type}
                    onChange={(e) => setActionFormData({ ...actionFormData, source_type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="action_item">Action Item</option>
                    <option value="meeting">Meeting/Discussion</option>
                    <option value="out_of_scope">Out-of-Scope Work</option>
                    <option value="observation">Observation/Note</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project
                  </label>
                  <select
                    value=""
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                  >
                    <option value="">Will use current project</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assigned To
                  </label>
                  <AssignedToAutocomplete
                    value={actionFormData.assignedTo}
                    onChange={(value) => setActionFormData({ ...actionFormData, assignedTo: value })}
                    crewMembers={crewMembers}
                    subcontractors={subcontractors}
                    placeholder="Type to search crew/contractors or enter custom name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={actionFormData.priority}
                    onChange={(e) => setActionFormData({ ...actionFormData, priority: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={actionFormData.status}
                    onChange={(e) => setActionFormData({ ...actionFormData, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="on_hold">On Hold</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={actionFormData.dueDate}
                    onChange={(e) => setActionFormData({ ...actionFormData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowActionModal(false);
                    setActionFormData({
                      title: '',
                      description: '',
                      source_type: 'action_item',
                      priority: 'medium',
                      status: 'open',
                      assignedTo: '',
                      dueDate: ''
                    });
                  }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!actionFormData.title.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Add Action Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

// Print view component
const PrintView = React.forwardRef<HTMLDivElement, { logData: DailyLogData }>(
  ({ logData }, ref) => {
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    return (
      <div ref={ref} className="print:block hidden">
        <style jsx global>{`
          @media print {
            @page {
              margin: 0.75in;
              size: letter;
            }
            
            body {
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
            }
            
            .no-print, .no-print * {
              display: none !important;
            }
            
            .print\\:block {
              display: block !important;
            }
            
            .print\\:hidden {
              display: none !important;
            }
            
            .print\\:text-black {
              color: black !important;
            }
            
            .print\\:bg-white {
              background-color: white !important;
            }
            
            .print\\:border-black {
              border-color: black !important;
            }
            
            .print\\:list-disc {
              list-style-type: disc !important;
            }
            
            .print\\:list-inside {
              list-style-position: inside !important;
            }
            
            .print\\:space-y-1 > * + * {
              margin-top: 0.25rem !important;
            }
            
            .print\\:space-y-2 > * + * {
              margin-top: 0.5rem !important;
            }
            
            .print\\:space-y-3 > * + * {
              margin-top: 0.75rem !important;
            }
            
            .print\\:space-y-6 > * + * {
              margin-top: 1.5rem !important;
            }
            
            .print\\:mb-2 {
              margin-bottom: 0.5rem !important;
            }
            
            .print\\:mb-3 {
              margin-bottom: 0.75rem !important;
            }
            
            .print\\:mb-6 {
              margin-bottom: 1.5rem !important;
            }
            
            .print\\:mb-8 {
              margin-bottom: 2rem !important;
            }
            
            .print\\:mt-8 {
              margin-top: 2rem !important;
            }
            
            .print\\:p-4 {
              padding: 1rem !important;
            }
            
            .print\\:p-8 {
              padding: 2rem !important;
            }
            
            .print\\:pb-1 {
              padding-bottom: 0.25rem !important;
            }
            
            .print\\:pt-4 {
              padding-top: 1rem !important;
            }
            
            .print\\:pl-4 {
              padding-left: 1rem !important;
            }
            
            .print\\:font-bold {
              font-weight: 700 !important;
            }
            
            .print\\:font-semibold {
              font-weight: 600 !important;
            }
            
            .print\\:text-lg {
              font-size: 1.125rem !important;
              line-height: 1.75rem !important;
            }
            
            .print\\:text-3xl {
              font-size: 1.875rem !important;
              line-height: 2.25rem !important;
            }
            
            .print\\:text-sm {
              font-size: 0.875rem !important;
              line-height: 1.25rem !important;
            }
            
            .print\\:text-center {
              text-align: center !important;
            }
            
            .print\\:text-left {
              text-align: left !important;
            }
            
            .print\\:leading-relaxed {
              line-height: 1.625 !important;
            }
            
            .print\\:border {
              border-width: 1px !important;
            }
            
            .print\\:border-b {
              border-bottom-width: 1px !important;
            }
            
            .print\\:border-t {
              border-top-width: 1px !important;
            }
            
            .print\\:border-l-2 {
              border-left-width: 2px !important;
            }
            
            .print\\:grid {
              display: grid !important;
            }
            
            .print\\:grid-cols-2 {
              grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            }
            
            .print\\:grid-cols-3 {
              grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
            }
            
            .print\\:gap-4 {
              gap: 1rem !important;
            }
            
            .print\\:gap-8 {
              gap: 2rem !important;
            }
            
            .print\\:ml-4 {
              margin-left: 1rem !important;
            }
            
            .print\\:italic {
              font-style: italic !important;
            }
            
            .print\\:whitespace-pre-wrap {
              white-space: pre-wrap !important;
            }
            
            .print\\:w-full {
              width: 100% !important;
            }
            
            .print\\:h-full {
              height: 100% !important;
            }
            
            .print\\:fixed {
              position: fixed !important;
            }
            
            .print\\:inset-0 {
              top: 0 !important;
              right: 0 !important;
              bottom: 0 !important;
              left: 0 !important;
            }
            
            .print\\:z-50 {
              z-index: 50 !important;
            }
          }
        `}</style>

        <div className="print:block print:w-full print:h-full print:p-8 print:bg-white print:text-black">
          {/* Header */}
          <div className="print:text-center print:mb-8">
            <h1 className="print:text-3xl print:font-bold print:mb-6 print:text-black">DAILY CONSTRUCTION LOG</h1>
            <div className="print:grid print:grid-cols-3 print:gap-4 print:text-left print:border print:border-black print:p-4">
              <div>
                <strong className="print:text-black">Date:</strong> {formatDate(logData.date)}
              </div>
              <div>
                <strong className="print:text-black">Superintendent:</strong> {logData.superintendentName}
              </div>
              <div>
                <strong className="print:text-black">Project:</strong> {logData.projectName}
              </div>
            </div>
          </div>

          {/* Content Sections */}
          <div className="print:space-y-6">
            {/* Contractors */}
            <div className="print:mb-6">
              <h3 className="print:font-bold print:text-lg print:mb-3 print:text-black print:border-b print:border-black print:pb-1">
                Contractors (Crew & Work Performed)
              </h3>
              {logData.contractors.length > 0 ? (
                <div className="print:space-y-3">
                  {logData.contractors.map(contractor => (
                    <div key={contractor.id} className="print:text-black print:leading-relaxed print:whitespace-pre-wrap print:border-l-2 print:border-gray-300 print:pl-4">
                      <strong>{contractor.name}</strong>
                      <p>Crew Count: {contractor.crewCount}</p>
                      {contractor.crewNames && <p>Crew Names: {contractor.crewNames}</p>}
                      <p>Work Performed: {contractor.workPerformed}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="print:text-black print:italic">No contractors recorded</p>
              )}
            </div>

            {/* Visitors on site */}
            <div className="print:mb-6">
              <h3 className="print:font-bold print:text-lg print:mb-3 print:text-black print:border-b print:border-black print:pb-1">
                2. Visitors on site
              </h3>
              {logData.tradesOnsite.filter(item => item.text.trim()).length > 0 ? (
                <ul className="print:list-disc print:list-inside print:space-y-2">
                  {logData.tradesOnsite.filter(item => item.text.trim()).map(item => (
                    <li key={item.id} className="print:text-black print:leading-relaxed">{item.text}</li>
                  ))}
                </ul>
              ) : (
                <p className="print:text-black print:italic">No trades recorded</p>
              )}
            </div>

            {/* Meetings */}
            <div className="print:mb-6">
              <h3 className="print:font-bold print:text-lg print:mb-3 print:text-black print:border-b print:border-black print:pb-1">
                3. Meetings / Discussions
              </h3>
              {logData.meetings.filter(item => item.text.trim()).length > 0 ? (
                <div className="print:space-y-3">
                  {logData.meetings.filter(item => item.text.trim()).map(item => (
                    <div key={item.id} className="print:text-black print:leading-relaxed print:whitespace-pre-wrap print:border-l-2 print:border-gray-300 print:pl-4">
                      {item.text}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="print:text-black print:italic">No meetings or discussions</p>
              )}
            </div>

            {/* Out of Scope */}
            <div className="print:mb-6">
              <h3 className="print:font-bold print:text-lg print:mb-3 print:text-black print:border-b print:border-black print:pb-1">
                4. Out-of-Scope / Extra Work Identified
              </h3>
              {logData.outOfScope.filter(item => item.text.trim()).length > 0 ? (
                <ul className="print:list-disc print:list-inside print:space-y-2">
                  {logData.outOfScope.filter(item => item.text.trim()).map(item => (
                    <li key={item.id} className="print:text-black print:leading-relaxed">{item.text}</li>
                  ))}
                </ul>
              ) : (
                <p className="print:text-black print:italic">No out-of-scope work identified</p>
              )}
            </div>

            {/* Delays */}
            <div className="print:mb-6">
              <h3 className="print:font-bold print:text-lg print:mb-3 print:text-black print:border-b print:border-black print:pb-1">
                5. Delays / Disruptions
              </h3>
              {logData.delays.filter(item => item.text.trim()).length > 0 ? (
                <ul className="print:list-disc print:list-inside print:space-y-2">
                  {logData.delays.filter(item => item.text.trim()).map(item => (
                    <li key={item.id} className="print:text-black print:leading-relaxed">{item.text}</li>
                  ))}
                </ul>
              ) : (
                <p className="print:text-black print:italic">No delays or disruptions</p>
              )}
            </div>

            {/* Notes */}
            <div className="print:mb-6">
              <h3 className="print:font-bold print:text-lg print:mb-3 print:text-black print:border-b print:border-black print:pb-1">
                6. Notes / Observations
              </h3>
              {logData.notes.filter(item => item.text.trim()).length > 0 ? (
                <div className="print:space-y-3">
                  {logData.notes.filter(item => item.text.trim()).map(item => (
                    <div key={item.id} className="print:text-black print:leading-relaxed print:whitespace-pre-wrap print:border-l-2 print:border-gray-300 print:pl-4">
                      {item.text}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="print:text-black print:italic">No notes or observations</p>
              )}
            </div>

            {/* Plan for Next Day/Week */}
            <div className="print:mb-6">
              <h3 className="print:font-bold print:text-lg print:mb-3 print:text-black print:border-b print:border-black print:pb-1">
                7. Plan for Next Day/Week (All Trades)
              </h3>
              {logData.nextDayPlan.filter(item => item.text.trim()).length > 0 ? (
                <ul className="print:list-disc print:list-inside print:space-y-2">
                  {logData.nextDayPlan.filter(item => item.text.trim()).map(item => (
                    <li key={item.id} className="print:text-black print:leading-relaxed">{item.text}</li>
                  ))}
                </ul>
              ) : (
                <p className="print:text-black print:italic">No plans recorded for next day</p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="print:mt-8 print:pt-4 print:border-t print:border-black print:text-sm print:text-center">
            <p className="print:text-black">
              Daily Log generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>
    );
  }
);

PrintView.displayName = 'PrintView';

// NEW ContractorsManager component
const ContractorsManager = ({
  contractors,
  setContractors,
  availableSubcontractors
}: {
  contractors: ContractorEntry[];
  setContractors: (c: ContractorEntry[]) => void;
  availableSubcontractors: Subcontractor[];
}) => {
  const [selectedId, setSelectedId] = useState('');
  const addContractor = () => {
    if (!selectedId) return;
    const sub = availableSubcontractors.find(s => s.id === selectedId);
    if (!sub) return;
    if (contractors.find(c => c.subcontractorId === sub.id)) return;
    setContractors([
      ...contractors,
      {
        id: generateId(),
        subcontractorId: sub.id,
        name: sub.name,
        crewCount: 0,
        crewNames: '',
        workPerformed: ''
      }
    ]);
    setSelectedId('');
  };
  const update = (id: string, patch: Partial<ContractorEntry>) =>
    setContractors(contractors.map(c => c.id === id ? { ...c, ...patch } : c));
  const remove = (id: string) =>
    setContractors(contractors.filter(c => c.id !== id));
  return (
    <div>
      <div className="flex gap-2 mb-4">
        <select
          value={selectedId}
          onChange={e => setSelectedId(e.target.value)}
          className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Select a contractor</option>
          {availableSubcontractors
            .filter(s => !contractors.find(c => c.subcontractorId === s.id))
            .map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <button
          onClick={addContractor}
          disabled={!selectedId}
          className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          type="button"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      {contractors.length === 0 && (
        <p className="text-gray-500 italic">No contractors added</p>
      )}
      <div className="space-y-4">
        {contractors.map(c => (
          <div key={c.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50 space-y-3">
            <div className="flex justify-between items-center">
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
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Crew Count
                </label>
                <input
                  type="number"
                  min={0}
                  value={c.crewCount}
                  onChange={e => update(c.id, { crewCount: parseInt(e.target.value || '0', 10) })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Crew Names (optional)
                </label>
                <textarea
                  rows={2}
                  value={c.crewNames}
                  onChange={e => update(c.id, { crewNames: e.target.value })}
                  placeholder="List crew members..."
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Work Performed
                </label>
                <textarea
                  rows={3}
                  value={c.workPerformed}
                  onChange={e => update(c.id, { workPerformed: e.target.value })}
                  placeholder="Describe work performed..."
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Main ConstructionDailyLog component
const ConstructionDailyLog = () => {
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
    id: generateId(),
    date: new Date().toISOString().split('T')[0],
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
  }, []);

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
        throw new Error('Please fill in all required fields (Date, Superintendent, Project)');
      }

      // Save daily log
      const { data: dailyLogData, error: dailyLogError } = await supabase
        .from('daily_logs')
        .insert([{
          date: logData.date,
          project_id: logData.projectId,
          superintendent_name: logData.superintendentName
        }])
        .select()
        .single();

      if (dailyLogError) throw dailyLogError;

      const logId = dailyLogData.id;

      // Prepare log sections
      const logSections = [];
      let orderNum = 1;

      // Add all sections with content
      const sectionMap = [
        // contractors handled separately via contractor_work
        { type: 'delays', items: logData.delays },
        { type: 'trades_onsite', items: logData.tradesOnsite },
        { type: 'meetings', items: logData.meetings },
        { type: 'out_of_scope', items: logData.outOfScope },
        { type: 'next_day_plan', items: logData.nextDayPlan },
        { type: 'notes', items: logData.notes }
      ];

      for (const section of sectionMap) {
        for (const item of section.items) {
          if (item.text.trim()) {
            logSections.push({
              log_id: logId,
              section_type: section.type,
              content: item.text.trim(),
              order_num: orderNum++
            });
          }
        }
      }

      // Append contractor_work entries
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

      // Save log sections
      if (logSections.length > 0) {
        const { error: sectionsError } = await supabase
          .from('log_sections')
          .insert(logSections);

        if (sectionsError) throw sectionsError;
      }

      // Save subcontractor associations
      const subcontractorAssociations = logData.contractors.map(c => ({
        log_id: logId,
        subcontractor_id: c.subcontractorId
      }));

      if (subcontractorAssociations.length > 0) {
        const { error: subcontractorsError } = await supabase
          .from('log_subcontractors')
          .insert(subcontractorAssociations);

        if (subcontractorsError) throw subcontractorsError;
      }

      setSuccess('Daily log saved successfully!');

      // Optionally redirect or reset form
      // window.location.href = '/dashboard';

    } catch (error: any) {
      console.error('Error saving daily log:', error);
      setError(error.message || 'Failed to save daily log');
    } finally {
      setSaving(false);
    }
  };

  const handleExportToPDF = async () => {
    try {
      // Show loading state
      setSaving(true);
      setError('');

      // Prepare the data to send to the API
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: logData.id,
          date: logData.date,
          superintendentName: logData.superintendentName,
          projectId: logData.projectId,
          projectName: logData.projectName,
          contractors: logData.contractors.map(c => ({
            name: c.name,
            crewCount: c.crewCount,
            crewNames: c.crewNames,
            workPerformed: c.workPerformed
          })),
          delays: logData.delays,
          tradesOnsite: logData.tradesOnsite,
          meetings: logData.meetings,
          outOfScope: logData.outOfScope,
          nextDayPlan: logData.nextDayPlan,
          notes: logData.notes
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      // Get the PDF blob
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Daily_Log_${(logData.projectName || 'Unknown').replace(/[^a-zA-Z0-9]/g, '_')}_${logData.date}.pdf`;

      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up
      window.URL.revokeObjectURL(url);

      setSuccess('PDF generated successfully!');
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      setError(error.message || 'Failed to generate PDF');
    } finally {
      setSaving(false);
    }
  };

  const createActionItem = async (sectionType: string, title: string, details?: {
    description?: string;
    priority?: string;
    assignedTo?: string;
    dueDate?: string;
  }) => {
    try {
      // Map section types to source types
      const sourceTypeMap: { [key: string]: string } = {
        'meetings': 'meeting',
        'outOfScope': 'out_of_scope',
        'workItems': 'action_item',
        'delays': 'observation',
        'tradesOnsite': 'observation',
        'nextDayPlan': 'action_item',
        'notes': 'observation'
      };

      const sourceType = sourceTypeMap[sectionType] || 'action_item';

      // Create action item data
      const actionItemData = {
        title: title.trim(),
        description: details?.description?.trim() || null,
        source_type: sourceType,
        source_content: title.trim(),
        project_id: logData.projectId,
        assigned_to: details?.assignedTo?.trim() || null,
        priority: details?.priority || 'medium',
        status: 'open',
        due_date: details?.dueDate || null,
        created_by: logData.superintendentName || 'Unknown',
        created_at: new Date().toISOString(),
        log_id: null
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

  return (
    <div className="min-h-screen bg-gray-50 p-4 no-print">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-800">Construction Daily Log</h1>
            </div>
            <div className="flex gap-3">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Link>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                type="button"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={handleExportToPDF}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                type="button"
              >
                <Download className="h-4 w-4" />
                {saving ? 'Generating PDF...' : 'Export PDF'}
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

          {loading && (
            <div className="mb-4 p-3 bg-blue-100 text-blue-700 rounded-md">
              Loading project data...
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
        <div className="mb-6">
          <Section title="1. Contractors (Crew & Work Performed)" icon={Users}>
            <ContractorsManager
              contractors={logData.contractors}
              setContractors={(newC: ContractorEntry[]) => setLogData(prev => ({ ...prev, contractors: newC }))}
              availableSubcontractors={availableSubcontractors}
            />
          </Section>
        </div>

        {/* 2. Visitors on site (was Trades Onsite) */}
        <Section title="2. Visitors on site" icon={Users}>
          <TradesList
            trades={logData.tradesOnsite || createDefaultArray()}
            setTrades={(newTrades: TextItem[]) => setLogData(prev => ({ ...prev, tradesOnsite: newTrades }))}
            onCreateActionItem={createActionItem}
            sectionType="tradesOnsite"
            crewMembers={[]}
            subcontractors={availableSubcontractors}
          />
        </Section>

        {/* 3. Meetings */}
        <Section
          title="3. Meetings / Discussions"
          icon={MessageSquare}
          onCreateActionItem={createActionItem}
          sectionType="meetings"
          crewMembers={[]}
          subcontractors={availableSubcontractors}
        >
          <TextItemsList
            items={logData.meetings || createDefaultArray()}
            setItems={(newItems: TextItem[]) => setLogData(prev => ({ ...prev, meetings: newItems }))}
            placeholder="Describe meetings and discussions..."
            rows={4}
            onCreateActionItem={createActionItem}
            sectionType="meetings"
            crewMembers={[]}
            subcontractors={availableSubcontractors}
          />
        </Section>

        {/* 4. Out-of-Scope */}
        <Section
          title="4. Out-of-Scope / Extra Work Identified"
          icon={FileText}
          onCreateActionItem={createActionItem}
          sectionType="outOfScope"
          crewMembers={[]}
          subcontractors={availableSubcontractors}
        >
          <TextItemsList
            items={logData.outOfScope || createDefaultArray()}
            setItems={(newItems: TextItem[]) => setLogData(prev => ({ ...prev, outOfScope: newItems }))}
            placeholder="Describe out-of-scope or extra work..."
            onCreateActionItem={createActionItem}
            sectionType="outOfScope"
            crewMembers={[]}
            subcontractors={availableSubcontractors}
          />
        </Section>

        {/* 5. Delays */}
        <Section title="5. Delays / Disruptions" icon={AlertTriangle}>
          <TextItemsList
            items={logData.delays || createDefaultArray()}
            setItems={(newItems: TextItem[]) => setLogData(prev => ({ ...prev, delays: newItems }))}
            placeholder="Describe delays or disruptions..."
            onCreateActionItem={createActionItem}
            sectionType="delays"
            crewMembers={[]}
            subcontractors={availableSubcontractors}
          />
        </Section>

        {/* 6. Notes */}
        <Section
          title="6. Notes / Observations"
          icon={Eye}
          onCreateActionItem={createActionItem}
          sectionType="notes"
          crewMembers={[]}
          subcontractors={availableSubcontractors}
        >
          <TextItemsList
            items={logData.notes || createDefaultArray()}
            setItems={(newItems: TextItem[]) => setLogData(prev => ({ ...prev, notes: newItems }))}
            placeholder="Add notes and observations..."
            onCreateActionItem={createActionItem}
            sectionType="notes"
            crewMembers={[]}
            subcontractors={availableSubcontractors}
          />
        </Section>

        {/* 7. Plan (renamed) */}
        <Section title="7. Plan for Next Day/Week (All Trades)" icon={Calendar}>
          <TextItemsList
            items={logData.nextDayPlan || createDefaultArray()}
            setItems={(newItems: TextItem[]) => setLogData(prev => ({ ...prev, nextDayPlan: newItems }))}
            placeholder="Describe plan for next day/week..."
            onCreateActionItem={createActionItem}
            sectionType="nextDayPlan"
            crewMembers={[]}
            subcontractors={availableSubcontractors}
          />
        </Section>
      </div>

      {/* Hidden Print Section */}
      <PrintView ref={printRef} logData={logData} />
    </div>
  );
};

export default ConstructionDailyLog;
