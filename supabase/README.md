# Supabase Schema Management

This folder contains all the SQL files needed to manage your Daily Logs application database schema.

## Files Overview

### 1. `current-schema.sql`
- **Purpose**: Represents your current database structure
- **When to use**: Reference file to understand what exists in your database
- **Contains**: All tables, indexes, and policies that currently exist

### 2. `migration-add-missing-fields.sql`
- **Purpose**: Safe migration that adds only the missing fields needed by the app
- **When to use**: Run this to upgrade your current database
- **Features**: 
  - Only adds columns if they don't exist
  - Renames existing columns to match app expectations
  - Adds new tables needed by the app
  - Safe to run multiple times

### 3. `target-schema.sql`
- **Purpose**: Complete schema showing the final desired state
- **When to use**: Reference for understanding the complete database structure
- **Contains**: All tables with all fields after migration is complete

### 4. `sample-data.sql`
- **Purpose**: Inserts test data for development and testing
- **When to use**: After running migrations, use this to populate test data
- **Contains**: Sample projects, crews, subcontractors, and daily logs

## How to Apply the Schema Updates

### Step 1: Run the Migration (REQUIRED)
Copy and paste the contents of `migration-add-missing-fields.sql` into your Supabase SQL Editor and run it.

This will:
- Add missing columns to existing tables
- Rename columns to match app expectations
- Create new tables (log_photos, equipment, log_equipment)
- Add necessary indexes and RLS policies
- Set default values for existing records

### Step 2: Add Sample Data (OPTIONAL)
If you want test data for development, copy and paste the contents of `sample-data.sql` into your Supabase SQL Editor and run it.

## Key Changes Made

### Projects Table
- Added: `description`, `status`
- Status field has check constraint: 'active', 'completed', 'on_hold'

### Crew Members Table
- Added: `phone`, `email`, `hourly_rate`, `notes`, `is_active`
- `is_active` defaults to `true`

### Subcontractors Table
- Renamed: `contact_name` → `contact_person`
- Renamed: `contact_phone` → `phone` 
- Renamed: `contact_email` → `email`
- Added: `address`, `specialty`, `notes`, `is_active`

### Daily Logs Table
- Added: `weather`, `temperature`

### New Tables
- `log_photos`: For future photo upload functionality
- `equipment`: Equipment tracking
- `log_equipment`: Links equipment usage to daily logs

## Database Relationship Summary

```
projects (1) ←→ (many) daily_logs
daily_logs (1) ←→ (many) log_sections
daily_logs (many) ←→ (many) crews (via log_crews)
daily_logs (many) ←→ (many) subcontractors (via log_subcontractors)
daily_logs (many) ←→ (many) equipment (via log_equipment)
crews (1) ←→ (many) crew_members
daily_logs (1) ←→ (many) log_photos
```

## Safety Notes

- All migrations use `IF NOT EXISTS` checks
- Column renames only happen if the target column doesn't exist
- Safe to run multiple times without errors
- No data loss - only additions and safe renames

## After Migration

Your app should now work perfectly with all features:
- ✅ Project management
- ✅ Daily log creation and editing
- ✅ Crew member management
- ✅ Contractor/subcontractor management
- ✅ All form fields will save to database
- ✅ All data properly loads from database

## Troubleshooting

If you encounter any issues:

1. **"column already exists" errors**: The migration script should prevent these, but if they occur, the operation will continue safely.

2. **"relation already exists" errors**: Normal and expected - the script will skip creating tables that already exist.

3. **Permission errors**: Make sure you're running the SQL as a database admin in Supabase.

4. **App not finding data**: Make sure RLS policies are applied correctly (they should be automatic with the migration).

## Future Schema Changes

When adding new features:
1. Update the target schema
2. Create a new migration file
3. Test the migration on a copy of your data
4. Apply to production
5. Update this README
