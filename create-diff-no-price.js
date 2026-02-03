
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadEnv() {
  const envPath = path.resolve(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        if (value.length > 0 && value.startsWith('"') && value.endsWith('"')) {
          value = value.substring(1, value.length - 1);
        }
        process.env[key] = value;
      }
    });
  }
}

loadEnv();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const diffCountParameters = [
  { "name": "neutrophils", "display_name": "NEUTROPHILS", "unit": "%", "reference_range": "40 - 70", "type": "numeric", "required": true, "order": 1 },
  { "name": "lymphocytes", "display_name": "LYMPHOCYTES", "unit": "%", "reference_range": "20 - 45", "type": "numeric", "required": true, "order": 2 },
  { "name": "eosinophil", "display_name": "EOSINOPHIL", "unit": "%", "reference_range": "2 - 6", "type": "numeric", "required": true, "order": 3 },
  { "name": "monocytes", "display_name": "MONOCYTES", "unit": "%", "reference_range": "1 - 8", "type": "numeric", "required": true, "order": 4 },
  { "name": "basophil", "display_name": "BASOPHIL", "unit": "%", "reference_range": "0 - 1", "type": "numeric", "required": true, "order": 5 }
];

async function run() {
  console.log('🔄 Creating Differential Count Template (No Price)...');

  // Using upsert on test_name unique constraint
  // REMOVED price field
  const { data, error } = await supabase
    .from('test_templates')
    .upsert({
      test_name: 'Differential Count', // Unique Key
      test_code: 'DIFF',
      test_category: 'Hematology',
      parameters: diffCountParameters,
      is_active: true,
      // price: 150, // <-- REMOVED
      sample_type: 'Blood (EDTA)',
      turnaround_time: '2-4 hours',
      updated_at: new Date().toISOString()
    }, { onConflict: 'test_name' })
    .select();

  if (error) {
    console.error('❌ Error:', error);
  } else {
    console.log('✅ Successfully created/updated Differential Count template.');
  }
}

run();
