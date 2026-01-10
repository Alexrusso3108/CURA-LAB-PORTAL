import { supabase } from './supabase';

// Debug function to check table structure
export async function debugTableStructure() {
  try {
    console.log('=== DEBUGGING TABLE STRUCTURE ===');

    // Get one record from opbilling
    const { data: opbilling, error: opError } = await supabase
      .from('opbilling')
      .select('*')
      .ilike('service_category', '%lab%')
      .limit(1);

    console.log('OPBilling Sample:', opbilling);
    if (opbilling && opbilling[0]) {
      console.log('OPBilling Column Names:', Object.keys(opbilling[0]));
    }
    if (opError) console.error('OPBilling Error:', opError);

    // Get one record from inpatient_bills (without service_category filter)
    const { data: inpatient, error: inError } = await supabase
      .from('inpatient_bills')
      .select('*')
      .limit(1);

    console.log('Inpatient Bills Sample:', inpatient);
    if (inpatient && inpatient[0]) {
      console.log('Inpatient Column Names:', Object.keys(inpatient[0]));
    }
    if (inError) console.error('Inpatient Error:', inError);

    return { opbilling, inpatient };
  } catch (error) {
    console.error('Debug Error:', error);
    return null;
  }
}

// =====================================================
// BILLING API - Using opbilling and inpatient_bills tables
// =====================================================
export const billingAPI = {
  // Get all lab bills (both outpatient and inpatient)
  async getAllLabBills(filters = {}) {
    try {
      // Fetch outpatient bills from opbilling table where service_category contains 'lab'
      const { data: outpatientBills, error: outError } = await supabase
        .from('opbilling')
        .select('*')
        .ilike('service_category', '%lab%')
        .order('created_at', { ascending: false });

      if (outError) {
        console.error('Error fetching opbilling:', outError);
        throw outError;
      }

      // For inpatient_bills - fetch all records first (no service_category filter)
      // TODO: User needs to specify how to filter lab bills in inpatient_bills table
      const { data: inpatientBills, error: inError } = await supabase
        .from('inpatient_bills')
        .select('*')
        .order('created_at', { ascending: false });

      if (inError) {
        console.error('Error fetching inpatient bills:', inError);
        // Don't throw, just continue with outpatient bills
        console.warn('Continuing without inpatient bills');
      }

      // Filter inpatient bills manually if needed (looking for 'lab' in various fields)
      let filteredInpatientBills = [];
      if (inpatientBills && inpatientBills.length > 0) {
        filteredInpatientBills = inpatientBills.filter(bill => {
          const searchFields = [
            bill.service_type,
            bill.department,
            bill.category,
            bill.service,
            bill.service_name,
            bill.description
          ].filter(Boolean).join(' ').toLowerCase();

          return searchFields.includes('lab') || searchFields.includes('laboratory');
        });
      }

      // Combine both arrays and add a source field
      let allBills = [
        ...(outpatientBills || []).map(bill => ({ ...bill, source: 'outpatient' })),
        ...(filteredInpatientBills || []).map(bill => ({ ...bill, source: 'inpatient' }))
      ];

      // Apply filters
      if (filters.status && filters.status !== 'all') {
        allBills = allBills.filter(bill => {
          const billStatus = (bill.status || bill.payment_status || '').toLowerCase();
          return billStatus === filters.status.toLowerCase();
        });
      }

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        allBills = allBills.filter(bill =>
          (bill.patient_name && bill.patient_name.toLowerCase().includes(searchLower)) ||
          (bill.name && bill.name.toLowerCase().includes(searchLower)) ||
          (bill.bill_id && bill.bill_id.toLowerCase().includes(searchLower)) ||
          (bill.patient_id && bill.patient_id.toLowerCase().includes(searchLower)) ||
          (bill.uhid && bill.uhid.toLowerCase().includes(searchLower)) ||
          (bill.id && bill.id.toString().toLowerCase().includes(searchLower))
        );
      }

      // Sort by date (most recent first)
      allBills.sort((a, b) => {
        const dateA = new Date(a.created_at || a.bill_date || a.date || 0);
        const dateB = new Date(b.created_at || b.bill_date || b.date || 0);
        return dateB - dateA;
      });

      console.log(`Fetched ${allBills.length} lab bills (${outpatientBills?.length || 0} outpatient, ${filteredInpatientBills?.length || 0} inpatient)`);
      return allBills;
    } catch (error) {
      console.error('Error fetching lab bills:', error);
      throw error;
    }
  },

  // Get outpatient lab bills only
  async getOutpatientBills(filters = {}) {
    try {
      let query = supabase
        .from('opbilling')
        .select('*')
        .ilike('service_category', '%lab%')
        .order('created_at', { ascending: false });

      if (filters.status && filters.status !== 'all') {
        query = query.or(`status.ilike.${filters.status},payment_status.ilike.${filters.status}`);
      }

      if (filters.search) {
        query = query.or(`patient_name.ilike.%${filters.search}%,name.ilike.%${filters.search}%,bill_id.ilike.%${filters.search}%,patient_id.ilike.%${filters.search}%,uhid.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching outpatient bills:', error);
      throw error;
    }
  },

  // Get inpatient lab bills only  
  async getInpatientBills(filters = {}) {
    try {
      let query = supabase
        .from('inpatient_bills')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters.status && filters.status !== 'all') {
        query = query.or(`status.ilike.${filters.status},payment_status.ilike.${filters.status}`);
      }

      if (filters.search) {
        query = query.or(`patient_name.ilike.%${filters.search}%,name.ilike.%${filters.search}%,bill_id.ilike.%${filters.search}%,patient_id.ilike.%${filters.search}%,uhid.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Filter for lab bills manually
      if (data) {
        return data.filter(bill => {
          const searchFields = [
            bill.service_type,
            bill.department,
            bill.category,
            bill.service,
            bill.service_name,
            bill.description
          ].filter(Boolean).join(' ').toLowerCase();

          return searchFields.includes('lab') || searchFields.includes('laboratory');
        });
      }
      return [];
    } catch (error) {
      console.error('Error fetching inpatient bills:', error);
      throw error;
    }
  },

  // Create new outpatient lab bill
  async createOutpatientBill(billData) {
    try {
      const { data, error } = await supabase
        .from('opbilling')
        .insert([{
          ...billData,
          service_category: 'laboratory' // Set service category to laboratory
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating outpatient bill:', error);
      throw error;
    }
  },

  // Create new inpatient lab bill
  async createInpatientBill(billData) {
    try {
      const { data, error } = await supabase
        .from('inpatient_bills')
        .insert([billData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating inpatient bill:', error);
      throw error;
    }
  },

  // Update bill (works for both outpatient and inpatient)
  async updateBill(id, updates, source = 'outpatient') {
    try {
      const tableName = source === 'inpatient' ? 'inpatient_bills' : 'opbilling';

      const { data, error } = await supabase
        .from(tableName)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating bill:', error);
      throw error;
    }
  },

  // Mark bill as paid
  async markAsPaid(id, paymentMethod, source = 'outpatient') {
    try {
      return await this.updateBill(id, {
        status: 'paid',
        payment_status: 'paid',
        payment_method: paymentMethod,
        paid_date: new Date().toISOString().split('T')[0]
      }, source);
    } catch (error) {
      console.error('Error marking bill as paid:', error);
      throw error;
    }
  },

  // Get billing statistics for lab bills
  async getStats() {
    try {
      const allBills = await this.getAllLabBills();

      const stats = {
        totalRevenue: 0,
        pendingPayments: 0,
        totalInvoices: allBills.length,
        paidInvoices: 0,
      };

      allBills.forEach(bill => {
        // Try multiple possible column names for total amount
        const total = parseFloat(
          bill.total ||
          bill.total_amount ||
          bill.amount ||
          bill.bill_amount ||
          bill.totalAmount ||
          bill.total_bill ||
          bill.net_amount ||
          bill.grand_total ||
          0
        );

        const isPaid =
          (bill.status && bill.status.toLowerCase() === 'paid') ||
          (bill.payment_status && bill.payment_status.toLowerCase() === 'paid');

        const isPending =
          (bill.status && bill.status.toLowerCase() === 'pending') ||
          (bill.payment_status && bill.payment_status.toLowerCase() === 'pending');

        if (isPaid) {
          stats.totalRevenue += total;
          stats.paidInvoices++;
        } else if (isPending) {
          stats.pendingPayments += total;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error getting billing stats:', error);
      return {
        totalRevenue: 0,
        pendingPayments: 0,
        totalInvoices: 0,
        paidInvoices: 0,
      };
    }
  },

  // Check table structure (for debugging)
  async checkTableStructure() {
    return await debugTableStructure();
  }
};

// =====================================================
// SAMPLES API - Laboratory Sample Tracking
// =====================================================
export const samplesAPI = {
  // Get all samples with optional filters
  async getAllSamples(filters = {}) {
    try {
      let query = supabase
        .from('samples')
        .select('*')
        .eq('is_deleted', false)
        .order('collection_date', { ascending: false });

      // Apply status filter
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      // Apply priority filter
      if (filters.priority && filters.priority !== 'all') {
        query = query.eq('priority', filters.priority);
      }

      // Apply search filter
      if (filters.search) {
        query = query.or(`sample_id.ilike.%${filters.search}%,patient_name.ilike.%${filters.search}%,test_name.ilike.%${filters.search}%,barcode.ilike.%${filters.search}%`);
      }

      // Apply date range filter
      if (filters.startDate) {
        query = query.gte('collection_date', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('collection_date', filters.endDate);
      }

      const { data, error } = await query;
      if (error) throw error;

      console.log(`Fetched ${data?.length || 0} samples`);
      return data || [];
    } catch (error) {
      console.error('Error fetching samples:', error);
      throw error;
    }
  },

  // Get a single sample by ID
  async getSampleById(id) {
    try {
      const { data, error } = await supabase
        .from('samples')
        .select('*')
        .eq('id', id)
        .eq('is_deleted', false)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching sample:', error);
      throw error;
    }
  },

  // Get sample by sample_id (barcode/ID)
  async getSampleBySampleId(sampleId) {
    try {
      const { data, error } = await supabase
        .from('samples')
        .select('*')
        .eq('sample_id', sampleId)
        .eq('is_deleted', false)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching sample by sample_id:', error);
      throw error;
    }
  },

  // Get samples by patient MRN
  async getSamplesByPatient(patientMrno) {
    try {
      const { data, error } = await supabase
        .from('samples')
        .select('*')
        .eq('patient_mrno', patientMrno)
        .eq('is_deleted', false)
        .order('collection_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching samples by patient:', error);
      throw error;
    }
  },

  // Create a new sample
  async createSample(sampleData) {
    try {
      const { data, error } = await supabase
        .from('samples')
        .insert([{
          ...sampleData,
          collection_date: sampleData.collection_date || new Date().toISOString(),
          status: sampleData.status || 'collected',
          priority: sampleData.priority || 'normal'
        }])
        .select()
        .single();

      if (error) throw error;
      console.log('Sample created:', data);
      return data;
    } catch (error) {
      console.error('Error creating sample:', error);
      throw error;
    }
  },

  // Update a sample
  async updateSample(id, updates) {
    try {
      const { data, error } = await supabase
        .from('samples')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      console.log('Sample updated:', data);
      return data;
    } catch (error) {
      console.error('Error updating sample:', error);
      throw error;
    }
  },

  // Update sample status
  async updateStatus(id, status, additionalData = {}) {
    try {
      const updates = {
        status,
        ...additionalData
      };

      // Auto-set timestamps based on status
      if (status === 'received' && !updates.received_date) {
        updates.received_date = new Date().toISOString();
      } else if (status === 'processing' && !updates.processing_started_at) {
        updates.processing_started_at = new Date().toISOString();
      } else if (status === 'completed' && !updates.completed_at) {
        updates.completed_at = new Date().toISOString();
      }

      return await this.updateSample(id, updates);
    } catch (error) {
      console.error('Error updating sample status:', error);
      throw error;
    }
  },

  // Soft delete a sample
  async deleteSample(id) {
    try {
      const { data, error } = await supabase
        .from('samples')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      console.log('Sample deleted:', data);
      return data;
    } catch (error) {
      console.error('Error deleting sample:', error);
      throw error;
    }
  },

  // Get samples statistics
  async getStats() {
    try {
      const samples = await this.getAllSamples();

      const stats = {
        totalSamples: samples.length,
        collected: samples.filter(s => s.status === 'collected').length,
        inTransit: samples.filter(s => s.status === 'in-transit').length,
        received: samples.filter(s => s.status === 'received').length,
        processing: samples.filter(s => s.status === 'processing').length,
        completed: samples.filter(s => s.status === 'completed').length,
        rejected: samples.filter(s => s.status === 'rejected').length,
        urgent: samples.filter(s => s.priority === 'urgent').length,
        stat: samples.filter(s => s.priority === 'stat').length,
      };

      return stats;
    } catch (error) {
      console.error('Error getting samples stats:', error);
      return {
        totalSamples: 0,
        collected: 0,
        inTransit: 0,
        received: 0,
        processing: 0,
        completed: 0,
        rejected: 0,
        urgent: 0,
        stat: 0,
      };
    }
  },

  // Get samples collected today
  async getTodaySamples() {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('samples')
        .select('*')
        .gte('collection_date', `${today}T00:00:00`)
        .lte('collection_date', `${today}T23:59:59`)
        .eq('is_deleted', false)
        .order('collection_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching today samples:', error);
      throw error;
    }
  },

  // Get pending samples (not completed or rejected)
  async getPendingSamples() {
    try {
      const { data, error } = await supabase
        .from('samples')
        .select('*')
        .not('status', 'in', '(completed,rejected)')
        .eq('is_deleted', false)
        .order('collection_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching pending samples:', error);
      throw error;
    }
  },

  // Search samples
  async searchSamples(searchTerm) {
    try {
      const { data, error } = await supabase
        .from('samples')
        .select('*')
        .or(`sample_id.ilike.%${searchTerm}%,patient_name.ilike.%${searchTerm}%,test_name.ilike.%${searchTerm}%,barcode.ilike.%${searchTerm}%`)
        .eq('is_deleted', false)
        .order('collection_date', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching samples:', error);
      throw error;
    }
  },

  // Get laboratory service types from service_types table
  async getLabServiceTypes() {
    try {
      const { data, error } = await supabase
        .from('service_types')
        .select('*')
        .order('service_type_name', { ascending: true });

      if (error) {
        console.error('Supabase error fetching service types:', error);
        throw error;
      }

      console.log('✅ Fetched service types:', data);
      console.log('✅ Total service types:', data?.length);
      return data || [];
    } catch (error) {
      console.error('❌ Error fetching service types:', error);
      // Return empty array if table doesn't exist or has errors
      return [];
    }
  }
};

// =====================================================
// TEST RESULTS API - Laboratory Test Results Management
// =====================================================
export const testResultsAPI = {
  // Get all test results with optional filters
  async getAllTestResults(filters = {}) {
    try {
      let query = supabase
        .from('test_results')
        .select(`
          *,
          samples (
            id,
            sample_id,
            patient_name,
            patient_mrno,
            test_name,
            collection_date,
            status
          )
        `)
        .eq('is_deleted', false)
        .order('tested_date', { ascending: false });

      if (filters.status && filters.status !== 'all') {
        query = query.eq('result_status', filters.status);
      }

      if (filters.search) {
        query = query.or(`test_name.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      console.log(`Fetched ${data?.length || 0} test results`);
      return data || [];
    } catch (error) {
      console.error('Error fetching test results:', error);
      throw error;
    }
  },

  // Get test results for a specific sample
  async getTestResultsBySample(sampleId) {
    try {
      const { data, error } = await supabase
        .from('test_results')
        .select('*')
        .eq('sample_id', sampleId)
        .eq('is_deleted', false)
        .order('tested_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching test results by sample:', error);
      throw error;
    }
  },

  // Create a new test result
  async createTestResult(resultData) {
    try {
      const { data, error } = await supabase
        .from('test_results')
        .insert([{
          ...resultData,
          result_status: resultData.result_status || 'pending',
          tested_date: resultData.tested_date || new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      console.log('Test result created:', data);
      return data;
    } catch (error) {
      console.error('Error creating test result:', error);
      throw error;
    }
  },

  // Update a test result
  async updateTestResult(id, updates) {
    try {
      const { data, error } = await supabase
        .from('test_results')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      console.log('Test result updated:', data);
      return data;
    } catch (error) {
      console.error('Error updating test result:', error);
      throw error;
    }
  },

  // Update result status
  async updateResultStatus(id, status, additionalData = {}) {
    try {
      const updates = {
        result_status: status,
        ...additionalData
      };

      // Auto-set timestamps based on status
      if (status === 'completed' && !updates.tested_date) {
        updates.tested_date = new Date().toISOString();
      } else if (status === 'verified' && !updates.verified_date) {
        updates.verified_date = new Date().toISOString();
      } else if (status === 'approved' && !updates.approved_date) {
        updates.approved_date = new Date().toISOString();
      }

      return await this.updateTestResult(id, updates);
    } catch (error) {
      console.error('Error updating result status:', error);
      throw error;
    }
  },

  // Get pending test results
  async getPendingResults() {
    try {
      const { data, error } = await supabase
        .from('test_results')
        .select(`
          *,
          samples (
            id,
            sample_id,
            patient_name,
            patient_mrno,
            test_name
          )
        `)
        .eq('result_status', 'pending')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching pending results:', error);
      throw error;
    }
  },

  // Get critical results
  async getCriticalResults() {
    try {
      const { data, error } = await supabase
        .from('test_results')
        .select(`
          *,
          samples (
            id,
            sample_id,
            patient_name,
            patient_mrno
          )
        `)
        .eq('is_critical', true)
        .eq('is_deleted', false)
        .order('tested_date', { ascending: false });

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
      const results = await this.getAllTestResults();

      const stats = {
        totalResults: results.length,
        pending: results.filter(r => r.result_status === 'pending').length,
        inProgress: results.filter(r => r.result_status === 'in-progress').length,
        completed: results.filter(r => r.result_status === 'completed').length,
        verified: results.filter(r => r.result_status === 'verified').length,
        approved: results.filter(r => r.result_status === 'approved').length,
        abnormal: results.filter(r => r.is_abnormal).length,
        critical: results.filter(r => r.is_critical).length,
      };

      return stats;
    } catch (error) {
      console.error('Error getting test results stats:', error);
      return {
        totalResults: 0,
        pending: 0,
        inProgress: 0,
        completed: 0,
        verified: 0,
        approved: 0,
        abnormal: 0,
        critical: 0,
      };
    }
  }
};

// =====================================================
// REPORTS API - Laboratory Report Generation
// =====================================================
export const reportsAPI = {
  // Get all reports with optional filters
  async getAllReports(filters = {}) {
    try {
      let query = supabase
        .from('laboratory_reports')
        .select(`
          *,
          samples (
            id,
            sample_id,
            patient_name,
            patient_mrno,
            test_name,
            collection_date,
            status
          )
        `)
        .eq('is_deleted', false)
        .order('report_date', { ascending: false });

      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters.search) {
        query = query.or(`report_number.ilike.%${filters.search}%,patient_name.ilike.%${filters.search}%,test_name.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      console.log(`Fetched ${data?.length || 0} reports`);
      return data || [];
    } catch (error) {
      console.error('Error fetching reports:', error);
      throw error;
    }
  },

  // Get reports for a specific sample
  async getReportsBySample(sampleId) {
    try {
      const { data, error } = await supabase
        .from('laboratory_reports')
        .select('*')
        .eq('sample_id', sampleId)
        .eq('is_deleted', false)
        .order('report_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching reports by sample:', error);
      throw error;
    }
  },

  // Get reports by patient MRN
  async getReportsByPatient(patientMrno) {
    try {
      const { data, error } = await supabase
        .from('laboratory_reports')
        .select('*')
        .eq('patient_mrno', patientMrno)
        .eq('is_deleted', false)
        .order('report_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching reports by patient:', error);
      throw error;
    }
  },

  // Create a new report
  async createReport(reportData) {
    try {
      const { data, error } = await supabase
        .from('laboratory_reports')
        .insert([{
          ...reportData,
          status: reportData.status || 'draft',
          report_date: reportData.report_date || new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      console.log('Report created:', data);
      return data;
    } catch (error) {
      console.error('Error creating report:', error);
      throw error;
    }
  },

  // Update a report
  async updateReport(id, updates) {
    try {
      const { data, error } = await supabase
        .from('laboratory_reports')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      console.log('Report updated:', data);
      return data;
    } catch (error) {
      console.error('Error updating report:', error);
      throw error;
    }
  },

  // Update report status
  async updateReportStatus(id, status, additionalData = {}) {
    try {
      const updates = {
        status,
        ...additionalData
      };

      // Auto-set timestamps based on status
      if (status === 'reviewed' && !updates.verified_date) {
        updates.verified_date = new Date().toISOString();
      } else if (status === 'approved' && !updates.approved_date) {
        updates.approved_date = new Date().toISOString();
      }

      return await this.updateReport(id, updates);
    } catch (error) {
      console.error('Error updating report status:', error);
      throw error;
    }
  },

  // Publish a report
  async publishReport(id, publishedBy) {
    try {
      return await this.updateReportStatus(id, 'published', {
        approved_by: publishedBy,
        approved_date: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error publishing report:', error);
      throw error;
    }
  },

  // Get pending reports
  async getPendingReports() {
    try {
      const { data, error } = await supabase
        .from('laboratory_reports')
        .select(`
          *,
          samples (
            id,
            sample_id,
            patient_name,
            patient_mrno
          )
        `)
        .eq('status', 'pending-review')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching pending reports:', error);
      throw error;
    }
  },

  // Get statistics
  async getStats() {
    try {
      const reports = await this.getAllReports();

      const stats = {
        totalReports: reports.length,
        draft: reports.filter(r => r.status === 'draft').length,
        pendingReview: reports.filter(r => r.status === 'pending-review').length,
        reviewed: reports.filter(r => r.status === 'reviewed').length,
        approved: reports.filter(r => r.status === 'approved').length,
        published: reports.filter(r => r.status === 'published').length,
        urgent: reports.filter(r => r.is_urgent).length,
      };

      return stats;
    } catch (error) {
      console.error('Error getting reports stats:', error);
      return {
        totalReports: 0,
        draft: 0,
        pendingReview: 0,
        reviewed: 0,
        approved: 0,
        published: 0,
        urgent: 0,
      };
    }
  }
};

