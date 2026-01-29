import { useState } from 'react';
import Sidebar from './components/Sidebar';
import PendingBills from './components/PendingBills';
import ReportGeneration from './components/ReportGeneration';
import './index.css';

function App() {
  const [activeView, setActiveView] = useState('pending-bills');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const renderView = () => {
    switch (activeView) {
      case 'pending-bills':
        return <PendingBills />;
      case 'reports':
        return <ReportGeneration />;
      default:
        return <PendingBills />;
    }
  };

  return (
    <div className="app">
      <div
        className={`mobile-overlay ${isSidebarOpen ? 'active' : ''}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      <Sidebar
        activeView={activeView}
        setActiveView={(view) => {
          setActiveView(view);
          setIsSidebarOpen(false);
        }}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="main-content">
        <button
          className="btn btn-secondary btn-icon mobile-menu-btn"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          ☰
        </button>
        {renderView()}
      </div>
    </div>
  );
}

export default App;
