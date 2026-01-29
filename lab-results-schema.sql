-- =====================================================
-- LAB RESULTS TABLE SCHEMA
-- For: Cura Hospital Laboratory Management System
-- Stores test results in JSON format for flexibility
-- Linked to opbilling table
-- =====================================================

-- Create lab_results table
CREATE TABLE IF NOT EXISTS lab_results (
    -- Primary Key
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    
    -- Link to Bill (from external billing system)
    -- Note: No foreign key constraint to avoid issues with opbilling table structure
    -- Using VARCHAR to support both UUID and integer bill IDs
    bill_id VARCHAR(255) NOT NULL,
    
    -- Patient Information (denormalized for quick access)
    patient_mrno VARCHAR(255) NOT NULL,
    patient_name VARCHAR(255),
    patient_age INTEGER,
    patient_gender VARCHAR(20),
    
    -- Test Information
    test_name VARCHAR(255) NOT NULL,
    test_code VARCHAR(50),
    test_category VARCHAR(100),
    
    -- Test Results (JSON format - flexible for any test type)
    test_parameters JSONB NOT NULL,
    -- Example for CBC:
    -- {
    --   "hemoglobin": {"value": "14.5", "unit": "g/dL", "range": "13-17", "status": "normal"},
    --   "rbc_count": {"value": "4.8", "unit": "M/µL", "range": "4.5-5.5", "status": "normal"},
    --   "wbc_count": {"value": "7200", "unit": "/µL", "range": "4000-11000", "status": "normal"}
    -- }
    
    -- Overall Result Summary
    overall_interpretation VARCHAR(50), -- 'normal', 'abnormal', 'critical'
    has_abnormal_values BOOLEAN DEFAULT FALSE,
    has_critical_values BOOLEAN DEFAULT FALSE,
    
    -- Result Status
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'verified', 'approved', 'published')),
    
    -- Testing Information
    tested_by VARCHAR(255),
    tested_date TIMESTAMP DEFAULT NOW(),
    testing_method VARCHAR(255),
    instrument_used VARCHAR(255),
    
    -- Verification & Approval
    verified_by VARCHAR(255),
    verified_date TIMESTAMP,
    approved_by VARCHAR(255),
    approved_date TIMESTAMP,
    
    -- Additional Information
    technician_notes TEXT,
    doctor_notes TEXT,
    clinical_significance TEXT,
    
    -- Quality Control
    qc_status VARCHAR(50), -- 'passed', 'failed', 'pending'
    qc_comments TEXT,
    
    -- Report Generation
    report_generated BOOLEAN DEFAULT FALSE,
    report_id UUID, -- Will link to laboratory_reports table
    report_generated_at TIMESTAMP,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    
    -- Soft delete
    deleted_at TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE
);

-- =====================================================
-- INDEXES for better query performance
-- =====================================================

-- Index on bill_id for quick lookups
CREATE INDEX IF NOT EXISTS idx_lab_results_bill_id ON lab_results(bill_id);

-- Index on patient_mrno for patient-specific queries
CREATE INDEX IF NOT EXISTS idx_lab_results_patient_mrno ON lab_results(patient_mrno);

-- Index on status for filtering
CREATE INDEX IF NOT EXISTS idx_lab_results_status ON lab_results(status) WHERE is_deleted = FALSE;

-- Index on test_name for grouping by test type
CREATE INDEX IF NOT EXISTS idx_lab_results_test_name ON lab_results(test_name);

-- Index on tested_date for date range queries
CREATE INDEX IF NOT EXISTS idx_lab_results_tested_date ON lab_results(tested_date DESC);

-- Index for abnormal results
CREATE INDEX IF NOT EXISTS idx_lab_results_abnormal ON lab_results(has_abnormal_values) WHERE has_abnormal_values = TRUE AND is_deleted = FALSE;

-- Index for critical results
CREATE INDEX IF NOT EXISTS idx_lab_results_critical ON lab_results(has_critical_values) WHERE has_critical_values = TRUE AND is_deleted = FALSE;

-- Index for pending results
CREATE INDEX IF NOT EXISTS idx_lab_results_pending ON lab_results(status) WHERE status = 'draft' AND is_deleted = FALSE;

-- GIN index on JSONB for parameter searches
CREATE INDEX IF NOT EXISTS idx_lab_results_parameters ON lab_results USING GIN (test_parameters);

-- =====================================================
-- TRIGGERS for auto-updating timestamps
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_lab_results_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at on row update
DROP TRIGGER IF EXISTS trigger_update_lab_results_timestamp ON lab_results;
CREATE TRIGGER trigger_update_lab_results_timestamp
    BEFORE UPDATE ON lab_results
    FOR EACH ROW
    EXECUTE FUNCTION update_lab_results_updated_at();

-- =====================================================
-- TRIGGER to auto-detect abnormal/critical values
-- =====================================================

CREATE OR REPLACE FUNCTION check_abnormal_critical_values()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if any parameter has abnormal or critical status
    NEW.has_abnormal_values := (
        SELECT COUNT(*) > 0
        FROM jsonb_each(NEW.test_parameters) AS param
        WHERE (param.value->>'status') IN ('abnormal', 'critical')
    );
    
    NEW.has_critical_values := (
        SELECT COUNT(*) > 0
        FROM jsonb_each(NEW.test_parameters) AS param
        WHERE (param.value->>'status') = 'critical'
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_abnormal_critical ON lab_results;
CREATE TRIGGER trigger_check_abnormal_critical
    BEFORE INSERT OR UPDATE ON lab_results
    FOR EACH ROW
    EXECUTE FUNCTION check_abnormal_critical_values();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE lab_results ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Allow all for authenticated users" ON lab_results;

-- Policy: Allow all operations for authenticated users (Development)
CREATE POLICY "Allow all for authenticated users" 
    ON lab_results 
    FOR ALL 
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- MODIFY opbilling TABLE to track results
-- =====================================================

-- Add columns to opbilling to track if results are entered
DO $$
BEGIN
    -- Check if column exists before adding
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'opbilling' AND column_name = 'results_entered'
    ) THEN
        ALTER TABLE opbilling ADD COLUMN results_entered BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'opbilling' AND column_name = 'results_entered_at'
    ) THEN
        ALTER TABLE opbilling ADD COLUMN results_entered_at TIMESTAMP;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'opbilling' AND column_name = 'results_entered_by'
    ) THEN
        ALTER TABLE opbilling ADD COLUMN results_entered_by VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'opbilling' AND column_name = 'lab_result_id'
    ) THEN
        ALTER TABLE opbilling ADD COLUMN lab_result_id VARCHAR(255);
    END IF;
END $$;

-- Create index on results_entered for filtering
CREATE INDEX IF NOT EXISTS idx_opbilling_results_entered ON opbilling(results_entered) WHERE results_entered = FALSE;

-- =====================================================
-- HELPFUL QUERIES
-- =====================================================

-- Query 1: Get all pending bills (no results entered)
-- SELECT * FROM opbilling 
-- WHERE results_entered = FALSE 
-- AND payment_status = 'paid'
-- ORDER BY bill_date DESC;

-- Query 2: Get results for a specific bill
-- SELECT * FROM lab_results WHERE bill_id = 'BILL_UUID' AND is_deleted = FALSE;

-- Query 3: Get all abnormal results
-- SELECT * FROM lab_results WHERE has_abnormal_values = TRUE AND is_deleted = FALSE;

-- Query 4: Get critical results
-- SELECT * FROM lab_results WHERE has_critical_values = TRUE AND is_deleted = FALSE;

-- Query 5: Get results by patient
-- SELECT * FROM lab_results WHERE patient_mrno = 'PATIENT_UUID' AND is_deleted = FALSE;

-- Query 6: Search within test parameters (example: find all results with high hemoglobin)
-- SELECT * FROM lab_results 
-- WHERE test_parameters @> '{"hemoglobin": {"status": "abnormal"}}'
-- AND is_deleted = FALSE;

-- Query 7: Get pending results (draft status)
-- SELECT lr.*, ob.patient_mrno, ob.service_type_name
-- FROM lab_results lr
-- JOIN opbilling ob ON lr.bill_id = ob.id
-- WHERE lr.status = 'draft' AND lr.is_deleted = FALSE;

-- Query 8: Get completed results ready for verification
-- SELECT * FROM lab_results 
-- WHERE status = 'completed' 
-- AND verified_date IS NULL 
-- AND is_deleted = FALSE;

-- =====================================================
-- EXAMPLE TEST PARAMETER STRUCTURES
-- =====================================================

-- Complete Blood Count (CBC)
-- {
--   "hemoglobin": {
--     "value": "14.5",
--     "unit": "g/dL",
--     "reference_range": "13-17 (M), 12-15 (F)",
--     "status": "normal",
--     "flag": ""
--   },
--   "rbc_count": {
--     "value": "4.8",
--     "unit": "million/µL",
--     "reference_range": "4.5-5.5 (M), 4.0-5.0 (F)",
--     "status": "normal",
--     "flag": ""
--   },
--   "wbc_count": {
--     "value": "7200",
--     "unit": "cells/µL",
--     "reference_range": "4000-11000",
--     "status": "normal",
--     "flag": ""
--   },
--   "platelet_count": {
--     "value": "250000",
--     "unit": "cells/µL",
--     "reference_range": "150000-450000",
--     "status": "normal",
--     "flag": ""
--   }
-- }

-- Lipid Profile
-- {
--   "total_cholesterol": {
--     "value": "180",
--     "unit": "mg/dL",
--     "reference_range": "<200",
--     "status": "normal",
--     "flag": ""
--   },
--   "hdl_cholesterol": {
--     "value": "55",
--     "unit": "mg/dL",
--     "reference_range": ">40 (M), >50 (F)",
--     "status": "normal",
--     "flag": ""
--   },
--   "ldl_cholesterol": {
--     "value": "110",
--     "unit": "mg/dL",
--     "reference_range": "<100",
--     "status": "abnormal",
--     "flag": "H"
--   },
--   "triglycerides": {
--     "value": "140",
--     "unit": "mg/dL",
--     "reference_range": "<150",
--     "status": "normal",
--     "flag": ""
--   }
-- }

DO $$
BEGIN
    RAISE NOTICE '✅ Lab Results table created successfully!';
    RAISE NOTICE '📊 Stores test results in flexible JSON format';
    RAISE NOTICE '🔗 Linked to opbilling table via bill_id';
    RAISE NOTICE '🔍 Indexes created for optimal performance';
    RAISE NOTICE '🤖 Auto-detects abnormal and critical values';
    RAISE NOTICE '📝 opbilling table updated with results tracking';
END $$;
