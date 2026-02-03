
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

async function inspectTemplates() {
  console.log('🔍 Inspecting all test templates...');
  const { data, error } = await supabase.from('test_templates').select('test_name, parameters');

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  console.log(`Found ${data.length} templates:`);
  data.forEach((t, i) => {
    const params = typeof t.parameters === 'string' ? JSON.parse(t.parameters) : t.parameters;
    console.log(`${i + 1}. Name: "${t.test_name}" | Parameters: ${params.length}`);
    if (t.test_name.toLowerCase().includes('cbc') || t.test_name.toLowerCase().includes('blood count')) {
      console.log('   - Parameters:', params.map(p => p.display_name).join(', '));
    }
  });
}

inspectTemplates();
