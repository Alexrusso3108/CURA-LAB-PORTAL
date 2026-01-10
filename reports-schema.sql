-- =====================================================
-- REPORTS TABLE SCHEMA
-- For: Cura Hospital Laboratory Management System
-- Linked to samples table
-- =====================================================

-- Create laboratory_reports table
CREATE TABLE IF NOT EXISTS laboratory_reports (
    -- Primary Key
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Link to Sample
    sample_id UUID NOT NULL REFERENCES samples(id) ON DELETE CASCADE,
    
    -- Report Identification
    report_number VARCHAR(100) UNIQUE,
    report_type VARCHAR(100) DEFAULT 'laboratory_report',
    
    -- Report Status
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'pending-review', 'reviewed', 'approved', 'published', 'cancelled')),
    
    -- Patient Information (duplicated for quick access)
    patient_name VARCHAR(255),
    patient_mrno UUID,
    patient_age INTEGER,
    patient_gender VARCHAR(20),
    
    -- Test Information
    test_name VARCHAR(255),
    test_code VARCHAR(50),
    test_category VARCHAR(100),
    
    -- Report Content
    findings TEXT,
    interpretation TEXT,
    recommendations TEXT,
    conclusion TEXT,
    
    -- Clinical Information
    clinical_history TEXT,
    referring_doctor VARCHAR(255),
    department VARCHAR(100),
    
    -- Report Metadata
    sample_collection_date TIMESTAMP,
    sample_received_date TIMESTAMP,
    report_date TIMESTAMP DEFAULT NOW(),
    report_time TIME DEFAULT CURRENT_TIME,
    
    -- Signatures & Approvals
    tested_by VARCHAR(255),
    tested_by_designation VARCHAR(100),
    verified_by VARCHAR(255),
    verified_by_designation VARCHAR(100),
    verified_date TIMESTAMP,
    approved_by VARCHAR(255),
    approved_by_designation VARCHAR(100),
    approved_date TIMESTAMP,
    
    -- Report Format
    report_template VARCHAR(100),
    report_format VARCHAR(50) DEFAULT 'pdf', -- 'pdf', 'html', 'docx'
    
    -- Report Storage
    report_file_url TEXT,
    report_file_size INTEGER,
    
    -- Distribution
    email_sent BOOLEAN DEFAULT FALSE,
    email_sent_date TIMESTAMP,
    printed BOOLEAN DEFAULT FALSE,
    printed_date TIMESTAMP,
    printed_by VARCHAR(255),
    
    -- Quality Indicators
    is_urgent BOOLEAN DEFAULT FALSE,
    is_confidential BOOLEAN DEFAULT FALSE,
    contains_critical_values BOOLEAN DEFAULT FALSE,
    
    -- Revision History
    revision_number INTEGER DEFAULT 1,
    previous_report_id UUID REFERENCES laboratory_reports(id),
    revision_notes TEXT,
    
    -- Additional Data (JSON for flexibility)
    additional_info JSONB,
    
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
CREATE INDEX IF NOT EXISTS idx_laboratory_reports_sample_id ON laboratory_reports(sample_id);

-- Index on report_number for quick search
CREATE INDEX IF NOT EXISTS idx_laboratory_reports_report_number ON laboratory_reports(report_number);

-- Index on status for filtering
CREATE INDEX IF NOT EXISTS idx_laboratory_reports_status ON laboratory_reports(status) WHERE is_deleted = FALSE;

-- Index on patient_mrno
CREATE INDEX IF NOT EXISTS idx_laboratory_reports_patient_mrno ON laboratory_reports(patient_mrno);

-- Index on report_date for date range queries
CREATE INDEX IF NOT EXISTS idx_laboratory_reports_report_date ON laboratory_reports(report_date DESC);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_laboratory_reports_sample_status ON laboratory_reports(sample_id, status) WHERE is_deleted = FALSE;

-- Index for urgent reports
CREATE INDEX IF NOT EXISTS idx_laboratory_reports_urgent ON laboratory_reports(is_urgent) WHERE is_urgent = TRUE AND is_deleted = FALSE;

-- =====================================================
-- TRIGGERS for auto-updating timestamps
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_laboratory_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at on row update
DROP TRIGGER IF EXISTS trigger_update_laboratory_reports_timestamp ON laboratory_reports;
CREATE TRIGGER trigger_update_laboratory_reports_timestamp
    BEFORE UPDATE ON laboratory_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_laboratory_reports_updated_at();

-- Function to auto-generate report number
CREATE OR REPLACE FUNCTION generate_report_number()
RETURNS TRIGGER AS $$
DECLARE
    new_report_number VARCHAR(100);
    counter INTEGER;
BEGIN
    IF NEW.report_number IS NULL THEN
        -- Get count of reports today
        SELECT COUNT(*) INTO counter
        FROM laboratory_reports
        WHERE DATE(created_at) = CURRENT_DATE;
        
        -- Generate report number: REP-YYYY-MM-DD-XXXX
        new_report_number := 'REP-' || 
                           TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD') || '-' || 
                           LPAD((counter + 1)::TEXT, 4, '0');
        
        NEW.report_number := new_report_number;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate report number
DROP TRIGGER IF EXISTS trigger_generate_report_number ON laboratory_reports;
CREATE TRIGGER trigger_generate_report_number
    BEFORE INSERT ON laboratory_reports
    FOR EACH ROW
    EXECUTE FUNCTION generate_report_number();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE laboratory_reports ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations for authenticated users (Development)
CREATE POLICY "Allow all for authenticated users" 
    ON laboratory_reports 
    FOR ALL 
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- HELPFUL QUERIES
-- =====================================================

-- Query 1: Get all reports for a specific sample
-- SELECT * FROM reports WHERE sample_id = 'SAMPLE_UUID' AND is_deleted = FALSE;

-- Query 2: Get pending reports
-- SELECT r.*, s.sample_id, s.patient_name 
-- FROM reports r
-- JOIN samples s ON r.sample_id = s.id
-- WHERE r.status = 'pending-review' AND r.is_deleted = FALSE;

-- Query 3: Get reports by patient MRN
-- SELECT * FROM reports WHERE patient_mrno = 'PATIENT_UUID' AND is_deleted = FALSE;

-- Query 4: Get reports by date range
-- SELECT * FROM reports 
-- WHERE report_date BETWEEN '2026-01-01' AND '2026-01-31' 
-- AND is_deleted = FALSE;

-- Query 5: Get urgent reports
-- SELECT * FROM reports WHERE is_urgent = TRUE AND is_deleted = FALSE;

-- Query 6: Get reports with sample and test results
-- SELECT 
--     r.*,
--     s.sample_id,
--     s.collection_date,
--     s.status as sample_status,
--     tr.result_value,
--     tr.interpretation
-- FROM reports r
-- JOIN samples s ON r.sample_id = s.id
-- LEFT JOIN test_results tr ON s.id = tr.sample_id
-- WHERE r.is_deleted = FALSE
-- ORDER BY r.report_date DESC;

-- Query 7: Get reports ready for approval
-- SELECT * FROM reports 
-- WHERE status = 'reviewed' 
-- AND verified_date IS NOT NULL 
-- AND approved_date IS NULL
-- AND is_deleted = FALSE;

DO $$
BEGIN
    RAISE NOTICE '✅ Reports table created successfully!';
    RAISE NOTICE '📄 Ready for laboratory report generation';
    RAISE NOTICE '🔗 Linked to samples table via sample_id';
    RAISE NOTICE '🔢 Auto-generates report numbers: REP-YYYY-MM-DD-XXXX';
END $$;
