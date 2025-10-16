import React from 'react';
import UsageAggregation from './components/UsageAggregation';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Metered Usage Analytics</h1>
      </header>
      <main>
        <UsageAggregation />
      </main>
    </div>
  );
}

export default App;

