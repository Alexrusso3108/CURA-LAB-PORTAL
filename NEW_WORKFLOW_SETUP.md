# 🔬 CURA LAB PORTAL - New Workflow Setup Guide

## ✅ Correct Workflow Implementation

This guide explains how to set up the redesigned laboratory portal with the correct workflow.

---

## 📋 Workflow Overview

### Old (Wrong) Flow ❌
```
Sample Tracking → Test Results → Report Generation → Billing
```

### New (Correct) Flow ✅
```
External Billing System → Pending Bills → Enter Test Results → Auto-Generate Report
```

---

## 🗄 Database Setup

### Step 1: Run SQL Scripts in Supabase

Execute these SQL files in your Supabase SQL Editor **in this order**:

1. **`lab-results-schema.sql`** - Creates the main results table
   - Creates `lab_results` table with JSON parameter storage
   - Adds tracking columns to `opbilling` table
   - Sets up triggers for auto-detection of abnormal/critical values

2. **`test-templates-schema.sql`** - Creates test templates
   - Creates `test_templates` table
   - Inserts common test templates (CBC, Lipid Profile, LFT, KFT, etc.)

### Step 2: Verify Tables

After running the scripts, verify these tables exist:
- ✅ `lab_results` - Stores test results
- ✅ `test_templates` - Stores test parameter definitions
- ✅ `opbilling` - Should have new columns: `results_entered`, `results_entered_at`, `results_entered_by`, `lab_result_id`

---

## 🎯 How It Works

### 1. External Billing System Creates Bills

The front desk software creates bills in the `opbilling` table with:
- Patient MRN
- Test name (e.g., "Complete Blood Count")
- Bill amount
- Payment status

**Example Bill:**
```sql
INSERT INTO opbilling (patient_mrno, service_type_name, total_amount, payment_status)
VALUES ('P12345', 'Complete Blood Count', 500.00, 'paid');
```

### 2. Lab Portal Shows Pending Bills

The lab portal displays all bills where `results_entered = FALSE`:

```
┌─────────────────────────────────────────────────────┐
│  📋 Pending Test Bills                              │
├─────────────────────────────────────────────────────┤
│  MRN      Test Name                    Action       │
│  P12345   Complete Blood Count         [Enter]      │
│  P12346   Lipid Profile                [Enter]      │
└─────────────────────────────────────────────────────┘
```

### 3. User Clicks "Enter Results"

When clicked:
1. System fetches bill details
2. Looks up test template for "Complete Blood Count"
3. Displays form with pre-defined parameters

### 4. Dynamic Form Based on Test Type

**For CBC (Complete Blood Count):**
```
Parameter         Value    Unit      Range           Status
Hemoglobin       [14.5]   g/dL      13-17 (M)       ✓ Normal
RBC Count        [4.8 ]   M/µL      4.5-5.5         ✓ Normal
WBC Count        [7200]   /µL       4000-11000      ✓ Normal
Platelet Count   [250k]   /µL       150k-450k       ✓ Normal
```

**For Lipid Profile:**
```
Parameter            Value    Unit      Range        Status
Total Cholesterol   [180 ]   mg/dL     <200         ✓ Normal
HDL Cholesterol     [55  ]   mg/dL     >40 (M)      ✓ Normal
LDL Cholesterol     [110 ]   mg/dL     <100         ⚠️ Abnormal
Triglycerides       [140 ]   mg/dL     <150         ✓ Normal
```

### 5. Auto-Calculate Status

As user enters values, system automatically:
- Compares value with reference range
- Marks as **Normal**, **Abnormal**, or **Critical**
- Highlights abnormal values in yellow/red

### 6. Save Results

When saved:
```javascript
{
  "bill_id": "uuid-of-bill",
  "patient_mrno": "P12345",
  "test_name": "Complete Blood Count",
  "test_parameters": {
    "hemoglobin": {
      "value": "14.5",
      "unit": "g/dL",
      "reference_range": "13-17 (M)",
      "status": "normal",
      "flag": ""
    },
    "rbc_count": {
      "value": "4.8",
      "unit": "M/µL",
      "reference_range": "4.5-5.5",
      "status": "normal",
      "flag": ""
    }
    // ... other parameters
  },
  "overall_interpretation": "normal",
  "has_abnormal_values": false,
  "has_critical_values": false,
  "tested_by": "Dr. Sharma",
  "status": "completed"
}
```

### 7. Update Bill Status

After saving:
- `opbilling.results_entered` = `TRUE`
- `opbilling.results_entered_at` = current timestamp
- `opbilling.lab_result_id` = ID of created result

---

## 🧪 Test Templates

### Available Templates

The system comes with these pre-configured tests:

1. **Complete Blood Count (CBC)**
   - Hemoglobin, RBC Count, WBC Count, Platelet Count, Hematocrit, MCV, MCH, MCHC

2. **Lipid Profile**
   - Total Cholesterol, HDL, LDL, VLDL, Triglycerides, Cholesterol/HDL Ratio

3. **Liver Function Test (LFT)**
   - Bilirubin (Total/Direct), SGOT, SGPT, Alkaline Phosphatase, Total Protein, Albumin, Globulin, A/G Ratio

4. **Kidney Function Test (KFT)**
   - Blood Urea, Serum Creatinine, Uric Acid, Sodium, Potassium, Chloride

5. **Thyroid Function Test**
   - T3, T4, TSH

6. **Blood Sugar Tests**
   - Fasting Blood Sugar, Random Blood Sugar, HbA1c

### Adding New Test Templates

To add a new test, insert into `test_templates`:

```sql
INSERT INTO test_templates (test_name, test_code, test_category, parameters)
VALUES (
  'Your Test Name',
  'CODE',
  'Category',
  '[
    {
      "name": "parameter_name",
      "display_name": "Parameter Display Name",
      "unit": "mg/dL",
      "reference_range": "10-20",
      "type": "numeric",
      "required": true,
      "order": 1
    }
  ]'::jsonb
);
```

---

## 🎨 User Interface

### Main Screen: Pending Bills

Shows two tabs:
1. **Pending** - Bills without results
2. **Completed** - Bills with results entered

### Statistics Cards

- Total Bills
- Pending Results
- Results Entered
- Paid Bills

### Search & Filter

- Search by patient MRN or test name
- Filter by payment status

---

## 🔄 Complete Data Flow

```
┌─────────────────────────────────────────────────────────┐
│  1. External Billing System                             │
│     Creates bill in opbilling table                     │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  2. Lab Portal - Pending Bills View                     │
│     SELECT * FROM opbilling                             │
│     WHERE results_entered = FALSE                       │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼ (User clicks "Enter Results")
┌─────────────────────────────────────────────────────────┐
│  3. Fetch Test Template                                 │
│     SELECT * FROM test_templates                        │
│     WHERE test_name = bill.service_type_name            │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  4. Display Dynamic Form                                │
│     Show parameters from template                       │
│     User enters values                                  │
│     Auto-calculate normal/abnormal                      │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼ (User clicks "Save")
┌─────────────────────────────────────────────────────────┐
│  5. Save to lab_results                                 │
│     INSERT INTO lab_results (...)                       │
│     VALUES (bill_id, parameters_json, ...)              │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  6. Update opbilling                                    │
│     UPDATE opbilling                                    │
│     SET results_entered = TRUE                          │
│     WHERE id = bill_id                                  │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  7. Auto-Generate Report (Future)                       │
│     Create report from results                          │
│     Status: draft → ready for review                    │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 Data Structure

### lab_results Table

```javascript
{
  id: "uuid",
  bill_id: "uuid-of-bill",
  patient_mrno: "P12345",
  patient_name: "Rajesh Kumar",
  patient_age: 45,
  patient_gender: "Male",
  test_name: "Complete Blood Count",
  test_parameters: {
    // JSON object with all test parameters
  },
  overall_interpretation: "normal" | "abnormal" | "critical",
  has_abnormal_values: false,
  has_critical_values: false,
  status: "draft" | "completed" | "verified" | "approved",
  tested_by: "Dr. Sharma",
  tested_date: "2026-01-29T10:30:00Z",
  technician_notes: "Sample quality good",
  created_at: "2026-01-29T10:30:00Z"
}
```

---

## 🚀 Getting Started

### 1. Run Database Scripts

```bash
# In Supabase SQL Editor:
# 1. Run lab-results-schema.sql
# 2. Run test-templates-schema.sql
```

### 2. Verify Setup

```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('lab_results', 'test_templates');

-- Check test templates
SELECT test_name, test_code FROM test_templates;

-- Check opbilling columns
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'opbilling' 
AND column_name LIKE 'results%';
```

### 3. Test with Sample Data

```sql
-- Create a test bill
INSERT INTO opbilling (
  patient_mrno, 
  service_type_name, 
  total_amount, 
  payment_status
)
VALUES (
  gen_random_uuid(), 
  'Complete Blood Count', 
  500.00, 
  'paid'
);
```

### 4. Start Development Server

```bash
npm run dev
```

### 5. Test the Workflow

1. Open the app
2. You should see the pending bill
3. Click "Enter Results"
4. Fill in the CBC parameters
5. Save
6. Bill should move to "Completed" tab

---

## ✅ Benefits of New Workflow

1. **No Duplicate Entry** - Patient details already in bill
2. **Standardized Tests** - Templates ensure consistency
3. **Faster Entry** - Click → Enter → Save
4. **Auto-Validation** - Reference ranges pre-defined
5. **Auto-Interpretation** - Normal/Abnormal calculated
6. **Complete Audit Trail** - Bill → Results → Report
7. **Flexible Storage** - JSON handles any test type

---

## 🔧 Customization

### Adding Custom Tests

1. Create template in `test_templates` table
2. Define all parameters with units and ranges
3. System automatically generates form

### Modifying Reference Ranges

Update the template:
```sql
UPDATE test_templates
SET parameters = jsonb_set(
  parameters,
  '{0,reference_range}',
  '"new-range"'
)
WHERE test_name = 'Your Test';
```

---

## 📝 Next Steps

1. ✅ Database setup complete
2. ✅ UI components created
3. ✅ API layer implemented
4. 🔄 Test with real data
5. 🔄 Add report auto-generation
6. 🔄 Add result verification workflow
7. 🔄 Add PDF export

---

## 🎯 Key Files

- **Database**: `lab-results-schema.sql`, `test-templates-schema.sql`
- **API**: `src/lib/newApi.js`
- **Components**: 
  - `src/components/PendingBills.jsx` - Main entry point
  - `src/components/TestResultEntry.jsx` - Dynamic form
- **App**: `src/App.jsx` - Updated routing

---

*This is the correct workflow for a laboratory management system integrated with an external billing system.*
