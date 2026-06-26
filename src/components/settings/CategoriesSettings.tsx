import { useState, useEffect, useCallback } from 'react';
import { supabase, Category, Tenant } from '../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash2,
  Save,
  Loader2,
  Check,
  ChevronUp,
  ChevronDown,
  X,
  Pencil,
  ChefHat,
  Triangle,
  Cake,
  Sparkles,
  DoorOpen,
  Users,
  Folder,
  Star,
  Zap,
  Heart,
  Coffee,
  ShoppingBag,
  Wrench,
  BookOpen,
} from 'lucide-react';

// Available icons for category selection
const AVAILABLE_ICONS = [
  { key: 'utensils', label: 'Utensílios', Icon: ChefHat },
  { key: 'triangle', label: 'Triângulo', Icon: Triangle },
  { key: 'cake', label: 'Doces', Icon: Cake },
  { key: 'sparkles', label: 'Limpeza', Icon: Sparkles },
  { key: 'door-open', label: 'Porta', Icon: DoorOpen },
  { key: 'users', label: 'Pessoas', Icon: Users },
  { key: 'folder', label: 'Pasta', Icon: Folder },
  { key: 'star', label: 'Estrela', Icon: Star },
  { key: 'zap', label: 'Raio', Icon: Zap },
  { key: 'heart', label: 'Coração', Icon: Heart },
  { key: 'coffee', label: 'Café', Icon: Coffee },
  { key: 'shopping-bag', label: 'Compras', Icon: ShoppingBag },
  { key: 'wrench', label: 'Ferramentas', Icon: Wrench },
  { key: 'book-open', label: 'Manual', Icon: BookOpen },
];

const iconMap: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {};
AVAILABLE_ICONS.forEach((i) => { iconMap[i.key] = i.Icon; });

interface Props {
  tenant: Tenant;
}

interface EditingCategory {
  id?: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

const DEFAULT_NEW: EditingCategory = {
  name: '',
  description: '',
  icon: 'folder',
  color: '#3B82F6',
};

export function CategoriesSettings({ tenant }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);

  // Editing state
  const [editingCategory, setEditingCategory] = useState<EditingCategory | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  }, [tenant.id]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleStartCreate = () => {
    setIsCreating(true);
    setEditingCategory({ ...DEFAULT_NEW });
    setShowIconPicker(false);
  };

  const handleStartEdit = (cat: Category) => {
    setIsCreating(false);
    setEditingCategory({
      id: cat.id,
      name: cat.name,
      description: cat.description || '',
      icon: cat.icon,
      color: cat.color,
    });
    setShowIconPicker(false);
  };

  const handleCancel = () => {
    setEditingCategory(null);
    setIsCreating(false);
    setShowIconPicker(false);
  };

  const handleSave = async () => {
    if (!editingCategory || !editingCategory.name.trim()) return;

    setSaving(true);
    try {
      if (isCreating) {
        const maxOrder = categories.length > 0
          ? Math.max(...categories.map((c) => c.sort_order))
          : 0;

        const { error } = await supabase.from('categories').insert({
          name: editingCategory.name.trim(),
          description: editingCategory.description.trim() || null,
          icon: editingCategory.icon,
          color: editingCategory.color,
          sort_order: maxOrder + 1,
          tenant_id: tenant.id,
        });
        if (error) throw error;
      } else if (editingCategory.id) {
        const { error } = await supabase
          .from('categories')
          .update({
            name: editingCategory.name.trim(),
            description: editingCategory.description.trim() || null,
            icon: editingCategory.icon,
            color: editingCategory.color,
          })
          .eq('id', editingCategory.id);
        if (error) throw error;
        setSavedId(editingCategory.id);
        setTimeout(() => setSavedId(null), 2000);
      }

      await fetchCategories();
      handleCancel();
    } catch (err) {
      console.error('Error saving category:', err);
      alert('Erro ao salvar categoria.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
      await fetchCategories();
      setDeleteConfirmId(null);
    } catch (err) {
      console.error('Error deleting category:', err);
      alert('Erro ao excluir categoria. Ela pode estar sendo usada por guias.');
    }
  };

  const handleReorder = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= categories.length) return;

    const updated = [...categories];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];

    // Optimistic update
    setCategories(updated);

    // Persist new order
    try {
      for (let i = 0; i < updated.length; i++) {
        await supabase
          .from('categories')
          .update({ sort_order: i + 1 })
          .eq('id', updated[i].id);
      }
    } catch (err) {
      console.error('Error reordering:', err);
      fetchCategories(); // Rollback
    }
  };

  const CurrentIcon = editingCategory ? (iconMap[editingCategory.icon] || Folder) : Folder;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-tenant-primary animate-spin" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">Gerenciar Categorias</h2>
          <p className="text-sm text-slate-400">Organize seus guias em categorias para facilitar a navegação.</p>
        </div>
        {!editingCategory && (
          <button onClick={handleStartCreate} className="btn-primary text-sm !px-4 !py-2.5">
            <Plus className="w-4 h-4" />
            Nova Categoria
          </button>
        )}
      </div>

      {/* Create / Edit Form */}
      <AnimatePresence>
        {editingCategory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-slate-900/80 rounded-2xl p-6 border border-tenant-primary/30 space-y-4">
              <h3 className="text-base font-bold text-white">
                {isCreating ? 'Nova Categoria' : 'Editar Categoria'}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Nome *</label>
                  <input
                    type="text"
                    value={editingCategory.name}
                    onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                    placeholder="Ex: Pizzas Tradicionais"
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-tenant-primary focus:ring-1 focus:ring-tenant-primary transition-all"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Descrição</label>
                  <input
                    type="text"
                    value={editingCategory.description}
                    onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                    placeholder="Uma breve descrição..."
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-tenant-primary focus:ring-1 focus:ring-tenant-primary transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Icon Picker */}
                <div className="relative">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Ícone</label>
                  <button
                    type="button"
                    onClick={() => setShowIconPicker(!showIconPicker)}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white flex items-center gap-3 hover:border-tenant-primary/50 transition-all"
                  >
                    <CurrentIcon className="w-5 h-5" style={{ color: editingCategory.color }} />
                    <span className="text-sm">{AVAILABLE_ICONS.find((i) => i.key === editingCategory.icon)?.label || 'Selecionar'}</span>
                  </button>

                  {showIconPicker && (
                    <div className="absolute top-full left-0 mt-2 w-full bg-slate-800 border border-white/10 rounded-xl p-3 grid grid-cols-4 sm:grid-cols-7 gap-2 z-50 shadow-2xl shadow-black/40">
                      {AVAILABLE_ICONS.map((item) => {
                        const IconComp = item.Icon;
                        return (
                          <button
                            key={item.key}
                            title={item.label}
                            onClick={() => {
                              setEditingCategory({ ...editingCategory, icon: item.key });
                              setShowIconPicker(false);
                            }}
                            className={`p-2.5 rounded-xl flex items-center justify-center transition-all ${
                              editingCategory.icon === item.key
                                ? 'bg-tenant-primary/20 border border-tenant-primary/50'
                                : 'hover:bg-white/5 border border-transparent'
                            }`}
                          >
                            <IconComp className="w-5 h-5" style={{ color: editingCategory.color }} />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Color */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Cor</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={editingCategory.color}
                      onChange={(e) => setEditingCategory({ ...editingCategory, color: e.target.value })}
                      className="w-10 h-10 rounded-xl bg-slate-800 border border-white/10 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={editingCategory.color}
                      onChange={(e) => setEditingCategory({ ...editingCategory, color: e.target.value })}
                      className="flex-1 bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleSave}
                  disabled={saving || !editingCategory.name.trim()}
                  className="btn-primary text-sm !px-5 !py-2.5"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isCreating ? 'Criar Categoria' : 'Salvar Alterações'}
                </button>
                <button
                  onClick={handleCancel}
                  className="px-5 py-2.5 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category List */}
      {categories.length === 0 && !editingCategory ? (
        <div className="text-center py-16 bg-slate-900/50 rounded-2xl border border-white/5">
          <Folder className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">Nenhuma categoria criada ainda.</p>
          <p className="text-slate-500 text-sm mt-1">Crie categorias para organizar seus guias.</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {categories.map((cat, index) => {
              const CatIcon = iconMap[cat.icon] || Folder;
              const isBeingEdited = editingCategory?.id === cat.id;

              return (
                <motion.div
                  layout
                  key={cat.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  className={`flex items-center gap-4 p-4 rounded-2xl transition-all border ${
                    isBeingEdited
                      ? 'bg-tenant-primary/5 border-tenant-primary/30'
                      : 'bg-slate-900/50 border-white/5 hover:border-white/10'
                  }`}
                >
                  {/* Reorder */}
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => handleReorder(index, 'up')}
                      disabled={index === 0}
                      className="p-1 text-slate-500 hover:text-white disabled:opacity-20 transition-colors"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleReorder(index, 'down')}
                      disabled={index === categories.length - 1}
                      className="p-1 text-slate-500 hover:text-white disabled:opacity-20 transition-colors"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Icon */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border border-white/5"
                    style={{ backgroundColor: `${cat.color}20` }}
                  >
                    <CatIcon className="w-5 h-5" style={{ color: cat.color }} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold truncate">{cat.name}</p>
                    {cat.description && (
                      <p className="text-xs text-slate-500 truncate">{cat.description}</p>
                    )}
                  </div>

                  {/* Saved indicator */}
                  {savedId === cat.id && (
                    <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
                      <Check className="w-3 h-3" /> Salvo
                    </span>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleStartEdit(cat)}
                      className="p-2 text-slate-500 hover:text-tenant-primary hover:bg-tenant-primary/10 rounded-xl transition-colors"
                      title="Editar"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    {deleteConfirmId === cat.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDelete(cat.id)}
                          className="p-2 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors text-xs font-bold"
                        >
                          Confirmar
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="p-2 text-slate-500 hover:text-white rounded-xl transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(cat.id)}
                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
