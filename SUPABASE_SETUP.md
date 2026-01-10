# Supabase Database Setup Instructions

## Step 1: Access Your Supabase Project

1. Go to [https://tcpzfkrpyjgsfrzxddta.supabase.co](https://tcpzfkrpyjgsfrzxddta.supabase.co)
2. Log in to your Supabase dashboard

## Step 2: Create Database Tables

1. In the Supabase dashboard, go to the **SQL Editor** (icon on the left sidebar)
2. Click **"New Query"**
3. Copy the entire contents of the `database-schema.sql` file
4. Paste it into the SQL editor
5. Click **"Run"** or press `Ctrl+Enter`

This will create:
- ✅ 5 tables: `samples`, `test_results`, `reports`, `inventory`, `invoices`
- ✅ Automatic ID generation with UUIDs
- ✅ Indexes for fast queries
- ✅ Auto-updating timestamps
- ✅ Row Level Security (RLS) policies
- ✅ Sample data for testing

## Step 3: Verify Tables Were Created

1. Go to **Table Editor** in the Supabase dashboard
2. You should see all 5 tables listed:
   - samples
   - test_results
   - reports
   - inventory
   - invoices

## Step 4: Restart the Development Server

The `.env` file has been created with your Supabase credentials. You need to restart the dev server to load the environment variables:

1. Stop the current development server (if running)
2. Run: `npm run dev`

## Connection Details

- **Supabase URL**: https://tcpzfkrpyjgsfrzxddta.supabase.co
- **Environment File**: `.env` (already created)
- **Supabase Client**: `src/lib/supabase.js`
- **API Service**: `src/lib/api.js`

## Database Schema Overview

### Samples Table
- Tracks all laboratory samples
- Fields: sample_id, patient details, test type, status, priority, container type, etc.
- Status: collected → processing → completed/rejected

### Test Results Table
- Stores test results linked to samples
- JSONB field for flexible parameter storage
- Verification tracking

### Reports Table
- Generated reports for patients
- Links to samples and test results
- Status tracking (ready → generated → sent)

### Inventory Table
- Equipment, reagents, and consumables tracking
- Auto-calculated status (adequate/low/critical)
- Expiry date monitoring

### Invoices Table
- Patient billing and invoicing
- JSONB for multiple tests per invoice
- Payment tracking with GST calculation

## Next Steps

After setting up the database:

1. **Restart the dev server** to load environment variables
2. The app will automatically connect to Supabase
3. Components will fetch real data from the database
4. Sample data is already loaded for testing

## Troubleshooting

If you encounter issues:

1. **Check environment variables are loaded**:
   - Restart the dev server after creating `.env`
   - Verify `import.meta.env.VITE_SUPABASE_URL` is not undefined

2. **Check RLS policies**:
   - Make sure Row Level Security policies allow anon access
   - Policies are created by the SQL script

3. **Check for errors**:
   - Open browser console (F12)
   - Look for Supabase-related errors
   - Check network tab for failed API calls

## Security Note

⚠️ The current RLS policies allow full access for development. For production:
1. Implement proper authentication
2. Restrict RLS policies based on user roles
3. Use service role key for admin operations only
