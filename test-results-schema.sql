-- =====================================================
-- TEST RESULTS TABLE SCHEMA
-- For: Cura Hospital Laboratory Management System
-- Linked to samples table
-- =====================================================

-- Create test_results table
CREATE TABLE IF NOT EXISTS test_results (
    -- Primary Key
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Link to Sample
    sample_id UUID NOT NULL REFERENCES samples(id) ON DELETE CASCADE,
    
    -- Test Information
    test_name VARCHAR(255) NOT NULL,
    test_code VARCHAR(50),
    test_category VARCHAR(100),
    
    -- Result Details
    result_status VARCHAR(50) DEFAULT 'pending' CHECK (result_status IN ('pending', 'in-progress', 'completed', 'verified', 'approved', 'rejected')),
    
    -- Result Values (flexible for different test types)
    result_value TEXT,
    result_unit VARCHAR(50),
    reference_range VARCHAR(255),
    
    -- Interpretation
    interpretation VARCHAR(50), -- 'normal', 'abnormal', 'critical', 'borderline'
    result_notes TEXT,
    clinical_significance TEXT,
    
    -- Flags
    is_abnormal BOOLEAN DEFAULT FALSE,
    is_critical BOOLEAN DEFAULT FALSE,
    is_panic_value BOOLEAN DEFAULT FALSE,
    
    -- Testing Process
    tested_by VARCHAR(255),
    tested_date TIMESTAMP,
    testing_method VARCHAR(255),
    instrument_used VARCHAR(255),
    
    -- Quality Control
    qc_status VARCHAR(50), -- 'passed', 'failed', 'pending'
    qc_comments TEXT,
    
    -- Verification & Approval
    verified_by VARCHAR(255),
    verified_date TIMESTAMP,
    approved_by VARCHAR(255),
    approved_date TIMESTAMP,
    
    -- Additional Test Parameters (JSON for flexibility)
    additional_parameters JSONB,
    
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

-- Index on sample_id for quick lookups
CREATE INDEX IF NOT EXISTS idx_test_results_sample_id ON test_results(sample_id);

-- Index on result_status for filtering
CREATE INDEX IF NOT EXISTS idx_test_results_status ON test_results(result_status) WHERE is_deleted = FALSE;

-- Index on test_name for grouping
CREATE INDEX IF NOT EXISTS idx_test_results_test_name ON test_results(test_name);

-- Index on tested_date for date range queries
CREATE INDEX IF NOT EXISTS idx_test_results_tested_date ON test_results(tested_date DESC);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_test_results_sample_status ON test_results(sample_id, result_status) WHERE is_deleted = FALSE;

-- Index for abnormal results
CREATE INDEX IF NOT EXISTS idx_test_results_abnormal ON test_results(is_abnormal) WHERE is_abnormal = TRUE AND is_deleted = FALSE;

-- Index for critical results
CREATE INDEX IF NOT EXISTS idx_test_results_critical ON test_results(is_critical) WHERE is_critical = TRUE AND is_deleted = FALSE;

-- =====================================================
-- TRIGGERS for auto-updating timestamps
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_test_results_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at on row update
DROP TRIGGER IF EXISTS trigger_update_test_results_timestamp ON test_results;
CREATE TRIGGER trigger_update_test_results_timestamp
    BEFORE UPDATE ON test_results
    FOR EACH ROW
    EXECUTE FUNCTION update_test_results_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations for authenticated users (Development)
CREATE POLICY "Allow all for authenticated users" 
    ON test_results 
    FOR ALL 
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- HELPFUL QUERIES
-- =====================================================

-- Query 1: Get all results for a specific sample
-- SELECT * FROM test_results WHERE sample_id = 'SAMPLE_UUID' AND is_deleted = FALSE;

-- Query 2: Get pending results
-- SELECT tr.*, s.sample_id, s.patient_name 
-- FROM test_results tr
-- JOIN samples s ON tr.sample_id = s.id
-- WHERE tr.result_status = 'pending' AND tr.is_deleted = FALSE;

-- Query 3: Get critical results
-- SELECT * FROM test_results WHERE is_critical = TRUE AND is_deleted = FALSE;

-- Query 4: Get results by date range
-- SELECT * FROM test_results 
-- WHERE tested_date BETWEEN '2026-01-01' AND '2026-01-31' 
-- AND is_deleted = FALSE;

-- Query 5: Get abnormal results
-- SELECT * FROM test_results WHERE is_abnormal = TRUE AND is_deleted = FALSE;

-- Query 6: Get results with sample details
-- SELECT 
--     tr.*,
--     s.sample_id,
--     s.patient_name,
--     s.patient_mrno,
--     s.collection_date
-- FROM test_results tr
-- JOIN samples s ON tr.sample_id = s.id
-- WHERE tr.is_deleted = FALSE
-- ORDER BY tr.tested_date DESC;

DO $$
BEGIN
    RAISE NOTICE '✅ Test Results table created successfully!';
    RAISE NOTICE '📊 Ready for laboratory test result management';
    RAISE NOTICE '🔗 Linked to samples table via sample_id';
END $$;
