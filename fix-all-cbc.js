
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

const updatedParameters = [
  {
    "name": "hemoglobin",
    "display_name": "HEMOGLOBIN",
    "unit": "gms%",
    "reference_range": "14 - 18",
    "type": "numeric",
    "required": true,
    "order": 1
  },
  {
    "name": "wbc_count",
    "display_name": "TOTAL COUNT",
    "unit": "cells/cmm",
    "reference_range": "4000 - 11000",
    "type": "numeric",
    "required": true,
    "order": 2
  },
  {
    "name": "rbc_count",
    "display_name": "RBC COUNT",
    "unit": "Millions/c",
    "reference_range": "4.7 - 6.1",
    "type": "numeric",
    "required": true,
    "order": 3
  },
  {
    "name": "platelet_count",
    "display_name": "PLATELET COUNT",
    "unit": "Lakhs/cmm",
    "reference_range": "1.5 - 4.5",
    "type": "numeric",
    "required": true,
    "order": 4
  },
  {
    "name": "hematocrit",
    "display_name": "PACKED CELL VOLUME",
    "unit": "%",
    "reference_range": "35 - 45",
    "type": "numeric",
    "required": true,
    "order": 5
  },
  {
    "name": "mcv",
    "display_name": "MCV",
    "unit": "fl",
    "reference_range": "80 - 99",
    "type": "numeric",
    "required": true,
    "order": 6
  },
  {
    "name": "mch",
    "display_name": "MCH",
    "unit": "pg/mL",
    "reference_range": "26 - 32",
    "type": "numeric",
    "required": true,
    "order": 7
  },
  {
    "name": "mchc",
    "display_name": "MCHC",
    "unit": "g/dl",
    "reference_range": "30 - 36",
    "type": "numeric",
    "required": true,
    "order": 8
  }
];

async function fixAllCBCTemplates() {
  console.log('🔄 Fixing all "Complete Blood Count" variations...');

  // Find all templates that look like CBC
  const { data: templates } = await supabase
    .from('test_templates')
    .select('id, test_name')
    .or('test_name.ilike.%blood count%,test_name.ilike.%cbc%');

  if (templates) {
    console.log(`Found ${templates.length} potential templates.`);
    for (const t of templates) {
      console.log(`Updating "${t.test_name}"...`);
      const { error } = await supabase
        .from('test_templates')
        .update({ parameters: updatedParameters })
        .eq('id', t.id);

      if (error) console.error(`Failed to update ${t.test_name}:`, error.message);
      else console.log(`Successfully updated ${t.test_name}`);
    }
  }
}

fixAllCBCTemplates();
