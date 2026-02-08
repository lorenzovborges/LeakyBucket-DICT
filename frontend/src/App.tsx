import { Suspense } from 'react';
import { RelayEnvironmentProvider } from 'react-relay';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { LoginScreen } from './auth/LoginScreen';
import { AppShell } from './layout/AppShell';
import { ToastProvider } from './shared/Toast';
import { Spinner } from './shared/Spinner';
import { AppErrorBoundary } from './shared/AppErrorBoundary';

function AuthGate() {
  const { state } = useAuth();

  if (!state) return <LoginScreen />;

  return (
    <RelayEnvironmentProvider environment={state.environment}>
      <AppErrorBoundary>
        <Suspense fallback={<Spinner large />}>
          <AppShell />
        </Suspense>
      </AppErrorBoundary>
    </RelayEnvironmentProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AuthGate />
      </ToastProvider>
    </AuthProvider>
  );
}
