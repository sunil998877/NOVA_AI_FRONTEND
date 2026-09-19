import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import AppErrorBoundary from './components/AppErrorBoundary';
import { AuthProvider } from './lib/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ToastProvider } from './components/ui/toast';
import './styles/global.css';
import { collabApi } from './lib/api';

if (typeof window !== "undefined" && window.location.pathname.startsWith("/collab/")) {
  const parts = window.location.pathname.split("/collab/");
  const token = parts[1]?.split("/")[0]?.split("?")[0];
  if (token) {
    collabApi.prefetchPortal(token);
    import("./pages/CreatorCollabPortal");
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <ToastProvider>
            <AppErrorBoundary>
              <App />
            </AppErrorBoundary>
          </ToastProvider>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

