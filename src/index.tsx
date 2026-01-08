import React from 'react';
import ReactDOM from 'react-dom/client';
import AppRouter from './AppRouter';
import { AuthProvider } from './contexts/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <ErrorBoundary>
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  </ErrorBoundary>
);



