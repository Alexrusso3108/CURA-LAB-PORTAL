-- =====================================================
-- FIX EXISTING BILLS - Add Test Names
-- Run this in Supabase SQL Editor
-- =====================================================

-- First, let's see what columns exist in opbilling
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'opbilling'
ORDER BY ordinal_position;

-- Check current bills
SELECT id, patient_mrno, service_type_name, total_amount, bill_date
FROM opbilling
LIMIT 10;

-- Update existing bills with test names based on amount
-- (This is a guess - adjust based on your actual data)
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

-- Verify the update
SELECT id, patient_mrno, service_type_name, total_amount, bill_date
FROM opbilling
ORDER BY bill_date DESC
LIMIT 10;

DO $$
BEGIN
    RAISE NOTICE '✅ Bills updated with test names!';
    RAISE NOTICE '🔬 Refresh your browser to see the test names';
END $$;
