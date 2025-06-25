import { NextRequest, NextResponse } from 'next/server';
import { jsPDF } from 'jspdf';

export async function POST(request: NextRequest) {
  try {
    const logData = await request.json();
    
    // Create new PDF document
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const lineHeight = 4.5;
    let currentY = margin;

    // Helper function to add text with proper wrapping (removes unwanted line breaks)
    const addText = (text: string, x: number, y: number, maxWidth: number, options: any = {}) => {
      // Clean the text - remove line breaks and normalize whitespace
      const cleanText = text
        .replace(/\r\n/g, ' ')  // Replace Windows line breaks
        .replace(/\n/g, ' ')    // Replace Unix line breaks
        .replace(/\r/g, ' ')    // Replace Mac line breaks
        .replace(/\s+/g, ' ')   // Replace multiple spaces with single space
        .trim();
      
      // Check if text fits on one line
      const textWidth = doc.getTextWidth(cleanText);
      if (textWidth <= maxWidth) {
        // Text fits on one line
        doc.text(cleanText, x, y, options);
        return y + lineHeight;
      } else {
        // Text needs to be wrapped, but do it manually to control line breaks
        const words = cleanText.split(' ');
        let currentLine = '';
        let currentY_local = y;
        
        for (let i = 0; i < words.length; i++) {
          const testLine = currentLine + (currentLine ? ' ' : '') + words[i];
          const testWidth = doc.getTextWidth(testLine);
          
          if (testWidth <= maxWidth) {
            currentLine = testLine;
          } else {
            // Line is too long, output current line and start new one
            if (currentLine) {
              doc.text(currentLine, x, currentY_local, options);
              currentY_local += lineHeight;
            }
            currentLine = words[i];
          }
        }
        
        // Output remaining text
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

    // Format the date nicely
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    };

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    currentY = addText('DAILY CONSTRUCTION LOG', pageWidth / 2, currentY, pageWidth - 2 * margin, { align: 'center' });
    currentY += 5;

    // Project Information Box
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    currentY += 5;
    
    // Three columns for project info
    const colWidth = (pageWidth - 2 * margin) / 3;
    
    doc.text('Date:', margin + 5, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(formatDate(logData.date), margin + 5, currentY + 6);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Superintendent:', margin + colWidth + 5, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(logData.superintendentName || 'Not specified', margin + colWidth + 5, currentY + 6);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Project:', margin + 2 * colWidth + 5, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(logData.projectName || 'Not specified', margin + 2 * colWidth + 5, currentY + 6);
    
    currentY += 25;

    // Helper function to add a section
    const addSection = (title: string, items: any[], isList: boolean = true) => {
      checkPageBreak(20);
      
      // Section title
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      currentY = addText(title, margin, currentY, pageWidth - 2 * margin);
      
      currentY += 5;
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      
      if (items && items.length > 0 && items.some((item: any) => item.text?.trim())) {
        const filteredItems = items.filter((item: any) => item.text?.trim());
        
        filteredItems.forEach((item: any, index: number) => {
          checkPageBreak(15);
          
          // Add bullet point
          doc.text('•', margin + 5, currentY);
          
          // Clean and add the text with proper wrapping
          const cleanedText = item.text
            .replace(/\r\n/g, ' ')
            .replace(/\n/g, ' ')
            .replace(/\r/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
          
          currentY = addText(cleanedText, margin + 15, currentY, pageWidth - 2 * margin - 15);
          currentY += 1; // Add some space between bullet points
        });
      } else {
        doc.setFont('helvetica', 'italic');
        currentY = addText('No items recorded', margin + 5, currentY, pageWidth - 2 * margin - 5);
        doc.setFont('helvetica', 'normal');
      }
      
      currentY += 6;
    };

    // Add all sections (all should use bullet points for separate items)
    addSection('1. Work Performed (All Trades)', logData.workItems);
    addSection('2. Delays / Disruptions', logData.delays);
    addSection('3. Trades Onsite', logData.tradesOnsite);
    addSection('4. Meetings / Discussions', logData.meetings);
    addSection('5. Out-of-Scope / Extra Work Identified', logData.outOfScope);
    addSection('6. Plan for Next Day (All Trades)', logData.nextDayPlan);
    addSection('7. Notes / Observations', logData.notes);

    // Personnel section if there are crews or subcontractors
    if ((logData.crews && logData.crews.length > 0) || (logData.subcontractors && logData.subcontractors.length > 0)) {
      checkPageBreak(50);
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      currentY = addText('Personnel & Subcontractors', margin, currentY, pageWidth - 2 * margin);
      
      currentY += 10;
      
      // Crews
      if (logData.crews && logData.crews.length > 0) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        currentY = addText('Crews:', margin, currentY, pageWidth - 2 * margin);
        currentY += 3;
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        
        logData.crews.forEach((crew: any) => {
          checkPageBreak(20);
          
          doc.setFont('helvetica', 'bold');
          currentY = addText(`• ${crew.name}`, margin + 5, currentY, pageWidth - 2 * margin - 5);
          doc.setFont('helvetica', 'normal');
          
          if (crew.members && crew.members.length > 0) {
            crew.members.forEach((member: any) => {
              checkPageBreak(10);
              currentY = addText(`  - ${member.name}`, margin + 15, currentY, pageWidth - 2 * margin - 15);
            });
          }
          currentY += 3;
        });
        currentY += 5;
      }
      
      // Subcontractors
      if (logData.subcontractors && logData.subcontractors.length > 0) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        currentY = addText('Subcontractors:', margin, currentY, pageWidth - 2 * margin);
        currentY += 3;
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        
        logData.subcontractors.forEach((sub: any) => {
          checkPageBreak(10);
          currentY = addText(`• ${sub.name}`, margin + 5, currentY, pageWidth - 2 * margin - 5);
          currentY += 2;
        });
      }
    }

    // Generate PDF buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    // Return the PDF as a response
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Daily_Log_${(logData.projectName || 'Unknown').replace(/[^a-zA-Z0-9]/g, '_')}_${logData.date}.pdf"`
      }
    });

  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
