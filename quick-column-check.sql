-- Quick check for actual columns that exist
-- Run this to see what we can actually query

-- 1. Appointments table columns
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'appointments'
ORDER BY ordinal_position;

-- 2. Users table columns
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- 3. Walk-in patients table columns
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'walk_in_patients'
ORDER BY ordinal_position;

-- 4. Sample data from appointments
SELECT * FROM appointments LIMIT 2;

-- 5. Sample data from users
SELECT * FROM users LIMIT 2;

-- 6. Sample data from walk_in_patients (if exists)
SELECT * FROM walk_in_patients LIMIT 2;
