#!/usr/bin/env node

const { execSync } = require('child_process');

// Test the corrected action format
console.log('Testing corrected AI action format...\n');

const testAction = {
  action: {
    type: "add_action_item_note",
    data: {
      actionItemId: "ff271d8b-b6dc-4b3b-a94f-bc8c128379cd",
      note: "Test note - corrected action format verification"
    }
  }
};

console.log('Testing action format:', JSON.stringify(testAction, null, 2));

try {
  const result = execSync(`curl -s "http://localhost:3000/api/ai-actions" -X POST -H "Content-Type: application/json" -d '${JSON.stringify(testAction)}'`, { encoding: 'utf8' });
  console.log('\nBackend response:', result);
  
  // Check if it was successful
  const response = JSON.parse(result);
  if (response.success) {
    console.log('✅ Action format test PASSED');
  } else {
    console.log('❌ Action format test FAILED:', response.error);
  }
} catch (error) {
  console.error('❌ Test failed:', error.message);
}
