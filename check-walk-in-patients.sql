-- Check walk_in_patients table for patient data
SELECT * FROM walk_in_patients 
WHERE mrno = '9d2f16e9-848d-4cc2-bf59-07b6e4805c2c'
OR id = '9d2f16e9-848d-4cc2-bf59-07b6e4805c2c'
LIMIT 5;

-- Check what columns walk_in_patients has
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'walk_in_patients'
ORDER BY ordinal_position;
