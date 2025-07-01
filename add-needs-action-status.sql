-- Add 'needs_action' status to action_items table
-- This script will update the check constraint to include the new status

BEGIN;

-- Step 1: Drop the existing status check constraint (if it exists)
ALTER TABLE public.action_items 
DROP CONSTRAINT IF EXISTS action_items_status_check;

-- Step 2: Add new status check constraint with 'needs_action'
ALTER TABLE public.action_items 
ADD CONSTRAINT action_items_status_check 
CHECK (
  status = ANY (
    ARRAY[
      'open'::text,
      'needs_action'::text,
      'in_progress'::text,
      'completed'::text,
      'cancelled'::text
    ]
  )
);

-- Step 3: Verify the constraint was added successfully
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'action_items_status_check';

-- Step 4: Show current status distribution
SELECT 
  status, 
  COUNT(*) as count
FROM public.action_items 
GROUP BY status 
ORDER BY status;

COMMIT;

-- Note: After running this, you can update existing action items to 'needs_action' status if needed:
-- UPDATE public.action_items SET status = 'needs_action' WHERE [your conditions];
