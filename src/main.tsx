import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class RootErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('AGSoft Acoustics Global Error Caught:', error, errorInfo);
  }

  handleReset = () => {
    try {
      localStorage.removeItem('agsoft_tuning_id');
      localStorage.removeItem('agsoft_tuner_mode');
    } catch {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#08090d',
          color: '#f8fafc',
          padding: '24px',
          textAlign: 'center',
          fontFamily: 'sans-serif'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>
            AGSoft Acoustics
          </h2>
          <p style={{ fontSize: '13px', color: '#94a3b8', maxWidth: '320px', marginBottom: '20px' }}>
            A temporary display conflict was detected. Tap below to reload fresh settings.
          </p>
          <button
            onClick={this.handleReset}
            style={{
              padding: '10px 20px',
              borderRadius: '12px',
              backgroundColor: '#10b981',
              color: '#000000',
              fontWeight: 'bold',
              fontSize: '13px',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Reload Tuner
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <RootErrorBoundary>
        <App />
      </RootErrorBoundary>
    </React.StrictMode>
  );
}
