import { supabase } from './supabase';

// =====================================================
// PATIENT DATA API - Fetch patient information
// =====================================================
export const patientDataAPI = {
  // Comprehensive patient data fetch from multiple sources
  async fetchPatientInfo(mrno, appointmentId = null) {
    try {
      console.log('🔍 Fetching patient info for:', { mrno, appointmentId });

      let patientData = {
        name: '',
        age: null,
        gender: '',
        source: null
      };

      // Helper function to calculate age from DOB
      const calculateAge = (dob) => {
        if (!dob) return null;
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        return age;
      };

      // 1. Try appointments table first
      if (appointmentId || mrno) {
        try {
          let query = supabase
            .from('appointments')
            .select('patient_name, mrno');

          if (appointmentId) {
            query = query.eq('appointment_id', appointmentId);
          } else {
            query = query.eq('mrno', mrno);
          }

          const { data, error } = await query
            .order('created_at', { ascending: false })
            .limit(1);

          if (!error && data && data.length > 0 && data[0].patient_name) {
            console.log('✅ Found in appointments:', data[0]);
            patientData.name = data[0].patient_name;
            patientData.age = data[0].age || patientData.age;
            patientData.gender = data[0].gender || patientData.gender;
            patientData.source = 'appointments';

            // If we have complete data, return early
            if (patientData.name && patientData.age && patientData.gender) {
              return patientData;
            }
          }
        } catch (err) {
          console.warn('Appointments query error:', err);
        }
      }

      // 2. Try users table
      if (mrno && !patientData.name) {
        try {
          // Only try MRNO match - users table doesn't have 'id' column
          const { data, error } = await supabase.from('users')
            .select('name, age, gender, mrno')
            .eq('mrno', mrno)
            .maybeSingle();

          if (!error && data) {
            console.log('✅ Found in users:', data);
            patientData.name = patientData.name || data.name || '';
            patientData.age = patientData.age || data.age;
            patientData.gender = patientData.gender || data.gender || '';
            patientData.source = patientData.source || 'users';

            if (patientData.name && patientData.age && patientData.gender) {
              return patientData;
            }
          }
        } catch (err) {
          console.warn('Users query error:', err);
        }
      }

      // 3. Try walk-in patients table (if it exists and has data)
      // Note: Skipping this table as it doesn't have mrno column
      // You can manually add patient data if needed

      if (patientData.name || patientData.age || patientData.gender) {
        console.log('✅ Patient data retrieved:', patientData);
        return patientData;
      } else {
        console.warn('❌ No patient data found for MRNO:', mrno);
        return null;
      }
    } catch (error) {
      console.error('Error fetching patient info:', error);
      return null;
    }
  }
};

// =====================================================
// LAB RESULTS API - New workflow
// =====================================================
export const labResultsAPI = {
  // Get all lab results with optional filters
  async getAllResults(filters = {}) {
    try {
      let query = supabase
        .from('lab_results')
        .select(`
          *,
          opbilling:bill_id (
            id,
            patient_mrno,
            service_type_name,
            total_amount,
            bill_date
          )
        `)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.patient_mrno) {
        query = query.eq('patient_mrno', filters.patient_mrno);
      }

      if (filters.test_name) {
        query = query.ilike('test_name', `%${filters.test_name}%`);
      }

      if (filters.has_abnormal) {
        query = query.eq('has_abnormal_values', true);
      }

      if (filters.has_critical) {
        query = query.eq('has_critical_values', true);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching lab results:', error);
      throw error;
    }
  },

  // Get result by bill ID
  async getResultByBillId(billId) {
    try {
      const { data, error } = await supabase
        .from('lab_results')
        .select('*')
        .eq('bill_id', String(billId))
        .eq('is_deleted', false)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
      return data;
    } catch (error) {
      console.error('Error fetching result by bill ID:', error);
      throw error;
    }
  },

  // Create new lab result
  async createResult(resultData) {
    try {
      // Convert IDs to strings for VARCHAR compatibility
      const dataToInsert = {
        ...resultData,
        bill_id: String(resultData.bill_id),
        patient_mrno: String(resultData.patient_mrno)
      };

      const { data, error } = await supabase
        .from('lab_results')
        .insert([dataToInsert])
        .select()
        .single();

      if (error) throw error;

      // Update opbilling table to mark results as entered
      if (data && resultData.bill_id) {
        await supabase
          .from('opbilling')
          .update({
            results_entered: true,
            results_entered_at: new Date().toISOString(),
            results_entered_by: resultData.tested_by || 'Lab Technician',
            lab_result_id: data.id
          })
          .eq('opbill_id', resultData.bill_id);
      }

      return data;
    } catch (error) {
      console.error('Error creating lab result:', error);
      throw error;
    }
  },

  // Update lab result
  async updateResult(id, updates) {
    try {
      const { data, error } = await supabase
        .from('lab_results')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating lab result:', error);
      throw error;
    }
  },

  // Update result status
  async updateStatus(id, status, additionalData = {}) {
    try {
      const updates = {
        status,
        ...additionalData
      };

      // Add timestamp based on status
      if (status === 'verified') {
        updates.verified_date = new Date().toISOString();
      } else if (status === 'approved') {
        updates.approved_date = new Date().toISOString();
      }

      return await this.updateResult(id, updates);
    } catch (error) {
      console.error('Error updating result status:', error);
      throw error;
    }
  },

  // Get pending results (draft status)
  async getPendingResults() {
    try {
      const { data, error } = await supabase
        .from('lab_results')
        .select('*')
        .eq('status', 'draft')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching pending results:', error);
      throw error;
    }
  },

  // Get abnormal results
  async getAbnormalResults() {
    try {
      const { data, error } = await supabase
        .from('lab_results')
        .select('*')
        .eq('has_abnormal_values', true)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching abnormal results:', error);
      throw error;
    }
  },

  // Get critical results
  async getCriticalResults() {
    try {
      const { data, error } = await supabase
        .from('lab_results')
        .select('*')
        .eq('has_critical_values', true)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching critical results:', error);
      throw error;
    }
  },

  // Get statistics
  async getStats() {
    try {
      const { data, error } = await supabase
        .from('lab_results')
        .select('status, has_abnormal_values, has_critical_values')
        .eq('is_deleted', false);

      if (error) throw error;

      const stats = {
        total: data.length,
        draft: data.filter(r => r.status === 'draft').length,
        completed: data.filter(r => r.status === 'completed').length,
        verified: data.filter(r => r.status === 'verified').length,
        approved: data.filter(r => r.status === 'approved').length,
        abnormal: data.filter(r => r.has_abnormal_values).length,
        critical: data.filter(r => r.has_critical_values).length
      };

      return stats;
    } catch (error) {
      console.error('Error fetching result stats:', error);
      return {
        total: 0,
        draft: 0,
        completed: 0,
        verified: 0,
        approved: 0,
        abnormal: 0,
        critical: 0
      };
    }
  }
};

// =====================================================
// PENDING BILLS API - Main entry point
// =====================================================
export const pendingBillsAPI = {
  // Get all pending bills (no results entered yet)
  async getPendingBills(filters = {}) {
    try {
      let query = supabase
        .from('opbilling')
        .select('*')
        .order('opbill_id', { ascending: false });

      // Apply filters
      if (filters.search) {
        query = query.or(`service_name.ilike.%${filters.search}%,patient_mrno.ilike.%${filters.search}%`);
      }

      if (filters.payment_status) {
        query = query.eq('payment_status', filters.payment_status);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Filter pending bills (where results_entered is false or null/undefined)
      const pendingBills = (data || []).filter(bill => !bill.results_entered);

      // Map to expected format
      const mappedBills = pendingBills.map(bill => ({
        ...bill,
        id: bill.opbill_id, // Map opbill_id to id
        service_type_name: bill.service_name, // Map service_name to service_type_name
        bill_date: new Date().toISOString(), // Use current date as fallback
        total_amount: bill.unit_price || 0 // Use unit_price as total_amount
      }));

      return mappedBills;
    } catch (error) {
      console.error('Error fetching pending bills:', error);
      throw error;
    }
  },

  // Get completed bills (results entered)
  // Get completed bills (results entered)
  async getCompletedBills(filters = {}) {
    try {
      console.log('🔄 Fetching completed bills...', filters);

      let query = supabase
        .from('opbilling')
        .select('*')
        .eq('results_entered', true);

      // Apply search filters
      if (filters.search) {
        query = query.or(`service_name.ilike.%${filters.search}%,patient_mrno.ilike.%${filters.search}%`);
      }

      const { data, error } = await query.order('opbill_id', { ascending: false });

      if (error) {
        console.error('Error in getCompletedBills:', error);
        throw error;
      }

      console.log('✅ Fetched completed bills:', data?.length);

      // Map to expected format
      return (data || []).map(bill => ({
        ...bill,
        id: bill.opbill_id,
        service_type_name: bill.service_name,
        total_amount: bill.total_amount || bill.unit_price || 0,
        lab_results: { status: 'completed' } // Default status
      }));
    } catch (error) {
      console.error('Error fetching completed bills:', error);
      throw error;
    }
  },

  // Get bill by ID
  async getBillById(billId) {
    try {
      const { data, error } = await supabase
        .from('opbilling')
        .select('*')
        .eq('opbill_id', billId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching bill:', error);
      throw error;
    }
  },

  // Get statistics
  async getStats() {
    try {
      const { data, error } = await supabase
        .from('opbilling')
        .select('results_entered, payment_status');

      if (error) throw error;

      const total = data.length;
      const completed = data.filter(b => b.results_entered === true).length;
      const pending = total - completed;
      const paid = data.filter(b => b.payment_status === 'paid').length;

      return {
        total,
        pending,
        completed,
        paid,
        unpaid: total - paid
      };
    } catch (error) {
      console.error('Error fetching bill stats:', error);
      return {
        total: 0,
        pending: 0,
        completed: 0,
        paid: 0,
        unpaid: 0
      };
    }
  }
};

// =====================================================
// TEST TEMPLATES API
// =====================================================
export const testTemplatesAPI = {
  // Get all test templates
  async getAllTemplates() {
    try {
      const { data, error } = await supabase
        .from('test_templates')
        .select('*')
        .eq('is_active', true)
        .order('test_name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching test templates:', error);
      throw error;
    }
  },

  // Get template by test name or test code
  async getTemplateByTestName(testName) {
    try {
      const { data, error } = await supabase
        .from('test_templates')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      // Normalize the query
      const normalizedQuery = testName.trim().toLowerCase();

      // Remove common prefixes
      const cleanedQuery = normalizedQuery
        .replace(/^serum\s*-?\s*/i, '')
        .replace(/^blood\s*-?\s*/i, '')
        .replace(/^urine\s*-?\s*/i, '')
        .trim();

      // Try exact match first (test_name or test_code)
      let match = data.find(t =>
        t.test_name.toLowerCase() === normalizedQuery ||
        (t.test_code && t.test_code.toLowerCase() === normalizedQuery)
      );

      // If no exact match, try with cleaned query
      if (!match) {
        match = data.find(t =>
          t.test_name.toLowerCase() === cleanedQuery ||
          (t.test_code && t.test_code.toLowerCase() === cleanedQuery)
        );
      }

      // If still no match, try partial matching (contains)
      if (!match) {
        match = data.find(t =>
          t.test_name.toLowerCase().includes(cleanedQuery) ||
          cleanedQuery.includes(t.test_name.toLowerCase()) ||
          (t.test_code && cleanedQuery.includes(t.test_code.toLowerCase()))
        );
      }

      if (match) {
        console.log(`✅ Template matched: "${testName}" → "${match.test_name}"`);
      } else {
        console.warn(`⚠️ No template found for: "${testName}"`);
      }

      return match || null;
    } catch (error) {
      console.error('Error fetching test template:', error);
      return null;
    }
  },

  // Create test template
  async createTemplate(templateData) {
    try {
      const { data, error } = await supabase
        .from('test_templates')
        .insert([templateData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating test template:', error);
      throw error;
    }
  },

  // Update test template
  async updateTemplate(id, updates) {
    try {
      const { data, error } = await supabase
        .from('test_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating test template:', error);
      throw error;
    }
  }
};

// Export all APIs
export default {
  patientDataAPI,
  labResultsAPI,
  pendingBillsAPI,
  testTemplatesAPI
};
