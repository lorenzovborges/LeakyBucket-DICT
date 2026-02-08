import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import { type Environment } from 'relay-runtime';
import { createRelayEnvironment } from '../relay/environment';

export type DemoTenantKey = 'A' | 'B';

interface TenantInfo {
  name: string;
  category: string;
  capacity: string;
}

interface DemoLoginResponse {
  tenant: TenantInfo;
  bearerToken: string;
}

interface AuthState {
  tenant: TenantInfo;
  environment: Environment;
}

interface AuthContextValue {
  state: AuthState | null;
  login: (tenantKey: DemoTenantKey) => Promise<void>;
  logout: () => void;
  isLoggingIn: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const TENANTS: Record<DemoTenantKey, TenantInfo> = {
  A: {
    name: 'Tenant A',
    category: 'A',
    capacity: '50,000',
  },
  B: {
    name: 'Tenant B',
    category: 'H',
    capacity: '50',
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseDemoLoginResponse(value: unknown): DemoLoginResponse | null {
  if (!isRecord(value) || !isRecord(value.tenant)) {
    return null;
  }

  if (
    typeof value.tenant.name !== 'string' ||
    typeof value.tenant.category !== 'string' ||
    typeof value.tenant.capacity !== 'string' ||
    typeof value.bearerToken !== 'string'
  ) {
    return null;
  }

  return {
    tenant: {
      name: value.tenant.name,
      category: value.tenant.category,
      capacity: value.tenant.capacity,
    },
    bearerToken: value.bearerToken,
  };
}

async function requestDemoLogin(tenantKey: DemoTenantKey): Promise<DemoLoginResponse> {
  let response: Response;

  try {
    response = await fetch('/auth/demo-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tenantKey }),
    });
  } catch {
    throw new Error('Could not reach backend demo login endpoint.');
  }

  let payload: unknown = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    if (isRecord(payload) && typeof payload.error === 'string') {
      throw new Error(payload.error);
    }

    throw new Error('Demo login failed.');
  }

  const parsed = parseDemoLoginResponse(payload);

  if (!parsed) {
    throw new Error('Invalid demo login response from backend.');
  }

  return parsed;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const logout = useCallback(() => {
    setState(null);
  }, []);

  const login = useCallback(
    async (tenantKey: DemoTenantKey) => {
      setIsLoggingIn(true);

      try {
        const { tenant, bearerToken } = await requestDemoLogin(tenantKey);
        const environment = createRelayEnvironment(bearerToken, {
          onUnauthenticated: logout,
        });
        setState({ tenant, environment });
      } finally {
        setIsLoggingIn(false);
      }
    },
    [logout],
  );

  const value = useMemo(
    () => ({ state, login, logout, isLoggingIn }),
    [state, login, logout, isLoggingIn],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
