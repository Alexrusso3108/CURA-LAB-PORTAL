
-- Insert or Update the "Differential Count" test template
-- Removed 'price' column as it does not exist in the schema
INSERT INTO test_templates (
    test_name,
    test_code,
    test_category,
    parameters,
    sample_type,
    turnaround_time,
    is_active
)
VALUES (
    'Differential Count',
    'DIFF',
    'Hematology',
    '[
      { "name": "neutrophils", "display_name": "NEUTROPHILS", "unit": "%", "reference_range": "40 - 70", "type": "numeric", "required": true, "order": 1 },
      { "name": "lymphocytes", "display_name": "LYMPHOCYTES", "unit": "%", "reference_range": "20 - 45", "type": "numeric", "required": true, "order": 2 },
      { "name": "eosinophil", "display_name": "EOSINOPHIL", "unit": "%", "reference_range": "2 - 6", "type": "numeric", "required": true, "order": 3 },
      { "name": "monocytes", "display_name": "MONOCYTES", "unit": "%", "reference_range": "1 - 8", "type": "numeric", "required": true, "order": 4 },
      { "name": "basophil", "display_name": "BASOPHIL", "unit": "%", "reference_range": "0 - 1", "type": "numeric", "required": true, "order": 5 }
    ]'::jsonb,
    'Blood (EDTA)',
    '2-4 hours',
    true
) ON CONFLICT (test_name) 
DO UPDATE SET 
    parameters = EXCLUDED.parameters,
    updated_at = NOW();
