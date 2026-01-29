-- =====================================================
-- FIND PATIENT NAME - Check appointment and patient tables
-- =====================================================

-- 1. Check if appointment table has patient info
SELECT * FROM appointment 
WHERE id = '0ba15a4a-d487-4094-8989-12cf0f77a041'
LIMIT 1;

-- 2. Check if there's a patients table
SELECT * FROM patients 
WHERE mrno = '56c1d48e-a4b3-47da-9d9f-79bc29cb5683'
LIMIT 1;

-- 3. Alternative: Check patient_master or patient_registration
SELECT * FROM patient_master 
WHERE mrno = '56c1d48e-a4b3-47da-9d9f-79bc29cb5683'
LIMIT 1;

-- 4. Alternative: Check opregistration
SELECT * FROM opregistration 
WHERE patient_mrno = '56c1d48e-a4b3-47da-9d9f-79bc29cb5683'
LIMIT 1;

-- 5. List all tables to see what exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
