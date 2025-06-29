#!/usr/bin/env node

console.log('=== AI Action Item Note Addition - End-to-End Test ===\n');

// Simulate the AI's complete process
console.log('1. User Request: "Add a note to the RFI fire penetration action item saying the architect was contacted"');

console.log('\n2. AI Process:');
console.log('   - AI looks up action items in context');
console.log('   - AI finds: "RFI fire penetration for architect" with ID: ff271d8b-b6dc-4b3b-a94f-bc8c128379cd');
console.log('   - AI generates response with embedded action JSON');

console.log('\n3. AI Response:');
const aiResponse = `I'll add a note to the "RFI fire penetration for architect" action item about contacting the architect.

{"action":{"type":"add_action_item_note","data":{"actionItemId":"ff271d8b-b6dc-4b3b-a94f-bc8c128379cd","note":"Contacted architect office today regarding fire penetration details. Waiting for their response, should have an answer by Friday."}}}`;

console.log(aiResponse);

console.log('\n4. Action Execution Test:');

const { execSync } = require('child_process');

// Extract the JSON from the AI response
const jsonMatch = aiResponse.match(/\{"action":\s*\{[\s\S]*?\}\}/);
if (jsonMatch) {
  console.log('   - Found action JSON:', jsonMatch[0]);
  
  try {
    const actionJson = JSON.parse(jsonMatch[0]);
    console.log('   - Parsed successfully:', JSON.stringify(actionJson, null, 4));
    
    // Test the action execution
    const result = execSync(`curl -s "http://localhost:3000/api/ai-actions" -X POST -H "Content-Type: application/json" -d '${jsonMatch[0]}'`, { encoding: 'utf8' });
    
    console.log('\n5. Backend Execution Result:');
    const response = JSON.parse(result);
    
    if (response.success) {
      console.log('✅ SUCCESS: Note added successfully!');
      console.log('   - Message:', response.message);
      console.log('   - Note ID:', response.data[0].id);
      console.log('   - Note Text:', response.data[0].note);
      console.log('   - Created By:', response.data[0].created_by);
      console.log('   - Created At:', response.data[0].created_at);
    } else {
      console.log('❌ FAILED:', response.error);
    }
    
  } catch (error) {
    console.log('❌ JSON parsing or execution failed:', error.message);
  }
} else {
  console.log('❌ No action JSON found in AI response');
}

console.log('\n=== Test Complete ===');
