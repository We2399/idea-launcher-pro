-- Update max_employees for all tiers according to new limits
-- Trial (free): 1 admin + 1 employee = max 1 employee
-- SE (mini in DB): 1 admin + 2-9 employees = max 9 employees  
-- SME: 1 admin + 10-50 employees = max 50 employees
-- Enterprise: 1 admin + 51-100 employees = max 100 employees

UPDATE organizations SET max_employees = 1 WHERE subscription_tier = 'free';
UPDATE organizations SET max_employees = 9 WHERE subscription_tier = 'mini';
UPDATE organizations SET max_employees = 50 WHERE subscription_tier = 'sme';
UPDATE organizations SET max_employees = 100 WHERE subscription_tier = 'enterprise';

-- Update subscription_pricing table with new pricing
DELETE FROM subscription_pricing;

INSERT INTO subscription_pricing (tier, min_employees, max_employees, monthly_price, currency, description, is_active)
VALUES 
  ('free', 0, 1, 0, 'USD', 'Trial plan: 1 admin + 1 employee', true),
  ('mini', 2, 9, 18, 'USD', 'Small Enterprise: 1 admin + 2-9 employees', true),
  ('sme', 10, 50, 58, 'USD', 'SME: 1 admin + 10-50 employees', true),
  ('enterprise', 51, 100, 98, 'USD', 'Enterprise: 1 admin + 51-100 employees', true);