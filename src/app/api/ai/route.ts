import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import OpenAI from 'openai';
import { executeAIAction } from '@/app/api/ai-actions/route';

// Data fetching functions
async function fetchConstructionData() {
  try {
    // Fetch recent daily logs with comprehensive data
    const { data: dailyLogs, error: logsError } = await supabase
      .from('daily_logs')
      .select(`
        id,
        date,
        project_id,
        superintendent_name,
        weather,
        temperature,
        created_at,
        updated_at,
        projects(name, description, status)
      `)
      .order('date', { ascending: false })
      .limit(20);

    if (logsError) {
      console.error('Error fetching daily logs:', logsError);
    }

    // Fetch log sections (work performed, delays, trades, meetings, etc.)
    const { data: logSections, error: sectionsError } = await supabase
      .from('log_sections')
      .select(`
        id,
        log_id,
        section_type,
        content,
        order_num,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false })
      .limit(200);

    if (sectionsError) {
      console.error('Error fetching log sections:', sectionsError);
    }

    // Fetch log crew assignments
    const { data: logCrews, error: logCrewsError } = await supabase
      .from('log_crews')
      .select(`
        id,
        log_id,
        crew_id,
        created_at,
        crew_members(name, role, email, phone)
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (logCrewsError) {
      console.error('Error fetching log crews:', logCrewsError);
    }

    // Fetch log equipment usage
    const { data: logEquipment, error: logEquipmentError } = await supabase
      .from('log_equipment')
      .select(`
        id,
        log_id,
        equipment_id,
        hours_used,
        notes,
        created_at,
        equipment(name, type, model, status)
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (logEquipmentError) {
      console.error('Error fetching log equipment:', logEquipmentError);
    }

    // Fetch log photos
    const { data: logPhotos, error: logPhotosError } = await supabase
      .from('log_photos')
      .select(`
        id,
        log_id,
        photo_url,
        caption,
        created_at
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (logPhotosError) {
      console.error('Error fetching log photos:', logPhotosError);
    }

    // Fetch log subcontractor participation
    const { data: logSubcontractors, error: logSubcontractorsError } = await supabase
      .from('log_subcontractors')
      .select(`
        id,
        log_id,
        subcontractor_id,
        created_at,
        subcontractors(name, specialty, contact_person, contact_email, contact_phone)
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (logSubcontractorsError) {
      console.error('Error fetching log subcontractors:', logSubcontractorsError);
    }

    // Fetch equipment master list for reference
    const { data: equipment, error: equipmentError } = await supabase
      .from('equipment')
      .select(`
        id,
        name,
        type,
        model,
        status,
        created_at,
        updated_at
      `)
      .order('name');

    if (equipmentError) {
      console.error('Error fetching equipment:', equipmentError);
    }

    // Fetch recent action items for context
    const { data: actionItems, error: actionError } = await supabase
      .from('action_items')
      .select(`
        id,
        title,
        description,
        source_type,
        project_id,
        assigned_to,
        priority,
        status,
        due_date,
        created_by,
        created_at,
        updated_at,
        completed_at,
        projects(name)
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (actionError) {
      console.error('Error fetching action items:', actionError);
    }

    // Fetch recent action item notes for context
    const { data: actionItemNotes, error: notesError } = await supabase
      .from('action_item_notes')
      .select(`
        id,
        action_item_id,
        note,
        created_by,
        created_at,
        action_items(
          title,
          status,
          priority,
          assigned_to,
          projects(name)
        )
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (notesError) {
      console.error('Error fetching action item notes:', notesError);
    }

    // Fetch projects for context
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, name, description, status, start_date, target_completion')
      .order('created_at', { ascending: false });

    if (projectsError) {
      console.error('Error fetching projects:', projectsError);
    }

    // Fetch crew members for context
    const { data: crewMembers, error: crewError } = await supabase
      .from('crew_members')
      .select('id, name, role, email, phone, hourly_rate, notes')
      .order('name');

    if (crewError) {
      console.error('Error fetching crew members:', crewError);
    }

    // Fetch subcontractors for context
    const { data: subcontractors, error: subcontractorsError } = await supabase
      .from('subcontractors')
      .select(`
        id, name, specialty, contact_person, contact_email, 
        contact_phone, address, license_number, insurance_info, 
        notes, is_active, created_at, updated_at
      `)
      .order('name');

    if (subcontractorsError) {
      console.error('Error fetching subcontractors:', subcontractorsError);
    }

    // Fetch project_subcontractors to identify officially awarded contractors
    const { data: projectSubcontractors, error: projectSubcontractorsError } = await supabase
      .from('project_subcontractors')
      .select(`
        id,
        project_id,
        subcontractor_id,
        status,
        assigned_date,
        notes,
        created_at,
        updated_at,
        projects(name, description, status),
        subcontractors(name, specialty, contact_person, contact_email, contact_phone)
      `)
      .order('assigned_date', { ascending: false });

    if (projectSubcontractorsError) {
      console.error('Error fetching project subcontractors:', projectSubcontractorsError);
    }

    return {
      dailyLogs: dailyLogs || [],
      logSections: logSections || [],
      logCrews: logCrews || [],
      logEquipment: logEquipment || [],
      logPhotos: logPhotos || [],
      logSubcontractors: logSubcontractors || [],
      equipment: equipment || [],
      actionItems: actionItems || [],
      actionItemNotes: actionItemNotes || [],
      projects: projects || [],
      crewMembers: crewMembers || [],
      subcontractors: subcontractors || [],
      projectSubcontractors: projectSubcontractors || [],
      error: null
    };
  } catch (error) {
    console.error('Error fetching construction data:', error);
    return {
      dailyLogs: [],
      logSections: [],
      logCrews: [],
      logEquipment: [],
      logPhotos: [],
      logSubcontractors: [],
      equipment: [],
      actionItems: [],
      actionItemNotes: [],
      projects: [],
      crewMembers: [],
      subcontractors: [],
      projectSubcontractors: [],
      error: 'Failed to fetch some data'
    };
  }
}

function createDataContext(data: any) {
  let context = '';

  // Enhanced action items analysis with complete note history and subcontractor matching
  if (data.actionItems.length > 0) {
    // Create a map of action item IDs to their notes
    const notesByActionItem = data.actionItemNotes.reduce((acc: any, note: any) => {
      if (!acc[note.action_item_id]) {
        acc[note.action_item_id] = [];
      }
      acc[note.action_item_id].push(note);
      return acc;
    }, {});

    // Create subcontractor lookup for matching assigned_to fields
    const subcontractorLookup = data.subcontractors.reduce((acc: any, sub: any) => {
      // Match by company name
      acc[sub.name.toLowerCase()] = sub;
      // Match by contact person name
      if (sub.contact_person) {
        acc[sub.contact_person.toLowerCase()] = sub;
        // Also match by first name only
        const firstName = sub.contact_person.split(' ')[0].toLowerCase();
        acc[firstName] = sub;
      }
      return acc;
    }, {});

    // Enrich action items with timeline data, sorted notes, and subcontractor info
    const enrichedItems = data.actionItems.map((item: any) => {
      const itemNotes = notesByActionItem[item.id] || [];
      const sortedNotes = itemNotes.sort((a: any, b: any) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      // Try to match assigned_to with subcontractor data
      let matchedSubcontractor = null;
      if (item.assigned_to) {
        const assignedLower = item.assigned_to.toLowerCase();
        matchedSubcontractor = subcontractorLookup[assignedLower];
        
        // If no direct match, try partial matching
        if (!matchedSubcontractor) {
          for (const [key, sub] of Object.entries(subcontractorLookup)) {
            if (assignedLower.includes(key) || key.includes(assignedLower)) {
              matchedSubcontractor = sub;
              break;
            }
          }
        }
      }

      const timeline = {
        created: item.created_at,
        lastUpdated: item.updated_at,
        completed: item.completed_at,
        noteCount: sortedNotes.length,
        firstNote: sortedNotes[0]?.created_at,
        lastNote: sortedNotes[sortedNotes.length - 1]?.created_at,
        daysSinceCreated: Math.floor((Date.now() - new Date(item.created_at).getTime()) / (1000 * 60 * 60 * 24)),
        daysSinceLastUpdate: Math.floor((Date.now() - new Date(item.updated_at).getTime()) / (1000 * 60 * 60 * 24))
      };

      return { 
        ...item, 
        timeline, 
        sortedNotes, 
        matchedSubcontractor 
      };
    });

    // Group by status and analyze
    const openItems = enrichedItems.filter((item: any) => item.status === 'open');
    const inProgressItems = enrichedItems.filter((item: any) => item.status === 'in_progress');
    const completedItems = enrichedItems.filter((item: any) => item.status === 'completed');
    const overdueItems = enrichedItems.filter((item: any) =>
      item.due_date && new Date(item.due_date) < new Date() && item.status !== 'completed'
    );

    if (overdueItems.length > 0) {
      context += `\n🚨 OVERDUE ITEMS (${overdueItems.length}) - IMMEDIATE ATTENTION REQUIRED:\n`;
      overdueItems.slice(0, 10).forEach((item: any) => {
        context += `\n[${item.priority.toUpperCase()}] ${item.title}\n`;
        context += `  Internal ID: ${item.id}\n`; // Keep ID for AI reference but label it clearly
        context += `  Project: ${item.projects?.name || 'No Project'}\n`;
        context += `  Due: ${item.due_date} (${Math.floor((Date.now() - new Date(item.due_date).getTime()) / (1000 * 60 * 60 * 24))} days overdue)\n`;
        context += `  Assigned: ${item.assigned_to || 'Unassigned'}\n`;
        
        // Add subcontractor contact info if matched
        if (item.matchedSubcontractor) {
          const sub = item.matchedSubcontractor;
          context += `  📧 CONTACT INFO:\n`;
          context += `    Company: ${sub.name}\n`;
          context += `    Contact: ${sub.contact_person || 'Not specified'}\n`;
          context += `    Email: ${sub.contact_email || 'No email'}\n`;
          context += `    Phone: ${sub.contact_phone || 'No phone'}\n`;
          context += `    Specialty: ${sub.specialty || 'General'}\n`;
        }
        
        context += `  Status: ${item.status}\n`;
        context += `  Created: ${item.timeline.daysSinceCreated} days ago\n`;
        context += `  Last Updated: ${item.timeline.daysSinceLastUpdate} days ago\n`;

        if (item.description) {
          context += `  Description: ${item.description}\n`;
        }

        if (item.sortedNotes && item.sortedNotes.length > 0) {
          context += `  COMPLETE NOTE HISTORY (${item.sortedNotes.length} notes):\n`;
          item.sortedNotes.forEach((note: any, index: number) => {
            const noteDate = new Date(note.created_at);
            const daysAgo = Math.floor((Date.now() - noteDate.getTime()) / (1000 * 60 * 60 * 24));
            context += `    ${index + 1}. [${noteDate.toLocaleDateString()} - ${daysAgo} days ago] ${note.created_by}: "${note.note}"\n`;
          });
        } else {
          context += `  ⚠️  NO PROGRESS NOTES - This item has no updates since creation\n`;
        }
        context += `\n`;
      });
    }

    if (openItems.length > 0) {
      context += `\n📋 OPEN ITEMS (${openItems.length}):\n`;
      openItems.slice(0, 15).forEach((item: any) => {
        context += `\n[${item.priority.toUpperCase()}] ${item.title}\n`;
        context += `  Internal ID: ${item.id}\n`; // Keep ID for AI reference but label it clearly
        context += `  Project: ${item.projects?.name || 'No Project'}\n`;
        if (item.due_date) {
          const daysUntilDue = Math.floor((new Date(item.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          context += `  Due: ${item.due_date} (${daysUntilDue > 0 ? `${daysUntilDue} days remaining` : `${Math.abs(daysUntilDue)} days overdue`})\n`;
        }
        context += `  Assigned: ${item.assigned_to || 'Unassigned'}\n`;
        
        // Add subcontractor contact info if matched
        if (item.matchedSubcontractor) {
          const sub = item.matchedSubcontractor;
          context += `  📧 CONTACT INFO:\n`;
          context += `    Company: ${sub.name} | Email: ${sub.contact_email || 'No email'} | Phone: ${sub.contact_phone || 'No phone'}\n`;
          context += `    Contact Person: ${sub.contact_person || 'Not specified'} | Specialty: ${sub.specialty || 'General'}\n`;
        }
        
        context += `  Age: ${item.timeline.daysSinceCreated} days since creation\n`;
        context += `  Last Activity: ${item.timeline.daysSinceLastUpdate} days ago\n`;

        if (item.description) {
          context += `  Description: ${item.description}\n`;
        }

        if (item.sortedNotes && item.sortedNotes.length > 0) {
          context += `  PROGRESS NOTES (${item.sortedNotes.length} total):\n`;
          // Show latest 3 notes for open items
          item.sortedNotes.slice(-3).forEach((note: any, index: number) => {
            const noteDate = new Date(note.created_at);
            const daysAgo = Math.floor((Date.now() - noteDate.getTime()) / (1000 * 60 * 60 * 24));
            context += `    • [${noteDate.toLocaleDateString()} - ${daysAgo} days ago] ${note.created_by}: "${note.note}"\n`;
          });
          if (item.sortedNotes.length > 3) {
            context += `    (${item.sortedNotes.length - 3} earlier notes not shown)\n`;
          }
        } else {
          context += `  ⚠️  NO PROGRESS NOTES - Consider adding updates\n`;
        }
        context += `\n`;
      });
    }

    if (inProgressItems.length > 0) {
      context += `\n🔄 IN PROGRESS ITEMS (${inProgressItems.length}):\n`;
      inProgressItems.slice(0, 10).forEach((item: any) => {
        context += `\n[${item.priority.toUpperCase()}] ${item.title}\n`;
        context += `  Internal ID: ${item.id}\n`; // Keep ID for AI reference but label it clearly
        context += `  Project: ${item.projects?.name || 'No Project'}\n`;
        if (item.due_date) {
          const daysUntilDue = Math.floor((new Date(item.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          context += `  Due: ${item.due_date} (${daysUntilDue > 0 ? `${daysUntilDue} days remaining` : `${Math.abs(daysUntilDue)} days overdue`})\n`;
        }
        context += `  Assigned: ${item.assigned_to || 'Unassigned'}\n`;
        
        // Add subcontractor contact info if matched
        if (item.matchedSubcontractor) {
          const sub = item.matchedSubcontractor;
          context += `  📧 Contact: ${sub.contact_person || sub.name} | ${sub.contact_email || 'No email'} | ${sub.contact_phone || 'No phone'}\n`;
        }
        
        context += `  Last Activity: ${item.timeline.daysSinceLastUpdate} days ago\n`;

        if (item.sortedNotes && item.sortedNotes.length > 0) {
          context += `  RECENT PROGRESS:\n`;
          // Show latest 2 notes for in-progress items
          item.sortedNotes.slice(-2).forEach((note: any) => {
            const noteDate = new Date(note.created_at);
            const daysAgo = Math.floor((Date.now() - noteDate.getTime()) / (1000 * 60 * 60 * 24));
            context += `    • [${noteDate.toLocaleDateString()} - ${daysAgo} days ago] ${note.created_by}: "${note.note}"\n`;
          });
        }
        context += `\n`;
      });
    }

    // Show recently completed items to understand what's been accomplished
    if (completedItems.length > 0) {
      context += `\n✅ RECENTLY COMPLETED ITEMS (${completedItems.length} total, showing latest 5):\n`;
      completedItems.slice(0, 5).forEach((item: any) => {
        const completionDate = item.completed_at ? new Date(item.completed_at) : new Date(item.updated_at);
        const daysAgo = Math.floor((Date.now() - completionDate.getTime()) / (1000 * 60 * 60 * 24));
        context += `\n[${item.priority.toUpperCase()}] ${item.title}\n`;
        context += `  Internal ID: ${item.id}\n`; // Keep ID for AI reference but label it clearly
        context += `  Project: ${item.projects?.name || 'No Project'}\n`;
        context += `  Completed: ${completionDate.toLocaleDateString()} (${daysAgo} days ago)\n`;

        if (item.sortedNotes && item.sortedNotes.length > 0) {
          const finalNote = item.sortedNotes[item.sortedNotes.length - 1];
          context += `  Final Note: "${finalNote.note}" - ${finalNote.created_by}\n`;
        }
        context += `\n`;
      });
    }

    context += `\n`;
    
    // Add a quick reference section for AI to easily find action item IDs
    const allItems = [...overdueItems, ...openItems, ...inProgressItems];
    if (allItems.length > 0) {
      context += `🔍 QUICK REFERENCE - ACTION ITEM IDS FOR DATABASE OPERATIONS:\n`;
      allItems.slice(0, 20).forEach((item: any) => {
        context += `- "${item.title}" = ID: ${item.id}\n`;
      });
      context += `\n`;
    }
  }

  // Add comprehensive action item notes analysis for additional context
  if (data.actionItemNotes.length > 0) {
    context += `RECENT ACTION ITEM NOTE ACTIVITY (Last 20 notes):\n`;

    // Group notes by action item for better analysis
    const notesByItem = data.actionItemNotes.reduce((acc: any, note: any) => {
      if (!acc[note.action_item_id]) {
        acc[note.action_item_id] = [];
      }
      acc[note.action_item_id].push(note);
      return acc;
    }, {});

    // Show recent activity with better context
    data.actionItemNotes.slice(0, 20).forEach((note: any) => {
      const noteDate = new Date(note.created_at);
      const daysAgo = Math.floor((Date.now() - noteDate.getTime()) / (1000 * 60 * 60 * 24));
      const timeAgo = daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo} days ago`;

      context += `• [${timeAgo}] ${note.created_by}: "${note.note}"\n`;
      context += `  Action Item ID: ${note.action_item_id}\n`;
      context += `  Timestamp: ${noteDate.toLocaleString()}\n`;
      context += `\n`;
    });
  }

  // COMPREHENSIVE DAILY LOGS ANALYSIS with all related data
  if (data.dailyLogs && data.dailyLogs.length > 0) {
    context += `\n📋 DAILY LOGS SUMMARY (${data.dailyLogs.length} recent logs):\n`;
    
    // Create maps for related data
    const sectionsByLogId = (data.logSections || []).reduce((acc: any, section: any) => {
      if (!acc[section.log_id]) acc[section.log_id] = [];
      acc[section.log_id].push(section);
      return acc;
    }, {});

    const crewsByLogId = (data.logCrews || []).reduce((acc: any, crew: any) => {
      if (!acc[crew.log_id]) acc[crew.log_id] = [];
      acc[crew.log_id].push(crew);
      return acc;
    }, {});

    const equipmentByLogId = (data.logEquipment || []).reduce((acc: any, equip: any) => {
      if (!acc[equip.log_id]) acc[equip.log_id] = [];
      acc[equip.log_id].push(equip);
      return acc;
    }, {});

    const photosByLogId = (data.logPhotos || []).reduce((acc: any, photo: any) => {
      if (!acc[photo.log_id]) acc[photo.log_id] = [];
      acc[photo.log_id].push(photo);
      return acc;
    }, {});

    const subcontractorsByLogId = (data.logSubcontractors || []).reduce((acc: any, sub: any) => {
      if (!acc[sub.log_id]) acc[sub.log_id] = [];
      acc[sub.log_id].push(sub);
      return acc;
    }, {});

    // Process each daily log with complete context
    data.dailyLogs.slice(0, 10).forEach((log: any) => {
      const logDate = new Date(log.date);
      const daysAgo = Math.floor((Date.now() - logDate.getTime()) / (1000 * 60 * 60 * 24));
      const timeRef = daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo} days ago`;

      context += `\n📅 ${log.date} (${timeRef}) - ${log.projects?.name || 'Unknown Project'}\n`;
      context += `   Superintendent: ${log.superintendent_name || 'Not specified'}\n`;
      if (log.weather) context += `   Weather: ${log.weather}\n`;
      if (log.temperature) context += `   Temperature: ${log.temperature}\n`;

      // Log sections (work performed, delays, meetings, etc.)
      const sections = sectionsByLogId[log.id] || [];
      if (sections.length > 0) {
        context += `   📝 LOG SECTIONS (${sections.length}):\n`;
        sections.sort((a: any, b: any) => (a.order_num || 0) - (b.order_num || 0)).forEach((section: any) => {
          context += `     ${section.section_type || 'General'}: ${section.content}\n`;
        });
      }

      // Crew assignments
      const crews = crewsByLogId[log.id] || [];
      if (crews.length > 0) {
        context += `   👷 CREW MEMBERS (${crews.length}):\n`;
        crews.forEach((crew: any) => {
          if (crew.crew_members) {
            context += `     ${crew.crew_members.name} (${crew.crew_members.role || 'Worker'})`;
            if (crew.crew_members.email) context += ` | Email: ${crew.crew_members.email}`;
            if (crew.crew_members.phone) context += ` | Phone: ${crew.crew_members.phone}`;
            context += `\n`;
          }
        });
      }

      // Equipment usage
      const equipment = equipmentByLogId[log.id] || [];
      if (equipment.length > 0) {
        context += `   🚜 EQUIPMENT USED (${equipment.length}):\n`;
        equipment.forEach((equip: any) => {
          context += `     ${equip.equipment?.name || 'Unknown Equipment'}`;
          if (equip.equipment?.type) context += ` (${equip.equipment.type})`;
          if (equip.hours_used) context += ` - ${equip.hours_used} hours`;
          if (equip.notes) context += ` | Notes: ${equip.notes}`;
          context += `\n`;
        });
      }

      // Subcontractor participation
      const subcontractors = subcontractorsByLogId[log.id] || [];
      if (subcontractors.length > 0) {
        context += `   🏗️ SUBCONTRACTORS ON SITE (${subcontractors.length}):\n`;
        subcontractors.forEach((sub: any) => {
          if (sub.subcontractors) {
            context += `     ${sub.subcontractors.name}`;
            if (sub.subcontractors.specialty) context += ` (${sub.subcontractors.specialty})`;
            if (sub.subcontractors.contact_person) context += ` | Contact: ${sub.subcontractors.contact_person}`;
            context += `\n`;
          }
        });
      }

      // Photos documentation
      const photos = photosByLogId[log.id] || [];
      if (photos.length > 0) {
        context += `   📸 PHOTOS (${photos.length}):\n`;
        photos.forEach((photo: any) => {
          context += `     Photo: ${photo.caption || 'No caption'}\n`;
        });
      }

      context += `\n`;
    });

    // Summary statistics for daily logs
    const totalSections = data.logSections?.length || 0;
    const totalCrews = data.logCrews?.length || 0;
    const totalEquipment = data.logEquipment?.length || 0;
    const totalPhotos = data.logPhotos?.length || 0;
    const totalLogSubcontractors = data.logSubcontractors?.length || 0;

    context += `DAILY LOGS STATISTICS:\n`;
    context += `- ${data.dailyLogs.length} daily logs in database\n`;
    context += `- ${totalSections} total log sections (work descriptions, delays, meetings)\n`;
    context += `- ${totalCrews} crew assignments recorded\n`;
    context += `- ${totalEquipment} equipment usage entries\n`;
    context += `- ${totalPhotos} photos documented\n`;
    context += `- ${totalLogSubcontractors} subcontractor participation records\n`;

    // Equipment summary
    if (data.equipment && data.equipment.length > 0) {
      context += `\n🚜 EQUIPMENT INVENTORY (${data.equipment.length} items):\n`;
      const activeEquipment = data.equipment.filter((e: any) => e.status === 'active' || !e.status);
      const inactiveEquipment = data.equipment.filter((e: any) => e.status === 'inactive' || e.status === 'maintenance');
      
      context += `- ${activeEquipment.length} active equipment items\n`;
      if (inactiveEquipment.length > 0) {
        context += `- ${inactiveEquipment.length} inactive/maintenance equipment\n`;
      }

      // Group by type
      const equipmentByType = data.equipment.reduce((acc: any, equip: any) => {
        const type = equip.type || 'General';
        if (!acc[type]) acc[type] = [];
        acc[type].push(equip);
        return acc;
      }, {});

      if (Object.keys(equipmentByType).length > 1) {
        context += `Equipment types available: ${Object.keys(equipmentByType).join(', ')}\n`;
      }
    }
  }

  // Add subcontractors information for email drafting and project coordination
  // Only include detailed subcontractor info when relevant to current context
  if (data.subcontractors.length > 0) {
    context += `\nSUBCONTRACTORS SUMMARY (${data.subcontractors.length} total):\n`;
    
    // Group by active/inactive status
    const activeSubcontractors = data.subcontractors.filter((sub: any) => sub.is_active !== false);
    const inactiveSubcontractors = data.subcontractors.filter((sub: any) => sub.is_active === false);
    
    context += `- ${activeSubcontractors.length} active subcontractors available\n`;
    if (inactiveSubcontractors.length > 0) {
      context += `- ${inactiveSubcontractors.length} inactive subcontractors on file\n`;
    }
    
    // Email drafting quick reference with enhanced metrics
    const emailReadyContractors = activeSubcontractors.filter((sub: any) => sub.contact_email);
    const fullContactContractors = activeSubcontractors.filter((sub: any) => sub.contact_email && sub.contact_person);
    const specialtyContractors = activeSubcontractors.filter((sub: any) => sub.specialty);
    
    context += `- ${emailReadyContractors.length} have email addresses for communication\n`;
    context += `- ${fullContactContractors.length} have complete contact information\n`;
    context += `- ${specialtyContractors.length} have specialties listed\n`;
    
    // Specialty breakdown for trade-specific context
    const specialtyGroups = activeSubcontractors.reduce((acc: any, sub: any) => {
      const specialty = sub.specialty || 'General';
      if (!acc[specialty]) acc[specialty] = [];
      acc[specialty].push(sub);
      return acc;
    }, {});
    
    if (Object.keys(specialtyGroups).length > 1) {
      context += `\nAvailable specialties: ${Object.keys(specialtyGroups).join(', ')}\n`;
    }
    
    // FULL SUBCONTRACTOR DATABASE FOR AI REFERENCE (not shown to user):
    // Store complete subcontractor data for AI to access when needed
    context += `\nFULL SUBCONTRACTOR DATABASE (for AI reference only):\n`;
    activeSubcontractors.forEach((sub: any) => {
      context += `${sub.name} | Contact: ${sub.contact_person || 'Not specified'} | Email: ${sub.contact_email || 'No email'} | Phone: ${sub.contact_phone || 'No phone'} | Specialty: ${sub.specialty || 'General'}`;
      if (sub.address) context += ` | Address: ${sub.address}`;
      if (sub.license_number) context += ` | License: ${sub.license_number}`;
      if (sub.insurance_info) context += ` | Insurance: ${sub.insurance_info}`;
      if (sub.notes) context += ` | Notes: ${sub.notes}`;
      context += `\n`;
    });
    
    context += `\n`;
  }

  // Add project subcontractor awards to distinguish between officially awarded vs. mentioned in action items
  if (data.projectSubcontractors && data.projectSubcontractors.length > 0) {
    context += `\n🏆 OFFICIALLY AWARDED PROJECT SUBCONTRACTORS (${data.projectSubcontractors.length} total):\n`;
    
    // Group by status
    const activeAwards = data.projectSubcontractors.filter((ps: any) => ps.status === 'active');
    const completedAwards = data.projectSubcontractors.filter((ps: any) => ps.status === 'completed');
    const inactiveAwards = data.projectSubcontractors.filter((ps: any) => ps.status === 'inactive');
    
    if (activeAwards.length > 0) {
      context += `\n🔥 CURRENTLY ACTIVE AWARDS (${activeAwards.length}):\n`;
      activeAwards.forEach((ps: any) => {
        const sub = ps.subcontractors;
        context += `  ✅ ${sub?.name || 'Unknown'} - ${sub?.specialty || 'No specialty'}\n`;
        context += `     Project: ${ps.projects?.name || 'Unknown Project'}\n`;
        context += `     Awarded: ${ps.assigned_date}\n`;
        context += `     Contact: ${sub?.contact_person || 'No contact'} | ${sub?.contact_email || 'No email'} | ${sub?.contact_phone || 'No phone'}\n`;
        if (ps.notes) context += `     Award Notes: ${ps.notes}\n`;
        context += `\n`;
      });
    }
    
    if (completedAwards.length > 0) {
      context += `\n✅ COMPLETED AWARDS (${completedAwards.length}):\n`;
      completedAwards.forEach((ps: any) => {
        const sub = ps.subcontractors;
        context += `  🏁 ${sub?.name || 'Unknown'} - ${sub?.specialty || 'No specialty'}\n`;
        context += `     Project: ${ps.projects?.name || 'Unknown Project'}\n`;
        context += `     Awarded: ${ps.assigned_date} | Status: ${ps.status}\n`;
        if (ps.notes) context += `     Completion Notes: ${ps.notes}\n`;
        context += `\n`;
      });
    }
    
    if (inactiveAwards.length > 0) {
      context += `\n❌ INACTIVE AWARDS (${inactiveAwards.length}):\n`;
      inactiveAwards.forEach((ps: any) => {
        const sub = ps.subcontractors;
        context += `  ⏸️ ${sub?.name || 'Unknown'} - ${sub?.specialty || 'No specialty'}\n`;
        context += `     Project: ${ps.projects?.name || 'Unknown Project'}\n`;
        context += `     Status: ${ps.status} | Originally Awarded: ${ps.assigned_date}\n`;
        if (ps.notes) context += `     Status Notes: ${ps.notes}\n`;
        context += `\n`;
      });
    }
    
    // Create project award summary for quick reference
    const projectAwardSummary = data.projectSubcontractors.reduce((acc: any, ps: any) => {
      const projectName = ps.projects?.name || 'Unknown Project';
      if (!acc[projectName]) acc[projectName] = { active: 0, completed: 0, inactive: 0, contractors: [] };
      acc[projectName][ps.status]++;
      acc[projectName].contractors.push({
        name: ps.subcontractors?.name || 'Unknown',
        specialty: ps.subcontractors?.specialty || 'No specialty',
        status: ps.status
      });
      return acc;
    }, {});
    
    context += `\n📊 PROJECT AWARD SUMMARY:\n`;
    Object.entries(projectAwardSummary).forEach(([projectName, summary]: [string, any]) => {
      context += `  ${projectName}:\n`;
      if (summary.active > 0) context += `    - ${summary.active} active subcontractor(s)\n`;
      if (summary.completed > 0) context += `    - ${summary.completed} completed subcontractor(s)\n`;
      if (summary.inactive > 0) context += `    - ${summary.inactive} inactive subcontractor(s)\n`;
      
      // List contractors for this project
      summary.contractors.forEach((contractor: any) => {
        context += `      • ${contractor.name} (${contractor.specialty}) - ${contractor.status}\n`;
      });
      context += `\n`;
    });
    context += `\n`;
  }

  if (data.error) {
    context += `NOTE: ${data.error}\n\n`;
  }

  return context;
}

// Conversation logging functions
async function findOrCreateConversation(sessionId: string, userId: string, firstMessage: string) {
  try {
    if (sessionId) {
      // Try to find existing conversation by session ID
      const { data: existingConversation } = await supabase
        .from('conversations')
        .select('id')
        .eq('session_id', sessionId)
        .eq('status', 'active')
        .single();

      if (existingConversation) {
        return existingConversation.id;
      }
    }

    // Create new conversation
    const title = firstMessage.length > 50
      ? firstMessage.substring(0, 50) + '...'
      : firstMessage;

    const { data: newConversation, error } = await supabase
      .from('conversations')
      .insert([{
        session_id: sessionId || `session_${Date.now()}`,
        user_id: userId || 'anonymous',
        title: title,
        status: 'active'
      }])
      .select('id')
      .single();

    if (error) throw error;
    return newConversation.id;
  } catch (error) {
    console.error('Error managing conversation:', error);
    // Return a fallback ID if database logging fails
    return `temp_${Date.now()}`;
  }
}

async function logMessage(conversationId: string, role: 'user' | 'assistant' | 'system', content: string, metadata?: any) {
  try {
    const messageData: any = {
      conversation_id: conversationId,
      role,
      content,
      created_at: new Date().toISOString()
    };

    if (metadata) {
      if (metadata.model) messageData.model_used = metadata.model;
      if (metadata.responseTime) messageData.response_time_ms = metadata.responseTime;
      if (metadata.tokenCount) messageData.token_count = metadata.tokenCount;
      if (metadata.promptTokens || metadata.completionTokens) {
        messageData.metadata = {
          prompt_tokens: metadata.promptTokens,
          completion_tokens: metadata.completionTokens,
          total_tokens: metadata.tokenCount
        };
      }
    }

    await supabase
      .from('conversation_messages')
      .insert([messageData]);
  } catch (error) {
    console.error('Error logging message:', error);
    // Don't throw - we don't want logging failures to break the chat
  }
}

async function logConversationContext(conversationId: string, constructionData: any) {
  try {
    const contextEntries = [
      {
        conversation_id: conversationId,
        context_type: 'action_items',
        context_data: {
          total: constructionData.actionItems?.length || 0,
          items: constructionData.actionItemsWithDetails?.slice(0, 5) || [] // Store sample for context
        }
      },
      {
        conversation_id: conversationId,
        context_type: 'projects',
        context_data: {
          total: constructionData.projects?.length || 0,
          projects: constructionData.projects || []
        }
      },
      {
        conversation_id: conversationId,
        context_type: 'daily_logs',
        context_data: {
          total: constructionData.dailyLogs?.length || 0,
          recent: constructionData.recentLogsWithDetails?.slice(0, 3) || []
        }
      }
    ];

    await supabase
      .from('conversation_context')
      .insert(contextEntries);
  } catch (error) {
    console.error('Error logging conversation context:', error);
    // Don't throw - we don't want logging failures to break the chat
  }
}

// Action execution functions
async function executeAction(actionType: string, actionData: any) {
  try {
    console.log('executeAction called with:', { actionType, actionData });
    
    // Call the imported action function directly instead of making HTTP calls
    const action = {
      type: actionType,
      data: {
        actionItemId: actionData.actionItemId,
        ...actionData
      }
    };
    
    console.log('Calling executeAIAction with:', { action, userId: actionData.user || 'AI Assistant' });
    
    const userId = actionData.user || 'AI Assistant';
    const result = await executeAIAction(action, userId);
    
    console.log('executeAIAction returned:', result);
    return result;
  } catch (error) {
    console.error(`Error executing action ${actionType}:`, error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const { message, sessionId, userId, conversationHistory, action, apiKey } = await request.json();

    // Check for API key - either from request or environment
    const openaiApiKey = apiKey || process.env.OPENAI_API_KEY;
    
    if (!openaiApiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not provided. Please add your API key in Settings.' },
        { status: 400 }
      );
    }

    // Create OpenAI client with the provided API key
    let openaiClient;
    try {
      openaiClient = new OpenAI({
        apiKey: openaiApiKey,
      });
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid OpenAI API key format' },
        { status: 400 }
      );
    }

    // Handle direct database actions requested by AI
    if (action) {
      const result = await executeAction(action.actionType, action.actionData);
      return NextResponse.json(result);
    }

    // Fetch current construction data
    const constructionData = await fetchConstructionData();
    const dataContext = createDataContext(constructionData);

    // Find or create conversation
    let conversationId = await findOrCreateConversation(sessionId, userId, message);

    // Log user message
    await logMessage(conversationId, 'user', message);

    // Log context data for this conversation (only on first message or periodically)
    if (!sessionId || Math.random() < 0.1) { // 10% chance to refresh context
      await logConversationContext(conversationId, constructionData);
    }

    const systemPrompt = `You are an AI construction assistant with access to real-time project data and comprehensive action item tracking. You help construction superintendents and project managers analyze their daily logs, identify patterns, and make informed decisions.

${dataContext}

DATABASE ACTION CAPABILITIES: 
You can now perform database actions when users request changes. When a user asks you to update something in the database, you should:

1. Explain what you're going to do in your response
2. Include the action JSON at the end of your response in this EXACT format (no extra spaces or characters):
{"action":{"actionType":"action_name","actionData":{"id":"action_item_id","status":"new_status","user":"AI Assistant"}}}

Available action types:
- update_action_item_status: Change status (open, in_progress, completed, cancelled)
- add_action_item_note: Add progress notes  
- update_action_item_priority: Change priority (low, medium, high, urgent)
- assign_action_item: Assign to someone
- update_action_item_due_date: Set or change due date

3. Reference the specific action item Internal ID from the data above (DO NOT show Internal IDs to users in your responses)
4. The action will be executed automatically

IMPORTANT: When discussing action items with users, refer to them by title only (e.g., "Small Punch List" not "Small Punch List (ID: xxx)"). The Internal IDs are for your database operations only and should never be displayed to users.

CRITICAL JSON FORMAT RULES:
- Use double quotes for all strings
- No extra spaces around colons or commas
- No trailing commas
- No line breaks within the JSON
- Place the JSON on its own line at the very end of your response

Examples (copy these formats exactly):
- To mark as completed: {"action":{"type":"update_action_item_status","data":{"actionItemId":"item_id_here","status":"completed","note":"Optional note"}}}
- To add a note: {"action":{"type":"add_action_item_note","data":{"actionItemId":"item_id_here","note":"Your note here"}}}
- To change priority: {"action":{"type":"update_action_item_priority","data":{"actionItemId":"item_id_here","priority":"urgent"}}}

CRITICAL: Replace "item_id_here" with the exact Internal ID value from the data above. If you cannot find the specific action item being referenced, explain this to the user instead of generating invalid JSON.

When making changes, always include relevant context and explain what was changed, then include the action JSON.

CRITICAL ANALYSIS INSTRUCTIONS:

1. TIMESTAMP ANALYSIS: Always analyze timestamps chronologically when discussing action items:
   - Look at creation dates, update dates, completion dates, and note timestamps
   - Consider the progression of notes over time to understand current status
   - Identify items that haven't been updated recently (potential stalled items)
   - Note when status changes occurred based on timestamp patterns

2. ACTION ITEM STATUS INTELLIGENCE: 
   - An item marked "completed" with recent completion timestamps IS completed
   - If you see notes about rescheduling or status changes, use the MOST RECENT information
   - Pay attention to note progression: earlier notes may be outdated by newer updates
   - Look for contradictions between status fields and recent notes

3. TEMPORAL CONTEXT: When answering questions:
   - Always reference the most recent and relevant information based on timestamps
   - If an item was updated after the question timeframe, mention the current status
   - Distinguish between what was true historically vs. what is current
   - Flag items that may need attention based on lack of recent updates

4. ACTION ITEM SCANNING FOR QUESTIONS: When users ask about specific people, companies, or work items:
   - ALWAYS scan through ALL action items for relevant matches
   - Look for assignments, descriptions, titles, and notes that mention the subject
   - Check both open and completed items for full context
   - Cross-reference with subcontractor database for complete contact information
   - Present findings with timeline context and current status

SPECIFIC EXAMPLE FROM YOUR DATA:
- If someone asks "is there drywall that needs to be ordered?" look at:
  1. The action item status field (completed/open/in_progress)
  2. The completion timestamp (when was it marked complete?)
  3. The most recent notes (what's the latest update?)
  4. Any notes about delivery dates or status changes

- If someone asks about "Sierra West" or "Eric":
  1. Scan ALL action items for mentions in titles, descriptions, assigned_to fields
  2. Look for notes mentioning meetings, quotes, follow-ups
  3. Check subcontractor database for contact details
  4. Present complete timeline of interactions

Based on this actual project data, provide helpful insights about:
- Work progress and productivity trends
- Safety observations and recommendations
- Schedule impacts and delays
- Resource utilization and planning
- Quality control issues
- Weather impact analysis
- Crew and subcontractor performance
- Individual crew member information (pay rates, contact details, roles, etc.)
- Personnel management and scheduling

ACTION ITEMS MANAGEMENT:
You have complete access to the action items system including:
- Current open, in-progress, and completed action items WITH FULL TIMESTAMP HISTORY
- Action item priorities (urgent, high, medium, low)
- Due dates and overdue items
- Assignments and responsible parties
- Source tracking (from meetings, out-of-scope work, observations, notes)
- Project associations and daily log origins
- COMPLETE CHRONOLOGICAL PROGRESSION of notes and updates
- Status change history through timestamp analysis

You can provide insights on:
- Current status based on most recent timestamps and notes
- Historical progression of action items
- Items that may be stalled (no recent updates)
- Overdue action items requiring immediate attention
- Resource conflicts (same person assigned multiple urgent items)
- Action item trends and patterns over time
- Priority recommendations based on due dates and project impact
- Workload distribution and capacity planning
- Progress tracking and completion rates
- Risk identification from unresolved action items

DAILY LOGS ANALYSIS & SEARCH:
You have comprehensive access to daily log data including:
- Daily log entries with dates, weather, temperatures, and superintendent information
- Log sections containing detailed work descriptions, delays, meetings, and observations
- Crew assignments and personnel participation for each day
- Equipment usage tracking with hours and operational notes
- Photo documentation with captions and timestamps
- Subcontractor participation and on-site presence
- Equipment inventory and status information

DAILY LOGS CAPABILITIES:
You can search, analyze, and answer questions about:
- Work performed on specific dates or date ranges
- Weather conditions and their impact on operations
- Crew participation and attendance patterns
- Equipment utilization and efficiency
- Subcontractor activity and coordination
- Safety incidents, meetings, and delays documented in logs
- Photo documentation and project progress visualization
- Work progression trends and productivity analysis
- Seasonal and weather-related work patterns

DAILY LOGS SEARCH INTELLIGENCE:
When users ask about daily operations, always:
1. Search through log sections for relevant work descriptions
2. Cross-reference crew assignments with crew member database
3. Match equipment usage with equipment inventory data
4. Identify subcontractor participation and contact information
5. Analyze photo documentation for visual progress context
6. Consider weather impacts on work performance
7. Track superintendent observations and management notes

EXAMPLES OF DAILY LOGS QUERIES YOU CAN HANDLE:
- "What work was performed last week?"
- "Which crews worked on concrete pour?"
- "What equipment was used on [specific date]?"
- "Were there any delays documented in the logs?"
- "What subcontractors were on site this month?"
- "Show me photos from the foundation work"
- "What was the weather like during roofing operations?"
- "Who was the superintendent for the electrical rough-in?"

CREW MEMBER DETAILS:
You have access to detailed crew member information including names, roles, hourly rates, contact information, and notes. You can answer questions about:
- Who works for the company and their roles
- How much specific crew members get paid
- Contact information for crew members
- Crew member skills and specialties
- Availability and scheduling

SUBCONTRACTOR DETAILS & EMAIL DRAFTING:
You have complete access to subcontractor information and can draft professional, ready-to-send emails. For each subcontractor you have:
- Company name and contact person details
- Specialty/trade expertise areas  
- Complete contact information (email, phone, address)
- License numbers and insurance information
- Historical notes and project context
- Active/inactive status

🚨 CRITICAL: DISTINGUISH BETWEEN OFFICIALLY AWARDED vs. MENTIONED SUBCONTRACTORS:

1. OFFICIALLY AWARDED SUBCONTRACTORS (in project_subcontractors table):
   - These are contractors who have been formally awarded work on specific projects
   - Status: active, completed, or inactive
   - Have official assignment dates and award documentation
   - When users ask "which contractor was awarded this project" or "who is the official contractor for X", ONLY reference these

2. MENTIONED SUBCONTRACTORS (in action items only):
   - These are contractors who appear in action item assignments or notes
   - May be candidates, providing quotes, or doing small tasks
   - NOT officially awarded major project work
   - When users ask about "mentions" or "who has been contacted", reference these

3. ANSWERING QUESTIONS ABOUT CONTRACTORS:
   - "Who was awarded the electrical work?" → Check project_subcontractors for active/completed electrical contractors
   - "Who is working on the plumbing?" → Check project_subcontractors for active status
   - "Have we heard from any drywall contractors?" → Check action items for mentions
   - "What contractors are officially on this project?" → Only list project_subcontractors with active/completed status

IMPORTANT: Only mention specific subcontractor details when:
1. User asks about a specific contractor or company
2. User requests email drafting
3. User asks about available contractors for a specific trade
4. User asks about contact information
5. The conversation topic is directly related to subcontractor management
6. User asks about officially awarded vs. mentioned contractors

For general questions, keep responses focused and concise without listing all contractor details.

EMAIL DRAFTING CAPABILITIES:
When drafting emails to subcontractors, you MUST create PROFESSIONAL, COPY-PASTE READY emails using all available database information:

ENHANCED SUBCONTRACTOR & ACTION ITEM INTEGRATION:
The system now automatically matches action items assigned to individuals with subcontractor database records. For example:
- Action items assigned to "Eric" or "Eric Stilwell" will automatically match with "Sierra West Drywall" 
- You have complete access to matched subcontractor contact information including email, phone, specialty, etc.
- When discussing action items, always reference the complete subcontractor contact details when available

AVAILABLE SUBCONTRACTOR DATA FIELDS:
- name: Company/business name (e.g., "Sierra West Drywall")
- contact_person: Individual contact person name (e.g., "Eric Stilwell")
- contact_email: Primary email address for communication (e.g., "Eric@sierrawes.com")
- contact_phone: Phone number for contact (e.g., "916.768.5200")
- specialty: Trade/specialty area (e.g., "Drywall/Insulation")
- address: Physical business address
- license_number: Professional license information
- insurance_info: Insurance coverage details
- notes: Historical project notes and relationship context
- is_active: Current status (active/inactive contractors)
- created_at/updated_at: Relationship timeline

CRITICAL: When users ask about contacting someone (like Eric from Sierra West Drywall), ALWAYS check both:
1. The action items for context about what work is assigned
2. The subcontractors database for complete contact information
3. Present the matched information together for complete context

EMAIL FORMATTING REQUIREMENTS:

1. HEADER STRUCTURE (Always include these lines):
   - Subject: Clear, descriptive subject with project context
   - To: contact_email from database
   - CC: additional emails if needed

2. GREETING PROTOCOL:
   - Use "Dear [contact_person]," if contact_person exists
   - Use "Dear [name] Team," if only company name available
   - Never use generic greetings when specific names are available

3. BODY CONTENT INTEGRATION:
   - Reference their specialty/trade expertise naturally
   - Include relevant project context and timeline
   - Use notes field for relationship building and historical context
   - Reference license/insurance when compliance-related
   - Include address reference for logistics/scheduling when relevant

4. CONTACT INFORMATION USAGE:
   - Always include their phone number for urgent matters
   - Reference their license number for compliance-sensitive communications
   - Use insurance info when discussing coverage requirements

5. PROFESSIONAL CLOSING:
   - Include sender's full contact information
   - Add clear next steps or action items
   - Professional sign-off with title/company

COPY-PASTE READY FORMAT:
Always format emails exactly like this:

Subject: [Descriptive subject with project/location context]
To: [contact_email]
CC: [if applicable]

Dear [contact_person/name],

[Opening paragraph with project context and their specialty reference]

[Main body with specific request/information using database context]

[Closing with next steps and contact information]

Best regards,
[Your name]
[Your title]
[Company name]
[Phone number]
[Email address]

EMAIL CONTENT INTELLIGENCE:
- If specialty = "electrical" → Reference electrical work, codes, inspections
- If specialty = "plumbing" → Reference plumbing systems, permits, fixtures  
- If specialty = "HVAC" → Reference heating/cooling systems, ductwork
- If notes contain project history → Reference previous successful collaborations
- If license_number exists → Mention licensing compliance when relevant
- If insurance_info exists → Reference coverage requirements when applicable

EMAIL EXAMPLES BY SCENARIO:
1. New Project Inquiry: Use specialty + notes for credibility
2. Schedule Coordination: Use address + phone for logistics
3. Compliance Communication: Use license_number + insurance_info
4. Follow-up Communication: Use notes for relationship context

When users request ANY email to subcontractors, always:
Check the subcontractor database for complete information
Create professional, ready-to-send emails with proper formatting
Include all relevant database context naturally
Provide copy-paste ready format with clear headers
Reference specific trades/specialties appropriately

When users request email drafts, always provide complete, professional emails that are ready to copy and paste into their email client.

Always reference specific data from the logs and crew member records when possible. Use timestamps to provide accurate, current information. If asked about logs but no data is available, explain that no logs have been created yet and suggest creating the first daily log.

Be conversational, practical, and focus on actionable insights for construction management. Always base your responses on the most current information available in the timestamps.`;

    // Build messages array with conversation history
    const messages: any[] = [
      {
        role: "system",
        content: systemPrompt
      }
    ];

    // Add conversation history if provided (excluding system messages)
    if (conversationHistory && Array.isArray(conversationHistory) && conversationHistory.length > 0) {
      // Convert frontend message format to OpenAI format and filter out system messages
      const historyMessages = conversationHistory
        .filter((msg: any) => msg.role !== 'system')
        .slice(-10) // Keep last 10 messages for context
        .map((msg: any) => ({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content
        }));

      messages.push(...historyMessages);
    }

    // Add current message
    messages.push({
      role: "user",
      content: message
    });

    const completion = await openaiClient.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      max_tokens: 4000,
      temperature: 0.4,
    });

    const response = completion.choices[0]?.message?.content;
    const responseTime = Date.now() - startTime;

    if (!response) {
      return NextResponse.json(
        { error: 'No response generated' },
        { status: 500 }
      );
    }

    // Clean response by removing markdown formatting symbols
    let cleanedResponse = response
      .replace(/\*\*/g, '') // Remove bold markdown
      .replace(/\*/g, '')   // Remove italic markdown and bullet points
      .replace(/#{1,6}\s*/g, '') // Remove header markdown
      .replace(/`{1,3}/g, '') // Remove code formatting
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1'); // Convert links to plain text

    // Check for and execute actions in the response
    let actionResult = null;
    let finalResponse = cleanedResponse;
    let actionMatch = null;

    try {
      // Look for action JSON in the response - improved pattern matching with multiple attempts
      actionMatch = cleanedResponse.match(/\{"action":\s*\{[^}]+\}\}/);
      
      // If that doesn't work, try a more flexible pattern
      if (!actionMatch) {
        actionMatch = cleanedResponse.match(/\{"action":\s*\{[\s\S]*?\}\}/);
      }
      
      // Try to find just the inner action object
      if (!actionMatch) {
        actionMatch = cleanedResponse.match(/"type":\s*"[^"]+",\s*"data":\s*\{[^}]+\}/);
        if (actionMatch) {
          actionMatch[0] = `{"action": {${actionMatch[0]}}}`;
        }
      }
      
      // Check for incomplete JSON (like a single "}")
      if (!actionMatch && cleanedResponse.includes('}') && !cleanedResponse.includes('{"action"')) {
        console.log('Detected incomplete JSON in response:', cleanedResponse);
        finalResponse = cleanedResponse.replace(/\s*\}\s*$/, '') +
          '\n\n❌ **Action Failed**: The action command was incomplete. Please try your request again with more specific details about which action item you want to modify.';
        return NextResponse.json({
          response: finalResponse,
          conversationId,
          sessionId: sessionId || `session_${Date.now()}`,
          metadata: {
            responseTime,
            tokenCount: completion.usage?.total_tokens,
            actionExecuted: false
          }
        });
      }

      if (actionMatch) {
        console.log('Found action pattern:', actionMatch[0]);
        console.log('Full AI response:', cleanedResponse);
        
        // Clean the JSON string to remove any potential formatting issues
        let jsonString = actionMatch[0]
          .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
          .replace(/\s+/g, ' ') // Normalize whitespace
          .trim();
        
        console.log('Cleaned JSON string:', jsonString);
        
        let actionJson;
        try {
          actionJson = JSON.parse(jsonString);
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          console.error('Problematic JSON:', jsonString);
          
          // Try to manually construct the action if we can extract the parts
          const actionTypeMatch = jsonString.match(/"actionType":\s*"([^"]+)"/);
          const idMatch = jsonString.match(/"id":\s*"([^"]+)"/);
          const statusMatch = jsonString.match(/"status":\s*"([^"]+)"/);
          const noteMatch = jsonString.match(/"note":\s*"([^"]+)"/);
          const userMatch = jsonString.match(/"user":\s*"([^"]+)"/);
          
          if (actionTypeMatch && idMatch) {
            actionJson = {
              action: {
                actionType: actionTypeMatch[1],
                actionData: {
                  id: idMatch[1],
                  status: statusMatch ? statusMatch[1] : undefined,
                  note: noteMatch ? noteMatch[1] : undefined,
                  user: userMatch ? userMatch[1] : 'AI Assistant'
                }
              }
            };
            console.log('Manually constructed action from malformed JSON:', actionJson);
          } else {
            // Could not extract action info, just remove the malformed JSON and continue
            console.log('Could not extract action from malformed JSON, skipping action execution');
            finalResponse = cleanedResponse.replace(actionMatch[0], '').trim();
            throw new Error('SKIP_ACTION'); // Special error to skip showing parse error
          }
        }
        
        const { actionType, actionData } = actionJson.action;

        console.log('Executing action:', actionType, actionData);
        
        // Ensure we have the required fields
        if (!actionType || !actionData) {
          throw new Error('Invalid action format: missing actionType or actionData');
        }

        // Convert to the format expected by executeAction
        const action = {
          type: actionType,
          data: actionData
        };

        actionResult = await executeAction(action.type, action.data);
        console.log('Action result:', actionResult);

        // Update the response to include action confirmation
        if (actionResult && actionResult.success) {
          const successMessage = actionResult.message || 'Action completed successfully';
          finalResponse = cleanedResponse.replace(actionMatch[0], '').trim() +
            `\n\n✅ Action Completed: ${successMessage}`;
        } else {
          const errorMessage = actionResult?.error || 'Action failed';
          finalResponse = cleanedResponse.replace(actionMatch[0], '').trim() +
            `\n\n❌ Action Failed: ${errorMessage}`;
        }
      }
    } catch (actionError) {
      console.error('Error executing action:', actionError);
      
      // Handle special SKIP_ACTION error - don't show error to user
      if (actionError instanceof Error && actionError.message === 'SKIP_ACTION') {
        // finalResponse was already set above, just continue
        console.log('Skipping action execution and error display due to malformed JSON');
      } else {
        console.error('Action error details:', {
          message: actionError instanceof Error ? actionError.message : 'Unknown error',
          stack: actionError instanceof Error ? actionError.stack : null,
          code: (actionError as any)?.code,
          details: (actionError as any)?.details,
          hint: (actionError as any)?.hint
        });
        
        // Provide more specific error messages based on the error type
        let errorMessage = 'Unknown error occurred';
        if (actionError instanceof Error) {
          errorMessage = actionError.message;
          
          // Check for specific database errors
          if ((actionError as any)?.code === '23503') {
            errorMessage = `Action item ID not found in database. Please verify the action item ID and try again.`;
          } else if ((actionError as any)?.message?.includes('violates foreign key constraint')) {
            errorMessage = `Invalid action item ID. The action item may have been deleted or the ID is incorrect.`;
          } else {
            errorMessage = actionError.message;
          }
        }
        
        finalResponse = cleanedResponse.replace(actionMatch?.[0] || '', '').trim() +
          `\n\n❌ Action Failed: ${errorMessage}`;
      }
    }

    // Log AI response
    await logMessage(conversationId, 'assistant', finalResponse, {
      model: 'gpt-4o-mini',
      responseTime,
      tokenCount: completion.usage?.total_tokens,
      promptTokens: completion.usage?.prompt_tokens,
      completionTokens: completion.usage?.completion_tokens,
      actionExecuted: actionResult ? true : false,
      actionResult: actionResult
    });

    return NextResponse.json({
      response: finalResponse,
      conversationId,
      sessionId: sessionId || `session_${Date.now()}`,
      metadata: {
        responseTime,
        tokenCount: completion.usage?.total_tokens,
        actionExecuted: actionResult ? true : false
      }
    });

  } catch (error: any) {
    console.error('Error in AI route:', error);

    if (error?.error?.type === 'insufficient_quota') {
      return NextResponse.json({
        error: 'OpenAI API quota exceeded. Please check your billing.'
      }, { status: 429 });
    }

    if (error?.status === 401) {
      return NextResponse.json({
        error: 'Invalid OpenAI API key.'
      }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
