import { useAuth, TENANTS } from './AuthContext';
import bucketLogo from '../assets/bucket.png';

export function LoginScreen() {
  const { login } = useAuth();

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-logo">
          <img src={bucketLogo} alt="Logo" width={200} height={200} />
        </div>

        <div className="login-buttons">
          <button
            className="login-btn login-btn-primary"
            onClick={() => login(TENANTS.A)}
          >
            <span className="login-btn-title">Tenant A</span>
            <span className="login-btn-desc">Category A &mdash; 50,000 capacity</span>
          </button>

          <button
            className="login-btn login-btn-secondary"
            onClick={() => login(TENANTS.B)}
          >
            <span className="login-btn-title">Tenant B</span>
            <span className="login-btn-desc">Category H &mdash; 50 capacity</span>
          </button>
        </div>
      </div>
    </div>
  );
}
