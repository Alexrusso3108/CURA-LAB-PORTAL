-- =====================================================
-- SIMPLIFIED DIAGNOSTIC SCRIPT
-- Run each query separately to avoid errors
-- =====================================================

-- QUERY 1: Check opbilling columns
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'opbilling'
ORDER BY ordinal_position;

-- QUERY 2: Sample opbilling data
SELECT 
    opbill_id,
    patient_mrno,
    appointment_id,
    service_name
FROM opbilling 
LIMIT 5;

-- QUERY 3: Check appointments columns
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'appointments'
ORDER BY ordinal_position;

-- QUERY 4: Sample appointments data
SELECT 
    appointment_id,
    mrno,
    patient_name,
    created_at
FROM appointments 
ORDER BY created_at DESC
LIMIT 5;

-- QUERY 5: Check users columns
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- QUERY 6: Sample users data (using * to avoid column errors)
SELECT * 
FROM users 
LIMIT 5;

-- QUERY 7: Join opbilling with appointments
SELECT 
    ob.opbill_id,
    ob.patient_mrno,
    ob.appointment_id,
    ob.service_name,
    a.patient_name as from_appointments,
    a.mrno as appointment_mrno
FROM opbilling ob
LEFT JOIN appointments a ON a.appointment_id = ob.appointment_id OR a.mrno = ob.patient_mrno
LIMIT 5;

-- QUERY 8: Join opbilling with users (safe version)
SELECT 
    ob.opbill_id,
    ob.patient_mrno,
    ob.service_name,
    u.*
FROM opbilling ob
LEFT JOIN users u ON u.mrno = ob.patient_mrno
LIMIT 5;

-- QUERY 9A: Check specific MRNO in appointments
SELECT 
    'Found in appointments' as location,
    *
FROM appointments
WHERE mrno = '9d2f16e9-848d-4cc2-bf59-07b6e4805c2c'
LIMIT 1;

-- QUERY 9B: Check specific MRNO in users
SELECT 
    'Found in users' as location,
    *
FROM users
WHERE mrno = '9d2f16e9-848d-4cc2-bf59-07b6e4805c2c'
LIMIT 1;

-- =====================================================
-- INSTRUCTIONS:
-- 1. Run each query ONE AT A TIME in Supabase SQL Editor
-- 2. Copy the results for each query
-- 3. Share the results to help diagnose the issue
-- =====================================================
