
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

const rftParameters = [
  {
    "name": "blood_urea",
    "display_name": "BLOOD UREA",
    "unit": "mg/dl",
    "reference_range": "15 - 45",
    "type": "numeric",
    "required": true,
    "order": 1
  },
  {
    "name": "serum_creatinine",
    "display_name": "SERUM CREATININE",
    "unit": "mg/dl",
    "reference_range": "0.7 - 1.3",
    "type": "numeric",
    "required": true,
    "order": 2
  }
];

async function run() {
  console.log('🔄 Creating Renal Function Test (RFT) Template...');

  const { data, error } = await supabase
    .from('test_templates')
    .upsert({
      test_name: 'Renal Function Test',
      test_code: 'RFT',
      test_category: 'Biochemistry',
      parameters: rftParameters,
      is_active: true,
      sample_type: 'Blood (Serum)',
      turnaround_time: 'Same day',
      updated_at: new Date().toISOString()
    }, { onConflict: 'test_name' })
    .select();

  if (error) {
    console.error('❌ Error:', error);
  } else {
    console.log('✅ Successfully created/updated Renal Function Test template.');
  }
}

run();
