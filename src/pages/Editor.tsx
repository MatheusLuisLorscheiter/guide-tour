import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCategories } from '../hooks/useGuides';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Loader2,
  Image as ImageIcon,
  X,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

interface StepInput {
  id?: string;
  step_number: number;
  title: string;
  description: string;
  tip: string;
  duration_seconds: number | null;
  media_urls: string[];
}

export function Editor() {
  const { id: guideId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { categories } = useCategories();
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [estimatedTime, setEstimatedTime] = useState<number>(0);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [steps, setSteps] = useState<StepInput[]>([
    { step_number: 1, title: '', description: '', tip: '', duration_seconds: null, media_urls: [] },
  ]);

  // Load existing guide if editing
  useEffect(() => {
    const loadGuide = async () => {
      if (!guideId) return;

      setLoading(true);
      try {
        const { data: guideData, error: guideError } = await supabase
          .from('guides')
          .select('*')
          .eq('id', guideId)
          .single();

        if (guideError) throw guideError;

        setTitle(guideData.title);
        setDescription(guideData.description || '');
        setCategoryId(guideData.category_id || '');
        setEstimatedTime(guideData.estimated_time || 0);
        setDifficulty(guideData.difficulty);

        const { data: stepsData, error: stepsError } = await supabase
          .from('steps')
          .select('*, media:step_media(*)')
          .eq('guide_id', guideId)
          .order('step_number', { ascending: true });

        if (stepsError) throw stepsError;

        if (stepsData && stepsData.length > 0) {
          setSteps(
            stepsData.map((s) => ({
              id: s.id,
              step_number: s.step_number,
              title: s.title,
              description: s.description || '',
              tip: s.tip || '',
              duration_seconds: s.duration_seconds,
              media_urls: s.media?.map((m: { url: string }) => m.url) || [],
            }))
          );
        }
      } catch (err) {
        console.error('Error loading guide:', err);
        setError('Erro ao carregar guia');
      } finally {
        setLoading(false);
      }
    };

    loadGuide();
  }, [guideId]);

  const addStep = () => {
    setSteps((prev) => [
      ...prev,
      {
        step_number: prev.length + 1,
        title: '',
        description: '',
        tip: '',
        duration_seconds: null,
        media_urls: [],
      },
    ]);
  };

  const removeStep = (index: number) => {
    if (steps.length <= 1) return;
    setSteps((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      return updated.map((s, i) => ({ ...s, step_number: i + 1 }));
    });
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= steps.length) return;

    setSteps((prev) => {
      const updated = [...prev];
      [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
      return updated.map((s, i) => ({ ...s, step_number: i + 1 }));
    });
  };

  const updateStep = (index: number, field: keyof StepInput, value: unknown) => {
    setSteps((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addMediaUrl = (stepIndex: number, url: string) => {
    if (!url.trim()) return;
    setSteps((prev) => {
      const updated = [...prev];
      updated[stepIndex].media_urls = [...updated[stepIndex].media_urls, url];
      return updated;
    });
  };

  const removeMediaUrl = (stepIndex: number, urlIndex: number) => {
    setSteps((prev) => {
      const updated = [...prev];
      updated[stepIndex].media_urls = updated[stepIndex].media_urls.filter(
        (_, i) => i !== urlIndex
      );
      return updated;
    });
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError('O título é obrigatório');
      return;
    }

    if (steps.some((s) => !s.title.trim())) {
      setError('Todos os passos precisam de um título');
      return;
    }

    if (!user) {
      setError('Você precisa estar logado');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const guideData = {
        title,
        description: description || null,
        category_id: categoryId || null,
        estimated_time: estimatedTime || null,
        difficulty,
        created_by: user.id,
        is_active: true,
      };

      let guideResult;
      if (guideId) {
        const { data, error } = await supabase.from('guides').update(guideData).eq('id', guideId).select().single();
        if (error) throw error;
        guideResult = data;
      } else {
        const { data, error } = await supabase.from('guides').insert(guideData).select().single();
        if (error) throw error;
        guideResult = data;
      }

      if (guideId) {
        await supabase.from('steps').delete().eq('guide_id', guideId);
      }

      const stepsToInsert = steps.map((s) => ({
        guide_id: guideResult.id,
        step_number: s.step_number,
        title: s.title,
        description: s.description || null,
        tip: s.tip || null,
        duration_seconds: s.duration_seconds || null,
      }));

      const { data: insertedSteps, error: stepsError } = await supabase.from('steps').insert(stepsToInsert).select();
      if (stepsError) throw stepsError;

      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const insertedStep = insertedSteps?.find((s) => s.step_number === step.step_number);
        if (step.media_urls.length > 0 && insertedStep) {
          const mediaToInsert = step.media_urls.map((url, idx) => ({
            step_id: insertedStep.id,
            type: 'image' as const,
            url,
            sort_order: idx,
          }));
          await supabase.from('step_media').insert(mediaToInsert);
        }
      }

      navigate('/');
    } catch (err) {
      console.error('Error saving guide:', err);
      setError('Erro ao salvar guia');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-tenant-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-20">
      {/* Header */}
      <header className="glass sticky top-0 z-40 border-b-0 border-white/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-slate-300 hover:text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-bold text-white">
                {guideId ? 'Editar Guia' : 'Criar Novo Guia'}
              </h1>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              <span className="hidden sm:inline">Salvar Guia</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 bg-tenant-secondary/10 border border-tenant-secondary/20 text-tenant-secondary px-4 py-3 rounded-xl flex items-center gap-3"
            >
              <X className="w-5 h-5" />
              <p className="font-medium">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Guide details */}
        <section className="glass-panel rounded-3xl p-6 sm:p-8 mb-8">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-tenant-primary/20 flex items-center justify-center text-orange-400 font-bold">1</div>
             Informações Principais
          </h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-wider">
                Título do Guia <span className="text-tenant-primary">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Como montar um cone salgado tradicional..."
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-tenant-primary focus:ring-1 focus:ring-tenant-primary transition-all text-lg font-medium"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-wider">
                Descrição Curta
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Uma breve descrição do objetivo deste processo..."
                rows={3}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-tenant-primary focus:ring-1 focus:ring-tenant-primary transition-all resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-wider">Categoria</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-tenant-primary focus:ring-1 focus:ring-tenant-primary transition-all"
                >
                  <option value="">Selecione...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-wider">Tempo (min)</label>
                <input
                  type="number"
                  value={estimatedTime}
                  onChange={(e) => setEstimatedTime(parseInt(e.target.value) || 0)}
                  min="0"
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-tenant-primary focus:ring-1 focus:ring-tenant-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-wider">Dificuldade</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-tenant-primary focus:ring-1 focus:ring-tenant-primary transition-all"
                >
                  <option value="easy">Fácil</option>
                  <option value="medium">Médio</option>
                  <option value="hard">Difícil</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Steps */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
             <h2 className="text-xl font-bold text-white flex items-center gap-3">
               <div className="w-8 h-8 rounded-lg bg-tenant-primary/20 flex items-center justify-center text-orange-400 font-bold">2</div>
               Passo a Passo
             </h2>
          </div>

          <AnimatePresence mode="popLayout">
            {steps.map((step, index) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={`step-${index}`}
                className="glass-panel border-white/10 rounded-3xl p-6 relative overflow-hidden group"
              >
                {/* Visual Step Number */}
                <div className="absolute top-0 right-0 p-8 pt-6 pr-6 pointer-events-none opacity-5">
                   <span className="text-9xl font-black">{step.step_number}</span>
                </div>

                <div className="flex items-start gap-4 sm:gap-6 relative z-10">
                  <div className="flex flex-col gap-2 pt-2">
                    <button
                      onClick={() => moveStep(index, 'up')}
                      disabled={index === 0}
                      className="p-1.5 bg-slate-800 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronUp className="w-5 h-5" />
                    </button>
                    <div className="w-8 h-8 rounded-full bg-tenant-primary flex items-center justify-center font-bold text-white shadow-lg shadow-tenant-primary/30">
                      {step.step_number}
                    </div>
                    <button
                      onClick={() => moveStep(index, 'down')}
                      disabled={index === steps.length - 1}
                      className="p-1.5 bg-slate-800 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronDown className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex-1 space-y-4">
                    <input
                      type="text"
                      value={step.title}
                      onChange={(e) => updateStep(index, 'title', e.target.value)}
                      placeholder="Título do passo..."
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-tenant-primary focus:ring-1 focus:ring-tenant-primary transition-all font-semibold text-lg"
                    />

                    <textarea
                      value={step.description}
                      onChange={(e) => updateStep(index, 'description', e.target.value)}
                      placeholder="Descreva as ações que o funcionário deve tomar..."
                      rows={2}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-tenant-primary focus:ring-1 focus:ring-tenant-primary transition-all resize-none"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                         <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Dica do Chef (Opcional)</label>
                         <input
                           type="text"
                           value={step.tip}
                           onChange={(e) => updateStep(index, 'tip', e.target.value)}
                           placeholder="Ex: Cuidado com o forno quente..."
                           className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-tenant-primary focus:ring-1 focus:ring-tenant-primary transition-all"
                         />
                      </div>
                      <div>
                         <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Timer (Segundos)</label>
                         <input
                           type="number"
                           value={step.duration_seconds || ''}
                           onChange={(e) => updateStep(index, 'duration_seconds', parseInt(e.target.value) || null)}
                           placeholder="Tempo exato para o passo"
                           min="0"
                           className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-tenant-primary focus:ring-1 focus:ring-tenant-primary transition-all"
                         />
                      </div>
                    </div>

                    {/* Media URLs */}
                    <div className="space-y-3 pt-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Imagens (Orientações/Setas)</label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          placeholder="URL da imagem..."
                          className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-tenant-primary focus:ring-1 focus:ring-tenant-primary transition-all"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const input = e.target as HTMLInputElement;
                              addMediaUrl(index, input.value);
                              input.value = '';
                            }
                          }}
                        />
                        <button
                          onClick={(e) => {
                            const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                            if (input.value) {
                              addMediaUrl(index, input.value);
                              input.value = '';
                            }
                          }}
                          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors border border-white/5"
                        >
                          <ImageIcon className="w-5 h-5 text-slate-300" />
                        </button>
                      </div>
                      
                      {step.media_urls.length > 0 && (
                        <div className="flex flex-wrap gap-3 mt-3">
                          {step.media_urls.map((url, urlIndex) => (
                            <div key={urlIndex} className="relative group rounded-xl overflow-hidden border border-white/10">
                              <img src={url} alt={`Media ${urlIndex + 1}`} className="w-24 h-24 object-cover" />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button
                                  onClick={() => removeMediaUrl(index, urlIndex)}
                                  className="w-8 h-8 bg-tenant-secondary rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                                >
                                  <X className="w-4 h-4 text-white" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => removeStep(index)}
                    disabled={steps.length <= 1}
                    className="p-3 text-slate-500 hover:text-tenant-secondary hover:bg-tenant-secondary/10 rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed mt-2"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={addStep}
            className="w-full py-4 border-2 border-dashed border-slate-700 hover:border-tenant-primary/50 rounded-3xl text-slate-400 hover:text-orange-400 font-bold flex items-center justify-center gap-3 transition-colors bg-slate-900/50"
          >
            <Plus className="w-6 h-6" />
            Adicionar Próximo Passo
          </motion.button>
        </section>

        <div className="mt-10 pt-8 border-t border-white/5 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary w-full sm:w-auto px-10 py-4 text-lg"
          >
            {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
            Concluir e Salvar Guia
          </button>
        </div>
      </main>
    </div>
  );
}
