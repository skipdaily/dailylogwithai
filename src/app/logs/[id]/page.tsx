'use client'

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { Building2, Calendar, User, Users, Wrench, AlertTriangle, MessageSquare, FileText, CheckSquare, Eye, ArrowLeft, Edit, Download, AlertCircle } from 'lucide-react';

interface LogData {
  id: string;
  date: string;
  superintendent_name: string;
  projects: {
    id: string;
    name: string;
    location?: string;
  } | null;
  log_sections: Array<{
    id: string;
    section_type: string;
    content: string;
    order_num: number;
  }>;
  log_subcontractors: Array<{
    subcontractors: {
      id: string;
      name: string;
    };
  }>;
  log_crews: Array<{
    crews: {
      id: string;
      name: string;
      crew_members: Array<{
        id: string;
        name: string;
        role?: string;
      }>;
    };
  }>;
}

export default function ViewLogPage() {
  const params = useParams();
  const router = useRouter();
  const logId = params.id as string;
  
  const [logData, setLogData] = useState<LogData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  useEffect(() => {
    if (logId) {
      fetchLogData();
    }
  }, [logId]);

  const fetchLogData = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('daily_logs')
        .select(`
          id,
          date,
          superintendent_name,
          projects (
            id,
            name,
            location
          ),
          log_sections (
            id,
            section_type,
            content,
            order_num
          ),
          log_subcontractors (
            subcontractors (
              id,
              name
            )
          ),
          log_crews (
            crews (
              id,
              name,
              crew_members (
                id,
                name,
                role
              )
            )
          )
        `)
        .eq('id', logId)
        .single();

      if (error) throw error;
      
      if (!data) {
        setError('Log not found');
        return;
      }

      setLogData(data as any);
    } catch (error: any) {
      console.error('Error fetching log data:', error);
      setError(error.message || 'Failed to load log data');
    } finally {
      setLoading(false);
    }
  };

  const getSectionsByType = (type: string) => {
    if (!logData?.log_sections) return [];
    return logData.log_sections
      .filter(section => section.section_type === type)
      .sort((a, b) => a.order_num - b.order_num);
  };

  const handlePrint = async () => {
    if (!logData) return;
    
    try {
      setIsGeneratingPdf(true);

      // Transform the database data structure to match what the PDF API expects
      const transformedData = {
        id: logData.id,
        date: logData.date,
        superintendentName: logData.superintendent_name,
        projectName: (Array.isArray(logData.projects) ? logData.projects[0]?.name : logData.projects?.name) || 'No Project',
        projectId: (Array.isArray(logData.projects) ? logData.projects[0]?.id : logData.projects?.id) || null,
        // Transform sections into arrays by type
        workItems: getSectionsByType('work_performed').map(section => ({
          id: section.id,
          text: section.content
        })),
        delays: getSectionsByType('delays').map(section => ({
          id: section.id,
          text: section.content
        })),
        tradesOnsite: getSectionsByType('trades_onsite').map(section => ({
          id: section.id,
          text: section.content
        })),
        meetings: getSectionsByType('meetings').map(section => ({
          id: section.id,
          text: section.content
        })),
        outOfScope: getSectionsByType('out_of_scope').map(section => ({
          id: section.id,
          text: section.content
        })),
        nextDayPlan: getSectionsByType('next_day_plan').map(section => ({
          id: section.id,
          text: section.content
        })),
        notes: getSectionsByType('notes').map(section => ({
          id: section.id,
          text: section.content
        })),
        // Transform crews and subcontractors
        crews: logData.log_crews.map(item => ({
          id: item.crews.id,
          name: item.crews.name,
          members: item.crews.crew_members.map(member => ({
            id: member.id,
            name: member.name
          }))
        })),
        subcontractors: logData.log_subcontractors.map(item => ({
          id: item.subcontractors.id,
          name: item.subcontractors.name
        }))
      };

      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transformedData),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `Daily_Log_${(transformedData.projectName || 'Unknown').replace(/[^a-zA-Z0-9]/g, '_')}_${transformedData.date}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="text-center">
          <div className="text-gray-500">Loading log...</div>
        </div>
      </div>
    );
  }

  if (error || !logData) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-red-100 text-red-700 rounded-md p-4 flex items-center">
          <AlertCircle className="h-4 w-4 mr-2" />
          {error || 'Log not found'}
        </div>
        <div className="mt-4">
          <Link 
            href="/logs"
            className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors inline-flex"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Logs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 print:shadow-none print:border-none">
        <div className="flex items-center justify-between mb-6 print:mb-4">
          <div className="flex items-center gap-3">
            <Building2 className="h-8 w-8 text-blue-600 print:hidden" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800 print:text-xl">Daily Construction Log</h1>
              <p className="text-gray-600 print:text-sm">
                {formatDate(logData.date)} • {logData.projects?.name || 'No Project'}
              </p>
            </div>
          </div>
          <div className="flex gap-3 print:hidden">
            <Link 
              href="/logs"
              className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
            <Link 
              href={`/logs/${logId}/edit`}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Edit className="h-4 w-4" />
              Edit
            </Link>
            <button
              onClick={handlePrint}
              disabled={isGeneratingPdf}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-4 w-4" />
              {isGeneratingPdf ? 'Generating PDF...' : 'Download PDF'}
            </button>
          </div>
        </div>

        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-400 print:hidden" />
            <div>
              <div className="text-sm text-gray-500 print:text-xs">Date</div>
              <div className="font-medium print:text-sm">{formatDate(logData.date)}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-gray-400 print:hidden" />
            <div>
              <div className="text-sm text-gray-500 print:text-xs">Superintendent</div>
              <div className="font-medium print:text-sm">{logData.superintendent_name}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-gray-400 print:hidden" />
            <div>
              <div className="text-sm text-gray-500 print:text-xs">Project</div>
              <div className="font-medium print:text-sm">
                {logData.projects?.name || 'No Project'}
                {logData.projects?.location && (
                  <div className="text-sm text-gray-500 print:text-xs">{logData.projects.location}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* People On Site */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Subcontractors */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 print:shadow-none print:border print:border-gray-300">
          <div className="flex items-center gap-3 mb-4">
            <Users className="h-5 w-5 text-blue-600 print:hidden" />
            <h3 className="text-lg font-semibold text-gray-800 print:text-base">Subcontractors</h3>
          </div>
          {logData.log_subcontractors.length > 0 ? (
            <div className="space-y-2">
              {logData.log_subcontractors.map((item, index) => (
                <div key={index} className="p-2 bg-gray-50 rounded-md print:bg-transparent print:border print:border-gray-200">
                  <span className="text-sm print:text-xs">{item.subcontractors.name}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic print:text-xs">No subcontractors on site</p>
          )}
        </div>

        {/* Crews */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 print:shadow-none print:border print:border-gray-300">
          <div className="flex items-center gap-3 mb-4">
            <Users className="h-5 w-5 text-blue-600 print:hidden" />
            <h3 className="text-lg font-semibold text-gray-800 print:text-base">Crews</h3>
          </div>
          {logData.log_crews.length > 0 ? (
            <div className="space-y-3">
              {logData.log_crews.map((item, index) => (
                <div key={index} className="p-2 bg-gray-50 rounded-md print:bg-transparent print:border print:border-gray-200">
                  <div className="font-medium text-sm print:text-xs">{item.crews.name}</div>
                  {item.crews.crew_members.length > 0 && (
                    <div className="mt-1 text-xs text-gray-600 print:text-xs">
                      {item.crews.crew_members.map(member => member.name).join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic print:text-xs">No crews on site</p>
          )}
        </div>
      </div>

      {/* Log Sections */}
      <div className="space-y-6">
        {/* Work Performed */}
        <LogSection 
          title="1. Work Performed (All Trades)" 
          icon={Wrench} 
          sections={getSectionsByType('work_performed')} 
        />

        {/* Delays */}
        <LogSection 
          title="2. Delays / Disruptions" 
          icon={AlertTriangle} 
          sections={getSectionsByType('delays')} 
        />

        {/* Trades Onsite */}
        <LogSection 
          title="3. Trades Onsite" 
          icon={Users} 
          sections={getSectionsByType('trades_onsite')} 
        />

        {/* Meetings */}
        <LogSection 
          title="4. Meetings / Discussions" 
          icon={MessageSquare} 
          sections={getSectionsByType('meetings')} 
        />

        {/* Out of Scope */}
        <LogSection 
          title="5. Out-of-Scope / Extra Work Identified" 
          icon={FileText} 
          sections={getSectionsByType('out_of_scope')} 
        />

        {/* Action Items */}
        <LogSection 
          title="6. Action Items" 
          icon={CheckSquare} 
          sections={getSectionsByType('action_items')} 
        />

        {/* Next Day Plan */}
        <LogSection 
          title="7. Plan for Next Day (All Trades)" 
          icon={Calendar} 
          sections={getSectionsByType('next_day_plan')} 
        />

        {/* Notes */}
        <LogSection 
          title="8. Notes / Observations" 
          icon={Eye} 
          sections={getSectionsByType('notes')} 
        />
      </div>
    </div>
  );
}

// Section component for consistent display
function LogSection({ 
  title, 
  icon: Icon, 
  sections 
}: { 
  title: string; 
  icon: React.ElementType; 
  sections: Array<{ content: string }>; 
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 print:shadow-none print:border print:border-gray-300">
      <div className="flex items-center gap-3 mb-4">
        <Icon className="h-5 w-5 text-blue-600 print:hidden" />
        <h3 className="text-lg font-semibold text-gray-800 print:text-base">{title}</h3>
      </div>
      {sections.length > 0 ? (
        <div className="space-y-3">
          {sections.map((section, index) => (
            <div key={index} className="text-gray-700 print:text-sm">
              <div className="whitespace-pre-wrap">{section.content}</div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 italic print:text-xs">No entries</p>
      )}
    </div>
  );
}
