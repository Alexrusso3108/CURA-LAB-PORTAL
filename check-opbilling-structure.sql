-- =====================================================
-- CHECK OPBILLING TABLE STRUCTURE
-- Run this FIRST to see what columns exist
-- =====================================================

-- 1. Check all columns in opbilling table
SELECT 
    column_name, 
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'opbilling'
ORDER BY ordinal_position;

-- 2. Check primary key
SELECT 
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'opbilling' 
    AND tc.constraint_type = 'PRIMARY KEY';

-- 3. Show sample data
SELECT * FROM opbilling LIMIT 3;
