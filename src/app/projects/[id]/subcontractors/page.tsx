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
  Edit2
} from 'lucide-react';

interface Project {
  id: string;
  name: string;
  location?: string;
  client?: string;
  status?: string;
}

interface Subcontractor {
  id: string;
  name: string;
  contact_person?: string;
  contact_email?: string;
  contact_phone?: string;
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

export default function ProjectSubcontractorsPage({ params }: { params: Promise<{ id: string }> }) {
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

  // Edit form state
  const [editingSubcontractor, setEditingSubcontractor] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Subcontractor>>({});

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
        .select('id, name, location, client, status')
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
      setError('Failed to load available subcontractors');
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
          status: 'awarded',
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

  const handleEditSubcontractor = (subcontractor: Subcontractor) => {
    setEditingSubcontractor(subcontractor.id);
    setEditFormData(subcontractor);
  };

  const handleSaveEdit = async () => {
    if (!editingSubcontractor) return;
    
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const { error } = await supabase
        .from('subcontractors')
        .update({
          name: editFormData.name,
          contact_person: editFormData.contact_person,
          contact_email: editFormData.contact_email,
          contact_phone: editFormData.contact_phone,
          specialty: editFormData.specialty,
          address: editFormData.address,
          license_number: editFormData.license_number,
          insurance_info: editFormData.insurance_info,
          notes: editFormData.notes
        })
        .eq('id', editingSubcontractor);

      if (error) throw error;

      setSuccess('Subcontractor updated successfully!');
      setEditingSubcontractor(null);
      setEditFormData({});
      fetchProjectSubcontractors();

    } catch (error: any) {
      console.error('Error updating subcontractor:', error);
      setError(error.message || 'Failed to update subcontractor');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingSubcontractor(null);
    setEditFormData({});
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'awarded':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
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
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Building2 className="h-6 w-6" />
              {project.name}
            </h1>
            <div className="text-gray-600 mt-1">
              {project.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {project.location}
                </span>
              )}
              {project.client && (
                <span className="mt-1 block">Client: {project.client}</span>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <PlusCircle className="h-4 w-4" />
            Add Subcontractor
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

      {/* Add Subcontractor Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Add Subcontractor to Project</h2>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <form onSubmit={handleAddSubcontractor}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Subcontractor *
                </label>
                <select
                  value={selectedSubcontractor}
                  onChange={(e) => setSelectedSubcontractor(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
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
                    All active subcontractors are already assigned to this project.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assignment Date
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    value={assignedDate}
                    onChange={(e) => setAssignedDate(e.target.value)}
                    className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assignment Notes
                </label>
                <textarea
                  value={assignmentNotes}
                  onChange={(e) => setAssignmentNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Notes about this assignment..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
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

      {/* Project Subcontractors List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Project Subcontractors ({projectSubcontractors.length})
          </h2>
        </div>

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
                    {editingSubcontractor === ps.subcontractors.id ? (
                      // Edit Form
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                            <input
                              type="text"
                              value={editFormData.name || ''}
                              onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Specialty</label>
                            <input
                              type="text"
                              value={editFormData.specialty || ''}
                              onChange={(e) => setEditFormData({...editFormData, specialty: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                            <input
                              type="text"
                              value={editFormData.contact_person || ''}
                              onChange={(e) => setEditFormData({...editFormData, contact_person: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                              type="email"
                              value={editFormData.contact_email || ''}
                              onChange={(e) => setEditFormData({...editFormData, contact_email: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                            <input
                              type="tel"
                              value={editFormData.contact_phone || ''}
                              onChange={(e) => setEditFormData({...editFormData, contact_phone: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
                            <input
                              type="text"
                              value={editFormData.license_number || ''}
                              onChange={(e) => setEditFormData({...editFormData, license_number: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                          <textarea
                            value={editFormData.address || ''}
                            onChange={(e) => setEditFormData({...editFormData, address: e.target.value})}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveEdit}
                            disabled={saving}
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                          >
                            {saving ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Display View
                      <>
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
                              <span>Contact: {ps.subcontractors.contact_person}</span>
                            </div>
                          )}

                          {ps.subcontractors.contact_email && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              <a href={`mailto:${ps.subcontractors.contact_email}`} className="text-blue-600 hover:underline">
                                {ps.subcontractors.contact_email}
                              </a>
                            </div>
                          )}

                          {ps.subcontractors.contact_phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              <a href={`tel:${ps.subcontractors.contact_phone}`} className="text-blue-600 hover:underline">
                                {ps.subcontractors.contact_phone}
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
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {editingSubcontractor !== ps.subcontractors.id && (
                      <button
                        onClick={() => handleEditSubcontractor(ps.subcontractors)}
                        className="text-blue-600 hover:text-blue-800 p-1"
                        title="Edit subcontractor"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    )}
                    
                    <select
                      value={ps.status}
                      onChange={(e) => handleStatusChange(ps.id, e.target.value)}
                      className="text-sm border border-gray-300 rounded-md px-2 py-1"
                    >
                      <option value="awarded">Awarded</option>
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
