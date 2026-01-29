-- =====================================================
-- TEST TEMPLATES TABLE
-- Defines parameters for each test type
-- Used to generate dynamic forms in the frontend
-- =====================================================

CREATE TABLE IF NOT EXISTS test_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Test Identification
    test_name VARCHAR(255) UNIQUE NOT NULL,
    test_code VARCHAR(50),
    test_category VARCHAR(100),
    
    -- Test Parameters Definition (JSON)
    parameters JSONB NOT NULL,
    -- Structure:
    -- [
    --   {
    --     "name": "hemoglobin",
    --     "display_name": "Hemoglobin",
    --     "unit": "g/dL",
    --     "reference_range": "13-17 (M), 12-15 (F)",
    --     "type": "numeric",
    --     "required": true,
    --     "order": 1
    --   }
    -- ]
    
    -- Template Metadata
    description TEXT,
    instructions TEXT,
    sample_type VARCHAR(100), -- Blood, Urine, etc.
    turnaround_time VARCHAR(50), -- "2-4 hours", "Same day", etc.
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- Index on test_name for quick lookups
CREATE INDEX IF NOT EXISTS idx_test_templates_test_name ON test_templates(test_name);

-- Index on active templates
CREATE INDEX IF NOT EXISTS idx_test_templates_active ON test_templates(is_active) WHERE is_active = TRUE;

-- GIN index on parameters for searching
CREATE INDEX IF NOT EXISTS idx_test_templates_parameters ON test_templates USING GIN (parameters);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_test_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_test_templates_timestamp ON test_templates;
CREATE TRIGGER trigger_update_test_templates_timestamp
    BEFORE UPDATE ON test_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_test_templates_updated_at();

-- Enable RLS
ALTER TABLE test_templates ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Allow all for authenticated users" ON test_templates;

CREATE POLICY "Allow all for authenticated users" 
    ON test_templates 
    FOR ALL 
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- INSERT COMMON TEST TEMPLATES
-- =====================================================

-- Complete Blood Count (CBC)
INSERT INTO test_templates (test_name, test_code, test_category, parameters, sample_type, turnaround_time)
VALUES (
    'Complete Blood Count',
    'CBC',
    'Hematology',
    '[
        {
            "name": "hemoglobin",
            "display_name": "Hemoglobin",
            "unit": "g/dL",
            "reference_range": "13-17 (M), 12-15 (F)",
            "type": "numeric",
            "required": true,
            "order": 1
        },
        {
            "name": "rbc_count",
            "display_name": "RBC Count",
            "unit": "million/µL",
            "reference_range": "4.5-5.5 (M), 4.0-5.0 (F)",
            "type": "numeric",
            "required": true,
            "order": 2
        },
        {
            "name": "wbc_count",
            "display_name": "WBC Count",
            "unit": "cells/µL",
            "reference_range": "4000-11000",
            "type": "numeric",
            "required": true,
            "order": 3
        },
        {
            "name": "platelet_count",
            "display_name": "Platelet Count",
            "unit": "cells/µL",
            "reference_range": "150000-450000",
            "type": "numeric",
            "required": true,
            "order": 4
        },
        {
            "name": "hematocrit",
            "display_name": "Hematocrit",
            "unit": "%",
            "reference_range": "40-50 (M), 36-44 (F)",
            "type": "numeric",
            "required": true,
            "order": 5
        },
        {
            "name": "mcv",
            "display_name": "MCV",
            "unit": "fL",
            "reference_range": "80-100",
            "type": "numeric",
            "required": false,
            "order": 6
        },
        {
            "name": "mch",
            "display_name": "MCH",
            "unit": "pg",
            "reference_range": "27-32",
            "type": "numeric",
            "required": false,
            "order": 7
        },
        {
            "name": "mchc",
            "display_name": "MCHC",
            "unit": "g/dL",
            "reference_range": "32-36",
            "type": "numeric",
            "required": false,
            "order": 8
        }
    ]'::jsonb,
    'Blood (EDTA)',
    '2-4 hours'
) ON CONFLICT (test_name) DO NOTHING;

-- Lipid Profile
INSERT INTO test_templates (test_name, test_code, test_category, parameters, sample_type, turnaround_time)
VALUES (
    'Lipid Profile',
    'LIPID',
    'Biochemistry',
    '[
        {
            "name": "total_cholesterol",
            "display_name": "Total Cholesterol",
            "unit": "mg/dL",
            "reference_range": "<200",
            "type": "numeric",
            "required": true,
            "order": 1
        },
        {
            "name": "hdl_cholesterol",
            "display_name": "HDL Cholesterol",
            "unit": "mg/dL",
            "reference_range": ">40 (M), >50 (F)",
            "type": "numeric",
            "required": true,
            "order": 2
        },
        {
            "name": "ldl_cholesterol",
            "display_name": "LDL Cholesterol",
            "unit": "mg/dL",
            "reference_range": "<100",
            "type": "numeric",
            "required": true,
            "order": 3
        },
        {
            "name": "vldl_cholesterol",
            "display_name": "VLDL Cholesterol",
            "unit": "mg/dL",
            "reference_range": "<30",
            "type": "numeric",
            "required": false,
            "order": 4
        },
        {
            "name": "triglycerides",
            "display_name": "Triglycerides",
            "unit": "mg/dL",
            "reference_range": "<150",
            "type": "numeric",
            "required": true,
            "order": 5
        },
        {
            "name": "cholesterol_hdl_ratio",
            "display_name": "Total Cholesterol/HDL Ratio",
            "unit": "",
            "reference_range": "<4.5",
            "type": "numeric",
            "required": false,
            "order": 6
        }
    ]'::jsonb,
    'Blood (Serum)',
    'Same day'
) ON CONFLICT (test_name) DO NOTHING;

-- Liver Function Test (LFT)
INSERT INTO test_templates (test_name, test_code, test_category, parameters, sample_type, turnaround_time)
VALUES (
    'Liver Function Test',
    'LFT',
    'Biochemistry',
    '[
        {
            "name": "bilirubin_total",
            "display_name": "Bilirubin (Total)",
            "unit": "mg/dL",
            "reference_range": "0.3-1.2",
            "type": "numeric",
            "required": true,
            "order": 1
        },
        {
            "name": "bilirubin_direct",
            "display_name": "Bilirubin (Direct)",
            "unit": "mg/dL",
            "reference_range": "0.1-0.3",
            "type": "numeric",
            "required": true,
            "order": 2
        },
        {
            "name": "sgot_ast",
            "display_name": "SGOT (AST)",
            "unit": "U/L",
            "reference_range": "5-40",
            "type": "numeric",
            "required": true,
            "order": 3
        },
        {
            "name": "sgpt_alt",
            "display_name": "SGPT (ALT)",
            "unit": "U/L",
            "reference_range": "7-56",
            "type": "numeric",
            "required": true,
            "order": 4
        },
        {
            "name": "alkaline_phosphatase",
            "display_name": "Alkaline Phosphatase",
            "unit": "U/L",
            "reference_range": "40-150",
            "type": "numeric",
            "required": true,
            "order": 5
        },
        {
            "name": "total_protein",
            "display_name": "Total Protein",
            "unit": "g/dL",
            "reference_range": "6.0-8.3",
            "type": "numeric",
            "required": true,
            "order": 6
        },
        {
            "name": "albumin",
            "display_name": "Albumin",
            "unit": "g/dL",
            "reference_range": "3.5-5.5",
            "type": "numeric",
            "required": true,
            "order": 7
        },
        {
            "name": "globulin",
            "display_name": "Globulin",
            "unit": "g/dL",
            "reference_range": "2.0-3.5",
            "type": "numeric",
            "required": true,
            "order": 8
        },
        {
            "name": "ag_ratio",
            "display_name": "A/G Ratio",
            "unit": "",
            "reference_range": "1.0-2.0",
            "type": "numeric",
            "required": false,
            "order": 9
        }
    ]'::jsonb,
    'Blood (Serum)',
    'Same day'
) ON CONFLICT (test_name) DO NOTHING;

-- Kidney Function Test (KFT)
INSERT INTO test_templates (test_name, test_code, test_category, parameters, sample_type, turnaround_time)
VALUES (
    'Kidney Function Test',
    'KFT',
    'Biochemistry',
    '[
        {
            "name": "blood_urea",
            "display_name": "Blood Urea",
            "unit": "mg/dL",
            "reference_range": "15-40",
            "type": "numeric",
            "required": true,
            "order": 1
        },
        {
            "name": "serum_creatinine",
            "display_name": "Serum Creatinine",
            "unit": "mg/dL",
            "reference_range": "0.6-1.2 (M), 0.5-1.1 (F)",
            "type": "numeric",
            "required": true,
            "order": 2
        },
        {
            "name": "uric_acid",
            "display_name": "Uric Acid",
            "unit": "mg/dL",
            "reference_range": "3.5-7.2 (M), 2.6-6.0 (F)",
            "type": "numeric",
            "required": true,
            "order": 3
        },
        {
            "name": "sodium",
            "display_name": "Sodium (Na+)",
            "unit": "mEq/L",
            "reference_range": "135-145",
            "type": "numeric",
            "required": true,
            "order": 4
        },
        {
            "name": "potassium",
            "display_name": "Potassium (K+)",
            "unit": "mEq/L",
            "reference_range": "3.5-5.0",
            "type": "numeric",
            "required": true,
            "order": 5
        },
        {
            "name": "chloride",
            "display_name": "Chloride (Cl-)",
            "unit": "mEq/L",
            "reference_range": "98-107",
            "type": "numeric",
            "required": true,
            "order": 6
        }
    ]'::jsonb,
    'Blood (Serum)',
    'Same day'
) ON CONFLICT (test_name) DO NOTHING;

-- Thyroid Profile
INSERT INTO test_templates (test_name, test_code, test_category, parameters, sample_type, turnaround_time)
VALUES (
    'Thyroid Function Test',
    'TFT',
    'Endocrinology',
    '[
        {
            "name": "t3_total",
            "display_name": "T3 (Total)",
            "unit": "ng/dL",
            "reference_range": "80-200",
            "type": "numeric",
            "required": true,
            "order": 1
        },
        {
            "name": "t4_total",
            "display_name": "T4 (Total)",
            "unit": "µg/dL",
            "reference_range": "5.0-12.0",
            "type": "numeric",
            "required": true,
            "order": 2
        },
        {
            "name": "tsh",
            "display_name": "TSH",
            "unit": "µIU/mL",
            "reference_range": "0.4-4.0",
            "type": "numeric",
            "required": true,
            "order": 3
        }
    ]'::jsonb,
    'Blood (Serum)',
    '1-2 days'
) ON CONFLICT (test_name) DO NOTHING;

-- Blood Sugar Tests
INSERT INTO test_templates (test_name, test_code, test_category, parameters, sample_type, turnaround_time)
VALUES (
    'Blood Sugar Fasting',
    'FBS',
    'Biochemistry',
    '[
        {
            "name": "glucose_fasting",
            "display_name": "Glucose (Fasting)",
            "unit": "mg/dL",
            "reference_range": "70-100",
            "type": "numeric",
            "required": true,
            "order": 1
        }
    ]'::jsonb,
    'Blood (Fluoride)',
    '2-4 hours'
) ON CONFLICT (test_name) DO NOTHING;

INSERT INTO test_templates (test_name, test_code, test_category, parameters, sample_type, turnaround_time)
VALUES (
    'Blood Sugar Random',
    'RBS',
    'Biochemistry',
    '[
        {
            "name": "glucose_random",
            "display_name": "Glucose (Random)",
            "unit": "mg/dL",
            "reference_range": "70-140",
            "type": "numeric",
            "required": true,
            "order": 1
        }
    ]'::jsonb,
    'Blood (Fluoride)',
    '2-4 hours'
) ON CONFLICT (test_name) DO NOTHING;

INSERT INTO test_templates (test_name, test_code, test_category, parameters, sample_type, turnaround_time)
VALUES (
    'HbA1c',
    'HBA1C',
    'Biochemistry',
    '[
        {
            "name": "hba1c",
            "display_name": "HbA1c",
            "unit": "%",
            "reference_range": "<5.7 (Normal), 5.7-6.4 (Prediabetes), >6.5 (Diabetes)",
            "type": "numeric",
            "required": true,
            "order": 1
        }
    ]'::jsonb,
    'Blood (EDTA)',
    'Same day'
) ON CONFLICT (test_name) DO NOTHING;

DO $$
BEGIN
    RAISE NOTICE '✅ Test Templates table created successfully!';
    RAISE NOTICE '📋 Common test templates inserted';
    RAISE NOTICE '🧪 Templates available for: CBC, Lipid Profile, LFT, KFT, Thyroid, Blood Sugar';
    RAISE NOTICE '💡 Add more templates as needed for your laboratory';
END $$;
