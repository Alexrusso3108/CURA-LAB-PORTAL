const Sidebar = ({ activeView, setActiveView, isOpen, onClose }) => {
  const menuItems = [
    { id: 'samples', name: 'Sample Tracking' },
    { id: 'results', name: 'Test Results' },
    { id: 'reports', name: 'Report Generation' },
    { id: 'billing', name: 'Billing' },
  ];

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: 'linear-gradient(135deg, hsl(195, 100%, 50%), hsl(280, 90%, 60%))',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            fontWeight: '800',
            color: 'white',
            boxShadow: '0 4px 12px hsla(195, 100%, 50%, 0.3)'
          }}>
            CH
          </div>
          <div>
            <h1 style={{
              fontSize: '1.25rem',
              fontWeight: '800',
              marginBottom: '2px',
              background: 'linear-gradient(135deg, hsl(195, 100%, 50%), hsl(280, 90%, 60%))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Cura Hospital
            </h1>
            <p style={{
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              fontWeight: '600'
            }}>
              Laboratory Portal
            </p>
          </div>
        </div>
        <button className="btn btn-ghost btn-icon close-sidebar-btn" onClick={onClose}>
          ✕
        </button>
      </div>

      <nav className="sidebar-nav">
        <div style={{ marginBottom: 'var(--space-md)' }}>
          <p style={{
            fontSize: '0.75rem',
            fontWeight: '700',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: 'var(--space-md)',
            paddingLeft: 'var(--space-lg)'
          }}>
            Main Menu
          </p>
          {menuItems.map((item) => (
            <div
              key={item.id}
              className={`nav-item ${activeView === item.id ? 'active' : ''}`}
              onClick={() => setActiveView(item.id)}
            >
              <span>{item.name}</span>
            </div>
          ))}
        </div>

        <div style={{
          marginTop: 'auto',
          padding: 'var(--space-lg)',
          background: 'var(--bg-tertiary)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, hsl(340, 90%, 55%), hsl(280, 90%, 60%))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.875rem',
              fontWeight: '700',
              color: 'white'
            }}>
              LA
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: '600', fontSize: '0.875rem', marginBottom: '2px' }}>
                Lab Admin
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Bengaluru
              </p>
            </div>
          </div>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
