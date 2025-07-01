'use client'

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { Gantt, Task, EventOption, StylingOption, ViewMode, DisplayOption } from 'gantt-task-react';
import { ArrowLeft, Plus, Save, Calendar, BarChart3, RefreshCw, Edit, Trash2 } from 'lucide-react';
import "gantt-task-react/dist/index.css";

interface ProjectTask {
  id: string;
  project_id: string;
  name: string;
  start_date: string;
  end_date: string;
  progress: number;
  type: 'task' | 'milestone' | 'project';
  parent_id?: string;
  dependencies?: string[];
  assigned_to?: string;
  notes?: string;
  color?: string;
}

interface Project {
  id: string;
  name: string;
  location?: string;
  client?: string;
  start_date?: string;
  end_date?: string;
}

interface Contractor {
  id: string;
  name: string;
  specialty?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
}

interface CrewMember {
  id: string;
  name: string;
  role?: string;
}

export default function ProjectGanttPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [ganttTasks, setGanttTasks] = useState<Task[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [crewMembers, setCrewMembers] = useState<CrewMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Month);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTask, setEditingTask] = useState<ProjectTask | null>(null);
  
  // Form state for adding new tasks
  const [taskForm, setTaskForm] = useState({
    name: '',
    start_date: '',
    end_date: '',
    progress: 0,
    type: 'task' as 'task' | 'milestone' | 'project',
    assigned_to: '',
    notes: '',
    color: '#3B82F6'
  });

  useEffect(() => {
    if (projectId) {
      fetchProjectData();
      fetchTasks();
      fetchContractors();
      fetchCrewMembers();
    }
  }, [projectId]);

  useEffect(() => {
    // Convert project tasks to Gantt chart format
    const convertedTasks: Task[] = tasks.map((task, index) => ({
      start: new Date(task.start_date),
      end: new Date(task.end_date),
      name: task.name,
      id: task.id,
      type: task.type === 'milestone' ? 'milestone' : 'task',
      progress: task.progress,
      isDisabled: false,
      styles: task.color ? { 
        backgroundColor: task.color,
        backgroundSelectedColor: task.color,
        progressColor: '#ffffff',
        progressSelectedColor: '#ffffff'
      } : undefined
    }));

    setGanttTasks(convertedTasks);
  }, [tasks]);

  const fetchProjectData = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) throw error;
      setProject(data);
    } catch (error: any) {
      console.error('Error fetching project:', error);
      setError(error.message || 'Failed to fetch project data');
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('project_tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('start_date', { ascending: true });

      if (error) throw error;
      setTasks(data || []);
    } catch (error: any) {
      console.error('Error fetching tasks:', error);
      setError(error.message || 'Failed to fetch project tasks');
    } finally {
      setLoading(false);
    }
  };

  const fetchContractors = async () => {
    try {
      const { data, error } = await supabase
        .from('subcontractors')
        .select('id, name, specialty, contact_person, email, phone')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setContractors(data || []);
    } catch (error: any) {
      console.error('Error fetching contractors:', error);
    }
  };

  const fetchCrewMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('crew_members')
        .select('id, name, role')
        .order('name');

      if (error) throw error;
      setCrewMembers(data || []);
    } catch (error: any) {
      console.error('Error fetching crew members:', error);
    }
  };

  const handleTaskChange = async (task: Task) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('project_tasks')
        .update({
          start_date: task.start.toISOString().split('T')[0],
          end_date: task.end.toISOString().split('T')[0],
          progress: task.progress,
          updated_at: new Date().toISOString()
        })
        .eq('id', task.id);

      if (error) throw error;
      
      // Update local state
      setTasks(prevTasks => 
        prevTasks.map(t => 
          t.id === task.id 
            ? {
                ...t,
                start_date: task.start.toISOString().split('T')[0],
                end_date: task.end.toISOString().split('T')[0],
                progress: task.progress
              }
            : t
        )
      );
      
      setSuccess('Task updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      console.error('Error updating task:', error);
      setError(error.message || 'Failed to update task');
    } finally {
      setSaving(false);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');

      if (!taskForm.name.trim() || !taskForm.start_date || !taskForm.end_date) {
        throw new Error('Name, start date, and end date are required');
      }

      const taskData = {
        project_id: projectId,
        name: taskForm.name.trim(),
        start_date: taskForm.start_date,
        end_date: taskForm.end_date,
        progress: taskForm.progress,
        type: taskForm.type,
        assigned_to: taskForm.assigned_to.trim() || null,
        notes: taskForm.notes.trim() || null,
        color: taskForm.color
      };

      if (editingTask) {
        // Update existing task
        const { error } = await supabase
          .from('project_tasks')
          .update({
            ...taskData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingTask.id);

        if (error) throw error;
        setSuccess('Task updated successfully!');
      } else {
        // Create new task
        const { error } = await supabase
          .from('project_tasks')
          .insert([taskData]);

        if (error) throw error;
        setSuccess('Task added successfully!');
      }

      resetForm();
      fetchTasks();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      console.error('Error saving task:', error);
      setError(error.message || 'Failed to save task');
    } finally {
      setSaving(false);
    }
  };

  const handleEditTask = (task: ProjectTask) => {
    setEditingTask(task);
    setTaskForm({
      name: task.name,
      start_date: task.start_date,
      end_date: task.end_date,
      progress: task.progress,
      type: task.type,
      assigned_to: task.assigned_to || '',
      notes: task.notes || '',
      color: task.color || '#3B82F6'
    });
    setShowAddForm(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('project_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
      
      setSuccess('Task deleted successfully!');
      fetchTasks();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      console.error('Error deleting task:', error);
      setError(error.message || 'Failed to delete task');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setShowAddForm(false);
    setEditingTask(null);
    setTaskForm({
      name: '',
      start_date: '',
      end_date: '',
      progress: 0,
      type: 'task',
      assigned_to: '',
      notes: '',
      color: '#3B82F6'
    });
    setError('');
  };

  const ganttOptions: DisplayOption = {
    viewMode: viewMode,
    locale: 'en-US'
  };

  const ganttStyling: StylingOption = {
    headerHeight: 50,
    columnWidth: viewMode === ViewMode.Month ? 300 : 65,
    listCellWidth: '155px',
    rowHeight: 50,
    ganttHeight: 400,
    barBackgroundColor: '#3B82F6',
    barBackgroundSelectedColor: '#1E40AF',
    barProgressColor: '#60A5FA',
    barProgressSelectedColor: '#3B82F6',
    projectProgressColor: '#60A5FA',
    projectProgressSelectedColor: '#3B82F6',
    milestoneBackgroundColor: '#EF4444',
    milestoneBackgroundSelectedColor: '#DC2626'
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-8">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading project timeline...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link 
            href={`/projects/${projectId}`}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Project
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-blue-600" />
              Project Timeline
            </h1>
            <p className="text-gray-600">{project?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as ViewMode)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value={ViewMode.Day}>Day View</option>
            <option value={ViewMode.Week}>Week View</option>
            <option value={ViewMode.Month}>Month View</option>
            <option value={ViewMode.Year}>Year View</option>
          </select>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Task
          </button>
        </div>
      </div>

      {/* Messages */}
      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
          {success}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {/* Add/Edit Task Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingTask ? 'Edit Task' : 'Add New Task'}
          </h2>
          <form onSubmit={handleAddTask}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Task Name *
                </label>
                <input
                  type="text"
                  value={taskForm.name}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Foundation work, Framing, etc."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={taskForm.type}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="task">Task</option>
                  <option value="milestone">Milestone</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={taskForm.start_date}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, start_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date *
                </label>
                <input
                  type="date"
                  value={taskForm.end_date}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, end_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Progress (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={taskForm.progress}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, progress: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assigned To
                </label>
                <select
                  value={taskForm.assigned_to}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, assigned_to: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select assignee...</option>
                  <optgroup label="Crew Members">
                    {crewMembers.map(member => (
                      <option key={`crew-${member.id}`} value={member.name}>
                        {member.name} {member.role ? `(${member.role})` : ''}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Contractors">
                    {contractors.map(contractor => (
                      <option key={`contractor-${contractor.id}`} value={contractor.name}>
                        {contractor.name} {contractor.specialty ? `- ${contractor.specialty}` : ''}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color
                </label>
                <input
                  type="color"
                  value={taskForm.color}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, color: e.target.value }))}
                  className="w-full h-10 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={taskForm.notes}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Additional task details..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : (editingTask ? 'Update Task' : 'Add Task')}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Gantt Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {ganttTasks.length > 0 ? (
          <div className="overflow-x-auto">
            <Gantt
              tasks={ganttTasks}
              viewMode={viewMode}
              onDateChange={handleTaskChange}
              onProgressChange={handleTaskChange}
              onDoubleClick={() => {}}
              {...ganttOptions}
              {...ganttStyling}
            />
          </div>
        ) : (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks yet</h3>
            <p className="text-gray-500 mb-4">Add your first task to start building your project timeline.</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add First Task
            </button>
          </div>
        )}
      </div>

      {/* Task Summary */}
      {tasks.length > 0 && (
        <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Task Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{tasks.length}</div>
              <div className="text-sm text-blue-800">Total Tasks</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {tasks.filter(t => t.progress === 100).length}
              </div>
              <div className="text-sm text-green-800">Completed</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {Math.round(tasks.reduce((sum, task) => sum + task.progress, 0) / tasks.length)}%
              </div>
              <div className="text-sm text-orange-800">Average Progress</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
