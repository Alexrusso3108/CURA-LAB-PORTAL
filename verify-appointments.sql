-- Check if appointment exists for this patient
SELECT 
  appointment_id,
  mrno,
  patient_name,
  patient_phone,
  date,
  time,
  status,
  created_at
FROM appointments 
WHERE mrno = '9d2f16e9-848d-4cc2-bf59-07b6e4805c2c'
ORDER BY created_at DESC
LIMIT 10;

-- Also check total count
SELECT COUNT(*) as total_appointments
FROM appointments 
WHERE mrno = '9d2f16e9-848d-4cc2-bf59-07b6e4805c2c';

-- Check if there are ANY appointments at all
SELECT COUNT(*) as total_appointments_in_table
FROM appointments;

-- Show a few sample appointments to see the data format
SELECT 
  appointment_id,
  mrno,
  patient_name,
  created_at
FROM appointments 
ORDER BY created_at DESC
LIMIT 5;
