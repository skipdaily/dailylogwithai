'use client'

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { 
  Building2, 
  Users, 
  PlusCircle, 
  X, 
  AlertCircle, 
  CheckCircle,
  Calendar,
  Phone,
  Mail,
  MapPin,
  FileText,
  ArrowLeft,
  Edit,
  User,
  Clock,
  Briefcase
} from 'lucide-react';

interface Project {
  id: string;
  name: string;
  location?: string;
  client?: string;
  status?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  created_at: string;
}

interface Subcontractor {
  id: string;
  name: string;
  contact_person?: string;
  contact_email?: string;
  contact_phone?: string;
  email?: string;  // Also present in your schema
  phone?: string;  // Also present in your schema
  specialty?: string;
  address?: string;
  license_number?: string;
  insurance_info?: string;
  notes?: string;
  is_active?: boolean;
}

interface ProjectSubcontractor {
  id: string;
  project_id: string;
  subcontractor_id: string;
  status: string;
  assigned_date: string;
  notes?: string;
  created_at: string;
  subcontractors: Subcontractor;
}

export default function ProjectOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const [project, setProject] = useState<Project | null>(null);
  const [projectSubcontractors, setProjectSubcontractors] = useState<ProjectSubcontractor[]>([]);
  const [availableSubcontractors, setAvailableSubcontractors] = useState<Subcontractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedSubcontractor, setSelectedSubcontractor] = useState('');
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [assignedDate, setAssignedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (resolvedParams.id) {
      fetchProject();
      fetchProjectSubcontractors();
      fetchAvailableSubcontractors();
    }
  }, [resolvedParams.id]);

  const fetchProject = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', resolvedParams.id)
        .single();

      if (error) throw error;
      setProject(data);
    } catch (error: any) {
      console.error('Error fetching project:', error);
      setError('Failed to load project details');
    }
  };

  const fetchProjectSubcontractors = async () => {
    try {
      const { data, error } = await supabase
        .from('project_subcontractors')
        .select(`
          id,
          project_id,
          subcontractor_id,
          status,
          assigned_date,
          notes,
          created_at,
          subcontractors (
            id,
            name,
            contact_person,
            contact_email,
            contact_phone,
            email,
            phone,
            specialty,
            address,
            license_number,
            insurance_info,
            notes,
            is_active
          )
        `)
        .eq('project_id', resolvedParams.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjectSubcontractors((data as any) || []);
    } catch (error: any) {
      console.error('Error fetching project subcontractors:', error);
      setError('Failed to load project subcontractors');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSubcontractors = async () => {
    try {
      const { data, error } = await supabase
        .from('subcontractors')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setAvailableSubcontractors(data || []);
    } catch (error: any) {
      console.error('Error fetching subcontractors:', error);
    }
  };

  const handleAddSubcontractor = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      if (!selectedSubcontractor) {
        throw new Error('Please select a subcontractor');
      }

      const { error } = await supabase
        .from('project_subcontractors')
        .insert([{
          project_id: resolvedParams.id,
          subcontractor_id: selectedSubcontractor,
          status: 'active',
          assigned_date: assignedDate,
          notes: assignmentNotes.trim() || null
        }]);

      if (error) throw error;

      setSuccess('Subcontractor added to project successfully!');
      setShowAddForm(false);
      setSelectedSubcontractor('');
      setAssignmentNotes('');
      setAssignedDate(new Date().toISOString().split('T')[0]);
      fetchProjectSubcontractors();

    } catch (error: any) {
      console.error('Error adding subcontractor:', error);
      setError(error.message || 'Failed to add subcontractor');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveSubcontractor = async (projectSubcontractorId: string) => {
    if (!confirm('Are you sure you want to remove this subcontractor from the project?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('project_subcontractors')
        .delete()
        .eq('id', projectSubcontractorId);

      if (error) throw error;

      setSuccess('Subcontractor removed from project successfully!');
      fetchProjectSubcontractors();
    } catch (error: any) {
      console.error('Error removing subcontractor:', error);
      setError(error.message || 'Failed to remove subcontractor');
    }
  };

  const handleStatusChange = async (projectSubcontractorId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('project_subcontractors')
        .update({ status: newStatus })
        .eq('id', projectSubcontractorId);

      if (error) throw error;

      setSuccess('Subcontractor status updated successfully!');
      fetchProjectSubcontractors();
    } catch (error: any) {
      console.error('Error updating status:', error);
      setError(error.message || 'Failed to update status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getProjectStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'on_hold':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter out already assigned subcontractors
  const unassignedSubcontractors = availableSubcontractors.filter(sub => 
    !projectSubcontractors.some(ps => ps.subcontractor_id === sub.id)
  );

  if (loading && !project) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center">Loading project details...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center text-red-600">Project not found</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/projects')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </button>
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <Building2 className="h-8 w-8" />
              {project.name}
            </h1>
            <div className="flex items-center gap-4 text-gray-600 mt-2">
              {project.status && (
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getProjectStatusColor(project.status)}`}>
                  {project.status.replace('_', ' ').toUpperCase()}
                </span>
              )}
              <span className="text-sm">
                Created {new Date(project.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
          <button
            onClick={() => router.push(`/projects/${project.id}/edit`)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            <Edit className="h-4 w-4" />
            Edit Project
          </button>
        </div>
      </div>

      {/* Success and Error Messages */}
      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md flex items-center">
          <CheckCircle className="h-4 w-4 mr-2" />
          {success}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md flex items-center">
          <AlertCircle className="h-4 w-4 mr-2" />
          {error}
        </div>
      )}

      {/* Project Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Project Details */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Project Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {project.client && (
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <label className="text-sm font-medium text-gray-500">Client</label>
                  <p className="text-gray-900">{project.client}</p>
                </div>
              </div>
            )}

            {project.location && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <label className="text-sm font-medium text-gray-500">Location</label>
                  <p className="text-gray-900">{project.location}</p>
                </div>
              </div>
            )}

            {project.start_date && (
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <label className="text-sm font-medium text-gray-500">Start Date</label>
                  <p className="text-gray-900">{new Date(project.start_date).toLocaleDateString()}</p>
                </div>
              </div>
            )}

            {project.end_date && (
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <label className="text-sm font-medium text-gray-500">End Date</label>
                  <p className="text-gray-900">{new Date(project.end_date).toLocaleDateString()}</p>
                </div>
              </div>
            )}
          </div>

          {project.description && (
            <div className="mt-6">
              <label className="text-sm font-medium text-gray-500">Description</label>
              <p className="text-gray-900 mt-1">{project.description}</p>
            </div>
          )}
        </div>

        {/* Project Stats */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Project Stats</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                <span className="text-gray-600">Subcontractors</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">{projectSubcontractors.length}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-gray-600">Active Subs</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">
                {projectSubcontractors.filter(ps => ps.status === 'active').length}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-purple-500" />
                <span className="text-gray-600">Completed</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">
                {projectSubcontractors.filter(ps => ps.status === 'completed').length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Subcontractors Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <Users className="h-6 w-6" />
              Subcontractors ({projectSubcontractors.length})
            </h2>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <PlusCircle className="h-4 w-4" />
              Add Subcontractor
            </button>
          </div>
        </div>

        {/* Add Subcontractor Form */}
        {showAddForm && (
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Add Subcontractor</h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddSubcontractor}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Subcontractor *
                  </label>
                  <select
                    value={selectedSubcontractor}
                    onChange={(e) => setSelectedSubcontractor(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Choose a subcontractor...</option>
                    {unassignedSubcontractors.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name} {sub.specialty && `(${sub.specialty})`}
                      </option>
                    ))}
                  </select>
                  {unassignedSubcontractors.length === 0 && (
                    <p className="text-sm text-gray-500 mt-1">
                      All active subcontractors are already assigned.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assignment Date
                  </label>
                  <input
                    type="date"
                    value={assignedDate}
                    onChange={(e) => setAssignedDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <input
                    type="text"
                    value={assignmentNotes}
                    onChange={(e) => setAssignmentNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Assignment notes..."
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  type="submit"
                  disabled={saving || !selectedSubcontractor}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Adding...' : 'Add Subcontractor'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Subcontractors List */}
        {loading ? (
          <div className="p-6 text-center text-gray-500">
            Loading subcontractors...
          </div>
        ) : projectSubcontractors.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No subcontractors assigned</h3>
            <p className="text-gray-500 mb-4">Add subcontractors to this project to get started.</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <PlusCircle className="h-4 w-4" />
              Add Subcontractor
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {projectSubcontractors.map((ps) => (
              <div key={ps.id} className="p-6 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">
                        {ps.subcontractors.name}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ps.status)}`}>
                        {ps.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600">
                      {ps.subcontractors.specialty && (
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span>{ps.subcontractors.specialty}</span>
                        </div>
                      )}
                      
                      {ps.subcontractors.contact_person && (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>{ps.subcontractors.contact_person}</span>
                        </div>
                      )}

                      {(ps.subcontractors.contact_email || ps.subcontractors.email) && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          <a href={`mailto:${ps.subcontractors.contact_email || ps.subcontractors.email}`} className="text-blue-600 hover:underline">
                            {ps.subcontractors.contact_email || ps.subcontractors.email}
                          </a>
                        </div>
                      )}

                      {(ps.subcontractors.contact_phone || ps.subcontractors.phone) && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          <a href={`tel:${ps.subcontractors.contact_phone || ps.subcontractors.phone}`} className="text-blue-600 hover:underline">
                            {ps.subcontractors.contact_phone || ps.subcontractors.phone}
                          </a>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Assigned: {new Date(ps.assigned_date).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {ps.notes && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-md">
                        <p className="text-sm text-gray-700">{ps.notes}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <select
                      value={ps.status}
                      onChange={(e) => handleStatusChange(ps.id, e.target.value)}
                      className="text-sm border border-gray-300 rounded-md px-2 py-1"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="completed">Completed</option>
                    </select>
                    
                    <button
                      onClick={() => handleRemoveSubcontractor(ps.id)}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Remove from project"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
