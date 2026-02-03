
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

async function checkPendingBills() {
  const { data, error } = await supabase
    .from('opbilling')
    .select('service_name, patient_mrno')
    .eq('results_entered', false)
    .order('opbill_id', { ascending: false })
    .limit(50);

  if (error) {
    fs.writeFileSync('bills_output.txt', error.message);
    return;
  }

  const output = data.map(b => `Bill: "${b.service_name}" | MRN: ${b.patient_mrno}`).join('\n');
  fs.writeFileSync('bills_output.txt', output);
}

checkPendingBills();
