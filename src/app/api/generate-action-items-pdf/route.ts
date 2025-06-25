import { NextRequest, NextResponse } from 'next/server';
import { jsPDF } from 'jspdf';
import { supabase } from '@/lib/supabaseClient';

interface ActionItem {
  id: string;
  title: string;
  description?: string;
  source_type: 'meeting' | 'out_of_scope' | 'action_item' | 'observation';
  assigned_to?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled';
  due_date?: string;
  created_by?: string;
  created_at?: string;
  projects?: { name: string };
  daily_logs?: { date: string; superintendent_name: string };
}

interface FilterOptions {
  searchTerm?: string;
  filterStatus?: string;
  filterPriority?: string;
  filterProject?: string;
  projectName?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { actionItems, filters } = await request.json() as {
      actionItems: ActionItem[];
      filters: FilterOptions;
    };
    
    // Create new PDF document
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const lineHeight = 4.5;
    let currentY = margin;

    // Helper function to add text with proper wrapping
    const addText = (text: string, x: number, y: number, maxWidth: number, options: any = {}) => {
      const cleanText = text
        .replace(/\r\n/g, ' ')
        .replace(/\n/g, ' ')
        .replace(/\r/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      const textWidth = doc.getTextWidth(cleanText);
      if (textWidth <= maxWidth) {
        doc.text(cleanText, x, y, options);
        return y + lineHeight;
      } else {
        const words = cleanText.split(' ');
        let currentLine = '';
        let currentY_local = y;
        
        for (let i = 0; i < words.length; i++) {
          const testLine = currentLine + (currentLine ? ' ' : '') + words[i];
          const testWidth = doc.getTextWidth(testLine);
          
          if (testWidth <= maxWidth) {
            currentLine = testLine;
          } else {
            if (currentLine) {
              doc.text(currentLine, x, currentY_local, options);
              currentY_local += lineHeight;
            }
            currentLine = words[i];
          }
        }
        
        if (currentLine) {
          doc.text(currentLine, x, currentY_local, options);
          currentY_local += lineHeight;
        }
        
        return currentY_local;
      }
    };

    // Helper function to add a new page if needed
    const checkPageBreak = (requiredSpace: number) => {
      if (currentY + requiredSpace > pageHeight - margin) {
        doc.addPage();
        currentY = margin;
        return true;
      }
      return false;
    };

    // Format date nicely
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    };

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    currentY = addText('ACTION ITEMS REPORT', pageWidth / 2, currentY, pageWidth - 2 * margin, { align: 'center' });
    currentY += 5;

    // Generation info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    currentY = addText(`Generated on: ${new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}`, pageWidth / 2, currentY, pageWidth - 2 * margin, { align: 'center' });
    currentY += 10;

    // Filters Applied Section
    if (filters.searchTerm || filters.filterStatus || filters.filterPriority || filters.filterProject) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      currentY = addText('FILTERS APPLIED:', margin, currentY, pageWidth - 2 * margin);
      currentY += 3;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');

      if (filters.searchTerm) {
        currentY = addText(`• Search: "${filters.searchTerm}"`, margin + 5, currentY, pageWidth - 2 * margin - 5);
      }
      if (filters.filterStatus) {
        const statusDisplay = filters.filterStatus.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
        currentY = addText(`• Status: ${statusDisplay}`, margin + 5, currentY, pageWidth - 2 * margin - 5);
      }
      if (filters.filterPriority) {
        const priorityDisplay = filters.filterPriority.charAt(0).toUpperCase() + filters.filterPriority.slice(1);
        currentY = addText(`• Priority: ${priorityDisplay}`, margin + 5, currentY, pageWidth - 2 * margin - 5);
      }
      if (filters.filterProject && filters.projectName) {
        currentY = addText(`• Project: ${filters.projectName}`, margin + 5, currentY, pageWidth - 2 * margin - 5);
      }
      currentY += 8;
    }

    // Summary Statistics (only for active items that will be shown)
    const activeItems = actionItems.filter(item => 
      item.status !== 'completed' && item.status !== 'cancelled'
    );
    
    const openItems = activeItems.filter(item => item.status === 'open').length;
    const inProgressItems = activeItems.filter(item => item.status === 'in_progress').length;
    const onHoldItems = activeItems.filter(item => item.status === 'on_hold').length;
    const urgentItems = activeItems.filter(item => item.priority === 'urgent').length;
    const highPriorityItems = activeItems.filter(item => item.priority === 'high').length;
    const mediumPriorityItems = activeItems.filter(item => item.priority === 'medium').length;
    const lowPriorityItems = activeItems.filter(item => item.priority === 'low').length;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    currentY = addText('SUMMARY (ACTIVE ITEMS ONLY):', margin, currentY, pageWidth - 2 * margin);
    currentY += 3;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    currentY = addText(`Total Active Items: ${activeItems.length}`, margin + 5, currentY, pageWidth - 2 * margin - 5);
    currentY = addText(`By Status: Open: ${openItems} | In Progress: ${inProgressItems} | On Hold: ${onHoldItems}`, margin + 5, currentY, pageWidth - 2 * margin - 5);
    currentY = addText(`By Priority: Urgent: ${urgentItems} | High: ${highPriorityItems} | Medium: ${mediumPriorityItems} | Low: ${lowPriorityItems}`, margin + 5, currentY, pageWidth - 2 * margin - 5);
    currentY += 10;

    // Filter out completed and cancelled items, then sort by priority (urgent -> high -> medium -> low)
    const activeActionItems = actionItems.filter(item => 
      item.status !== 'completed' && item.status !== 'cancelled'
    );
    
    const priorityOrder = { 'urgent': 0, 'high': 1, 'medium': 2, 'low': 3 };
    const sortedActionItems = [...activeActionItems].sort((a, b) => {
      const aPriority = priorityOrder[a.priority] ?? 4;
      const bPriority = priorityOrder[b.priority] ?? 4;
      
      // Primary sort by priority
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      
      // Secondary sort by status (open/in_progress first, then on_hold)
      const statusOrder: { [key: string]: number } = { 'open': 0, 'in_progress': 1, 'on_hold': 2 };
      const aStatus = statusOrder[a.status] ?? 3;
      const bStatus = statusOrder[b.status] ?? 3;
      
      if (aStatus !== bStatus) {
        return aStatus - bStatus;
      }
      
      // Tertiary sort by due date (earliest first, no due date last)
      if (a.due_date && b.due_date) {
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      } else if (a.due_date && !b.due_date) {
        return -1;
      } else if (!a.due_date && b.due_date) {
        return 1;
      }
      
      // Final sort by creation date (newest first)
      if (a.created_at && b.created_at) {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      
      return 0;
    });

    // Fetch notes for all action items
    const actionItemIds = sortedActionItems.map(item => item.id);
    let allNotes: { [key: string]: any[] } = {};

    if (actionItemIds.length > 0) {
      try {
        const { data: notesData, error: notesError } = await supabase
          .from('action_item_notes')
          .select('*')
          .in('action_item_id', actionItemIds)
          .order('created_at', { ascending: false });

        if (!notesError && notesData) {
          // Group notes by action item ID
          allNotes = notesData.reduce((acc, note) => {
            if (!acc[note.action_item_id]) {
              acc[note.action_item_id] = [];
            }
            acc[note.action_item_id].push(note);
            return acc;
          }, {});
        }
      } catch (error) {
        console.error('Error fetching notes for PDF:', error);
        // Continue without notes if there's an error
      }
    }

    // Action Items List
    if (sortedActionItems.length === 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'italic');
      currentY = addText('No action items match the current filters.', pageWidth / 2, currentY, pageWidth - 2 * margin, { align: 'center' });
    } else {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      currentY = addText('ACTION ITEMS:', margin, currentY, pageWidth - 2 * margin);
      currentY += 8;

      sortedActionItems.forEach((item, index) => {
        checkPageBreak(35);

        // Item number and title
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        currentY = addText(`${index + 1}. ${item.title}`, margin, currentY, pageWidth - 2 * margin);

        // Item details in a structured format
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        
        // Status, Priority, and Project on one line
        const statusDisplay = item.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
        const priorityDisplay = item.priority.charAt(0).toUpperCase() + item.priority.slice(1);
        const projectDisplay = item.projects?.name || 'No project';
        
        currentY = addText(`Status: ${statusDisplay} | Priority: ${priorityDisplay} | Project: ${projectDisplay}`, 
          margin + 10, currentY, pageWidth - 2 * margin - 10);

        // Assigned to and Due date
        const assignedTo = item.assigned_to || 'Unassigned';
        const dueDate = item.due_date ? formatDate(item.due_date) : 'No due date';
        currentY = addText(`Assigned: ${assignedTo} | Due: ${dueDate}`, 
          margin + 10, currentY, pageWidth - 2 * margin - 10);

        // Source and Created info
        const sourceDisplay = item.source_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
        const createdBy = item.created_by || 'Unknown';
        const createdDate = item.created_at ? formatDate(item.created_at) : 'Unknown';
        currentY = addText(`Source: ${sourceDisplay} | Created by: ${createdBy} on ${createdDate}`, 
          margin + 10, currentY, pageWidth - 2 * margin - 10);

        // Description if available
        if (item.description && item.description.trim()) {
          currentY += 2;
          doc.setFont('helvetica', 'italic');
          currentY = addText(`Description: ${item.description}`, margin + 10, currentY, pageWidth - 2 * margin - 10);
          doc.setFont('helvetica', 'normal');
        }

        // Notes section
        const itemNotes = allNotes[item.id] || [];
        if (itemNotes.length > 0) {
          currentY += 2;
          doc.setFont('helvetica', 'bold');
          currentY = addText(`Notes (${itemNotes.length}):`, margin + 10, currentY, pageWidth - 2 * margin - 10);
          doc.setFont('helvetica', 'normal');
          
          itemNotes.forEach((note: any, noteIndex: number) => {
            checkPageBreak(8);
            
            // Note content
            currentY = addText(`• ${note.note}`, margin + 15, currentY, pageWidth - 2 * margin - 15);
            
            // Note metadata (smaller font)
            doc.setFontSize(8);
            doc.setFont('helvetica', 'italic');
            const noteDate = note.created_at ? formatDate(note.created_at) : 'Unknown date';
            const noteBy = note.created_by || 'Unknown';
            currentY = addText(`  - ${noteBy}, ${noteDate}`, margin + 20, currentY, pageWidth - 2 * margin - 20);
            
            // Reset font
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            currentY += 1; // Small spacing between notes
          });
        }

        // Related log info if available
        if (item.daily_logs?.date) {
          currentY += 1;
          const logDate = formatDate(item.daily_logs.date);
          const superintendent = item.daily_logs.superintendent_name || 'Unknown';
          currentY = addText(`Related Log: ${logDate} (Superintendent: ${superintendent})`, 
            margin + 10, currentY, pageWidth - 2 * margin - 10);
        }

        currentY += 6; // Space between items
      });
    }

    // Footer
    checkPageBreak(20);
    currentY += 10;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    currentY = addText('This report was generated from the Daily Log Construction Management System', 
      pageWidth / 2, currentY, pageWidth - 2 * margin, { align: 'center' });

    // Generate PDF buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    // Create filename with current date and filter info
    let filename = 'Action_Items_Report';
    if (filters.filterStatus) {
      filename += `_${filters.filterStatus}`;
    }
    if (filters.filterPriority) {
      filename += `_${filters.filterPriority}`;
    }
    filename += `_${new Date().toISOString().split('T')[0]}.pdf`;

    // Return the PDF as a response
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });

  } catch (error) {
    console.error('Error generating action items PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
