import { useState } from 'react';
import { TENANTS, useAuth, type DemoTenantKey } from './AuthContext';
import bucketLogo from '../assets/bucket.png';

export function LoginScreen() {
  const { login, isLoggingIn } = useAuth();
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (tenantKey: DemoTenantKey) => {
    setErrorMessage('');

    try {
      await login(tenantKey);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not start demo session.';
      setErrorMessage(message);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-logo">
          <img src={bucketLogo} alt="Logo" width={200} height={200} />
        </div>

        <div className="login-buttons">
          <button
            className="login-btn login-btn-primary"
            disabled={isLoggingIn}
            onClick={() => handleLogin('A')}
          >
            <span className="login-btn-title">{TENANTS.A.name}</span>
            <span className="login-btn-desc">
              Category {TENANTS.A.category} &mdash; {TENANTS.A.capacity} capacity
            </span>
          </button>

          <button
            className="login-btn login-btn-secondary"
            disabled={isLoggingIn}
            onClick={() => handleLogin('B')}
          >
            <span className="login-btn-title">{TENANTS.B.name}</span>
            <span className="login-btn-desc">
              Category {TENANTS.B.category} &mdash; {TENANTS.B.capacity} capacity
            </span>
          </button>
        </div>

        {errorMessage ? <p className="login-error">{errorMessage}</p> : null}
      </div>
    </div>
  );
}
