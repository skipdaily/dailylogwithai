'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link'
import { Building2, FileText, Plus, Calendar, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient';

export default function Dashboard() {
  const [recentLogs, setRecentLogs] = useState([]);
  const [stats, setStats] = useState({
    totalLogs: 0,
    activeProjects: 0,
    thisMonthLogs: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch recent logs with project info
      const { data: logsData, error: logsError } = await supabase
        .from('daily_logs')
        .select(`
          id,
          date,
          superintendent_name,
          projects(name)
        `)
        .order('date', { ascending: false })
        .limit(5);

      if (logsError) throw logsError;

      // Fetch total logs count
      const { count: totalLogsCount, error: totalLogsError } = await supabase
        .from('daily_logs')
        .select('*', { count: 'exact', head: true });

      if (totalLogsError) throw totalLogsError;

      // Fetch active projects count
      const { count: activeProjectsCount, error: projectsError } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true });

      if (projectsError) throw projectsError;

      // Fetch this month's logs count
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      const { count: thisMonthCount, error: monthError } = await supabase
        .from('daily_logs')
        .select('*', { count: 'exact', head: true })
        .gte('date', startOfMonth.toISOString().split('T')[0]);

      if (monthError) throw monthError;

      setRecentLogs(logsData || []);
      setStats({
        totalLogs: totalLogsCount || 0,
        activeProjects: activeProjectsCount || 0,
        thisMonthLogs: thisMonthCount || 0
      });
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      setError(error.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <Link 
          href="/logs/new" 
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Log
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-800">Total Logs</h2>
          </div>
          <p className="text-3xl font-bold text-gray-900">{loading ? '...' : stats.totalLogs}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="h-5 w-5 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-800">Active Projects</h2>
          </div>
          <p className="text-3xl font-bold text-gray-900">{loading ? '...' : stats.activeProjects}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="h-5 w-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-800">This Month</h2>
          </div>
          <p className="text-3xl font-bold text-gray-900">{loading ? '...' : stats.thisMonthLogs}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Recent Logs</h2>
          <Link href="/logs" className="text-blue-600 hover:text-blue-800 text-sm">
            View All
          </Link>
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
        ) : recentLogs.length === 0 ? (
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
                {recentLogs.map((log: any) => (
                  <tr key={log.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(log.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.projects?.name || 'No Project'}
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
  )
}
