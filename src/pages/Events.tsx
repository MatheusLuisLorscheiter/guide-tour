import { useState, useEffect } from 'react';
import { supabase, Event } from '../lib/supabase';
import { Loader2, Calendar as CalendarIcon, MapPin, Zap, ExternalLink, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export function Events() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  const getImpactColor = (impact: string | null) => {
    if (!impact) return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    const lower = impact.toLowerCase();
    if (lower.includes('alto') || lower.includes('high')) return 'bg-red-500/10 text-red-400 border-red-500/20';
    if (lower.includes('médio') || lower.includes('medio') || lower.includes('medium')) return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
    return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  };

  return (
    <div className="min-h-screen bg-slate-950 pb-20">
      <header className="glass sticky top-0 z-40 border-b-0 border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-slate-300 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-tenant-primary" />
                Eventos Locais
              </h1>
              <p className="text-xs text-slate-500">Eventos mapeados pela IA na sua região</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/schedules')}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-medium text-white transition-colors"
          >
            Ver Escalas
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-tenant-primary animate-spin" />
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center glass-panel rounded-3xl p-8">
            <CalendarIcon className="w-16 h-16 text-slate-600 mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">Nenhum evento mapeado</h3>
            <p className="text-slate-400 max-w-md">
              Ainda não temos eventos capturados para a sua região. Certifique-se de configurar a Cidade Alvo nas Configurações e aguarde a varredura da IA.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event, index) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                key={event.id}
                className="glass-panel p-6 rounded-2xl flex flex-col h-full hover:border-white/10 transition-colors"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${getImpactColor(event.estimated_impact)}`}>
                    Impacto: {event.estimated_impact || 'Desconhecido'}
                  </div>
                  {event.source_url && (
                    <a href={event.source_url} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-white transition-colors">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
                
                <h3 className="text-lg font-bold text-white mb-2">{event.title}</h3>
                <p className="text-sm text-slate-400 mb-6 flex-grow line-clamp-3">
                  {event.description}
                </p>

                <div className="mt-auto pt-4 border-t border-white/5 space-y-3">
                  <div className="flex items-center text-sm text-slate-300">
                    <CalendarIcon className="w-4 h-4 mr-2 text-tenant-primary" />
                    {new Date(event.event_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                  </div>
                  
                  <button 
                    onClick={() => navigate('/schedules')}
                    className="w-full py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-medium text-white transition-all text-center"
                  >
                    Criar Escala para o Evento
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
