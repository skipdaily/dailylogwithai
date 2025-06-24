const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectDatabase() {
  console.log('🔍 Inspecting your Supabase database...\n');

  // Get all tables by trying to query each expected table
  const tables = ['projects', 'crews', 'crew_members', 'subcontractors', 'daily_logs', 'log_sections', 'log_crews', 'log_subcontractors'];
  
  for (const table of tables) {
    console.log(`📋 Table: ${table}`);
    try {
      // Get a sample row to see the structure
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`   ❌ Error: ${error.message}`);
      } else {
        if (data && data.length > 0) {
          console.log(`   ✅ Exists with columns: ${Object.keys(data[0]).join(', ')}`);
          console.log(`   📊 Sample data:`, data[0]);
        } else {
          console.log(`   ✅ Exists but no data`);
        }
      }
    } catch (err) {
      console.log(`   ❌ Failed to query: ${err.message}`);
    }
    console.log('');
  }

  // Try to get total counts
  console.log('📊 Record counts:');
  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (!error) {
        console.log(`   ${table}: ${count} records`);
      }
    } catch (err) {
      // Ignore errors for count
    }
  }
}

inspectDatabase()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
