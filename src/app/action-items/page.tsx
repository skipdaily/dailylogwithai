'use client'

import React, { useState, useEffect, Suspense } from 'react';
import { Plus, Search, Edit2, Trash2, AlertCircle, CheckCircle, Clock, AlertTriangle, FileText, MessageSquare } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

interface ActionItem {
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
  created_at?: string;
  updated_at?: string;
  completed_at?: string;
  projects?: { name: string };
  daily_logs?: { date: string; superintendent_name: string };
}

interface ActionItemNote {
  id: string;
  action_item_id: string;
  note: string;
  created_by: string;
  created_at: string;
}

interface Project {
  id: string;
  name: string;
}

interface CrewMember {
  id: string;
  name: string;
  role?: string;
  email?: string;
  phone?: string;
}

interface Subcontractor {
  id: string;
  name: string;
  specialty?: string;
  contact_person?: string;
  email?: string;
  contact_email?: string;
  phone?: string;
  contact_phone?: string;
  is_active?: boolean;
}

// Loading fallback component
function ActionItemsPageLoading() {
  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Action Items</h1>
      </div>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="text-center py-8">
          <div className="text-gray-500">Loading action items...</div>
        </div>
      </div>
    </div>
  );
}

// Main component wrapped in Suspense
function ActionItemsContent() {
  const searchParams = useSearchParams();

  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [crewMembers, setCrewMembers] = useState<CrewMember[]>([]);
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ActionItem | null>(null);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ActionItem | null>(null);
  const [itemNotes, setItemNotes] = useState<ActionItemNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [itemNotesCache, setItemNotesCache] = useState<{ [key: string]: ActionItemNote[] }>({});

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    source_type: 'action_item' as 'meeting' | 'out_of_scope' | 'action_item' | 'observation',
    project_id: '',
    assigned_to: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    status: 'open' as 'open' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled',
    due_date: '',
    created_by: 'Thomas Gould' // Default, could be made dynamic
  });

  useEffect(() => {
    fetchData();

    // Check for URL parameters to auto-populate form
    const shouldAdd = searchParams.get('add');
    if (shouldAdd === 'true') {
      const title = searchParams.get('title') || '';
      const description = searchParams.get('description') || '';
      const sourceType = searchParams.get('source_type') || 'action_item';
      const projectId = searchParams.get('project_id') || '';
      const createdBy = searchParams.get('created_by') || 'Thomas Gould';

      // Update form data with URL parameters
      setFormData({
        title,
        description,
        source_type: sourceType as 'meeting' | 'out_of_scope' | 'action_item' | 'observation',
        project_id: projectId,
        assigned_to: '',
        priority: 'medium',
        status: 'open',
        due_date: '',
        created_by: createdBy
      });

      // Show the add form
      setShowAddForm(true);

      // Clean up URL parameters after auto-populating
      if (window.history.replaceState) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [searchParams]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch action items with related project and log info
      const { data: itemsData, error: itemsError } = await supabase
        .from('action_items')
        .select(`
          *,
          projects(name),
          daily_logs(date, superintendent_name)
        `)
        .order('created_at', { ascending: false });

      if (itemsError) throw itemsError;

      // Fetch projects for the form
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('id, name')
        .order('name');

      if (projectsError) throw projectsError;

      // Fetch crew members
      const { data: crewData, error: crewError } = await supabase
        .from('crew_members')
        .select('id, name, role, email, phone')
        .order('name');

      if (crewError) throw crewError;

      // Fetch active subcontractors
      const { data: subcontractorsData, error: subcontractorsError } = await supabase
        .from('subcontractors')
        .select('id, name, specialty, contact_person, email, contact_email, phone, contact_phone, is_active')
        .eq('is_active', true)
        .order('name');

      if (subcontractorsError) throw subcontractorsError;

      setActionItems(itemsData || []);
      setProjects(projectsData || []);
      setCrewMembers(crewData || []);
      setSubcontractors(subcontractorsData || []);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      setError(error.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const fetchNotes = async (actionItemId: string) => {
    try {
      const { data, error } = await supabase
        .from('action_item_notes')
        .select('*')
        .eq('action_item_id', actionItemId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItemNotes(data || []);
    } catch (error: any) {
      console.error('Error fetching notes:', error);
    }
  };

  const fetchNotesForItem = async (actionItemId: string) => {
    try {
      const { data, error } = await supabase
        .from('action_item_notes')
        .select('*')
        .eq('action_item_id', actionItemId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Cache the notes
      setItemNotesCache(prev => ({
        ...prev,
        [actionItemId]: data || []
      }));

      return data || [];
    } catch (error: any) {
      console.error('Error fetching notes:', error);
      return [];
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      source_type: 'action_item',
      project_id: '',
      assigned_to: '',
      priority: 'medium',
      status: 'open',
      due_date: '',
      created_by: 'Thomas Gould'
    });
    setShowAddForm(false);
    setEditingItem(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');

      // Validate required fields
      if (!formData.title.trim()) {
        setError('Title is required');
        return;
      }

      // Prepare the data for submission
      const submitData = {
        title: formData.title.trim(),
        description: formData.description?.trim() || null,
        source_type: formData.source_type,
        project_id: formData.project_id || null,
        assigned_to: formData.assigned_to?.trim() || null,
        priority: formData.priority,
        status: formData.status,
        due_date: formData.due_date || null,
        created_by: formData.created_by,
        updated_at: new Date().toISOString(),
        // Don't include log_id since it's not set in the form
        log_id: null,
        source_content: null
      };

      console.log('Submitting data:', submitData);

      if (editingItem) {
        // Update existing action item
        const { data, error } = await supabase
          .from('action_items')
          .update(submitData)
          .eq('id', editingItem.id)
          .select();

        console.log('Update response:', { data, error });
        if (error) {
          console.error('Supabase update error:', error);
          console.error('Error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          throw error;
        }
        setSuccess('Action item updated successfully!');
      } else {
        // Add new action item - include created_at for new items
        const newItemData = {
          ...submitData,
          created_at: new Date().toISOString()
        };

        console.log('Inserting new item data:', newItemData);
        const { data, error } = await supabase
          .from('action_items')
          .insert([newItemData])
          .select();

        console.log('Insert response:', { data, error });
        if (error) {
          console.error('Supabase insert error:', error);
          console.error('Error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          throw error;
        }
        setSuccess('Action item added successfully!');
      }

      resetForm();
      fetchData();
    } catch (error: any) {
      console.error('Error saving action item:', error);
      console.error('Full error object:', JSON.stringify(error, null, 2));

      // Better error handling
      let errorMessage = 'Failed to save action item';

      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.details) {
        errorMessage = error.details;
      } else if (error?.hint) {
        errorMessage = error.hint;
      } else if (error?.code) {
        errorMessage = `Database error (${error.code})`;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (typeof error === 'object') {
        // If it's still an empty object or unexpected structure
        errorMessage = `Unexpected error: ${JSON.stringify(error)}`;
      }

      setError(errorMessage);
    }
  };

  const handleEdit = (item: ActionItem) => {
    setFormData({
      title: item.title || '',
      description: item.description || '',
      source_type: item.source_type,
      project_id: item.project_id || '',
      assigned_to: item.assigned_to || '',
      priority: item.priority,
      status: item.status,
      due_date: item.due_date || '',
      created_by: item.created_by || 'Thomas Gould'
    });
    setEditingItem(item);
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this action item?')) return;

    try {
      setError('');
      const { error } = await supabase
        .from('action_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setSuccess('Action item deleted successfully!');
      fetchData();
    } catch (error: any) {
      console.error('Error deleting action item:', error);
      setError(error.message || 'Failed to delete action item');
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      setError('');
      const { error } = await supabase
        .from('action_items')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      fetchData();
    } catch (error: any) {
      console.error('Error updating status:', error);
      setError(error.message || 'Failed to update status');
    }
  };

  const showNotes = async (item: ActionItem) => {
    setSelectedItem(item);
    await fetchNotes(item.id);
    setShowNotesModal(true);
  };

  const addNote = async () => {
    if (!newNote.trim() || !selectedItem) return;

    try {
      const { error } = await supabase
        .from('action_item_notes')
        .insert([{
          action_item_id: selectedItem.id,
          note: newNote.trim(),
          created_by: 'Thomas Gould' // Could be made dynamic
        }]);

      if (error) throw error;
      setNewNote('');
      fetchNotes(selectedItem.id);
    } catch (error: any) {
      console.error('Error adding note:', error);
    }
  };

  const toggleItemExpansion = async (actionItemId: string) => {
    const newExpandedItems = new Set(expandedItems);

    if (expandedItems.has(actionItemId)) {
      // Collapse
      newExpandedItems.delete(actionItemId);
    } else {
      // Expand and fetch notes if not cached
      newExpandedItems.add(actionItemId);
      if (!itemNotesCache[actionItemId]) {
        await fetchNotesForItem(actionItemId);
      }
    }

    setExpandedItems(newExpandedItems);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'on_hold': return 'text-yellow-600 bg-yellow-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      case 'open': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'in_progress': return <Clock className="w-4 h-4" />;
      case 'on_hold': return <AlertTriangle className="w-4 h-4" />;
      case 'cancelled': return <AlertCircle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const filteredItems = actionItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.assigned_to && item.assigned_to.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = !filterStatus || item.status === filterStatus;
    const matchesPriority = !filterPriority || item.priority === filterPriority;
    const matchesProject = !filterProject || item.project_id === filterProject;

    return matchesSearch && matchesStatus && matchesPriority && matchesProject;
  });

  const openItems = filteredItems.filter(item => item.status === 'open').length;
  const inProgressItems = filteredItems.filter(item => item.status === 'in_progress').length;
  const completedItems = filteredItems.filter(item => item.status === 'completed').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading action items...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Action Items</h1>
              <p className="mt-1 text-gray-600">Track and manage construction action items</p>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Action Item
            </button>
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center">
                <FileText className="w-8 h-8 text-gray-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Open</p>
                  <p className="text-2xl font-bold text-gray-900">{openItems}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center">
                <Clock className="w-8 h-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold text-gray-900">{inProgressItems}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">{completedItems}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center">
                <AlertTriangle className="w-8 h-8 text-orange-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{filteredItems.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            {success}
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search action items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="on_hold">On Hold</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <select
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Projects</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>

            <button
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('');
                setFilterPriority('');
                setFilterProject('');
              }}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Action Items List */}
        <div className="bg-white rounded-lg shadow">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No action items found</h3>
              <p className="text-gray-600 mb-4">Get started by creating your first action item</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Action Item
              </button>
            </div>
          ) : (
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredItems.map((item) => (
                    <React.Fragment key={item.id}>
                      <tr
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => toggleItemExpansion(item.id)}
                      >
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900 flex items-center">
                              <span className="mr-2">
                                {expandedItems.has(item.id) ? '▼' : '▶'}
                              </span>
                              {item.title}
                            </div>
                            {item.description && (
                              <div className="text-sm text-gray-500 mt-1 ml-6">{item.description}</div>
                            )}
                            <div className="text-xs text-gray-400 mt-1 ml-6 capitalize">
                              Source: {item.source_type.replace('_', ' ')}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getPriorityColor(item.priority)}`}>
                            {item.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={item.status}
                            onChange={(e) => handleStatusChange(item.id, e.target.value)}
                            className={`text-xs rounded-full px-2 py-1 border-0 font-medium capitalize ${getStatusColor(item.status)}`}
                          >
                            <option value="open">Open</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="on_hold">On Hold</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {item.assigned_to || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {item.due_date ? new Date(item.due_date).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {item.projects?.name || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => showNotes(item)}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded"
                              title="View Notes"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEdit(item)}
                              className="text-indigo-600 hover:text-indigo-900 p-1 rounded"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="text-red-600 hover:text-red-900 p-1 rounded"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Notes Section */}
                      {expandedItems.has(item.id) && (
                        <tr>
                          <td colSpan={7} className="px-6 py-4 bg-gray-50">
                            <div className="ml-6">
                              <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                                <MessageSquare className="w-4 h-4 mr-2" />
                                Notes ({itemNotesCache[item.id]?.length || 0})
                              </h4>

                              {itemNotesCache[item.id]?.length > 0 ? (
                                <div className="space-y-3 max-h-60 overflow-y-auto">
                                  {itemNotesCache[item.id].map((note) => (
                                    <div key={note.id} className="bg-white p-3 rounded-lg border border-gray-200">
                                      <div className="text-sm text-gray-800 mb-2">{note.note}</div>
                                      <div className="text-xs text-gray-500 flex items-center justify-between">
                                        <span>By: {note.created_by}</span>
                                        <span>{formatTimestamp(note.created_at)}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-sm text-gray-500 italic">No notes yet</div>
                              )}

                              <div className="mt-3 text-xs text-gray-400">
                                Created: {formatTimestamp(item.created_at || '')} |
                                Last Updated: {formatTimestamp(item.updated_at || '')}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add/Edit Action Item Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">
                {editingItem ? 'Edit Action Item' : 'Add New Action Item'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter action item title"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                      value={formData.source_type}
                      onChange={(e) => setFormData({ ...formData, source_type: e.target.value as any })}
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
                      value={formData.project_id}
                      onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select project</option>
                      {projects.map(project => (
                        <option key={project.id} value={project.id}>{project.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assigned To
                    </label>
                    <AssignedToAutocomplete
                      value={formData.assigned_to}
                      onChange={(value) => setFormData({ ...formData, assigned_to: value })}
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
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
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
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
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
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {editingItem ? 'Update' : 'Add'} Action Item
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Notes Modal */}
        {showNotesModal && selectedItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">
                Notes for: {selectedItem.title}
              </h2>

              {/* Add Note */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Add Note
                </label>
                <div className="flex gap-2">
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    rows={3}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your note..."
                  />
                  <button
                    onClick={addNote}
                    disabled={!newNote.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Notes List */}
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {itemNotes.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No notes yet</p>
                ) : (
                  itemNotes.map((note) => (
                    <div key={note.id} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium text-gray-900">{note.created_by}</span>
                        <span className="text-sm text-gray-500">
                          {new Date(note.created_at).toLocaleDateString()} at{' '}
                          {new Date(note.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-gray-700">{note.note}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={() => setShowNotesModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Autocomplete component for Assigned To field
interface AutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  crewMembers: CrewMember[];
  subcontractors: Subcontractor[];
  placeholder?: string;
}

function AssignedToAutocomplete({ value, onChange, crewMembers, subcontractors, placeholder }: AutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Combine crew members and subcontractors into assignee options
  const assigneeOptions = React.useMemo(() => {
    const options: Array<{ id: string; name: string; type: 'crew' | 'subcontractor'; details?: string }> = [];

    // Add crew members
    crewMembers.forEach(member => {
      options.push({
        id: `crew_${member.id}`,
        name: member.name,
        type: 'crew',
        details: member.role ? `(${member.role})` : ''
      });
    });

    // Add subcontractors
    subcontractors.forEach(sub => {
      const contactPerson = sub.contact_person ? ` - ${sub.contact_person}` : '';
      options.push({
        id: `sub_${sub.id}`,
        name: sub.name,
        type: 'subcontractor',
        details: sub.specialty ? `(${sub.specialty}${contactPerson})` : contactPerson
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

// Export the main component wrapped in Suspense
export default function ActionItemsPage() {
  return (
    <Suspense fallback={<ActionItemsPageLoading />}>
      <ActionItemsContent />
    </Suspense>
  );
}
