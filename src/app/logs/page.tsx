'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileText, Plus, Search, Building2, AlertCircle, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

// Define the shape of the logs returned from Supabase
interface ProjectData {
  id: string;
  name: string;
}

interface LogData {
  id: string;
  date: string;
  superintendent_name: string;
  projects: ProjectData;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogData[]>([]);
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    fetchLogs();
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setProjects(data || []);
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Error fetching projects:', err);
    }
  };

  const fetchLogs = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('daily_logs')
        .select(`
          id,
          date,
          superintendent_name,
          projects(id, name)
        `)
        .order('date', { ascending: false });

      // Apply filters
      if (selectedProject) {
        query = query.eq('project_id', selectedProject);
      }

      if (selectedDate) {
        query = query.eq('date', selectedDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Apply search filter on client side for now
      let filteredLogs = data || [];
      if (searchTerm) {
        filteredLogs = filteredLogs.filter(log =>
          log.superintendent_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.projects?.name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      setLogs(filteredLogs);
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Error fetching logs:', err);
      setError(err.message || 'Failed to load logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProject, selectedDate]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchLogs();
    }, 300);

    return () => clearTimeout(debounceTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const deleteLog = async (logId: string) => {
    if (!confirm('Are you sure you want to delete this log? This action cannot be undone.')) {
      return;
    }
    
    try {
      setLoading(true);
      const { error } = await supabase
        .from('daily_logs')
        .delete()
        .eq('id', logId);
        
      if (error) throw error;
      
      // Refresh logs after deletion
      fetchLogs();
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Error deleting log:', err);
      setError(err.message || 'Failed to delete log');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">All Daily Logs</h1>
        <Link
          href="/logs/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Log
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="w-full md:w-64">
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="">All Projects</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full md:w-64">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <div className="text-gray-500">Loading logs...</div>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <div className="text-gray-500 mb-2">No logs found</div>
            <Link
              href="/logs/new"
              className="text-blue-600 hover:text-blue-800"
            >
              Create your first daily log
            </Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Superintendent</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(log.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <Building2 className="h-4 w-4 text-gray-400 mr-2" />
                          {log.projects?.name || 'No Project'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.superintendent_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Link
                            href={`/logs/${log.id}`}
                            className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full hover:bg-blue-200 transition-colors"
                          >
                            View
                          </Link>
                          <Link
                            href={`/logs/${log.id}/edit`}
                            className="inline-flex items-center px-3 py-1 text-xs font-medium text-indigo-700 bg-indigo-100 rounded-full hover:bg-indigo-200 transition-colors"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => deleteLog(log.id)}
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

            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">1</span> to <span className="font-medium">{logs.length}</span> of <span className="font-medium">{logs.length}</span> results
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}