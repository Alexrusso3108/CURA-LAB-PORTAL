-- Laboratory Management System Database Schema for Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- SAMPLES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS samples (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sample_id VARCHAR(50) UNIQUE NOT NULL,
  patient_name VARCHAR(200) NOT NULL,
  patient_id VARCHAR(50) NOT NULL,
  test_type VARCHAR(200) NOT NULL,
  status VARCHAR(50) DEFAULT 'collected' CHECK (status IN ('collected', 'processing', 'completed', 'rejected')),
  priority VARCHAR(50) DEFAULT 'normal' CHECK (priority IN ('normal', 'high', 'urgent')),
  container_type VARCHAR(100),
  collected_at TIMESTAMP DEFAULT NOW(),
  collected_by VARCHAR(200),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- TEST RESULTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS test_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sample_id UUID REFERENCES samples(id) ON DELETE CASCADE,
  test_type VARCHAR(200) NOT NULL,
  results JSONB NOT NULL, -- Store test parameters as JSON
  verified_by VARCHAR(200),
  remarks TEXT,
  status VARCHAR(50) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'verified')),
  completed_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- REPORTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id VARCHAR(50) UNIQUE NOT NULL,
  sample_id UUID REFERENCES samples(id) ON DELETE CASCADE,
  test_result_id UUID REFERENCES test_results(id) ON DELETE CASCADE,
  patient_name VARCHAR(200) NOT NULL,
  patient_id VARCHAR(50) NOT NULL,
  age INTEGER,
  gender VARCHAR(20),
  test_type VARCHAR(200) NOT NULL,
  report_date DATE DEFAULT CURRENT_DATE,
  status VARCHAR(50) DEFAULT 'ready' CHECK (status IN ('ready', 'generated', 'sent')),
  verified_by VARCHAR(200),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- INVENTORY TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id VARCHAR(50) UNIQUE NOT NULL,
  item_name VARCHAR(200) NOT NULL,
  category VARCHAR(100) NOT NULL CHECK (category IN ('Consumables', 'Reagents', 'Equipment', 'Chemicals')),
  quantity INTEGER NOT NULL DEFAULT 0,
  unit VARCHAR(50) NOT NULL,
  reorder_level INTEGER NOT NULL,
  status VARCHAR(50) GENERATED ALWAYS AS (
    CASE 
      WHEN quantity <= (reorder_level * 0.5) THEN 'critical'
      WHEN quantity <= reorder_level THEN 'low'
      ELSE 'adequate'
    END
  ) STORED,
  supplier VARCHAR(200),
  batch_number VARCHAR(100),
  expiry_date DATE,
  last_restocked DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- INVOICES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id VARCHAR(50) UNIQUE NOT NULL,
  patient_name VARCHAR(200) NOT NULL,
  patient_id VARCHAR(50) NOT NULL,
  contact_number VARCHAR(20),
  invoice_date DATE DEFAULT CURRENT_DATE,
  tests JSONB NOT NULL, -- Array of {name, price}
  subtotal DECIMAL(10, 2) NOT NULL,
  tax DECIMAL(10, 2) NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  payment_method VARCHAR(50),
  paid_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- INDICES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_samples_patient_id ON samples(patient_id);
CREATE INDEX IF NOT EXISTS idx_samples_status ON samples(status);
CREATE INDEX IF NOT EXISTS idx_samples_created_at ON samples(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_test_results_sample_id ON test_results(sample_id);
CREATE INDEX IF NOT EXISTS idx_test_results_status ON test_results(status);

CREATE INDEX IF NOT EXISTS idx_reports_patient_id ON reports(patient_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_report_date ON reports(report_date DESC);

CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory(category);
CREATE INDEX IF NOT EXISTS idx_inventory_status ON inventory(status);

CREATE INDEX IF NOT EXISTS idx_invoices_patient_id ON invoices(patient_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_date ON invoices(invoice_date DESC);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_samples_updated_at BEFORE UPDATE ON samples
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_test_results_updated_at BEFORE UPDATE ON test_results
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) - Enable for all tables
-- =====================================================
ALTER TABLE samples ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Create policies for anon access (for development - adjust for production)
CREATE POLICY "Enable read access for all users" ON samples FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON samples FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON samples FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON samples FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON test_results FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON test_results FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON test_results FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON test_results FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON reports FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON reports FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON reports FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON inventory FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON inventory FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON inventory FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON inventory FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON invoices FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON invoices FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON invoices FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON invoices FOR DELETE USING (true);

-- =====================================================
-- SAMPLE DATA FOR TESTING
-- =====================================================
-- Insert sample data for samples
INSERT INTO samples (sample_id, patient_name, patient_id, test_type, status, priority, container_type, collected_by) VALUES
('S001', 'Rajesh Kumar', 'P12345', 'Complete Blood Count', 'completed', 'normal', 'EDTA Tube', 'Nurse Priya'),
('S002', 'Priya Sharma', 'P12346', 'Lipid Profile', 'processing', 'high', 'Serum Tube', 'Nurse Amit'),
('S003', 'Amit Patel', 'P12347', 'Thyroid Function Test', 'completed', 'normal', 'Serum Tube', 'Nurse Priya'),
('S004', 'Sneha Reddy', 'P12348', 'Liver Function Test', 'rejected', 'urgent', 'Serum Tube', 'Nurse Raj'),
('S005', 'Vikram Singh', 'P12349', 'HbA1c', 'collected', 'normal', 'Fluoride Tube', 'Nurse Amit')
ON CONFLICT (sample_id) DO NOTHING;

-- Insert sample inventory items
INSERT INTO inventory (item_id, item_name, category, quantity, unit, reorder_level, supplier, batch_number, expiry_date) VALUES
('INV001', 'Blood Collection Tubes (EDTA)', 'Consumables', 45, 'boxes', 50, 'MedSupply Co.', 'BCT2024-001', '2026-12-31'),
('INV002', 'Reagent Kit - CBC', 'Reagents', 12, 'kits', 20, 'BioLab Solutions', 'RGT-CBC-2024', '2026-06-30'),
('INV003', 'Glucose Test Strips', 'Consumables', 78, 'vials', 60, 'DiagnoTech', 'GTS-2024-045', '2027-01-31'),
('INV004', 'Centrifuge Machine', 'Equipment', 3, 'units', 1, 'LabEquip Inc.', 'CFG-2025-X', NULL),
('INV005', 'Reagent Kit - Lipid Profile', 'Reagents', 25, 'kits', 15, 'BioLab Solutions', 'RGT-LIP-2024', '2026-08-31'),
('INV006', 'Pipette Tips (1000μL)', 'Consumables', 150, 'packs', 100, 'LabGear Pro', 'PT-1000-2024', NULL)
ON CONFLICT (item_id) DO NOTHING;

-- Insert sample invoices
INSERT INTO invoices (invoice_id, patient_name, patient_id, tests, subtotal, tax, total, status, payment_method, paid_date) VALUES
('INV001', 'Rajesh Kumar', 'P12345', '[{"name": "Complete Blood Count", "price": 450}, {"name": "Blood Sugar", "price": 150}]'::jsonb, 600, 108, 708, 'paid', 'UPI', CURRENT_DATE),
('INV002', 'Priya Sharma', 'P12346', '[{"name": "Lipid Profile", "price": 850}, {"name": "Liver Function Test", "price": 650}]'::jsonb, 1500, 270, 1770, 'pending', NULL, NULL),
('INV003', 'Amit Patel', 'P12347', '[{"name": "Thyroid Function Test", "price": 750}]'::jsonb, 750, 135, 885, 'paid', 'Cash', CURRENT_DATE)
ON CONFLICT (invoice_id) DO NOTHING;
