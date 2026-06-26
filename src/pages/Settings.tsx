import { useState } from 'react';
import { useTenant } from '../contexts/TenantContext';
import { motion } from 'framer-motion';
import { ArrowLeft, Palette, FolderTree, Users, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppearanceSettings } from '../components/settings/AppearanceSettings';
import { CategoriesSettings } from '../components/settings/CategoriesSettings';
import { TeamSettings } from '../components/settings/TeamSettings';
import { AISettings } from '../components/settings/AISettings';
import { Bot } from 'lucide-react';

type Tab = 'appearance' | 'categories' | 'team' | 'ai';

const TABS: { key: Tab; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'appearance', label: 'Aparência', Icon: Palette },
  { key: 'categories', label: 'Categorias', Icon: FolderTree },
  { key: 'team', label: 'Equipe', Icon: Users },
  { key: 'ai', label: 'Inteligência', Icon: Bot },
];

export function Settings() {
  const { tenant, refreshTenant, loading } = useTenant();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('appearance');

  if (loading || !tenant) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-tenant-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-20">
      <header className="glass sticky top-0 z-40 border-b-0 border-white/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-slate-300 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">Configurações</h1>
              <p className="text-xs text-slate-500">{tenant.name}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col md:flex-row gap-8">

          {/* Sidebar */}
          <aside className="w-full md:w-56 flex-shrink-0">
            <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
              {TABS.map(({ key, label, Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap text-sm font-medium ${
                    activeTab === key
                      ? 'bg-tenant-primary text-white font-bold shadow-lg shadow-tenant-primary/20'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {label}
                </button>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <section className="flex-1 glass-panel rounded-3xl p-6 sm:p-8">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
              {activeTab === 'appearance' && (
                <AppearanceSettings tenant={tenant} refreshTenant={refreshTenant} />
              )}
              {activeTab === 'categories' && (
                <CategoriesSettings tenant={tenant} />
              )}
              {activeTab === 'team' && (
                <TeamSettings tenant={tenant} />
              )}
              {activeTab === 'ai' && (
                <AISettings tenantId={tenant.id} />
              )}
            </motion.div>
          </section>
        </div>
      </main>
    </div>
  );
}
