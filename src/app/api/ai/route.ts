import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabase } from '@/lib/supabaseClient';

// Create OpenAI client with robust error handling
const createOpenAIClient = () => {
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'dummy-key') {
    console.error('OPENAI_API_KEY is not properly configured in environment variables');
  }

  try {
    return new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      dangerouslyAllowBrowser: false
    });
  } catch (error) {
    console.error('Error initializing OpenAI client:', error);
    // Return a dummy client that will fail gracefully when used
    return {
      chat: {
        completions: {
          create: async () => {
            throw new Error('OpenAI API key not properly configured');
          }
        }
      }
    } as unknown as OpenAI;
  }
};

const openai = createOpenAIClient();

async function fetchConstructionData() {
  try {
    // Fetch all relevant data from your Supabase tables including action items
    const [
      { data: projects },
      { data: dailyLogs },
      { data: crews },
      { data: crewMembers },
      { data: subcontractors },
      { data: logSections },
      { data: logCrews },
      { data: logSubcontractors },
      { data: actionItems },
      { data: actionItemNotes }
    ] = await Promise.all([
      supabase.from('projects').select('*'),
      supabase.from('daily_logs').select('*'),
      supabase.from('crews').select('*'),
      supabase.from('crew_members').select('*'),
      supabase.from('subcontractors').select('*'),
      supabase.from('log_sections').select('*'),
      supabase.from('log_crews').select('*'),
      supabase.from('log_subcontractors').select('*'),
      supabase.from('action_items').select('*').order('created_at', { ascending: false }),
      supabase.from('action_item_notes').select('*').order('created_at', { ascending: false })
    ]);

    // Fetch recent logs with related data
    const { data: recentLogsWithDetails } = await supabase
      .from('daily_logs')
      .select(`
        id,
        date,
        superintendent_name,
        projects(name, location),
        log_sections(section_type, content),
        log_crews(crews(name)),
        log_subcontractors(subcontractors(name))
      `)
      .order('date', { ascending: false })
      .limit(10);

    // Fetch action items with related project and log info, including ALL notes with proper column names
    const { data: actionItemsWithDetails } = await supabase
      .from('action_items')
      .select(`
        *,
        projects(name, location),
        daily_logs(date, superintendent_name),
        action_item_notes(id, note, created_by, created_at)
      `)
      .order('created_at', { ascending: false })
      .limit(50); // Increased to get more comprehensive data

    // Also fetch a comprehensive view of action items with their complete history
    const { data: actionItemsHistory } = await supabase
      .from('action_items')
      .select(`
        id,
        title,
        description,
        status,
        priority,
        due_date,
        assigned_to,
        created_at,
        updated_at,
        completed_at,
        projects(name, location),
        action_item_notes(id, note, created_by, created_at)
      `)
      .order('updated_at', { ascending: false });

    return {
      projects: projects || [],
      dailyLogs: dailyLogs || [],
      crews: crews || [],
      crewMembers: crewMembers || [],
      subcontractors: subcontractors || [],
      logSections: logSections || [],
      logCrews: logCrews || [],
      logSubcontractors: logSubcontractors || [],
      actionItems: actionItems || [],
      actionItemNotes: actionItemNotes || [],
      recentLogsWithDetails: recentLogsWithDetails || [],
      actionItemsWithDetails: actionItemsWithDetails || [],
      actionItemsHistory: actionItemsHistory || []
    };
  } catch (error) {
    console.error('Error fetching construction data:', error);
    return {
      projects: [],
      dailyLogs: [],
      crews: [],
      crewMembers: [],
      subcontractors: [],
      logSections: [],
      logCrews: [],
      logSubcontractors: [],
      actionItems: [],
      actionItemNotes: [],
      recentLogsWithDetails: [],
      actionItemsWithDetails: [],
      actionItemsHistory: [],
      error: 'Unable to fetch data from database'
    };
  }
}

function createDataContext(data: any) {
  const stats = {
    totalProjects: data.projects.length,
    totalLogs: data.dailyLogs.length,
    totalCrews: data.crews.length,
    totalCrewMembers: data.crewMembers.length,
    totalSubcontractors: data.subcontractors.length,
    recentLogsCount: data.recentLogsWithDetails.length,
    totalActionItems: data.actionItems.length,
    openActionItems: data.actionItems.filter((item: any) => item.status === 'open').length,
    inProgressActionItems: data.actionItems.filter((item: any) => item.status === 'in_progress').length,
    completedActionItems: data.actionItems.filter((item: any) => item.status === 'completed').length,
    urgentActionItems: data.actionItems.filter((item: any) => item.priority === 'urgent').length,
    overdueActionItems: data.actionItems.filter((item: any) =>
      item.due_date && new Date(item.due_date) < new Date() && item.status !== 'completed'
    ).length
  };

  let context = `CONSTRUCTION PROJECT DATA SUMMARY:

STATISTICS:
- Total Projects: ${stats.totalProjects}
- Total Daily Logs: ${stats.totalLogs}
- Total Crews: ${stats.totalCrews}
- Total Crew Members: ${stats.totalCrewMembers}
- Total Subcontractors: ${stats.totalSubcontractors}
- Recent Logs Available: ${stats.recentLogsCount}

ACTION ITEMS SUMMARY:
- Total Action Items: ${stats.totalActionItems}
- Open: ${stats.openActionItems}
- In Progress: ${stats.inProgressActionItems}
- Completed: ${stats.completedActionItems}
- Urgent Priority: ${stats.urgentActionItems}
- Overdue: ${stats.overdueActionItems}

`;

  // Add projects information
  if (data.projects.length > 0) {
    context += `ACTIVE PROJECTS:\n`;
    data.projects.forEach((project: any) => {
      context += `- ${project.name}${project.location ? ` (${project.location})` : ''}\n`;
    });
    context += '\n';
  }

  // Add recent logs with details
  if (data.recentLogsWithDetails.length > 0) {
    context += `RECENT DAILY LOGS:\n`;
    data.recentLogsWithDetails.forEach((log: any) => {
      context += `
Date: ${log.date}
Project: ${log.projects?.name || 'No Project'}
Superintendent: ${log.superintendent_name}
`;

      if (log.log_sections?.length > 0) {
        context += `Sections:\n`;
        log.log_sections.forEach((section: any) => {
          if (section.content?.trim()) {
            context += `  - ${section.section_type}: ${section.content.substring(0, 100)}${section.content.length > 100 ? '...' : ''}\n`;
          }
        });
      }

      if (log.log_crews?.length > 0) {
        const crewNames = log.log_crews.map((lc: any) => lc.crews?.name).filter(Boolean);
        if (crewNames.length > 0) {
          context += `Crews: ${crewNames.join(', ')}\n`;
        }
      }

      if (log.log_subcontractors?.length > 0) {
        const subNames = log.log_subcontractors.map((ls: any) => ls.subcontractors?.name).filter(Boolean);
        if (subNames.length > 0) {
          context += `Subcontractors: ${subNames.join(', ')}\n`;
        }
      }
      context += '\n';
    });
  }

  // Add crews and crew members lists
  if (data.crews.length > 0) {
    context += `AVAILABLE CREWS: ${data.crews.map((c: any) => c.name).join(', ')}\n\n`;
  }

  // Add detailed crew members information
  if (data.crewMembers.length > 0) {
    context += `CREW MEMBERS:\n`;
    data.crewMembers.forEach((member: any) => {
      context += `- ${member.name}`;
      if (member.role) context += ` (${member.role})`;
      if (member.hourly_rate) context += ` - $${member.hourly_rate}/hr`;
      if (member.phone) context += ` - Phone: ${member.phone}`;
      if (member.email) context += ` - Email: ${member.email}`;
      if (member.notes) context += ` - Notes: ${member.notes}`;
      context += `\n`;
    });
    context += `\n`;
  }

  if (data.subcontractors.length > 0) {
    context += `SUBCONTRACTORS:\n`;
    data.subcontractors.forEach((subcontractor: any) => {
      context += `- ${subcontractor.name}`;
      if (subcontractor.specialty) context += ` (${subcontractor.specialty})`;
      if (subcontractor.contact_person) context += ` - Contact: ${subcontractor.contact_person}`;
      if (subcontractor.email || subcontractor.contact_email) {
        const email = subcontractor.email || subcontractor.contact_email;
        context += ` - Email: ${email}`;
      }
      if (subcontractor.phone || subcontractor.contact_phone) {
        const phone = subcontractor.phone || subcontractor.contact_phone;
        context += ` - Phone: ${phone}`;
      }
      if (subcontractor.address) context += ` - Address: ${subcontractor.address}`;
      if (subcontractor.license_number) context += ` - License: ${subcontractor.license_number}`;
      if (subcontractor.insurance_info) context += ` - Insurance: ${subcontractor.insurance_info}`;
      if (subcontractor.notes) context += ` - Notes: ${subcontractor.notes}`;
      if (subcontractor.is_active === false) context += ` - ⚠️ INACTIVE`;
      context += `\n`;
    });
    context += `\n`;
  }

  // Add action items information with comprehensive timeline analysis
  if (data.actionItemsWithDetails.length > 0) {
    context += `CURRENT ACTION ITEMS WITH COMPLETE HISTORY:\n`;

    // Create a comprehensive analysis of action items with their full timeline
    const enrichedItems = data.actionItemsWithDetails.map((item: any) => {
      // Sort notes chronologically to understand progression
      const sortedNotes = (item.action_item_notes || []).sort((a: any, b: any) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      // Analyze the timeline and current status
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

      return { ...item, timeline, sortedNotes };
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
        context += `  Project: ${item.projects?.name || 'No Project'}\n`;
        context += `  Due: ${item.due_date} (${Math.floor((Date.now() - new Date(item.due_date).getTime()) / (1000 * 60 * 60 * 24))} days overdue)\n`;
        context += `  Assigned: ${item.assigned_to || 'Unassigned'}\n`;
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
        context += `  Project: ${item.projects?.name || 'No Project'}\n`;
        if (item.due_date) {
          const daysUntilDue = Math.floor((new Date(item.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          context += `  Due: ${item.due_date} (${daysUntilDue > 0 ? `${daysUntilDue} days remaining` : `${Math.abs(daysUntilDue)} days overdue`})\n`;
        }
        context += `  Assigned: ${item.assigned_to || 'Unassigned'}\n`;
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
        context += `  Project: ${item.projects?.name || 'No Project'}\n`;
        if (item.due_date) {
          const daysUntilDue = Math.floor((new Date(item.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          context += `  Due: ${item.due_date} (${daysUntilDue > 0 ? `${daysUntilDue} days remaining` : `${Math.abs(daysUntilDue)} days overdue`})\n`;
        }
        context += `  Assigned: ${item.assigned_to || 'Unassigned'}\n`;
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
    switch (actionType) {
      case 'update_action_item_status':
        return await updateActionItemStatus(actionData.id, actionData.status, actionData.note, actionData.user);

      case 'add_action_item_note':
        return await addActionItemNote(actionData.id, actionData.note, actionData.user);

      case 'create_action_item':
        return await createActionItem(actionData);

      case 'update_action_item_priority':
        return await updateActionItemPriority(actionData.id, actionData.priority, actionData.user);

      case 'assign_action_item':
        return await assignActionItem(actionData.id, actionData.assignedTo, actionData.user);

      case 'update_action_item_due_date':
        return await updateActionItemDueDate(actionData.id, actionData.dueDate, actionData.user);

      default:
        throw new Error(`Unknown action type: ${actionType}`);
    }
  } catch (error) {
    console.error(`Error executing action ${actionType}:`, error);
    throw error;
  }
}

async function updateActionItemStatus(id: string, status: string, note?: string, user?: string) {
  const updateData: any = {
    status,
    updated_at: new Date().toISOString()
  };

  if (status === 'completed') {
    updateData.completed_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('action_items')
    .update(updateData)
    .eq('id', id)
    .select();

  if (error) throw error;

  // Add a note about the status change
  if (note) {
    await addActionItemNote(id, note, user || 'AI Assistant');
  } else {
    await addActionItemNote(id, `Status updated to ${status}`, user || 'AI Assistant');
  }

  return { success: true, data, message: `Action item status updated to ${status}` };
}

async function addActionItemNote(id: string, note: string, user: string = 'AI Assistant') {
  const { data, error } = await supabase
    .from('action_item_notes')
    .insert([{
      action_item_id: id,
      note,
      created_by: user,
      created_at: new Date().toISOString()
    }])
    .select();

  if (error) throw error;
  return { success: true, data, message: 'Note added successfully' };
}

async function createActionItem(actionData: any) {
  const { data, error } = await supabase
    .from('action_items')
    .insert([{
      title: actionData.title,
      description: actionData.description,
      priority: actionData.priority || 'medium',
      status: 'open',
      assigned_to: actionData.assignedTo,
      due_date: actionData.dueDate,
      project_id: actionData.projectId,
      daily_log_id: actionData.dailyLogId,
      source: actionData.source || 'ai_assistant',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }])
    .select();

  if (error) throw error;

  // Add initial note if provided
  if (actionData.initialNote) {
    await addActionItemNote(data[0].id, actionData.initialNote, actionData.user || 'AI Assistant');
  }

  return { success: true, data, message: 'Action item created successfully' };
}

async function updateActionItemPriority(id: string, priority: string, user?: string) {
  const { data, error } = await supabase
    .from('action_items')
    .update({
      priority,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select();

  if (error) throw error;

  await addActionItemNote(id, `Priority updated to ${priority}`, user || 'AI Assistant');
  return { success: true, data, message: `Action item priority updated to ${priority}` };
}

async function assignActionItem(id: string, assignedTo: string, user?: string) {
  const { data, error } = await supabase
    .from('action_items')
    .update({
      assigned_to: assignedTo,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select();

  if (error) throw error;

  await addActionItemNote(id, `Assigned to ${assignedTo}`, user || 'AI Assistant');
  return { success: true, data, message: `Action item assigned to ${assignedTo}` };
}

async function updateActionItemDueDate(id: string, dueDate: string, user?: string) {
  const { data, error } = await supabase
    .from('action_items')
    .update({
      due_date: dueDate,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select();

  if (error) throw error;

  const formattedDate = new Date(dueDate).toLocaleDateString();
  await addActionItemNote(id, `Due date updated to ${formattedDate}`, user || 'AI Assistant');
  return { success: true, data, message: `Action item due date updated to ${formattedDate}` };
}

// ...existing fetchConstructionData function...

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

🔧 **DATABASE ACTION CAPABILITIES**: 
You can now perform database actions when users request changes. When a user asks you to update something in the database, you should:

1. **Explain what you're going to do** in your response
2. **Use the available action types** to make the change:
   - update_action_item_status: Change status (open, in_progress, completed, cancelled)
   - add_action_item_note: Add progress notes
   - update_action_item_priority: Change priority (low, medium, high, urgent)
   - assign_action_item: Assign to someone
   - update_action_item_due_date: Set or change due date

3. **Reference the specific action item ID** from the data above
4. **Confirm the action** was successful

Example user requests you can handle:
- "Mark action item #123 as completed"
- "Change the priority of the drywall order to urgent"
- "Add a note to action item #456 saying the materials arrived"
- "Assign the electrical work to John Smith"
- "Set the due date for action item #789 to next Friday"

When making changes, always include relevant context and explain what was changed.

CRITICAL ANALYSIS INSTRUCTIONS:

1. **TIMESTAMP ANALYSIS**: Always analyze timestamps chronologically when discussing action items:
   - Look at creation dates, update dates, completion dates, and note timestamps
   - Consider the progression of notes over time to understand current status
   - Identify items that haven't been updated recently (potential stalled items)
   - Note when status changes occurred based on timestamp patterns

2. **ACTION ITEM STATUS INTELLIGENCE**: 
   - An item marked "completed" with recent completion timestamps IS completed
   - If you see notes about rescheduling or status changes, use the MOST RECENT information
   - Pay attention to note progression: earlier notes may be outdated by newer updates
   - Look for contradictions between status fields and recent notes

3. **TEMPORAL CONTEXT**: When answering questions:
   - Always reference the most recent and relevant information based on timestamps
   - If an item was updated after the question timeframe, mention the current status
   - Distinguish between what was true historically vs. what is current
   - Flag items that may need attention based on lack of recent updates

SPECIFIC EXAMPLE FROM YOUR DATA:
- If someone asks "is there drywall that needs to be ordered?" look at:
  1. The action item status field (completed/open/in_progress)
  2. The completion timestamp (when was it marked complete?)
  3. The most recent notes (what's the latest update?)
  4. Any notes about delivery dates or status changes

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

CREW MEMBER DETAILS:
You have access to detailed crew member information including names, roles, hourly rates, contact information, and notes. You can answer questions about:
- Who works for the company and their roles
- How much specific crew members get paid
- Contact information for crew members
- Crew member skills and specialties
- Availability and scheduling

SUBCONTRACTOR DETAILS:
You have complete access to subcontractor information including contact details, specialties, and business information. You can:
- Draft professional emails to specific subcontractors using their correct email addresses
- Reference their contact person names, phone numbers, and specialties
- Include their license numbers and insurance information when relevant
- Access their addresses for scheduling and logistics
- Use their notes and historical information for context
- Filter by active/inactive status

When drafting emails or communications:
- Always use the specific contact person's name if available
- Include the correct email address from the database
- Reference their specialty or area of expertise
- Be professional and include relevant project context
- Use their preferred contact methods (email/phone) as indicated in their records

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
      max_tokens: 1000,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content;
    const responseTime = Date.now() - startTime;

    if (!response) {
      return NextResponse.json(
        { error: 'No response generated' },
        { status: 500 }
      );
    }

    // Check for and execute actions in the response
    let actionResult = null;
    let finalResponse = response;

    try {
      // Look for action JSON in the response
      const actionMatch = response.match(/\{"action":\s*\{[^}]+\}\}/);
      if (actionMatch) {
        const actionJson = JSON.parse(actionMatch[0]);
        const { actionType, actionData } = actionJson.action;

        console.log('Executing action:', actionType, actionData);
        actionResult = await executeAction(actionType, actionData);

        // Update the response to include action confirmation
        finalResponse = response.replace(actionMatch[0], '') +
          `\n\n✅ **Action Completed**: ${actionResult.message}`;
      }
    } catch (actionError) {
      console.error('Error executing action:', actionError);
      finalResponse = response +
        `\n\n❌ **Action Failed**: ${actionError instanceof Error ? actionError.message : 'Unknown error occurred'}`;
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
