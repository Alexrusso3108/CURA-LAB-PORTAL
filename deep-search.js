
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

async function deepSearch() {
  const { data, error } = await supabase.from('test_templates').select('id, test_name, parameters');
  if (error) return;

  const results = [];
  data.forEach(t => {
    const params = typeof t.parameters === 'string' ? JSON.parse(t.parameters) : t.parameters;
    const hasNeutrophils = params.some(p => p.display_name && p.display_name.toUpperCase().includes('NEUTROPHILS'));
    if (hasNeutrophils) {
      results.push({
        id: t.id,
        name: t.test_name,
        paramCount: params.length,
        paramNames: params.map(p => p.display_name)
      });
    }
  });

  fs.writeFileSync('neutrophils_templates.txt', JSON.stringify(results, null, 2));
}

deepSearch();
