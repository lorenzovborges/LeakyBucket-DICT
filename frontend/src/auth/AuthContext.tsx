import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import { type Environment } from 'relay-runtime';
import { createRelayEnvironment } from '../relay/environment';

interface TenantInfo {
  name: string;
  token: string;
  category: string;
  capacity: string;
}

interface AuthState {
  tenant: TenantInfo;
  environment: Environment;
}

interface AuthContextValue {
  state: AuthState | null;
  login: (tenant: TenantInfo) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const TENANTS: Record<string, TenantInfo> = {
  A: {
    name: 'Tenant A',
    token: 'tenant-a-secret',
    category: 'A',
    capacity: '50,000',
  },
  B: {
    name: 'Tenant B',
    token: 'tenant-b-secret',
    category: 'H',
    capacity: '50',
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState | null>(null);

  const logout = useCallback(() => {
    setState(null);
  }, []);

  const login = useCallback(
    (tenant: TenantInfo) => {
      const environment = createRelayEnvironment(tenant.token, {
        onUnauthenticated: logout,
      });
      setState({ tenant, environment });
    },
    [logout],
  );

  const value = useMemo(() => ({ state, login, logout }), [state, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
