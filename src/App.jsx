import { useState } from 'react';
import Sidebar from './components/Sidebar';
import SampleTracking from './components/SampleTracking';
import TestResults from './components/TestResults';
import ReportGeneration from './components/ReportGeneration';
import Billing from './components/Billing';
import './index.css';

function App() {
  const [activeView, setActiveView] = useState('samples');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const renderView = () => {
    switch (activeView) {
      case 'samples':
        return <SampleTracking />;
      case 'results':
        return <TestResults />;
      case 'reports':
        return <ReportGeneration />;
      case 'billing':
        return <Billing />;
      default:
        return <SampleTracking />;
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
