-- Clean up stale pending invitation for yuengigi@yahoo.com who already joined
UPDATE employee_invitations 
SET status = 'accepted', 
    accepted_at = NOW(), 
    accepted_by = 'e49fc6b7-cf78-4992-8694-ddd90f9ac3b0'
WHERE id = '822a48a5-4ea5-4b3c-af42-d33aeb3ca95d' 
AND status = 'pending';

-- Also clean up the expired one
UPDATE employee_invitations 
SET status = 'expired'
WHERE id = 'f5c2093b-2f05-4f89-b29a-824b07557801' 
AND status = 'pending';