'use client'

import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, AlertCircle, Users, Phone, Mail, User, Briefcase } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface CrewMember {
  id: string;
  name: string;
  role?: string;
  phone?: string;
  email?: string;
  crew_id?: string;
  hourly_rate?: number;
  notes?: string;
  created_at?: string;
}

interface Crew {
  id: string;
  name: string;
  description?: string;
}

export default function CrewMembersPage() {
  const [crewMembers, setCrewMembers] = useState<CrewMember[]>([]);
  const [crews, setCrews] = useState<Crew[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCrew, setFilterCrew] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMember, setEditingMember] = useState<CrewMember | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    role: '',
    phone: '',
    email: '',
    crew_id: '',
    hourly_rate: '',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch crew members
      const { data: membersData, error: membersError } = await supabase
        .from('crew_members')
        .select('*')
        .order('name');

      if (membersError) throw membersError;

      // Fetch crews
      const { data: crewsData, error: crewsError } = await supabase
        .from('crews')
        .select('*')
        .order('name');

      if (crewsError) throw crewsError;

      setCrewMembers(membersData || []);
      setCrews(crewsData || []);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      setError(error.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      role: '',
      phone: '',
      email: '',
      crew_id: '',
      hourly_rate: '',
      notes: ''
    });
    setShowAddForm(false);
    setEditingMember(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');

      const submitData = {
        ...formData,
        hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
        crew_id: formData.crew_id || null
      };

      // Debug logging
      console.log('Form data being submitted:', submitData);
      console.log('Editing member:', editingMember);

      if (editingMember) {
        // Update existing crew member
        console.log('Updating crew member with ID:', editingMember.id);
        const { data, error } = await supabase
          .from('crew_members')
          .update(submitData)
          .eq('id', editingMember.id)
          .select();

        console.log('Update response:', { data, error });
        if (error) throw error;
        setSuccess('Crew member updated successfully!');
      } else {
        // Add new crew member
        console.log('Inserting new crew member');
        const { data, error } = await supabase
          .from('crew_members')
          .insert([submitData])
          .select();

        console.log('Insert response:', { data, error });
        if (error) throw error;
        setSuccess('Crew member added successfully!');
      }

      resetForm();
      fetchData();
    } catch (error: any) {
      console.error('Error saving crew member:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      // Handle different types of error objects
      let errorMessage = 'Failed to save crew member';
      
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.error_description) {
        errorMessage = error.error_description;
      } else if (error?.details) {
        errorMessage = error.details;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error?.code) {
        errorMessage = `Database error (${error.code}): ${error.hint || error.message || 'Unknown error'}`;
      }
      
      setError(errorMessage);
    }
  };

  const handleEdit = (member: CrewMember) => {
    setFormData({
      name: member.name || '',
      role: member.role || '',
      phone: member.phone || '',
      email: member.email || '',
      crew_id: member.crew_id || '',
      hourly_rate: member.hourly_rate ? member.hourly_rate.toString() : '',
      notes: member.notes || ''
    });
    setEditingMember(member);
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this crew member?')) return;

    try {
      setError('');
      const { error } = await supabase
        .from('crew_members')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setSuccess('Crew member deleted successfully!');
      fetchData();
    } catch (error: any) {
      console.error('Error deleting crew member:', error);
      setError(error.message || 'Failed to delete crew member');
    }
  };

  // Filter crew members based on search term, crew, and role
  const filteredMembers = crewMembers.filter(member => {
    const matchesSearch = searchTerm === '' || 
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCrew = filterCrew === '' || member.crew_id === filterCrew;
    const matchesRole = filterRole === '' || member.role === filterRole;
    
    return matchesSearch && matchesCrew && matchesRole;
  });

  // Get unique roles for filter dropdown
  const uniqueRoles = Array.from(new Set(crewMembers.map(m => m.role).filter(Boolean)));

  const getCrewName = (crewId: string) => {
    const crew = crews.find(c => c.id === crewId);
    return crew?.name || 'Unassigned';
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Crew Members</h1>
          <p className="text-gray-600">Manage your construction crew members</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add New Member
        </button>
      </div>

      {/* Success/Error Messages */}
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

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <User className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-800">
              {editingMember ? 'Edit Crew Member' : 'Add New Crew Member'}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="John Smith"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role/Position
                </label>
                <input
                  type="text"
                  value={formData.role}
                  onChange={(e) => handleInputChange('role', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Foreman, Laborer, Operator, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="(555) 123-4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="john.smith@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assigned Crew
                </label>
                <select
                  value={formData.crew_id}
                  onChange={(e) => handleInputChange('crew_id', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="">No crew assigned</option>
                  {crews.map((crew) => (
                    <option key={crew.id} value={crew.id}>
                      {crew.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hourly Rate ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.hourly_rate}
                  onChange={(e) => handleInputChange('hourly_rate', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="25.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Additional notes about this crew member..."
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                {editingMember ? 'Update Member' : 'Add Member'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search crew members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="w-full lg:w-48">
            <select
              value={filterCrew}
              onChange={(e) => setFilterCrew(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="">All Crews</option>
              {crews.map((crew) => (
                <option key={crew.id} value={crew.id}>
                  {crew.name}
                </option>
              ))}
            </select>
          </div>
          <div className="w-full lg:w-48">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="">All Roles</option>
              {uniqueRoles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Crew Members Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            All Crew Members ({filteredMembers.length})
          </h2>

          {loading ? (
            <div className="text-center py-8">
              <div className="text-gray-500">Loading crew members...</div>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <div className="text-gray-500 mb-2">
                {searchTerm || filterCrew || filterRole ? 'No crew members match your filters' : 'No crew members found'}
              </div>
              {!searchTerm && !filterCrew && !filterRole && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Add your first crew member
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Crew
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="h-4 w-4 text-gray-400 mr-3" />
                          <div className="text-sm font-medium text-gray-900">
                            {member.name}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {member.role ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <Briefcase className="h-3 w-3 mr-1" />
                            {member.role}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500">Not specified</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {member.crew_id ? getCrewName(member.crew_id) : 'Unassigned'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="space-y-1">
                          {member.phone && (
                            <div className="flex items-center">
                              <Phone className="h-3 w-3 mr-1" />
                              {member.phone}
                            </div>
                          )}
                          {member.email && (
                            <div className="flex items-center">
                              <Mail className="h-3 w-3 mr-1" />
                              {member.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {member.hourly_rate ? `$${member.hourly_rate}/hr` : 'Not set'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(member)}
                            className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full hover:bg-blue-200 transition-colors"
                          >
                            <Edit2 className="h-3 w-3 mr-1" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(member.id)}
                            className="inline-flex items-center px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-full hover:bg-red-200 transition-colors"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
