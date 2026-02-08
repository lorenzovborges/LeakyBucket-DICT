import { useAuth } from '../auth/AuthContext';
import bucketLogo from '../assets/bucket.png';

export function Header() {
  const { state, logout } = useAuth();
  if (!state) return null;

  return (
    <header className="header">
      <div className="header-brand">
        <img src={bucketLogo} alt="Logo" width={40} height={40} />
        Leaky Bucket
      </div>
      <div className="header-tenant">
        <div className="header-tenant-info">
          <div className="header-tenant-name">{state.tenant.name}</div>
          <div className="header-tenant-cat">
            Category {state.tenant.category} &middot; Cap {state.tenant.capacity}
          </div>
        </div>
        <button className="btn btn-sm btn-outline" onClick={logout}>
          Logout
        </button>
      </div>
    </header>
  );
}
