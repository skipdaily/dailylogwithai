import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// Database action functions for AI to perform operations
async function updateActionItemStatus(actionItemId: string, status: string, updatedBy: string, note?: string) {
  try {
    const validStatuses = ['open', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`);
    }

    // Update the action item
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
      .eq('id', actionItemId)
      .select()
      .single();

    if (error) throw error;

    // Add a note about the status change
    const noteText = note
      ? `Status changed to ${status}. ${note}`
      : `Status changed to ${status}`;

    await supabase
      .from('action_item_notes')
      .insert([{
        action_item_id: actionItemId,
        note: noteText,
        created_by: updatedBy
      }]);

    return { success: true, data, message: `Action item ${actionItemId} status updated to ${status}` };
  } catch (error: any) {
    console.error('Error updating action item status:', error);
    return { success: false, error: error.message };
  }
}

async function addActionItemNote(actionItemId: string, note: string, createdBy: string) {
  try {
    const { data, error } = await supabase
      .from('action_item_notes')
      .insert([{
        action_item_id: actionItemId,
        note,
        created_by: createdBy
      }])
      .select()
      .single();

    if (error) throw error;

    // Update the action item's updated_at timestamp
    await supabase
      .from('action_items')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', actionItemId);

    return { success: true, data, message: `Note added to action item ${actionItemId}` };
  } catch (error: any) {
    console.error('Error adding action item note:', error);
    return { success: false, error: error.message };
  }
}

async function updateActionItemPriority(actionItemId: string, priority: string, updatedBy: string) {
  try {
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    if (!validPriorities.includes(priority)) {
      throw new Error(`Invalid priority: ${priority}. Must be one of: ${validPriorities.join(', ')}`);
    }

    const { data, error } = await supabase
      .from('action_items')
      .update({
        priority,
        updated_at: new Date().toISOString()
      })
      .eq('id', actionItemId)
      .select()
      .single();

    if (error) throw error;

    // Add a note about the priority change
    await supabase
      .from('action_item_notes')
      .insert([{
        action_item_id: actionItemId,
        note: `Priority changed to ${priority}`,
        created_by: updatedBy
      }]);

    return { success: true, data, message: `Action item ${actionItemId} priority updated to ${priority}` };
  } catch (error: any) {
    console.error('Error updating action item priority:', error);
    return { success: false, error: error.message };
  }
}

async function assignActionItem(actionItemId: string, assignedTo: string, updatedBy: string) {
  try {
    const { data, error } = await supabase
      .from('action_items')
      .update({
        assigned_to: assignedTo,
        updated_at: new Date().toISOString()
      })
      .eq('id', actionItemId)
      .select()
      .single();

    if (error) throw error;

    // Add a note about the assignment
    await supabase
      .from('action_item_notes')
      .insert([{
        action_item_id: actionItemId,
        note: `Assigned to ${assignedTo}`,
        created_by: updatedBy
      }]);

    return { success: true, data, message: `Action item ${actionItemId} assigned to ${assignedTo}` };
  } catch (error: any) {
    console.error('Error assigning action item:', error);
    return { success: false, error: error.message };
  }
}

async function updateActionItemDueDate(actionItemId: string, dueDate: string, updatedBy: string) {
  try {
    const { data, error } = await supabase
      .from('action_items')
      .update({
        due_date: dueDate,
        updated_at: new Date().toISOString()
      })
      .eq('id', actionItemId)
      .select()
      .single();

    if (error) throw error;

    // Add a note about the due date change
    await supabase
      .from('action_item_notes')
      .insert([{
        action_item_id: actionItemId,
        note: `Due date updated to ${dueDate}`,
        created_by: updatedBy
      }]);

    return { success: true, data, message: `Action item ${actionItemId} due date updated to ${dueDate}` };
  } catch (error: any) {
    console.error('Error updating action item due date:', error);
    return { success: false, error: error.message };
  }
}

async function createNewActionItem(title: string, description: string, projectId: string, priority: string = 'medium', assignedTo?: string, dueDate?: string, createdBy: string = 'AI Assistant') {
  try {
    const actionItemData: any = {
      title,
      description,
      project_id: projectId,
      priority,
      status: 'open',
      created_by: createdBy
    };

    if (assignedTo) actionItemData.assigned_to = assignedTo;
    if (dueDate) actionItemData.due_date = dueDate;

    const { data, error } = await supabase
      .from('action_items')
      .insert([actionItemData])
      .select()
      .single();

    if (error) throw error;

    return { success: true, data, message: `New action item created: ${title}` };
  } catch (error: any) {
    console.error('Error creating action item:', error);
    return { success: false, error: error.message };
  }
}

// Function to execute AI-requested database actions
async function executeAIAction(action: any, userId: string) {
  const { type, data } = action;
  const updatedBy = userId || 'AI Assistant';

  switch (type) {
    case 'update_action_item_status':
      return await updateActionItemStatus(data.actionItemId, data.status, updatedBy, data.note);

    case 'add_action_item_note':
      return await addActionItemNote(data.actionItemId, data.note, updatedBy);

    case 'update_action_item_priority':
      return await updateActionItemPriority(data.actionItemId, data.priority, updatedBy);

    case 'assign_action_item':
      return await assignActionItem(data.actionItemId, data.assignedTo, updatedBy);

    case 'update_action_item_due_date':
      return await updateActionItemDueDate(data.actionItemId, data.dueDate, updatedBy);

    case 'create_action_item':
      return await createNewActionItem(
        data.title,
        data.description,
        data.projectId,
        data.priority,
        data.assignedTo,
        data.dueDate,
        updatedBy
      );

    default:
      return { success: false, error: `Unknown action type: ${type}` };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, userId } = await request.json();

    if (!action) {
      return NextResponse.json(
        { error: 'No action specified' },
        { status: 400 }
      );
    }

    const result = await executeAIAction(action, userId);
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Error in AI actions route:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
