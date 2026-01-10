# Test Results & Reports - Database Setup Guide

## 📋 Overview

I've created two new database tables to manage test results and reports, both linked to the `samples` table.

## 🗄️ Tables Created

### 1. **test_results** Table
Stores individual test results for each sample.

**Key Features:**
- ✅ Linked to `samples` table via `sample_id`
- ✅ Tracks result status (pending → in-progress → completed → verified → approved)
- ✅ Stores result values, units, and reference ranges
- ✅ Flags for abnormal, critical, and panic values
- ✅ Quality control tracking
- ✅ Verification and approval workflow
- ✅ Flexible JSON field for additional parameters

### 2. **reports** Table
Generates and manages laboratory reports.

**Key Features:**
- ✅ Linked to `samples` table via `sample_id`
- ✅ Auto-generates report numbers (REP-YYYY-MM-DD-XXXX)
- ✅ Tracks report status (draft → pending-review → reviewed → approved → published)
- ✅ Stores findings, interpretation, recommendations
- ✅ Digital signatures and approvals
- ✅ Distribution tracking (email sent, printed)
- ✅ Revision history support

## 📁 Files Created

1. **`test-results-schema.sql`** - Test Results table schema
2. **`reports-schema.sql`** - Reports table schema

## 🚀 Setup Instructions

### Step 1: Create Test Results Table

1. Open your **Supabase Dashboard**: https://tcpzfkrpyjgsfrzxddta.supabase.co
2. Go to **SQL Editor**
3. Open `test-results-schema.sql`
4.  **Copy the entire content**
5. **Paste** into SQL Editor
6. Click **Run**
7. Wait for "✅ Test Results table created successfully!"

### Step 2: Create Reports Table

1. In the same **SQL Editor**
2. Open `reports-schema.sql`
3. **Copy the entire content**
4. **Paste** into SQL Editor
5. Click **Run**
6. Wait for "✅ Reports table created successfully!"

### Step 3: Verify Tables

Go to **Table Editor** in Supabase and verify you see:
- ✅ `samples` (already exists)
- ✅ `test_results` (newly created)
- ✅ `reports` (newly created)

## 📊 Table Relationships

```
samples (parent)
    ↓
    ├─→ test_results (child)
    └─→ reports (child)
```

**Key Points:**
- One sample can have multiple test results
- One sample can have multiple reports (revisions)
- If a sample is deleted, all its test results and reports are also deleted (CASCADE)

## 🔑 Key Columns

### test_results Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `sample_id` | UUID | Links to samples table |
| `test_name` | VARCHAR | Name of the test |
| `result_status` | VARCHAR | pending, in-progress, completed, verified, approved |
| `result_value` | TEXT | The actual test result |
| `result_unit` | VARCHAR | Unit of measurement |
| `reference_range` | VARCHAR | Normal range |
| `interpretation` | VARCHAR | normal, abnormal, critical, borderline |
| `is_abnormal` | BOOLEAN | Flag for abnormal results |
| `is_critical` | BOOLEAN | Flag for critical results |
| `tested_by` | VARCHAR | Technician name |
| `tested_date` | TIMESTAMP | When test was performed |
| `verified_by` | VARCHAR | Who verified the result |
| `approved_by` | VARCHAR | Who approved the result |

### reports Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `sample_id` | UUID | Links to samples table |
| `report_number` | VARCHAR | Auto-generated (REP-YYYY-MM-DD-XXXX) |
| `status` | VARCHAR | draft, pending-review, reviewed, approved, published |
| `patient_name` | VARCHAR | Patient's name |
| `patient_mrno` | UUID | Patient MRN |
| `test_name` | VARCHAR | Test name |
| `findings` | TEXT | Test findings |
| `interpretation` | TEXT | Clinical interpretation |
| `recommendations` | TEXT | Doctor's recommendations |
| `tested_by` | VARCHAR | Who performed the test |
| `verified_by` | VARCHAR | Who verified the report |
| `approved_by` | VARCHAR | Who approved the report |
| `report_date` | TIMESTAMP | Report generation date |
| `is_urgent` | BOOLEAN | Urgent report flag |

## 🔄 Workflow

### Test Results Workflow

```
1. Sample Collected → samples table
2. Test Performed → test_results table (status: 'in-progress')
3. Results Entered → test_results table (result_value filled)
4. Results Verified → test_results table (status: 'verified')
5. Results Approved → test_results table (status: 'approved')
```

### Report Generation Workflow

```
1. Test Results Approved
2. Generate Report → reports table (status: 'draft')
3. Review Report → reports table (status: 'pending-review')
4. Verify Report → reports table (status: 'reviewed')
5. Approve Report → reports table (status: 'approved')
6. Publish Report → reports table (status: 'published')
7. Email/Print → email_sent, printed flags set
```

## 📝 Example Queries

### Get all test results for a sample

```sql
SELECT * 
FROM test_results 
WHERE sample_id = 'YOUR_SAMPLE_UUID' 
AND is_deleted = FALSE;
```

### Get pending test results with sample info

```sql
SELECT 
    tr.*,
    s.sample_id,
    s.patient_name,
    s.test_name
FROM test_results tr
JOIN samples s ON tr.sample_id = s.id
WHERE tr.result_status = 'pending' 
AND tr.is_deleted = FALSE;
```

### Get critical test results

```sql
SELECT * 
FROM test_results 
WHERE is_critical = TRUE 
AND is_deleted = FALSE
ORDER BY tested_date DESC;
```

### Get all reports for a patient

```sql
SELECT * 
FROM reports 
WHERE patient_mrno = 'YOUR_PATIENT_MRN' 
AND is_deleted = FALSE
ORDER BY report_date DESC;
```

### Get reports ready for approval

```sql
SELECT * 
FROM reports 
WHERE status = 'reviewed' 
AND verified_date IS NOT NULL 
AND approved_date IS NULL
AND is_deleted = FALSE;
```

## 🎯 Next Steps

After creating the tables:

1. ✅ Tables are ready in your database
2. 🔄 **Next**: I'll update the API to add CRUD functions for test_results and reports
3. 🔄 **Next**: I'll update TestResults.jsx component to use real data
4. 🔄 **Next**: I'll update ReportGeneration.jsx component to use real data

## 🔒 Security Notes

- ✅ Row Level Security (RLS) is enabled on both tables
- ⚠️ Currently set to allow all operations (development mode)
- 🔐 **Production**: Update RLS policies based on your authentication requirements

## 💡 Features Included

### Test Results
- ✅ Result tracking with multiple statuses
- ✅ Quality control management
- ✅ Abnormal/Critical value flagging
- ✅ Verification and approval workflow
- ✅ Flexible JSON storage for custom parameters

### Reports
- ✅ Auto-generated report numbers
- ✅ Multi-level approval workflow
- ✅ Distribution tracking
- ✅ Revision support
- ✅ Digital signatures
- ✅ Confidential and urgent flags

**Ready to create the tables? Run the SQL files in Supabase!** 🚀
