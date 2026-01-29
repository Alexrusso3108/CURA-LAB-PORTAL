-- =====================================================
-- ADD SAMPLE BILLS FOR TESTING
-- Run this in Supabase SQL Editor to create test bills
-- =====================================================

-- Insert sample laboratory bills
INSERT INTO opbilling (
  patient_mrno,
  service_type_name,
  total_amount,
  tax_amount,
  payment_status,
  bill_date,
  payment_method
)
VALUES
  -- CBC Test
  (
    gen_random_uuid(),
    'Complete Blood Count',
    500.00,
    90.00,
    'paid',
    CURRENT_DATE,
    'UPI'
  ),
  
  -- Lipid Profile
  (
    gen_random_uuid(),
    'Lipid Profile',
    850.00,
    153.00,
    'paid',
    CURRENT_DATE,
    'Cash'
  ),
  
  -- Liver Function Test
  (
    gen_random_uuid(),
    'Liver Function Test',
    750.00,
    135.00,
    'pending',
    CURRENT_DATE,
    NULL
  ),
  
  -- Kidney Function Test
  (
    gen_random_uuid(),
    'Kidney Function Test',
    650.00,
    117.00,
    'paid',
    CURRENT_DATE - INTERVAL '1 day',
    'Card'
  ),
  
  -- Thyroid Function Test
  (
    gen_random_uuid(),
    'Thyroid Function Test',
    900.00,
    162.00,
    'paid',
    CURRENT_DATE - INTERVAL '2 days',
    'UPI'
  ),
  
  -- Blood Sugar Fasting
  (
    gen_random_uuid(),
    'Blood Sugar Fasting',
    150.00,
    27.00,
    'paid',
    CURRENT_DATE,
    'Cash'
  ),
  
  -- HbA1c
  (
    gen_random_uuid(),
    'HbA1c',
    400.00,
    72.00,
    'pending',
    CURRENT_DATE,
    NULL
  )
ON CONFLICT DO NOTHING;

-- Verify the bills were created
SELECT 
  id,
  patient_mrno,
  service_type_name,
  total_amount,
  payment_status,
  bill_date,
  results_entered
FROM opbilling
ORDER BY bill_date DESC
LIMIT 10;

DO $$
BEGIN
    RAISE NOTICE '✅ Sample bills created successfully!';
    RAISE NOTICE '📋 You should now see 7 test bills in the Lab Portal';
    RAISE NOTICE '🔬 All bills are pending (results_entered = NULL or FALSE)';
END $$;
