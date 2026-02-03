
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

const coagulationParameters = [
  {
    "name": "pt",
    "display_name": "PT",
    "unit": "seconds",
    "reference_range": "10 - 14",
    "type": "numeric",
    "required": true,
    "order": 1
  },
  {
    "name": "inr",
    "display_name": "INR",
    "unit": "",
    "reference_range": "0.8 - 1.1",
    "type": "numeric",
    "required": true,
    "order": 2
  },
  {
    "name": "aptt",
    "display_name": "ACTIVATED PARTIAL THROMBOPLASTIN TIME (APTT)",
    "unit": "seconds",
    "reference_range": "22 - 35",
    "type": "numeric",
    "required": true,
    "order": 3
  }
];

async function run() {
  console.log('🔄 Creating Coagulation Profile Template...');

  const { data, error } = await supabase
    .from('test_templates')
    .upsert({
      test_name: 'Coagulation Profile',
      test_code: 'COAG',
      test_category: 'Hematology',
      parameters: coagulationParameters,
      is_active: true,
      sample_type: 'Blood (Citrate)',
      turnaround_time: '2-4 hours',
      updated_at: new Date().toISOString()
    }, { onConflict: 'test_name' })
    .select();

  if (error) {
    console.error('❌ Error:', error);
  } else {
    console.log('✅ Successfully created/updated Coagulation Profile template.');
  }
}

run();
