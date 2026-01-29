-- Check what columns appointments table has
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'appointments'
ORDER BY ordinal_position;
