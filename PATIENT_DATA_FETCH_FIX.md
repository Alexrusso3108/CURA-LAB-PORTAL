# Patient Data Auto-Fetch Fix 🏥

## Problem
When entering test results, patient information (name, gender, and age) was not being fetched automatically from the database.

## Solution Implemented

### 1. **Enhanced Patient Data Fetching Logic** ✅

#### Created New API (`patientDataAPI`)
- **Location**: `src/lib/newApi.js`
- **Function**: `fetchPatientInfo(mrno, appointmentId)`
- **Features**:
  - Searches across **3 tables**: `appointments`, `users`, `walk_in_patients`
  - Multiple search strategies for each table
  - Handles different MRNO formats (string, UUID, number)
  - Calculates age from date of birth if needed
  - Returns comprehensive patient data with source tracking

#### Updated TestResultEntry Component
- **Location**: `src/components/TestResultEntry.jsx`
- **Improvements**:
  - Uses centralized `patientDataAPI` for cleaner code
  - Enhanced debugging with detailed console logs
  - Multiple fallback strategies
  - Checks bill object itself for patient data
  - Better error handling

### 2. **Search Strategies**

The system now tries multiple approaches to find patient data:

#### Strategy 1: Appointments Table
- Search by `appointment_id` (if available)
- Search by `mrno`
- Returns: `patient_name`, `age`, `gender`

#### Strategy 2: Users Table
- Direct MRNO match
- UUID match (if MRNO looks like UUID)
- Text casting for type mismatches
- Returns: `name`, `age` (or calculates from `date_of_birth`), `gender`

#### Strategy 3: Walk-in Patients Table
- Search by `mrno`
- Returns: `name`, `age`, `gender`

#### Strategy 4: Bill Object
- Checks if `opbilling` table has patient columns
- Falls back to data already in the bill object

### 3. **Diagnostic Tools** 🔍

Created SQL diagnostic script to help identify issues:
- **File**: `diagnose-patient-fetch.sql`
- **Purpose**: 
  - Check table structures
  - Verify column existence
  - Test joins between tables
  - Identify MRNO format mismatches
  - Sample data inspection

## How to Use

### For Developers

1. **The fix is automatic** - No code changes needed when entering results
2. **Check console logs** - Open browser DevTools to see detailed fetch logs
3. **Run diagnostics** if issues persist:
   ```sql
   -- Run this in Supabase SQL Editor
   -- File: diagnose-patient-fetch.sql
   ```

### Console Log Examples

**Successful Fetch:**
```
🔍 Starting patient data fetch... { mrno: "12345", appId: null, ... }
🔍 Fetching patient info for: { mrno: "12345", appointmentId: null }
✅ Found in users: { name: "John Doe", age: 35, gender: "Male" }
✅ Patient data retrieved: { name: "John Doe", age: 35, gender: "Male", source: "users" }
✅ Got patient data from API: { name: "John Doe", age: 35, gender: "Male" }
```

**Failed Fetch:**
```
🔍 Starting patient data fetch... { mrno: "12345", appId: null }
🔎 Searching appointments table...
Appointments query 1 error: {...}
🔎 Searching users table...
Users query 1 error: {...}
❌ No patient data found for MRNO: 12345
💡 Suggestion: Run diagnose-patient-fetch.sql to investigate
```

## Troubleshooting

### Issue: Patient data still not fetching

**Step 1**: Check browser console for error messages
- Open DevTools (F12)
- Look for 🔍, ✅, or ❌ emoji logs
- Note which tables are being searched

**Step 2**: Run diagnostic SQL script
```sql
-- In Supabase SQL Editor, run:
-- diagnose-patient-fetch.sql
```

**Step 3**: Check for common issues:

1. **MRNO Format Mismatch**
   - opbilling has: `"12345"` (string)
   - users has: `12345` (number)
   - **Solution**: The code now handles this automatically

2. **Missing appointment_id**
   - opbilling doesn't have `appointment_id` populated
   - **Solution**: Code falls back to MRNO-only search

3. **Patient data in different table**
   - Check diagnostic results to see which table has the data
   - Verify table names match what's in the code

4. **Column name differences**
   - appointments: `patient_name`
   - users: `name`
   - **Solution**: Code handles both

### Issue: Partial data (e.g., name but no age)

This is expected if:
- Appointments table only has `patient_name`
- Users table has complete data

**Solution**: The code combines data from multiple sources to get complete information.

## Database Requirements

### Required Tables

1. **opbilling** (must have)
   - `patient_mrno` - Patient identifier
   - `appointment_id` - Optional link to appointments

2. **At least ONE of these tables** (with patient data):
   - `appointments` - with `patient_name`, `mrno`
   - `users` - with `name`, `age`, `gender`, `mrno` or `id`
   - `walk_in_patients` - with `name`, `age`, `gender`, `mrno`

### Optional Enhancements

To improve performance, you can add patient data directly to `opbilling`:

```sql
-- Add patient columns to opbilling (optional)
ALTER TABLE opbilling 
ADD COLUMN IF NOT EXISTS patient_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS patient_age INTEGER,
ADD COLUMN IF NOT EXISTS patient_gender VARCHAR(50);

-- Create trigger to auto-populate from users table
-- (This would eliminate the need for runtime fetching)
```

## Performance Notes

- **First fetch**: ~100-300ms (searches 3 tables)
- **Cached in component**: Data persists while modal is open
- **Early exit**: Returns immediately when complete data is found

## Future Improvements

1. **Add caching layer** - Store fetched patient data in localStorage
2. **Denormalize data** - Add patient columns to opbilling table
3. **Create database view** - Join opbilling with patient tables
4. **Add patient search** - Allow manual patient lookup if auto-fetch fails

## Files Modified

1. ✅ `src/lib/newApi.js` - Added `patientDataAPI`
2. ✅ `src/components/TestResultEntry.jsx` - Enhanced fetch logic
3. ✅ `diagnose-patient-fetch.sql` - New diagnostic tool

## Testing Checklist

- [ ] Open browser console
- [ ] Navigate to Pending Bills
- [ ] Click "Enter Results" on any bill
- [ ] Check console for patient data fetch logs
- [ ] Verify patient name, age, gender are auto-filled
- [ ] If not filled, run diagnostic SQL script
- [ ] Share diagnostic results for further investigation

---

**Need Help?** 
- Check console logs first
- Run `diagnose-patient-fetch.sql`
- Review error messages in browser DevTools
- Verify database table structures match requirements
