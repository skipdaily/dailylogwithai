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
      .select();

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
    console.log('🎯 addActionItemNote called with:', { actionItemId, note, createdBy });
    
    // Validate inputs
    if (!actionItemId || !note || !createdBy) {
      const missingFields = [];
      if (!actionItemId) missingFields.push('actionItemId');
      if (!note) missingFields.push('note');
      if (!createdBy) missingFields.push('createdBy');
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    if (typeof actionItemId !== 'string' || actionItemId.trim().length === 0) {
      throw new Error(`Invalid actionItemId: must be a non-empty string, got: ${typeof actionItemId} "${actionItemId}"`);
    }

    if (typeof note !== 'string' || note.trim().length === 0) {
      throw new Error(`Invalid note: must be a non-empty string, got: ${typeof note} "${note}"`);
    }

    // Clean inputs
    const cleanActionItemId = actionItemId.trim();
    const cleanNote = note.trim();
    const cleanCreatedBy = createdBy.trim();
    
    console.log('🔍 Searching for action item with ID:', cleanActionItemId);
    
    // First verify the action item exists
    const { data: actionItem, error: actionItemError } = await supabase
      .from('action_items')
      .select('id, title, status, project_id')
      .eq('id', cleanActionItemId)
      .single();

    if (actionItemError) {
      console.error('❌ Error finding action item:', actionItemError);
      throw new Error(`Action item not found: ${actionItemError.message}`);
    }

    if (!actionItem) {
      console.error('❌ Action item returned null/undefined');
      throw new Error(`Action item with ID ${cleanActionItemId} does not exist`);
    }

    console.log('✅ Found action item:', actionItem);

    // Insert the note
    console.log('📝 Inserting note into action_item_notes table...');
    const { data, error } = await supabase
      .from('action_item_notes')
      .insert([{
        action_item_id: cleanActionItemId,
        note: cleanNote,
        created_by: cleanCreatedBy
      }])
      .select();

    if (error) {
      console.error('❌ Error inserting note:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      throw error;
    }

    console.log('✅ Successfully inserted note:', data);

    // Update the action item's updated_at timestamp
    console.log('🕒 Updating action item timestamp...');
    const { error: updateError } = await supabase
      .from('action_items')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', cleanActionItemId);

    if (updateError) {
      console.error('⚠️ Error updating action item timestamp (note was still added successfully):', updateError);
      // Don't throw here, the note was already added successfully
    } else {
      console.log('✅ Action item timestamp updated successfully');
    }

    const successMessage = `Note added to action item "${actionItem.title}" (Status: ${actionItem.status})`;
    console.log('🎉 addActionItemNote completed successfully:', successMessage);
    
    return { 
      success: true, 
      data, 
      message: successMessage,
      actionItem: {
        id: actionItem.id,
        title: actionItem.title,
        status: actionItem.status
      }
    };
  } catch (error: any) {
    console.error('💥 Error adding action item note:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
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
      .select();

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
      .select();

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
      .select();

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

async function createNewActionItem(title: string, description: string, projectId: string, sourceType: string = 'ai_assistant', priority: string = 'medium', assignedTo?: string, dueDate?: string, createdBy: string = 'AI Assistant') {
  try {
    const actionItemData: any = {
      title,
      description,
      source_type: sourceType,
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
      .select();

    if (error) throw error;

    return { success: true, data, message: `New action item created: ${title}` };
  } catch (error: any) {
    console.error('Error creating action item:', error);
    return { success: false, error: error.message };
  }
}

async function addActionItemAttachment(actionItemId: string, fileName: string, fileUrl: string, fileSize?: number, mimeType?: string, uploadedBy: string = 'AI Assistant') {
  try {
    const attachmentData: any = {
      action_item_id: actionItemId,
      file_name: fileName,
      file_url: fileUrl,
      uploaded_by: uploadedBy
    };

    if (fileSize) attachmentData.file_size = fileSize;
    if (mimeType) attachmentData.mime_type = mimeType;

    const { data, error } = await supabase
      .from('action_item_attachments')
      .insert([attachmentData])
      .select();

    if (error) throw error;

    return { success: true, data, message: `Attachment added to action item ${actionItemId}` };
  } catch (error: any) {
    console.error('Error adding action item attachment:', error);
    return { success: false, error: error.message };
  }
}

// Function to execute AI-requested database actions
export async function executeAIAction(action: any, userId: string) {
  try {
    console.log('🚀 executeAIAction called with:', { action, userId });
    
    const { type, data } = action;
    const updatedBy = userId || 'AI Assistant';

    if (!type) {
      throw new Error('Action type is required');
    }

    if (!data) {
      throw new Error('Action data is required');
    }

    console.log('📋 Action details:', { type, data, updatedBy });

    switch (type) {
      case 'update_action_item_status':
        console.log('🔄 Executing update_action_item_status');
        const statusActionItemId = data.actionItemId || data.id;
        if (!statusActionItemId) {
          throw new Error('Action item ID is required');
        }
        return await updateActionItemStatus(statusActionItemId, data.status, updatedBy, data.note);

      case 'add_action_item_note':
        console.log('📝 Executing add_action_item_note');
        const noteActionItemId = data.actionItemId || data.id;
        if (!noteActionItemId) {
          throw new Error('Action item ID is required');
        }
        return await addActionItemNote(noteActionItemId, data.note, updatedBy);

      case 'add_action_item_attachment':
        console.log('📎 Executing add_action_item_attachment');
        const attachmentActionItemId = data.actionItemId || data.id;
        if (!attachmentActionItemId) {
          throw new Error('Action item ID is required');
        }
        return await addActionItemAttachment(
          attachmentActionItemId,
          data.fileName,
          data.fileUrl,
          data.fileSize,
          data.mimeType,
          updatedBy
        );

      case 'update_action_item_priority':
        console.log('⭐ Executing update_action_item_priority');
        const priorityActionItemId = data.actionItemId || data.id;
        if (!priorityActionItemId) {
          throw new Error('Action item ID is required');
        }
        return await updateActionItemPriority(priorityActionItemId, data.priority, updatedBy);

      case 'assign_action_item':
        console.log('👤 Executing assign_action_item');
        const assignActionItemId = data.actionItemId || data.id;
        if (!assignActionItemId) {
          throw new Error('Action item ID is required');
        }
        return await assignActionItem(assignActionItemId, data.assignedTo, updatedBy);

      case 'update_action_item_due_date':
        console.log('📅 Executing update_action_item_due_date');
        const dueDateActionItemId = data.actionItemId || data.id;
        if (!dueDateActionItemId) {
          throw new Error('Action item ID is required');
        }
        return await updateActionItemDueDate(dueDateActionItemId, data.dueDate, updatedBy);

      case 'create_action_item':
        console.log('🆕 Executing create_action_item');
        return await createNewActionItem(
          data.title,
          data.description,
          data.projectId,
          data.sourceType || 'ai_assistant',
          data.priority,
          data.assignedTo,
          data.dueDate,
          updatedBy
        );

      default:
        const errorMsg = `Unknown action type: ${type}. Valid types are: update_action_item_status, add_action_item_note, add_action_item_attachment, update_action_item_priority, assign_action_item, update_action_item_due_date, create_action_item`;
        console.error('❌', errorMsg);
        return { success: false, error: errorMsg };
    }
  } catch (error: any) {
    console.error('💥 executeAIAction failed:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      action,
      userId
    });
    return { success: false, error: error.message };
  }
}

export async function POST(request: NextRequest) {
  console.log('🌐 AI Actions API endpoint called');
  
  try {
    const body = await request.json();
    console.log('📨 Request body:', body);
    
    const { action, userId } = body;

    if (!action) {
      console.error('❌ No action specified in request');
      return NextResponse.json(
        { error: 'No action specified' },
        { status: 400 }
      );
    }

    console.log('🎯 Processing action:', action);
    console.log('👤 User ID:', userId);

    const result = await executeAIAction(action, userId);
    
    console.log('✅ Action completed, result:', result);
    
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('💥 Error in AI actions route:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
