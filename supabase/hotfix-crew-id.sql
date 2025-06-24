-- HOTFIX: Make crew_id optional in crew_members table
-- Run this immediately to fix the "crew_id violates not-null constraint" error

ALTER TABLE crew_members ALTER COLUMN crew_id DROP NOT NULL;

-- This allows crew members to exist without being assigned to a specific crew
-- which matches your UI that shows "No crew assigned" option
