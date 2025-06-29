#!/usr/bin/env node

/**
 * Test script to demonstrate how the AI should format action commands
 * to add notes to action items.
 * 
 * This script simulates what the AI route should do:
 * 1. Parse a user request to add a note
 * 2. Find the correct action item ID from context
 * 3. Generate the proper JSON action format
 * 4. Call the backend to execute the action
 */

const actionItemsContext = [
  { id: 'f916cb93-4229-41e7-8ee5-f046365c75ed', title: 'Stucco / siding', status: 'open' },
  { id: '2626a95f-36c0-4824-8e96-0d1ba7ec38d4', title: 'gypcrete quote', status: 'in_progress' },
  { id: '947078ef-ad3a-4542-a7b2-a72909d00c55', title: 'Temp # fencing around the building', status: 'open' }
];

async function simulateAIRequest(userMessage) {
  console.log('🤖 AI Processing:', userMessage);
  
  // Step 1: Parse the user request
  const noteMatch = userMessage.match(/add.*note.*saying[:\s]+(.*)/i);
  const itemMatch = userMessage.match(/(stucco|siding|gypcrete|fencing)/i);
  
  if (!noteMatch || !itemMatch) {
    console.log('❌ Could not parse note request');
    return;
  }
  
  const noteText = noteMatch[1].replace(/["\s]+$/, ''); // Clean up the note text
  const itemKeyword = itemMatch[1].toLowerCase();
  
  // Step 2: Find the action item ID
  let targetItem = null;
  for (const item of actionItemsContext) {
    if (item.title.toLowerCase().includes(itemKeyword)) {
      targetItem = item;
      break;
    }
  }
  
  if (!targetItem) {
    console.log('❌ Could not find action item matching:', itemKeyword);
    return;
  }
  
  console.log('✅ Found target action item:', targetItem.title);
  
  // Step 3: Generate the action JSON (this is what the AI should output)
  const actionJSON = {
    action: {
      actionType: "add_action_item_note",
      actionData: {
        id: targetItem.id,
        note: noteText,
        user: "AI Assistant"
      }
    }
  };
  
  console.log('📝 Generated action JSON:', JSON.stringify(actionJSON, null, 2));
  
  // Step 4: Execute the action
  try {
    const response = await fetch('http://localhost:3000/api/ai-actions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: actionJSON.action,
        userId: 'AI_Test_Script'
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('🎉 Success:', result.message);
      console.log('📋 Note added to:', result.actionItem?.title);
    } else {
      console.log('❌ Failed:', result.error);
    }
    
  } catch (error) {
    console.log('💥 Network error:', error.message);
  }
}

// Test cases
const testRequests = [
  'Add a note to the Stucco / siding action item saying: Testing AI integration with improved backend',
  'Add a note to the gypcrete quote saying: Waiting for updated pricing',
  'Add a note to the fencing saying: Contractor confirmed for next week'
];

async function runTests() {
  console.log('🚀 Starting AI Note Addition Tests\n');
  
  for (let i = 0; i < testRequests.length; i++) {
    console.log(`\n--- Test ${i + 1} ---`);
    await simulateAIRequest(testRequests[i]);
  }
  
  console.log('\n✨ All tests completed!');
  console.log('\n📚 How to fix AI note addition:');
  console.log('1. The AI must generate JSON in exactly this format:');
  console.log('   {"action":{"actionType":"add_action_item_note","actionData":{"id":"uuid-here","note":"text-here","user":"AI Assistant"}}}');
  console.log('2. The AI must use the exact Internal ID from the context data');
  console.log('3. The AI must not show Internal IDs to users - only use them for backend operations');
  console.log('4. The JSON must be on a single line at the end of the AI response');
}

// Run the tests
runTests().catch(console.error);
