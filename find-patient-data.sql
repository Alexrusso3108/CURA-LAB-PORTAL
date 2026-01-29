-- =====================================================
-- DATABASE EXPLORATION - Find Patient Data
-- Run these queries in Supabase SQL Editor
-- =====================================================

-- 1. List ALL tables in your database
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Find tables that might contain patient data
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
AND (
  table_name ILIKE '%patient%' 
  OR table_name ILIKE '%person%'
  OR table_name ILIKE '%user%'
  OR table_name ILIKE '%client%'
  OR table_name ILIKE '%member%'
)
ORDER BY table_name;

-- 3. Search for columns with 'name' in any table
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_schema = 'public'
AND (
  column_name ILIKE '%name%'
  OR column_name ILIKE '%age%'
  OR column_name ILIKE '%gender%'
  OR column_name ILIKE '%dob%'
  OR column_name ILIKE '%birth%'
)
ORDER BY table_name, column_name;

-- 4. Show structure of opbilling table (we know this exists)
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'opbilling'
ORDER BY ordinal_position;

-- 5. Check if there's an appointment table (might have patient info)
SELECT 
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'appointment'
ORDER BY ordinal_position;

-- 6. Look for any table with 'mrno' column (patient identifier)
SELECT DISTINCT
  table_name,
  column_name
FROM information_schema.columns 
WHERE table_schema = 'public'
AND column_name ILIKE '%mrno%'
ORDER BY table_name;

-- 7. Sample data from opbilling to see what's available
SELECT 
  opbill_id,
  patient_mrno,
  service_name,
  *
FROM opbilling 
LIMIT 3;

-- =====================================================
-- INSTRUCTIONS:
-- 1. Run queries 1-6 to explore your database
-- 2. Look at the results to find which table has patient names
-- 3. Share the table name and column names with me
-- 4. I'll update the code to fetch from the correct table
-- =====================================================
