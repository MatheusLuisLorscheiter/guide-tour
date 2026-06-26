import { useEffect, useState } from 'react';
import { supabase, Schedule } from '../lib/supabase';
import { Loader2, ArrowLeft, CalendarDays, Plus, Clock, Users, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTenant } from '../contexts/TenantContext';
import { useAuth } from '../contexts/AuthContext';

type ScheduleAssignment = {
  id: string;
  status: 'pending' | 'confirmed' | 'declined';
  user_id: string;
};

type ScheduleRow = Schedule & {
  event: { id: string; title: string } | null;
  assignments: ScheduleAssignment[];
};

export function Schedules() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAdmin } = useTenant();
  const { user } = useAuth();
  const selectedEventId = searchParams.get('eventId');
  const selectedEventTitle = searchParams.get('eventTitle');
  const [schedules, setSchedules] = useState<ScheduleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      const { data, error } = await supabase
        .from('schedules')
        .select(`
          *,
          event:events(id, title),
          assignments:schedule_assignments(id, status, user_id)
        `)
        .order('start_time', { ascending: true });

      if (error) throw error;
      setSchedules((data as ScheduleRow[] | null) || []);
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
        {selectedEventId && selectedEventTitle && (
          <div className="glass-panel rounded-2xl p-4 mb-6 border border-tenant-primary/30">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Evento selecionado</p>
            <p className="text-white font-semibold">{selectedEventTitle}</p>
            <p className="text-sm text-slate-400 mt-1">
              Você já veio do Radar de Eventos. Use “Novo Turno” para criar a escala vinculada a este evento.
            </p>
          </div>
        )}

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
            {schedules.map((schedule, index) => {
              const myAssignment = schedule.assignments?.find((assignment) => assignment.user_id === user?.id);
              
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

        {showModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="glass-panel rounded-2xl p-6 w-full max-w-lg border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Novo Turno</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-slate-300 text-sm">
                O fluxo de criação completa será conectado na próxima etapa. Enquanto isso, o contexto do evento já está disponível para vinculação:
              </p>
              <p className="mt-3 text-tenant-primary font-medium">
                {selectedEventTitle || 'Nenhum evento selecionado do Radar'}
              </p>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-medium"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
