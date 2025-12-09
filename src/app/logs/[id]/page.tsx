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
}

interface ContractorDisplay {
  subcontractor_id: string;
  name: string;
  crewCount: number;
  crewNames: string;
  workPerformed: string;
}

export default function ViewLogPage() {
  const params = useParams();
  const router = useRouter();
  const logId = params.id as string;

  const [logData, setLogData] = useState<LogData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [contractors, setContractors] = useState<ContractorDisplay[]>([]);

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

      if (data) {
        try {
          const contractorSections = (data.log_sections || []).filter((s: any) => s.section_type === 'contractor_work');
          const parsed = contractorSections.map((s: any) => {
            try {
              const obj = JSON.parse(s.content);
              const subRel = (data.log_subcontractors || []).find((ls: any) => ls.subcontractors?.id === obj.subcontractor_id);
              return {
                subcontractor_id: obj.subcontractor_id,
                name: subRel?.subcontractors?.name || 'Unknown',
                crewCount: obj.crewCount ?? 0,
                crewNames: obj.crewNames ?? '',
                workPerformed: obj.workPerformed ?? ''
              } as ContractorDisplay;
            } catch {
              return null;
            }
          }).filter(Boolean) as ContractorDisplay[];
          setContractors(parsed);
        } catch (e) {
          console.warn('Contractor parse error', e);
        }
      }
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

      // Helper to expand sections - each row may contain multiple newline-separated items
      const expandSections = (sections: any[]) => {
        const items: { id: string; text: string }[] = [];
        sections.forEach(s => {
          // Split content by newlines and create separate items
          const lines = s.content.split('\n').filter((line: string) => line.trim());
          lines.forEach((line: string, index: number) => {
            items.push({ id: `${s.id}-${index}`, text: line.trim() });
          });
        });
        return items;
      };

      // Transform the database data structure to match what the PDF API expects
      const transformedData = {
        id: logData.id,
        date: logData.date,
        superintendentName: logData.superintendent_name,
        projectName: (Array.isArray(logData.projects) ? logData.projects[0]?.name : logData.projects?.name) || 'No Project',
        projectId: (Array.isArray(logData.projects) ? logData.projects[0]?.id : logData.projects?.id) || null,
        contractors: contractors.length > 0 ? contractors : logData.log_subcontractors.map(item => ({
          subcontractor_id: item.subcontractors.id,
          name: item.subcontractors.name,
          crewCount: 0,
          crewNames: '',
          workPerformed: ''
        })),
        delays: expandSections(getSectionsByType('delays')),
        tradesOnsite: expandSections(getSectionsByType('trades_onsite')),
        meetings: expandSections(getSectionsByType('meetings')),
        outOfScope: expandSections(getSectionsByType('out_of_scope')),
        nextDayPlan: expandSections(getSectionsByType('next_day_plan')),
        notes: expandSections(getSectionsByType('notes'))
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
    // Add T00:00:00 to date-only strings to prevent UTC interpretation
    const normalizedDate = dateString.includes('T') ? dateString : `${dateString}T00:00:00`;
    return new Date(normalizedDate).toLocaleDateString('en-US', {
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

      {/* Log Sections */}
      <div className="space-y-6">
        {/* Contractors */}
        <LogSection
          title="1. Contractors (Crew & Work Performed)"
          icon={Users}
          sections={
            contractors.length > 0
              ? contractors.map(c => ({
                content:
                  `${c.name} - Crew: ${c.crewCount}` +
                  (c.crewNames ? `\nMembers: ${c.crewNames}` : '') +
                  (c.workPerformed ? `\nWork: ${c.workPerformed}` : '')
              }))
              : logData.log_subcontractors.map(sc => ({
                content: `${sc.subcontractors.name} (no details recorded)`
              }))
          }
        />

        {/* Visitors on site */}
        <LogSection
          title="2. Visitors on site"
          icon={Users}
          sections={getSectionsByType('trades_onsite')}
        />

        {/* Meetings */}
        <LogSection
          title="3. Meetings / Discussions"
          icon={MessageSquare}
          sections={getSectionsByType('meetings')}
        />

        {/* Out of Scope */}
        <LogSection
          title="4. Out-of-Scope / Extra Work Identified"
          icon={FileText}
          sections={getSectionsByType('out_of_scope')}
        />

        {/* Delays */}
        <LogSection
          title="5. Delays / Disruptions"
          icon={AlertTriangle}
          sections={getSectionsByType('delays')}
        />

        {/* Notes */}
        <LogSection
          title="6. Notes / Observations"
          icon={Eye}
          sections={getSectionsByType('notes')}
        />

        {/* Plan */}
        <LogSection
          title="7. Plan for Next Day/Week (All Trades)"
          icon={Calendar}
          sections={getSectionsByType('next_day_plan')}
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
