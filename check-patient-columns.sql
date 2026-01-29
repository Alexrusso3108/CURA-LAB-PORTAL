-- Check what patient-related columns exist in opbilling
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'opbilling' 
AND column_name LIKE '%patient%' OR column_name LIKE '%name%' OR column_name LIKE '%age%' OR column_name LIKE '%gender%'
ORDER BY ordinal_position;

-- Show sample data to see what's available
SELECT 
  opbill_id,
  patient_mrno,
  -- Add any patient-related columns here
  *
FROM opbilling 
LIMIT 3;
