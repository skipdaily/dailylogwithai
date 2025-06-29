// Test action execution directly
const action = {
  actionType: "update_action_item_status",
  actionData: {
    id: "d62c88db-f8ba-4fc9-b053-49cafb8d05ed",
    status: "open", 
    user: "Test User"
  }
};

console.log('Testing action execution...');
console.log('Action JSON format:', JSON.stringify(action, null, 2));

// Test JSON format that AI would generate
const aiJsonFormat = JSON.stringify({
  action: action
});

console.log('\nAI JSON format:', aiJsonFormat);
console.log('\nJSON parse test:');

try {
  const parsed = JSON.parse(aiJsonFormat);
  console.log('Successfully parsed:', parsed);
  console.log('Action type:', parsed.action.actionType);
  console.log('Action data:', parsed.action.actionData);
} catch (error) {
  console.error('Parse error:', error);
}
