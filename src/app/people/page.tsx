'use client'

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { PlusCircle, User, Users, Building, Phone, Mail, AlertCircle, Search, Trash2, ArrowUpDown, Edit } from 'lucide-react';

export default function PeoplePage() {
  const [activeTab, setActiveTab] = useState('contractors');
  const [supabaseConnected, setSupabaseConnected] = useState(true);
  
  // Contractors list and filtering state
  const [contractors, setContractors] = useState<any[]>([]);
  const [filteredContractors, setFilteredContractors] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [contractorsLoading, setContractorsLoading] = useState(false);
  const [contractorsError, setContractorsError] = useState('');
  
  // Contractor form state
  const [contractorName, setContractorName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  
  // Crew member form state
  const [crewName, setCrewName] = useState('');
  const [memberName, setMemberName] = useState('');
  const [memberRole, setMemberRole] = useState('');
  
  // Loading states
  const [contractorLoading, setContractorLoading] = useState(false);
  const [crewLoading, setCrewLoading] = useState(false);
  
  // Success message states
  const [contractorSuccess, setContractorSuccess] = useState('');
  const [crewSuccess, setCrewSuccess] = useState('');
  
  // Error message states
  const [contractorError, setContractorError] = useState('');
  const [crewError, setCrewError] = useState('');
  
  // Check if Supabase is connected
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const { error } = await supabase.from('subcontractors').select('id').limit(1);
        if (error && error.message.includes('not initialized')) {
          setSupabaseConnected(false);
        } else {
          setSupabaseConnected(true);
          // Fetch contractors when connection is confirmed
          if (activeTab === 'contractors') {
            fetchContractors();
          }
        }
      } catch (error) {
        console.error('Supabase connection error:', error);
        setSupabaseConnected(false);
      }
    };
    
    checkConnection();
  }, [activeTab]);

  // Fetch contractors from Supabase
  const fetchContractors = async () => {
    setContractorsLoading(true);
    setContractorsError('');
    
    try {
      const { data, error } = await supabase
        .from('subcontractors')
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      setContractors(data || []);
      setFilteredContractors(data || []);
    } catch (error: any) {
      setContractorsError(error.message || 'Failed to fetch contractors');
      console.error('Error fetching contractors:', error);
    } finally {
      setContractorsLoading(false);
    }
  };

  // Filter and sort contractors
  useEffect(() => {
    let filtered = contractors.filter(contractor =>
      contractor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contractor.contact_name && contractor.contact_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (contractor.contact_email && contractor.contact_email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (contractor.contact_phone && contractor.contact_phone.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Sort contractors
    filtered.sort((a, b) => {
      let aValue = a[sortField] || '';
      let bValue = b[sortField] || '';
      
      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredContractors(filtered);
  }, [contractors, searchTerm, sortField, sortDirection]);

  // Handle sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Delete contractor
  const deleteContractor = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contractor?')) return;
    
    try {
      const { error } = await supabase
        .from('subcontractors')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Refresh the list
      fetchContractors();
    } catch (error: any) {
      setContractorsError(error.message || 'Failed to delete contractor');
      console.error('Error deleting contractor:', error);
    }
  };

  // Fetch contractors from Supabase
  useEffect(() => {
    const fetchContractors = async () => {
      setContractorsLoading(true);
      setContractorsError('');
      
      try {
        const { data, error } = await supabase
          .from('subcontractors')
          .select('*');
        
        if (error) throw error;
        
        setContractors(data);
        setFilteredContractors(data);
      } catch (error: any) {
        setContractorsError(error.message || 'Failed to fetch contractors');
        console.error('Error fetching contractors:', error);
      } finally {
        setContractorsLoading(false);
      }
    };
    
    if (supabaseConnected) {
      fetchContractors();
    }
  }, [supabaseConnected]);
  
  // Handle contractor form submission
  const handleContractorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContractorLoading(true);
    setContractorSuccess('');
    setContractorError('');
    
    try {
      const { data, error } = await supabase
        .from('subcontractors')
        .insert([
          { 
            name: contractorName,
            contact_name: contactName,
            contact_email: contactEmail,
            contact_phone: contactPhone
          }
        ]);
      
      if (error) throw error;
      
      // Clear form
      setContractorName('');
      setContactName('');
      setContactEmail('');
      setContactPhone('');
      
      setContractorSuccess('Contractor added successfully!');
      
      // Refresh the contractors list
      fetchContractors();
    } catch (error: any) {
      setContractorError(error.message || 'Failed to add contractor');
      console.error('Error adding contractor:', error);
    } finally {
      setContractorLoading(false);
    }
  };
  
  // Handle crew member form submission
  const handleCrewMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCrewLoading(true);
    setCrewSuccess('');
    setCrewError('');
    
    if (!supabaseConnected) {
      setCrewError('Database connection not available. Please check your environment configuration.');
      setCrewLoading(false);
      return;
    }
    
    try {
      // First, check if crew exists or create a new one
      let crewId;
      
      // Check if crew exists
      const crewResponse = await supabase
        .from('crews')
        .select('id')
        .eq('name', crewName);
        
      if (crewResponse.error) throw crewResponse.error;
      
      const existingCrew = crewResponse.data?.[0];
      
      if (existingCrew) {
        crewId = existingCrew.id;
      } else {
        // Create new crew
        const newCrewResponse = await supabase
          .from('crews')
          .insert([{ name: crewName }])
          .select('id');
        
        if (newCrewResponse.error) throw newCrewResponse.error;
        crewId = newCrewResponse.data?.[0]?.id;
      }
      
      if (!crewId) {
        throw new Error('Failed to create or find crew');
      }
      
      // Add crew member
      const { error: memberError } = await supabase
        .from('crew_members')
        .insert([
          { 
            crew_id: crewId,
            name: memberName,
            role: memberRole
          }
        ]);
      
      if (memberError) throw memberError;
      
      // Clear form
      setMemberName('');
      setMemberRole('');
      
      setCrewSuccess('Crew member added successfully!');
    } catch (error: any) {
      setCrewError(error.message || 'Failed to add crew member');
      console.error('Error adding crew member:', error);
    } finally {
      setCrewLoading(false);
    }
  };
  
  // Handle search term change
  const handleSearchTermChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Filter contractors based on search term
    if (value.trim() === '') {
      setFilteredContractors(contractors);
    } else {
      const filtered = contractors.filter((contractor) =>
        contractor.name.toLowerCase().includes(value.toLowerCase()) ||
        contractor.contact_name.toLowerCase().includes(value.toLowerCase()) ||
        contractor.contact_email.toLowerCase().includes(value.toLowerCase()) ||
        contractor.contact_phone.includes(value)
      );
      setFilteredContractors(filtered);
    }
  };
  
  // Handle sort change
  const handleSortChange = (field: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    
    if (sortField === field) {
      direction = sortDirection === 'asc' ? 'desc' : 'asc';
    }
    
    setSortField(field);
    setSortDirection(direction);
    
    // Sort filtered contractors
    const sorted = [...filteredContractors].sort((a, b) => {
      if (direction === 'asc') {
        return a[field] > b[field] ? 1 : -1;
      } else {
        return a[field] < b[field] ? 1 : -1;
      }
    });
    
    setFilteredContractors(sorted);
  };
  
  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Manage People</h1>
      </div>
      
      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`py-2 px-4 font-medium ${
            activeTab === 'contractors'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('contractors')}
        >
          Contractors
        </button>
        <button
          className={`py-2 px-4 font-medium ${
            activeTab === 'crew'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('crew')}
        >
          Crew Members
        </button>
      </div>
      
      {/* Contractors Form */}
      {activeTab === 'contractors' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Building className="h-5 w-5 mr-2" /> 
            Add New Contractor
          </h2>
          
          {contractorSuccess && (
            <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
              {contractorSuccess}
            </div>
          )}
          
          {contractorError && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
              {contractorError}
            </div>
          )}
          
          <form onSubmit={handleContractorSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contractor Name *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={contractorName}
                    onChange={(e) => setContractorName(e.target.value)}
                    className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="ABC Construction Inc."
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Person
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="John Doe"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="john.doe@example.com"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Phone
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>
              
              <div className="col-span-2 mt-4">
                <button
                  type="submit"
                  disabled={contractorLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 flex items-center justify-center"
                >
                  {contractorLoading ? (
                    <span>Saving...</span>
                  ) : (
                    <>
                      <PlusCircle className="h-5 w-5 mr-2" />
                      Add Contractor
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
          
          {/* Search and Filter */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Contractors List</h3>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => handleSortChange('name')}
                  className={`px-4 py-2 text-sm font-medium rounded-md focus:outline-none ${
                    sortField === 'name'
                      ? sortDirection === 'asc'
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                </button>
                <button
                  onClick={() => handleSortChange('contact_name')}
                  className={`px-4 py-2 text-sm font-medium rounded-md focus:outline-none ${
                    sortField === 'contact_name'
                      ? sortDirection === 'asc'
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Contact {sortField === 'contact_name' && (sortDirection === 'asc' ? '↑' : '↓')}
                </button>
                <button
                  onClick={() => handleSortChange('contact_email')}
                  className={`px-4 py-2 text-sm font-medium rounded-md focus:outline-none ${
                    sortField === 'contact_email'
                      ? sortDirection === 'asc'
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Email {sortField === 'contact_email' && (sortDirection === 'asc' ? '↑' : '↓')}
                </button>
                <button
                  onClick={() => handleSortChange('contact_phone')}
                  className={`px-4 py-2 text-sm font-medium rounded-md focus:outline-none ${
                    sortField === 'contact_phone'
                      ? sortDirection === 'asc'
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Phone {sortField === 'contact_phone' && (sortDirection === 'asc' ? '↑' : '↓')}
                </button>
              </div>
            </div>
            
            {/* Search Bar */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Contractors
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={handleSearchTermChange}
                  className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Search by name, email, or phone"
                />
              </div>
            </div>
            
            {/* Contractors Table */}
            <div className="overflow-x-auto rounded-lg shadow">
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="text-left text-sm font-medium text-gray-700 bg-gray-50">
                    <th className="px-4 py-2">
                      <button
                        onClick={() => handleSort('name')}
                        className="flex items-center focus:outline-none"
                      >
                        Contractor Name
                        {sortField === 'name' && (
                          <span className="ml-1 text-xs">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </button>
                    </th>
                    <th className="px-4 py-2">
                      <button
                        onClick={() => handleSort('contact_name')}
                        className="flex items-center focus:outline-none"
                      >
                        Contact Person
                        {sortField === 'contact_name' && (
                          <span className="ml-1 text-xs">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </button>
                    </th>
                    <th className="px-4 py-2">
                      <button
                        onClick={() => handleSort('contact_email')}
                        className="flex items-center focus:outline-none"
                      >
                        Email
                        {sortField === 'contact_email' && (
                          <span className="ml-1 text-xs">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </button>
                    </th>
                    <th className="px-4 py-2">
                      <button
                        onClick={() => handleSort('contact_phone')}
                        className="flex items-center focus:outline-none"
                      >
                        Phone
                        {sortField === 'contact_phone' && (
                          <span className="ml-1 text-xs">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </button>
                    </th>
                    <th className="px-4 py-2 text-center">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-gray-200">
                  {filteredContractors.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-2 text-center text-gray-500">
                        No contractors found.
                      </td>
                    </tr>
                  )}
                  {filteredContractors.map((contractor) => (
                    <tr key={contractor.id}>
                      <td className="px-4 py-2">
                        {contractor.name}
                      </td>
                      <td className="px-4 py-2">
                        {contractor.contact_name}
                      </td>
                      <td className="px-4 py-2">
                        {contractor.contact_email}
                      </td>
                      <td className="px-4 py-2">
                        {contractor.contact_phone}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <button
                          onClick={() => deleteContractor(contractor.id)}
                          className="text-red-600 hover:text-red-800 focus:outline-none"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      
      {/* Crew Members Form */}
      {activeTab === 'crew' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Users className="h-5 w-5 mr-2" /> 
            Add New Crew Member
          </h2>
          
          {crewSuccess && (
            <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
              {crewSuccess}
            </div>
          )}
          
          {crewError && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
              {crewError}
            </div>
          )}
          
          <form onSubmit={handleCrewMemberSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Crew Name *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={crewName}
                    onChange={(e) => setCrewName(e.target.value)}
                    className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Alpha Team"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Member Name *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={memberName}
                    onChange={(e) => setMemberName(e.target.value)}
                    className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="John Doe"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={memberRole}
                    onChange={(e) => setMemberRole(e.target.value)}
                    className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Foreman"
                    required
                  />
                </div>
              </div>
              
              <div className="col-span-2 mt-4">
                <button
                  type="submit"
                  disabled={crewLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 flex items-center justify-center"
                >
                  {crewLoading ? (
                    <span>Saving...</span>
                  ) : (
                    <>
                      <PlusCircle className="h-5 w-5 mr-2" />
                      Add Crew Member
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
          
          {/* Contractors List Section */}
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">All Contractors</h3>
              <div className="text-sm text-gray-500">
                {filteredContractors.length} of {contractors.length} contractors
              </div>
            </div>
            
            {contractorsError && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md flex items-center">
                <AlertCircle className="h-4 w-4 mr-2" />
                {contractorsError}
              </div>
            )}
            
            {/* Search Bar */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Contractors
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Search by name, email, or phone"
                />
              </div>
            </div>
            
            {/* Sort Buttons */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort by:
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleSort('name')}
                  className={`px-4 py-2 text-sm font-medium rounded-md focus:outline-none transition-colors ${
                    sortField === 'name'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Company Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                </button>
                <button
                  onClick={() => handleSort('contact_name')}
                  className={`px-4 py-2 text-sm font-medium rounded-md focus:outline-none transition-colors ${
                    sortField === 'contact_name'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Contact {sortField === 'contact_name' && (sortDirection === 'asc' ? '↑' : '↓')}
                </button>
                <button
                  onClick={() => handleSort('contact_email')}
                  className={`px-4 py-2 text-sm font-medium rounded-md focus:outline-none transition-colors ${
                    sortField === 'contact_email'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Email {sortField === 'contact_email' && (sortDirection === 'asc' ? '↑' : '↓')}
                </button>
                <button
                  onClick={() => handleSort('contact_phone')}
                  className={`px-4 py-2 text-sm font-medium rounded-md focus:outline-none transition-colors ${
                    sortField === 'contact_phone'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Phone {sortField === 'contact_phone' && (sortDirection === 'asc' ? '↑' : '↓')}
                </button>
              </div>
            </div>
            
            {/* Contractors Table */}
            {contractorsLoading ? (
              <div className="text-center py-8">
                <div className="text-gray-500">Loading contractors...</div>
              </div>
            ) : filteredContractors.length === 0 ? (
              <div className="text-center py-8">
                <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <div className="text-gray-500 mb-2">
                  {contractors.length === 0 ? 'No contractors added yet' : 'No contractors match your search'}
                </div>
                {contractors.length === 0 && (
                  <div className="text-sm text-gray-400">
                    Add your first contractor using the form above
                  </div>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg shadow">
                <table className="min-w-full bg-white">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Company Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact Person
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Phone
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredContractors.map((contractor) => (
                      <tr key={contractor.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Building className="h-5 w-5 text-gray-400 mr-3" />
                            <div className="text-sm font-medium text-gray-900">
                              {contractor.name || 'N/A'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <User className="h-4 w-4 text-gray-400 mr-2" />
                            <div className="text-sm text-gray-900">
                              {contractor.contact_name || 'N/A'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {contractor.contact_email ? (
                            <div className="flex items-center">
                              <Mail className="h-4 w-4 text-gray-400 mr-2" />
                              <a
                                href={`mailto:${contractor.contact_email}`}
                                className="text-sm text-blue-600 hover:text-blue-900"
                              >
                                {contractor.contact_email}
                              </a>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">N/A</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {contractor.contact_phone ? (
                            <div className="flex items-center">
                              <Phone className="h-4 w-4 text-gray-400 mr-2" />
                              <a
                                href={`tel:${contractor.contact_phone}`}
                                className="text-sm text-blue-600 hover:text-blue-900"
                              >
                                {contractor.contact_phone}
                              </a>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">N/A</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => deleteContractor(contractor.id)}
                              className="inline-flex items-center px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-full hover:bg-red-200 transition-colors"
                              title="Delete contractor"
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
      )}
    </div>
  );
}
