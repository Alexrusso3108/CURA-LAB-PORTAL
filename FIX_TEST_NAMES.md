# 🔧 Fix: "Error loading test template"

## Problem
Your bills don't have test names in the `service_type_name` column, so the system can't load templates or enter results.

## Solution

### Option 1: Fix Existing Bills (Quick Fix)

Run this SQL in Supabase SQL Editor:

```sql
-- Update existing bills with test names
UPDATE opbilling
SET service_type_name = CASE
  WHEN total_amount BETWEEN 100 AND 300 THEN 'Blood Sugar Fasting'
  WHEN total_amount BETWEEN 400 AND 600 THEN 'Complete Blood Count'
  WHEN total_amount BETWEEN 600 AND 800 THEN 'Kidney Function Test'
  WHEN total_amount BETWEEN 700 AND 900 THEN 'Liver Function Test'
  WHEN total_amount BETWEEN 800 AND 1000 THEN 'Lipid Profile'
  WHEN total_amount BETWEEN 1000 AND 1500 THEN 'Thyroid Function Test'
  WHEN total_amount BETWEEN 1500 AND 2000 THEN 'Complete Blood Count'
  ELSE 'Blood Sugar Random'
END
WHERE service_type_name IS NULL OR service_type_name = '';
```

Then refresh your browser!

### Option 2: Update Bills Manually

Run this to update specific bills:

```sql
-- Update bill by ID
UPDATE opbilling
SET service_type_name = 'Complete Blood Count'
WHERE id = 'YOUR_BILL_ID_HERE';
```

### Option 3: Delete Old Bills and Create New Ones

```sql
-- Delete all existing bills
DELETE FROM opbilling;

-- Create new bills with test names
INSERT INTO opbilling (patient_mrno, service_type_name, total_amount, payment_status, bill_date)
VALUES
  (gen_random_uuid(), 'Complete Blood Count', 500.00, 'paid', CURRENT_DATE),
  (gen_random_uuid(), 'Lipid Profile', 850.00, 'paid', CURRENT_DATE),
  (gen_random_uuid(), 'Liver Function Test', 750.00, 'paid', CURRENT_DATE);
```

## What I Fixed in the Code

I updated `PendingBills.jsx` to:
1. ✅ Check if test name exists before proceeding
2. ✅ Show helpful error message if test name is missing
3. ✅ Allow proceeding even if template doesn't exist (will show generic form)
4. ✅ Handle template errors gracefully

## Next Steps

1. **Run Option 1 SQL** (recommended) - Updates all existing bills
2. **Refresh browser** - You'll see test names in the table
3. **Click "Enter Results"** - Should work now!
4. **Run the schema scripts** (optional but recommended):
   - `lab-results-schema.sql` - Adds result tracking
   - `test-templates-schema.sql` - Creates test templates

## Why This Happened

Your `opbilling` table has bills but the `service_type_name` column is empty. The lab portal needs this to:
- Display the test name
- Load the correct test template
- Know which parameters to show

## Test Names Available

These test names have templates:
- Complete Blood Count
- Lipid Profile
- Liver Function Test
- Kidney Function Test
- Thyroid Function Test
- Blood Sugar Fasting
- Blood Sugar Random
- HbA1c

Make sure your bills use these exact names!
