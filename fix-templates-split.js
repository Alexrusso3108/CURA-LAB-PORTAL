
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

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const cbcParameters = [
  { "name": "hemoglobin", "display_name": "HEMOGLOBIN", "unit": "gms%", "reference_range": "14 - 18", "type": "numeric", "required": true, "order": 1 },
  { "name": "wbc_count", "display_name": "TOTAL COUNT", "unit": "cells/cmm", "reference_range": "4000 - 11000", "type": "numeric", "required": true, "order": 2 },
  { "name": "rbc_count", "display_name": "RBC COUNT", "unit": "Millions/c", "reference_range": "4.7 - 6.1", "type": "numeric", "required": true, "order": 3 },
  { "name": "platelet_count", "display_name": "PLATELET COUNT", "unit": "Lakhs/cmm", "reference_range": "1.5 - 4.5", "type": "numeric", "required": true, "order": 4 },
  { "name": "hematocrit", "display_name": "PACKED CELL VOLUME", "unit": "%", "reference_range": "35 - 45", "type": "numeric", "required": true, "order": 5 },
  { "name": "mcv", "display_name": "MCV", "unit": "fl", "reference_range": "80 - 99", "type": "numeric", "required": true, "order": 6 },
  { "name": "mch", "display_name": "MCH", "unit": "pg/mL", "reference_range": "26 - 32", "type": "numeric", "required": true, "order": 7 },
  { "name": "mchc", "display_name": "MCHC", "unit": "g/dl", "reference_range": "30 - 36", "type": "numeric", "required": true, "order": 8 }
];

const diffCountParameters = [
  { "name": "neutrophils", "display_name": "NEUTROPHILS", "unit": "%", "reference_range": "40 - 70", "type": "numeric", "required": true, "order": 1 },
  { "name": "lymphocytes", "display_name": "LYMPHOCYTES", "unit": "%", "reference_range": "20 - 45", "type": "numeric", "required": true, "order": 2 },
  { "name": "eosinophil", "display_name": "EOSINOPHIL", "unit": "%", "reference_range": "2 - 6", "type": "numeric", "required": true, "order": 3 },
  { "name": "monocytes", "display_name": "MONOCYTES", "unit": "%", "reference_range": "1 - 8", "type": "numeric", "required": true, "order": 4 },
  { "name": "basophil", "display_name": "BASOPHIL", "unit": "%", "reference_range": "0 - 1", "type": "numeric", "required": true, "order": 5 }
];

async function splitTemplates() {
  console.log('🔄 Reverting "Complete Blood Count" template...');

  // 1. Revert CBC
  const { error: cbcError } = await supabase
    .from('test_templates')
    .update({
      parameters: cbcParameters,
      updated_at: new Date().toISOString()
    })
    .eq('test_name', 'Complete Blood Count');

  if (cbcError) console.error('❌ Error reverting CBC:', cbcError);
  else console.log('✅ CBC Template reverted to original.');

  // 2. Create/Update Differential Count
  console.log('🔄 Creating/Updating "Differential Count" template...');

  // Check if exists
  const { data: existing } = await supabase
    .from('test_templates')
    .select('id')
    .ilike('test_name', 'Differential Count')
    .maybeSingle();

  if (existing) {
    const { error: diffError } = await supabase
      .from('test_templates')
      .update({
        parameters: diffCountParameters,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id);

    if (diffError) console.error('❌ Error updating Differential Count:', diffError);
    else console.log('✅ Differential Count Template updated.');
  } else {
    const { error: createError } = await supabase
      .from('test_templates')
      .insert({
        test_name: 'Differential Count',
        test_code: 'DIFF',
        parameters: diffCountParameters,
        is_active: true,
        price: 150 // Default price
      });

    if (createError) console.error('❌ Error creating Differential Count:', createError);
    else console.log('✅ Differential Count Template created.');
  }
}

splitTemplates();
