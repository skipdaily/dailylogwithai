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
    doc.setFont('helvetica', 'normal');
    currentY = addText('DAILY LOG', pageWidth / 2, currentY, pageWidth - 2 * margin, { align: 'center' });
    currentY += 5;

    // Project Information Box
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    currentY += 5;

    // Three columns for project info
    const colWidth = (pageWidth - 2 * margin) / 3;

    doc.text('Date:', margin + 5, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(formatDate(logData.date), margin + 5, currentY + 6);

    doc.setFont('helvetica', 'normal');
    doc.text('Superintendent:', margin + colWidth + 5, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(logData.superintendentName || 'Not specified', margin + colWidth + 5, currentY + 6);

    doc.setFont('helvetica', 'normal');
    doc.text('Project:', margin + 2 * colWidth + 5, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(logData.projectName || 'Not specified', margin + 2 * colWidth + 5, currentY + 6);

    currentY += 25;

    // Helper function to add a section
    const addSection = (title: string, items: any[], isList: boolean = true) => {
      checkPageBreak(20);

      // Section title now bold
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      currentY = addText(title, margin, currentY, pageWidth - 2 * margin);
      currentY += 5;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');

      if (items && items.length > 0) {
        // Filter out empty items
        const filteredItems = items.filter((item: any) => item.text?.trim());

        if (filteredItems.length > 0) {
          // Process each item as a separate bullet point
          filteredItems.forEach((item: any, index: number) => {
            checkPageBreak(15);

            // Add bullet point
            doc.text('•', margin + 5, currentY);

            // Clean the text but keep each item separate
            const cleanedText = (item.text || '')
              .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
              .trim();

            // Add the text next to the bullet point
            const textStartY = currentY;
            currentY = addText(cleanedText, margin + 15, textStartY, pageWidth - 2 * margin - 15);

            // Add spacing between bullet points
            currentY += 4;
          });
        } else {
          doc.setFont('helvetica', 'italic');
          currentY = addText('No items recorded', margin + 5, currentY, pageWidth - 2 * margin - 5);
          doc.setFont('helvetica', 'normal');
        }
      } else {
        doc.setFont('helvetica', 'italic');
        currentY = addText('No items recorded', margin + 5, currentY, pageWidth - 2 * margin - 5);
        doc.setFont('helvetica', 'normal');
      }

      currentY += 6;
    };

    // Determine contractors (new) vs legacy
    const contractors: any[] = Array.isArray(logData.contractors)
      ? logData.contractors
      : [];

    // REPLACE previous addContractorsSection implementation with stacked layout
    const addContractorsSection = () => {
      if (contractors.length === 0) {
        // Legacy fallback
        if (Array.isArray(logData.workItems)) {
          addSection('1. Work Performed (All Trades)', logData.workItems);
          return;
        }
        addSection('1. Contractors (Crew & Work Performed)', []); // empty
        return;
      }

      checkPageBreak(20);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold'); // title bold
      currentY = addText('1. Contractors (Crew & Work Performed)', margin, currentY, pageWidth - 2 * margin);
      currentY += 5;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');

      const addLabeledLine = (label: string, value: string) => {
        if (!value) return;
        // bold label, normal wrapped value
        doc.setFont('helvetica', 'bold');
        doc.text(label, margin + 10, currentY);
        const labelWidth = doc.getTextWidth(label + ' ');
        doc.setFont('helvetica', 'normal');
        currentY = addText(value, margin + 10 + labelWidth, currentY, pageWidth - 2 * margin - labelWidth);
      };

      contractors.forEach(c => {
        checkPageBreak(25);

        // Bullet
        doc.text('•', margin + 2, currentY);

        // Bold contractor name
        const name = c.name || 'Contractor';
        doc.setFont('helvetica', 'bold');
        doc.text(name, margin + 10, currentY);

        // Normal crew info after name (same line)
        let xAfterName = margin + 10 + doc.getTextWidth(name) + 4;
        doc.setFont('helvetica', 'normal');
        if (c.crewCount !== undefined && c.crewCount !== null) {
          const crewText = `Crew: ${c.crewCount}`;
          // If exceeds width, move to next line
            if (xAfterName + doc.getTextWidth(crewText) > pageWidth - margin) {
              currentY += lineHeight;
              doc.text(crewText, margin + 10, currentY);
            } else {
              doc.text(crewText, xAfterName, currentY);
            }
        }
        currentY += lineHeight;

        // Members line (bold label)
        if (c.crewNames) {
          addLabeledLine('Members:', c.crewNames);
        }

        // Work line (bold label)
        if (c.workPerformed) {
          addLabeledLine('Work:', c.workPerformed);
        }

        currentY += 6;
      });

      currentY += 4;
    };

    // Insert before other addSection calls:
    // REMOVE previous addSection('1. Work Performed...') line and replace with:
    addContractorsSection();
    // NEW ORDER & TITLES:
    addSection('2. Visitors on site', logData.tradesOnsite);
    addSection('3. Meetings / Discussions', logData.meetings);
    addSection('4. Out-of-Scope / Extra Work Identified', logData.outOfScope);
    addSection('5. Delays / Disruptions', logData.delays);
    addSection('6. Notes / Observations', logData.notes);
    addSection('7. Plan for Next Day/Week (All Trades)', logData.nextDayPlan);

    // Remove subcontractors standalone section (now included per contractor) OR keep if no contractors
    if (contractors.length === 0 && logData.subcontractors?.length > 0) {
      checkPageBreak(30);
      doc.setFontSize(14);
      currentY = addText('Subcontractors', margin, currentY, pageWidth - 2 * margin);
      currentY += 8;
      doc.setFontSize(11);
      logData.subcontractors.forEach((sub: any) => {
        checkPageBreak(10);
        currentY = addText(`• ${sub.name}`, margin + 5, currentY, pageWidth - 2 * margin - 5);
        currentY += 2;
      });
      currentY += 5;
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
