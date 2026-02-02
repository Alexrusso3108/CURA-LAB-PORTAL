-- =====================================================
-- SAFE DIAGNOSTIC SCRIPT - Step by Step
-- Run each query separately
-- =====================================================

-- STEP 1: What columns exist in users table?
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- STEP 2: What columns exist in appointments table?
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'appointments'
ORDER BY ordinal_position;

-- STEP 3: What columns exist in opbilling table?
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'opbilling'
ORDER BY ordinal_position;

-- STEP 4: Sample users data (using only * to avoid column errors)
SELECT * FROM users LIMIT 3;

-- STEP 5: Sample appointments data
SELECT * FROM appointments LIMIT 3;

-- STEP 6: Sample opbilling data
SELECT * FROM opbilling LIMIT 3;

-- STEP 7: Try to find patient by MRNO in appointments
SELECT * 
FROM appointments
WHERE mrno = '9d2f16e9-848d-4cc2-bf59-07b6e4805c2c'
LIMIT 1;

-- STEP 8: Try to find patient by MRNO in users
SELECT * 
FROM users
WHERE mrno = '9d2f16e9-848d-4cc2-bf59-07b6e4805c2c'
LIMIT 1;

-- =====================================================
-- INSTRUCTIONS:
-- 1. Run STEP 1-3 first to see what columns exist
-- 2. Then run STEP 4-6 to see sample data
-- 3. Finally run STEP 7-8 to find your specific patient
-- 4. Share the results!
-- =====================================================
