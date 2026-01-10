import { useState } from 'react';

const Inventory = () => {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [formData, setFormData] = useState({
    itemName: '',
    category: '',
    quantity: '',
    unit: '',
    reorderLevel: '',
    supplier: '',
    expiryDate: '',
    batchNumber: ''
  });

  const [inventory, setInventory] = useState([
    {
      id: 'INV001',
      itemName: 'Blood Collection Tubes (EDTA)',
      category: 'Consumables',
      quantity: 45,
      unit: 'boxes',
      reorderLevel: 50,
      status: 'low',
      supplier: 'MedSupply Co.',
      lastRestocked: '2026-01-05',
      expiryDate: '2026-12-31',
      batchNumber: 'BCT2024-001'
    },
    {
      id: 'INV002',
      itemName: 'Reagent Kit - CBC',
      category: 'Reagents',
      quantity: 12,
      unit: 'kits',
      reorderLevel: 20,
      status: 'critical',
      supplier: 'BioLab Solutions',
      lastRestocked: '2026-01-02',
      expiryDate: '2026-06-30',
      batchNumber: 'RGT-CBC-2024'
    },
    {
      id: 'INV003',
      itemName: 'Glucose Test Strips',
      category: 'Consumables',
      quantity: 78,
      unit: 'vials',
      reorderLevel: 60,
      status: 'adequate',
      supplier: 'DiagnoTech',
      lastRestocked: '2026-01-08',
      expiryDate: '2027-01-31',
      batchNumber: 'GTS-2024-045'
    },
    {
      id: 'INV004',
      itemName: 'Centrifuge Machine',
      category: 'Equipment',
      quantity: 3,
      unit: 'units',
      reorderLevel: 1,
      status: 'adequate',
      supplier: 'LabEquip Inc.',
      lastRestocked: '2025-11-15',
      expiryDate: 'N/A',
      batchNumber: 'CFG-2025-X'
    },
    {
      id: 'INV005',
      itemName: 'Reagent Kit - Lipid Profile',
      category: 'Reagents',
      quantity: 25,
      unit: 'kits',
      reorderLevel: 15,
      status: 'adequate',
      supplier: 'BioLab Solutions',
      lastRestocked: '2026-01-07',
      expiryDate: '2026-08-31',
      batchNumber: 'RGT-LIP-2024'
    },
    {
      id: 'INV006',
      itemName: 'Pipette Tips (1000μL)',
      category: 'Consumables',
      quantity: 150,
      unit: 'packs',
      reorderLevel: 100,
      status: 'adequate',
      supplier: 'LabGear Pro',
      lastRestocked: '2026-01-06',
      expiryDate: 'N/A',
      batchNumber: 'PT-1000-2024'
    },
  ]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const newItem = {
      id: `INV${String(inventory.length + 1).padStart(3, '0')}`,
      ...formData,
      quantity: parseInt(formData.quantity),
      reorderLevel: parseInt(formData.reorderLevel),
      status: 'adequate',
      lastRestocked: new Date().toISOString().split('T')[0]
    };
    setInventory([...inventory, newItem]);
    setShowModal(false);
    setFormData({
      itemName: '',
      category: '',
      quantity: '',
      unit: '',
      reorderLevel: '',
      supplier: '',
      expiryDate: '',
      batchNumber: ''
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'critical':
        return { class: 'badge-danger', text: 'Critical', icon: '🔴' };
      case 'low':
        return { class: 'badge-warning', text: 'Low Stock', icon: '⚠️' };
      case 'adequate':
        return { class: 'badge-success', text: 'Adequate', icon: '✅' };
      default:
        return { class: 'badge-info', text: 'Unknown', icon: '❓' };
    }
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterCategory === 'all' || item.category === filterCategory;
    return matchesSearch && matchesFilter;
  });

  const categories = ['all', ...new Set(inventory.map(item => item.category))];

  const stats = {
    total: inventory.length,
    critical: inventory.filter(i => i.status === 'critical').length,
    low: inventory.filter(i => i.status === 'low').length,
    adequate: inventory.filter(i => i.status === 'adequate').length
  };

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="page-title">Inventory Management</h1>
            <p className="page-description">Track reagents, consumables, and laboratory equipment</p>
          </div>
          <button className="btn btn-primary btn-lg" onClick={() => setShowModal(true)}>
            <span style={{ fontSize: '1.25rem' }}>➕</span>
            <span>Add New Item</span>
          </button>
        </div>
      </div>

      <div className="page-content">
        {/* Statistics */}
        <div className="grid grid-cols-4" style={{ marginBottom: 'var(--space-xl)' }}>
          <div className="stat-card">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Items</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--color-danger)' }}>{stats.critical}</div>
            <div className="stat-label">Critical Stock</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--color-warning)' }}>{stats.low}</div>
            <div className="stat-label">Low Stock</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--color-success)' }}>{stats.adequate}</div>
            <div className="stat-label">Adequate Stock</div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="card" style={{ padding: 'var(--space-xl)', marginBottom: 'var(--space-xl)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-lg)', alignItems: 'center' }}>
            <div className="search-bar" style={{ flex: 1 }}>
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="search-input"
                placeholder="Search by item name, ID, or supplier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
              {categories.map(category => (
                <button
                  key={category}
                  className={`btn ${filterCategory === category ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                  onClick={() => setFilterCategory(category)}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="card" style={{ padding: '0' }}>
          <div className="table-container" style={{ border: 'none' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Item ID</th>
                  <th>Item Name</th>
                  <th>Category</th>
                  <th>Quantity</th>
                  <th>Reorder Level</th>
                  <th>Status</th>
                  <th>Supplier</th>
                  <th>Batch Number</th>
                  <th>Expiry Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.length === 0 ? (
                  <tr>
                    <td colSpan="10" style={{ textAlign: 'center', padding: 'var(--space-3xl)', color: 'var(--text-muted)' }}>
                      No inventory items found
                    </td>
                  </tr>
                ) : (
                  filteredInventory.map((item) => {
                    const statusBadge = getStatusBadge(item.status);
                    const isExpiringSoon = item.expiryDate !== 'N/A' &&
                      new Date(item.expiryDate) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

                    return (
                      <tr key={item.id}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '600', color: 'var(--color-primary)' }}>
                          {item.id}
                        </td>
                        <td style={{ fontWeight: '500' }}>{item.itemName}</td>
                        <td>
                          <span className="badge badge-info" style={{ fontSize: '0.75rem' }}>
                            {item.category}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                            <span style={{
                              fontWeight: '700',
                              fontSize: '1rem',
                              color: item.status === 'critical' ? 'var(--color-danger)' :
                                item.status === 'low' ? 'var(--color-warning)' : 'var(--text-primary)'
                            }}>
                              {item.quantity}
                            </span>
                            <span style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
                              {item.unit}
                            </span>
                          </div>
                        </td>
                        <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                          {item.reorderLevel} {item.unit}
                        </td>
                        <td>
                          <span className={`badge ${statusBadge.class}`}>
                            {statusBadge.icon} {statusBadge.text}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.8125rem' }}>{item.supplier}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                          {item.batchNumber}
                        </td>
                        <td>
                          <div style={{ fontSize: '0.8125rem' }}>
                            {item.expiryDate === 'N/A' ? (
                              <span style={{ color: 'var(--text-muted)' }}>N/A</span>
                            ) : (
                              <span style={{ color: isExpiringSoon ? 'var(--color-warning)' : 'var(--text-secondary)' }}>
                                {item.expiryDate}
                                {isExpiringSoon && <span style={{ marginLeft: '4px' }}>⚠️</span>}
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                            <button className="btn btn-secondary btn-sm" title="Restock">
                              ➕ Restock
                            </button>
                            <button className="btn btn-ghost btn-sm btn-icon" title="Edit">✏️</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Item Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Add New Inventory Item</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="grid grid-cols-2">
                  <div className="form-group">
                    <label className="form-label">Item Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      value={formData.itemName}
                      onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Category *</label>
                    <select
                      className="form-select"
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      <option value="">Select Category</option>
                      <option value="Consumables">Consumables</option>
                      <option value="Reagents">Reagents</option>
                      <option value="Equipment">Equipment</option>
                      <option value="Chemicals">Chemicals</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2">
                  <div className="form-group">
                    <label className="form-label">Quantity *</label>
                    <input
                      type="number"
                      className="form-input"
                      required
                      min="0"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Unit *</label>
                    <select
                      className="form-select"
                      required
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    >
                      <option value="">Select Unit</option>
                      <option value="boxes">Boxes</option>
                      <option value="kits">Kits</option>
                      <option value="vials">Vials</option>
                      <option value="packs">Packs</option>
                      <option value="units">Units</option>
                      <option value="liters">Liters</option>
                      <option value="ml">ML</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2">
                  <div className="form-group">
                    <label className="form-label">Reorder Level *</label>
                    <input
                      type="number"
                      className="form-input"
                      required
                      min="0"
                      value={formData.reorderLevel}
                      onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Supplier *</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      value={formData.supplier}
                      onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2">
                  <div className="form-group">
                    <label className="form-label">Batch Number *</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      value={formData.batchNumber}
                      onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Expiry Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={formData.expiryDate}
                      onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
