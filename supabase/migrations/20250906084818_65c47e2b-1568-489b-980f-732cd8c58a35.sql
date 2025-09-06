-- Update leave types: remove emergency and personal, add Others if not exists
UPDATE leave_types SET name = 'Vacation' WHERE name = 'Annual Leave' OR name = 'Vacation';
UPDATE leave_types SET name = 'Sick Leave' WHERE name = 'Sick';
DELETE FROM leave_types WHERE name IN ('Emergency', 'Personal', 'Emergency Leave', 'Personal Leave');

-- Add Others leave type if it doesn't exist
INSERT INTO leave_types (name, max_days_per_year, description)
SELECT 'Others', 5, 'Other types of leave'
WHERE NOT EXISTS (SELECT 1 FROM leave_types WHERE name = 'Others');