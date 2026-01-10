-- =====================================================
-- LABORATORY SAMPLES TABLE SCHEMA
-- For: Cura Hospital Laboratory Management System
-- =====================================================

-- Drop existing table if needed (DANGEROUS - removes all data!)
-- DROP TABLE IF EXISTS samples CASCADE;

-- Create samples table
CREATE TABLE IF NOT EXISTS samples (
    -- Primary Key
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Sample Identification
    sample_id VARCHAR(50) UNIQUE NOT NULL,
    barcode VARCHAR(100) UNIQUE,
    
    -- Patient Information
    patient_mrno UUID NOT NULL,
    patient_name VARCHAR(255),
    patient_age INTEGER,
    patient_gender VARCHAR(20),
    
    -- Sample Details
    sample_type VARCHAR(100) NOT NULL,
    test_name VARCHAR(255) NOT NULL,
    test_code VARCHAR(50),
    collection_date TIMESTAMP NOT NULL DEFAULT NOW(),
    collection_time TIME,
    
    -- Collection Information
    collected_by VARCHAR(255),
    collection_location VARCHAR(255),
    
    -- Sample Status
    status VARCHAR(50) DEFAULT 'collected' CHECK (status IN ('collected', 'in-transit', 'received', 'processing', 'completed', 'rejected')),
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('normal', 'urgent', 'stat', 'routine')),
    
    -- Department & Doctor
    department VARCHAR(100),
    referring_doctor VARCHAR(255),
    doctor_id UUID,
    
    -- Sample Specifications
    container_type VARCHAR(100),
    volume VARCHAR(50),
    specimen_condition VARCHAR(255),
    
    -- Additional Information
    clinical_notes TEXT,
    special_instructions TEXT,
    rejection_reason TEXT,
    
    -- Tracking
    received_date TIMESTAMP,
    received_by VARCHAR(255),
    processing_started_at TIMESTAMP,
    completed_at TIMESTAMP,
    
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
CREATE INDEX IF NOT EXISTS idx_samples_sample_id ON samples(sample_id);

-- Index on patient_mrno for patient-specific queries
CREATE INDEX IF NOT EXISTS idx_samples_patient_mrno ON samples(patient_mrno);

-- Index on status for filtering by status
CREATE INDEX IF NOT EXISTS idx_samples_status ON samples(status) WHERE is_deleted = FALSE;

-- Index on collection_date for date range queries
CREATE INDEX IF NOT EXISTS idx_samples_collection_date ON samples(collection_date DESC);

-- Index on test_name for grouping by test type
CREATE INDEX IF NOT EXISTS idx_samples_test_name ON samples(test_name);

-- Composite index for common queries (patient + status)
CREATE INDEX IF NOT EXISTS idx_samples_patient_status ON samples(patient_mrno, status) WHERE is_deleted = FALSE;

-- Index on barcode for barcode scanning
CREATE INDEX IF NOT EXISTS idx_samples_barcode ON samples(barcode) WHERE barcode IS NOT NULL;

-- =====================================================
-- TRIGGERS for auto-updating timestamps
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_samples_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at on row update
DROP TRIGGER IF EXISTS trigger_update_samples_timestamp ON samples;
CREATE TRIGGER trigger_update_samples_timestamp
    BEFORE UPDATE ON samples
    FOR EACH ROW
    EXECUTE FUNCTION update_samples_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Enable if you need authentication/authorization
-- =====================================================

-- Enable RLS
ALTER TABLE samples ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations for authenticated users (Development)
-- IMPORTANT: Update these policies for production based on your auth requirements
CREATE POLICY "Allow all for authenticated users" 
    ON samples 
    FOR ALL 
    USING (true)
    WITH CHECK (true);

-- Policy: Allow read access for anonymous users (for public dashboards)
-- Uncomment if needed:
-- CREATE POLICY "Allow read for anon users" 
--     ON samples 
--     FOR SELECT 
--     USING (is_deleted = FALSE);

-- =====================================================
-- HELPFUL QUERIES FOR COMMON OPERATIONS
-- =====================================================

-- Query 1: Get all active samples (not deleted)
-- SELECT * FROM samples WHERE is_deleted = FALSE ORDER BY collection_date DESC;

-- Query 2: Get samples by status
-- SELECT * FROM samples WHERE status = 'collected' AND is_deleted = FALSE;

-- Query 3: Get samples for a specific patient
-- SELECT * FROM samples WHERE patient_mrno = 'YOUR_PATIENT_MRNO_UUID' AND is_deleted = FALSE;

-- Query 4: Get urgent samples
-- SELECT * FROM samples WHERE priority = 'urgent' AND status NOT IN ('completed', 'rejected') AND is_deleted = FALSE;

-- Query 5: Get samples collected today
-- SELECT * FROM samples WHERE DATE(collection_date) = CURRENT_DATE AND is_deleted = FALSE;

-- Query 6: Get samples by date range
-- SELECT * FROM samples 
-- WHERE collection_date BETWEEN '2026-01-01' AND '2026-01-31' 
-- AND is_deleted = FALSE 
-- ORDER BY collection_date DESC;

-- Query 7: Count samples by status
-- SELECT status, COUNT(*) as count 
-- FROM samples 
-- WHERE is_deleted = FALSE 
-- GROUP BY status;

-- Query 8: Search samples by patient name or sample ID
-- SELECT * FROM samples 
-- WHERE (patient_name ILIKE '%search_term%' OR sample_id ILIKE '%search_term%')
-- AND is_deleted = FALSE;

-- =====================================================
-- GRANT PERMISSIONS (if using service role)
-- =====================================================

-- Grant all privileges to authenticated role
-- GRANT ALL ON samples TO authenticated;
-- GRANT ALL ON samples TO anon;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Samples table created successfully!';
    RAISE NOTICE '📊 Ready for laboratory sample tracking';
    RAISE NOTICE '🔍 Indexes created for optimal performance';
    RAISE NOTICE '🔒 Row Level Security enabled';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Review and adjust RLS policies for your security needs';
    RAISE NOTICE '2. Update authentication settings if needed';
    RAISE NOTICE '3. Test with sample insertions';
END $$;
