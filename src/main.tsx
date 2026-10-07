import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { testFirestoreConnection } from './services/firebase';
import { AuthProvider } from './presentation/context/AuthContext';
import { ErrorBoundary } from './presentation/components/ErrorBoundary';

testFirestoreConnection().catch(console.error);

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <AuthProvider>
      <App />
    </AuthProvider>
  </ErrorBoundary>
);

