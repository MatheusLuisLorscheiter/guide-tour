import { useEffect, useMemo, useState } from 'react';
import { supabase, Event } from '../lib/supabase';
import { Loader2, Calendar as CalendarIcon, Zap, ExternalLink, ArrowLeft, Navigation } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

type EventWithCoordinates = Event & {
  latitude: number;
  longitude: number;
};

const eventMarkerIcon = L.icon({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});

export function Events() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventWithCoordinates | null>(null);
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

  const mapEvents = useMemo<EventWithCoordinates[]>(() => {
    return events.filter((event): event is EventWithCoordinates => {
      if (typeof event.latitude !== 'number' || typeof event.longitude !== 'number') {
        return false;
      }
      return event.latitude >= -90 && event.latitude <= 90 && event.longitude >= -180 && event.longitude <= 180;
    });
  }, [events]);

  useEffect(() => {
    if (mapEvents.length === 0) {
      setSelectedEvent(null);
      return;
    }

    setSelectedEvent((currentSelection) => {
      if (!currentSelection) {
        return mapEvents[0];
      }

      const stillVisible = mapEvents.find((event) => event.id === currentSelection.id);
      return stillVisible || mapEvents[0];
    });
  }, [mapEvents]);

  const mapCenter = useMemo<[number, number]>(() => {
    if (selectedEvent) {
      return [selectedEvent.latitude, selectedEvent.longitude];
    }
    if (mapEvents.length > 0) {
      return [mapEvents[0].latitude, mapEvents[0].longitude];
    }
    return [-29.7583, -51.1477];
  }, [mapEvents, selectedEvent]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
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
        ) : mapEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center glass-panel rounded-3xl p-8">
            <Navigation className="w-16 h-16 text-slate-600 mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">Eventos sem coordenadas</h3>
            <p className="text-slate-400 max-w-xl">
              Encontramos {events.length} evento(s), mas nenhum possui latitude/longitude válidas ainda. Execute novamente a varredura de IA para geocodificação e visualização no mapa.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start">
            <div className="glass-panel rounded-3xl p-2 h-[70vh] min-h-[480px] overflow-hidden">
              <MapContainer center={mapCenter} zoom={9} scrollWheelZoom className="h-full w-full rounded-2xl">
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {mapEvents.map((event) => (
                  <Marker
                    key={event.id}
                    icon={eventMarkerIcon}
                    position={[event.latitude, event.longitude]}
                    eventHandlers={{
                      click: () => setSelectedEvent(event),
                    }}
                  />
                ))}
              </MapContainer>
            </div>

            <div className="space-y-4">
              <AnimatePresence mode="wait">
                {selectedEvent && (
                  <motion.div
                    key={selectedEvent.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.2 }}
                    className="glass-panel rounded-2xl p-5 border border-white/10"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${getImpactColor(selectedEvent.estimated_impact)}`}>
                        Impacto: {selectedEvent.estimated_impact || 'Desconhecido'}
                      </div>
                      {selectedEvent.source_url && (
                        <a
                          href={selectedEvent.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-500 hover:text-white transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-white">{selectedEvent.title}</h3>
                    <p className="text-sm text-slate-400 mt-2 line-clamp-4">{selectedEvent.description || 'Sem descrição disponível.'}</p>

                    <div className="space-y-2 mt-5 text-sm text-slate-300">
                      <div className="flex items-center">
                        <CalendarIcon className="w-4 h-4 mr-2 text-tenant-primary" />
                        {formatDate(selectedEvent.event_date)}
                      </div>
                      <div className="flex items-center text-slate-400">
                        <Navigation className="w-4 h-4 mr-2 text-tenant-primary" />
                        {selectedEvent.latitude.toFixed(4)}, {selectedEvent.longitude.toFixed(4)}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        const params = new URLSearchParams({
                          eventId: selectedEvent.id,
                          eventTitle: selectedEvent.title,
                        });
                        navigate(`/schedules?${params.toString()}`);
                      }}
                      className="w-full mt-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-medium text-white transition-all text-center"
                    >
                      Criar Escala para o Evento
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="glass-panel rounded-2xl p-4">
                <p className="text-xs text-slate-500 mb-3 uppercase tracking-wider">Eventos no mapa</p>
                <div className="space-y-2 max-h-[40vh] overflow-auto pr-1">
                  {mapEvents.map((event) => (
                    <button
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className={`w-full text-left p-3 rounded-xl border transition-all ${
                        selectedEvent?.id === event.id
                          ? 'border-tenant-primary/60 bg-tenant-primary/10'
                          : 'border-white/10 hover:border-white/20 bg-slate-900/20'
                      }`}
                    >
                      <p className="text-sm font-semibold text-white line-clamp-1">{event.title}</p>
                      <p className="text-xs text-slate-400 mt-1">{formatDate(event.event_date)}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
