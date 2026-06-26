import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase, Tenant, TenantUser } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface TenantContextType {
  tenant: Tenant | null;
  tenantUser: TenantUser | null;
  loading: boolean;
  isAdmin: boolean;
  refreshTenant: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [tenantUser, setTenantUser] = useState<TenantUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTenant = async () => {
    if (!user) {
      setTenant(null);
      setTenantUser(null);
      setLoading(false);
      return;
    }

    try {
      // Find the user's tenant link
      const { data: tuData, error: tuError } = await supabase
        .from('tenant_users')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (tuError && tuError.code !== 'PGRST116') throw tuError;

      setTenantUser(tuData || null);

      if (tuData) {
        // Fetch the actual tenant
        const { data: tData, error: tError } = await supabase
          .from('tenants')
          .select('*')
          .eq('id', tuData.tenant_id)
          .single();

        if (tError) throw tError;
        setTenant(tData);

        // Inject CSS Variables for Customization
        if (tData) {
          const root = document.documentElement;
          if (tData.primary_color) {
            root.style.setProperty('--color-primary', tData.primary_color);
          }
          if (tData.secondary_color) {
            root.style.setProperty('--color-secondary', tData.secondary_color);
          }
        }
      } else {
        setTenant(null);
      }
    } catch (err) {
      console.error('Error fetching tenant:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenant();
  }, [user]);

  const value = {
    tenant,
    tenantUser,
    loading,
    isAdmin: tenantUser?.role === 'admin',
    refreshTenant: fetchTenant
  };

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}
