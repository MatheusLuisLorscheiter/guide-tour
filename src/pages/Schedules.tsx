import { useState, useEffect } from 'react';
import { supabase, Schedule, Event } from '../lib/supabase';
import { Loader2, ArrowLeft, CalendarDays, Plus, Clock, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '../contexts/TenantContext';
import { useAuth } from '../contexts/AuthContext';

export function Schedules() {
  const navigate = useNavigate();
  const { isAdmin } = useTenant();
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      // In a real app we'd also fetch the event and assignments via joins
      const { data, error } = await supabase
        .from('schedules')
        .select(`
          *,
          event:events(id, title),
          assignments:schedule_assignments(id, status, user_id)
        `)
        .order('start_time', { ascending: true });

      if (error) throw error;
      setSchedules(data || []);
    } catch (err) {
      console.error('Error fetching schedules:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };
  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
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
                <CalendarDays className="w-5 h-5 text-tenant-primary" />
                Gestão de Escalas
              </h1>
              <p className="text-xs text-slate-500">Organize os turnos da sua equipe</p>
            </div>
          </div>
          {isAdmin && (
            <button 
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-tenant-primary hover:bg-tenant-primary/90 rounded-xl text-sm font-medium text-white transition-colors"
            >
              <Plus className="w-4 h-4" />
              Novo Turno
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-tenant-primary animate-spin" />
          </div>
        ) : schedules.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center glass-panel rounded-3xl p-8">
            <CalendarDays className="w-16 h-16 text-slate-600 mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">Nenhuma escala cadastrada</h3>
            <p className="text-slate-400 max-w-md">
              Crie turnos de trabalho para o seu dia a dia ou vincule-os a eventos específicos na cidade.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {schedules.map((schedule: any, index) => {
              const myAssignment = schedule.assignments?.find((a: any) => a.user_id === user?.id);
              
              return (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  key={schedule.id}
                  className="glass-panel p-6 rounded-2xl flex flex-col h-full hover:border-white/10 transition-colors relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-tenant-primary"></div>
                  
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-white">{schedule.title}</h3>
                  </div>
                  
                  {schedule.event && (
                    <div className="inline-block px-2.5 py-1 bg-white/5 rounded-lg text-xs text-slate-300 mb-4 self-start">
                      🎯 Evento: {schedule.event.title}
                    </div>
                  )}

                  <div className="space-y-3 mb-6 mt-2">
                    <div className="flex items-center text-sm text-slate-300">
                      <Clock className="w-4 h-4 mr-2 text-slate-400" />
                      {formatDate(schedule.start_time)} • {formatTime(schedule.start_time)} as {formatTime(schedule.end_time)}
                    </div>
                    <div className="flex items-center text-sm text-slate-300">
                      <Users className="w-4 h-4 mr-2 text-slate-400" />
                      {schedule.assignments?.length || 0} Funcionários Escalados
                    </div>
                  </div>

                  <div className="mt-auto pt-4 border-t border-white/5">
                    {isAdmin ? (
                      <button className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-medium text-white transition-colors">
                        Gerenciar Equipe
                      </button>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-400">Meu status:</span>
                        <span className={`text-sm font-medium ${
                          myAssignment?.status === 'confirmed' ? 'text-emerald-400' :
                          myAssignment?.status === 'declined' ? 'text-red-400' : 'text-orange-400'
                        }`}>
                          {myAssignment?.status === 'confirmed' ? 'Confirmado' :
                           myAssignment?.status === 'declined' ? 'Recusado' : 'Pendente'}
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  );
}
