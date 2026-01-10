import { useState } from 'react';
import Sidebar from './components/Sidebar';
import SampleTracking from './components/SampleTracking';
import TestResults from './components/TestResults';
import ReportGeneration from './components/ReportGeneration';
import Billing from './components/Billing';
import './index.css';

function App() {
  const [activeView, setActiveView] = useState('samples');

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
      <Sidebar activeView={activeView} setActiveView={setActiveView} />
      <div className="main-content">
        {renderView()}
      </div>
    </div>
  );
}

export default App;
