-- =====================================================
-- FIND PATIENT DATA - Check appointments and users tables
-- =====================================================

-- 1. Check appointments table (note: plural!)
SELECT * FROM appointments 
WHERE id = '0ba15a4a-d487-4094-8989-12cf0f77a041'
LIMIT 1;

-- 2. Check users table (might have patient info)
SELECT * FROM users 
WHERE id = '56c1d48e-a4b3-47da-9d9f-79bc29cb5683'
LIMIT 1;

-- 3. Alternative: Check by mrno if users table has it
SELECT * FROM users 
WHERE mrno = '56c1d48e-a4b3-47da-9d9f-79bc29cb5683'
LIMIT 1;

-- 4. Check what columns appointments table has
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'appointments'
ORDER BY ordinal_position;

-- 5. Check what columns users table has
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'users'
ORDER BY ordinal_position;
