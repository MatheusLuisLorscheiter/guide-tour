import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCategories, useGuides } from '../hooks/useGuides';
import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '../contexts/TenantContext';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import {
  ChefHat,
  Triangle,
  Cake,
  Sparkles,
  DoorOpen,
  Users,
  Eye,
  Search,
  X,
  Plus,
  LogOut,
  Clock,
  Settings,
  CalendarDays,
  Zap
} from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ className?: string, style?: React.CSSProperties }>> = {
  'utensils': ChefHat,
  'triangle': Triangle,
  'cake': Cake,
  'sparkles': Sparkles,
  'door-open': DoorOpen,
  'users': Users,
  'folder': ChefHat,
};

export function Home() {
  const navigate = useNavigate();
  const { categories, loading: catLoading } = useCategories();
  const { user, signOut } = useAuth();
  const { tenant, isAdmin } = useTenant();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { guides, loading: guidesLoading } = useGuides(selectedCategory || undefined);

  const filteredGuides = guides.filter((guide) =>
    guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    guide.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'medium':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'hard':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'Fácil';
      case 'medium': return 'Médio';
      case 'hard': return 'Difícil';
      default: return difficulty;
    }
  };

  const formatTime = (minutes: number | null) => {
    if (!minutes) return null;
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header with Glassmorphism */}
      <header className="glass sticky top-0 z-40 border-b-0 border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-tenant-primary to-tenant-secondary rounded-2xl flex items-center justify-center shadow-lg">
              <ChefHat className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                {tenant?.name || 'GuideTour'}
              </h1>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Treinamento & Processos</p>
            </div>
          </motion.div>

          {user && (
            <div className="flex items-center gap-3">
              {isAdmin && (
                <>
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/settings')}
                    className="p-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-700 text-slate-300 transition-colors border border-white/5"
                    title="Configurações"
                  >
                    <Settings className="w-5 h-5" />
                  </motion.button>

                  <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/events')}
                    className="p-2.5 rounded-xl bg-slate-800/50 hover:bg-tenant-primary/20 text-slate-300 hover:text-tenant-primary transition-colors border border-white/5"
                    title="Eventos Locais"
                  >
                    <Zap className="w-5 h-5" />
                  </motion.button>
                  
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/schedules')}
                    className="p-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-700 text-slate-300 transition-colors border border-white/5"
                    title="Escalas e Turnos"
                  >
                    <CalendarDays className="w-5 h-5" />
                  </motion.button>

                  <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/editor')}
                    className="btn-primary"
                  >
                    <Plus className="w-5 h-5" />
                    <span className="hidden sm:inline">Novo Guia</span>
                  </motion.button>
                </>
              )}

              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={async () => {
                  await signOut();
                  navigate('/login');
                }}
                className="btn-secondary px-4 bg-slate-800/50 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 text-slate-300 border-white/5"
                title="Sair da conta"
              >
                <LogOut className="w-5 h-5" />
              </motion.button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Search */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mb-10 group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-tenant-primary/20 to-tenant-secondary/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all opacity-50" />
          <div className="relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar processos, receitas ou rotinas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full glass-panel border-white/10 rounded-2xl pl-14 pr-12 py-4 text-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-tenant-primary/50 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </motion.div>

        {/* Categories */}
        {!catLoading && categories.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-10"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Categorias</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory(null)}
                className={cn(
                  "px-5 py-2.5 rounded-xl font-medium transition-all",
                  !selectedCategory
                    ? "bg-gradient-to-r from-tenant-primary to-tenant-secondary text-white shadow-lg border border-tenant-primary/50"
                    : "glass-panel text-slate-300 hover:bg-white/10"
                )}
              >
                Todos
              </motion.button>
              {categories.map((category) => {
                const Icon = iconMap[category.icon] || ChefHat;
                const isSelected = selectedCategory === category.id;
                return (
                  <motion.button
                    key={category.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedCategory(category.id)}
                    className={cn(
                      "px-5 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 border",
                      isSelected
                        ? "bg-gradient-to-r from-tenant-primary to-tenant-secondary text-white shadow-lg border-tenant-primary/50"
                        : "glass-panel text-slate-300 hover:bg-white/10 border-white/5"
                    )}
                  >
                    <Icon className="w-4 h-4" style={{ color: isSelected ? 'white' : category.color }} />
                    {category.name}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Guides Grid */}
        <motion.div layout>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">
              {selectedCategory
                ? categories.find((c) => c.id === selectedCategory)?.name || 'Guias'
                : 'Todos os Guias'}
            </h2>
            <span className="text-sm font-medium text-slate-400 bg-slate-800/50 px-3 py-1 rounded-full border border-white/5">
              {filteredGuides.length} resultados
            </span>
          </div>

          {guidesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="glass-panel rounded-3xl h-56 animate-pulse"
                />
              ))}
            </div>
          ) : filteredGuides.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20 glass-panel rounded-3xl"
            >
              <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5">
                <ChefHat className="w-10 h-10 text-slate-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Nenhum guia encontrado</h3>
              <p className="text-slate-400 max-w-md mx-auto">
                Tente ajustar sua busca ou selecione outra categoria para ver os guias disponíveis.
              </p>
            </motion.div>
          ) : (
            <motion.div 
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              <AnimatePresence mode="popLayout">
                {filteredGuides.map((guide, index) => {
                  const category = categories.find((c) => c.id === guide.category_id);
                  const Icon = iconMap[category?.icon || 'folder'] || ChefHat;

                  return (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      key={guide.id}
                      onClick={() => navigate(`/guide/${guide.id}`)}
                      className="group cursor-pointer glass-panel hover:bg-slate-800/60 rounded-3xl p-6 text-left transition-all duration-300 hover:shadow-2xl hover:shadow-tenant-primary/10 hover:-translate-y-1 relative overflow-hidden"
                    >
                      {/* Decorative gradient blob */}
                      <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-tenant-primary/20 to-tenant-secondary/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />

                      <div className="relative z-10">
                        <div className="flex items-start justify-between mb-4">
                          <div
                            className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner border border-white/10"
                            style={{ backgroundColor: `${category?.color}20` }}
                          >
                            <Icon
                              className="w-7 h-7"
                              style={{ color: category?.color }}
                            />
                          </div>
                          <span
                            className={cn(
                              "px-3 py-1.5 rounded-xl text-xs font-bold border uppercase tracking-wider",
                              getDifficultyColor(guide.difficulty)
                            )}
                          >
                            {getDifficultyLabel(guide.difficulty)}
                          </span>
                        </div>

                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-tenant-primary transition-colors line-clamp-1">
                          {guide.title}
                        </h3>

                        {guide.description && (
                          <p className="text-slate-400 text-sm line-clamp-2 mb-6">
                            {guide.description}
                          </p>
                        )}

                        <div className="flex items-center gap-5 text-sm font-medium text-slate-500 pt-4 border-t border-white/5">
                          {guide.estimated_time && (
                            <span className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-orange-400" />
                              {formatTime(guide.estimated_time)}
                            </span>
                          )}
                          <span className="flex items-center gap-2">
                            <Eye className="w-4 h-4 text-blue-400" />
                            {guide.views_count}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
