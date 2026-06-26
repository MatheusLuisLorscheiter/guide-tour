import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGuide, useSteps, useUserProgress } from '../hooks/useGuides';
import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '../contexts/TenantContext';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { PrintableGuide } from '../components/PrintableGuide';
import { cn } from '../lib/utils';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Clock,
  Lightbulb,
  Check,
  X,
  Loader2,
  Play,
  Pause,
  CheckCircle,
  Eye,
  Image as ImageIcon,
  FileText
} from 'lucide-react';

export function GuideView() {
  const { id: guideId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { guide, loading: guideLoading } = useGuide(guideId!);
  const { steps, loading: stepsLoading } = useSteps(guideId!);
  const { completedSteps, loading: progressLoading, toggleStepComplete } = useUserProgress(guideId!);
  const { user } = useAuth();
  const { tenant } = useTenant();
  
  const printRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showTip, setShowTip] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const [direction, setDirection] = useState(0); // For animation direction

  const loading = guideLoading || stepsLoading || progressLoading;
  const currentStep = steps[currentStepIndex];
  const totalSteps = steps.length;
  const completedCount = completedSteps.length;
  const progress = totalSteps > 0 ? (completedCount / totalSteps) * 100 : 0;

  // Timer countdown effect
  useEffect(() => {
    if (!timerRunning || timerSeconds === null) return;

    if (timerSeconds <= 0) {
      setTimerRunning(false);
      setTimerSeconds(null);
      return;
    }

    const interval = setInterval(() => {
      setTimerSeconds((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [timerRunning, timerSeconds]);

  // Reset timer when step changes
  useEffect(() => {
    setTimerSeconds(null);
    setTimerRunning(false);
  }, [currentStepIndex]);

  const goToStep = (index: number) => {
    if (index >= 0 && index < totalSteps) {
      setDirection(index > currentStepIndex ? 1 : -1);
      setCurrentStepIndex(index);
      setShowTip(false);
    }
  };

  const goToNextStep = () => {
    if (currentStepIndex < totalSteps - 1) {
      goToStep(currentStepIndex + 1);
    }
  };

  const goToPrevStep = () => {
    if (currentStepIndex > 0) {
      goToStep(currentStepIndex - 1);
    }
  };

  const handleCompleteStep = async () => {
    if (!currentStep) return;
    await toggleStepComplete(currentStep.id);
    if (currentStepIndex < totalSteps - 1 && !completedSteps.includes(currentStep.id)) {
      setTimeout(() => goToNextStep(), 400);
    }
  };

  const handleTimerClick = () => {
    if (!currentStep?.duration_seconds) return;

    if (timerSeconds === null) {
      setTimerSeconds(currentStep.duration_seconds);
      setTimerRunning(true);
    } else if (timerRunning) {
      setTimerRunning(false);
    } else {
      setTimerRunning(true);
    }
  };

  const getTimerColor = () => {
    if (timerSeconds === null) return 'text-slate-400 bg-slate-800/50 border-white/10';
    if (timerSeconds <= 10) return 'text-red-400 bg-red-500/20 border-red-500/30 animate-pulse';
    if (timerSeconds <= 20) return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
    if (timerSeconds <= 30) return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
    return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30';
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  };

  const handleExportPNG = async () => {
    if (!printRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(printRef.current, { 
        scale: 2,
        useCORS: true,
        logging: false
      });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `guia-${guide?.title?.toLowerCase().replace(/\s+/g, '-')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error generating PNG:', err);
      alert('Erro ao gerar PNG. Verifique as imagens usadas.');
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = async () => {
    if (!printRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(printRef.current, { 
        scale: 2,
        useCORS: true,
        logging: false
      });
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      let heightLeft = pdfHeight;
      let position = 0;
      
      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pdf.internal.pageSize.getHeight();

      while (heightLeft >= 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pdf.internal.pageSize.getHeight();
      }

      pdf.save(`guia-${guide?.title?.toLowerCase().replace(/\s+/g, '-')}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Erro ao gerar PDF. Verifique as imagens usadas.');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (!guide || steps.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <X className="w-16 h-16 text-slate-600 mb-6" />
        <p className="text-xl font-semibold text-slate-400 mb-6">Guia não encontrado ou sem passos</p>
        <button onClick={() => navigate('/')} className="btn-secondary">
          Voltar ao Início
        </button>
      </div>
    );
  }

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Immersive Header */}
      <header className="glass sticky top-0 z-40 border-b-0 border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-colors text-slate-300 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-white truncate">
                {guide.title}
              </h1>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold border border-white/10 uppercase tracking-wider text-slate-300">
                  {guide.difficulty === 'easy' ? 'Fácil' : guide.difficulty === 'medium' ? 'Médio' : 'Difícil'}
                </span>
                {guide.estimated_time && (
                  <span className="text-sm font-medium text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-orange-400" />
                    {guide.estimated_time} min
                  </span>
                )}
              </div>
            </div>

            {/* Progress Circular Indicator */}
            <div className="hidden sm:flex items-center gap-4 mr-6">
              <div className="text-right">
                <span className="text-lg font-black text-white tracking-tight">
                  {completedCount}<span className="text-slate-500">/{totalSteps}</span>
                </span>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">concluídos</p>
              </div>
              <div className="w-14 h-14 relative">
                <svg className="w-14 h-14 transform -rotate-90">
                  <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="none" className="text-slate-800" />
                  <circle
                    cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="none"
                    strokeDasharray={150}
                    strokeDashoffset={150 - (150 * progress) / 100}
                    className="text-tenant-primary transition-all duration-1000 ease-out"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-white">{Math.round(progress)}%</span>
                </div>
              </div>
            </div>
            
            {/* Export Buttons */}
            <div className="hidden lg:flex items-center gap-2 border-l border-white/10 pl-6">
               <button
                 onClick={handleExportPNG}
                 disabled={exporting}
                 className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/50 hover:bg-slate-700 text-slate-300 transition-colors border border-white/5"
                 title="Baixar como PNG"
               >
                 {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                 <span className="text-sm font-medium">PNG</span>
               </button>
               <button
                 onClick={handleExportPDF}
                 disabled={exporting}
                 className="flex items-center gap-2 px-3 py-2 rounded-xl bg-tenant-secondary hover:bg-tenant-secondary/80 text-white transition-colors shadow-lg shadow-tenant-secondary/20"
                 title="Baixar como PDF"
               >
                 {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                 <span className="text-sm font-medium">PDF</span>
               </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10 flex flex-col">
        
        {/* Step Carousel Progress Bar */}
        <div className="mb-8 overflow-hidden relative">
           <div className="flex items-center justify-center gap-2 overflow-x-auto pb-4 scrollbar-hide px-2">
            {steps.map((step, index) => {
              const isCompleted = completedSteps.includes(step.id);
              const isActive = index === currentStepIndex;
              return (
                <button
                  key={step.id}
                  onClick={() => goToStep(index)}
                  className={cn(
                    "flex-shrink-0 w-12 h-12 rounded-2xl font-bold text-lg transition-all flex items-center justify-center relative",
                    isActive
                      ? "bg-gradient-to-br from-tenant-primary to-tenant-secondary text-white shadow-xl shadow-tenant-primary/30 scale-110 z-10"
                      : isCompleted
                      ? "glass-panel bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                      : "glass-panel text-slate-400 hover:text-white hover:bg-white/10"
                  )}
                >
                  {isCompleted && !isActive ? <Check className="w-5 h-5" /> : index + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main step content */}
        <div className="flex-1 relative overflow-hidden rounded-[2.5rem] bg-slate-900 border border-white/5 shadow-2xl">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={currentStepIndex}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
              className="w-full h-full flex flex-col"
            >
              {/* Media section (Images showing orientations/arrows) */}
              {currentStep?.media && currentStep.media.length > 0 && (
                <div className="relative w-full aspect-video sm:aspect-[21/9] bg-black overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent z-10 opacity-60" />
                  {currentStep.media[0].type === 'image' ? (
                    <img
                      src={currentStep.media[0].url}
                      alt={currentStep.media[0].alt_text || currentStep.title}
                      className="w-full h-full object-cover object-center"
                    />
                  ) : (
                    <video
                      src={currentStep.media[0].url}
                      controls
                      className="w-full h-full object-cover"
                    />
                  )}
                  {/* Decorative tag on image */}
                  <div className="absolute top-6 right-6 z-20 bg-black/50 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl text-white font-medium flex items-center gap-2">
                    <Eye className="w-4 h-4 text-tenant-primary" /> Orientação Visual
                  </div>
                </div>
              )}

              {/* Text content */}
              <div className="p-6 sm:p-10 flex-1 flex flex-col justify-center">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-6">
                  <div>
                    <span className="inline-block px-3 py-1 bg-tenant-primary/10 text-tenant-primary font-bold text-sm rounded-lg mb-3 uppercase tracking-wider">
                      Passo {currentStepIndex + 1} de {totalSteps}
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                      {currentStep?.title}
                    </h2>
                  </div>
                  
                  {/* Timer */}
                  {currentStep?.duration_seconds && (
                    <button
                      onClick={handleTimerClick}
                      className={cn(
                        "flex items-center gap-3 px-5 py-3 rounded-2xl border transition-all cursor-pointer hover:scale-105 shadow-xl flex-shrink-0",
                        getTimerColor()
                      )}
                    >
                      <div className="p-2 bg-black/20 rounded-full">
                        {timerRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-bold uppercase tracking-wider opacity-80 mb-0.5">Tempo do Passo</p>
                        <p className="font-black text-xl leading-none">
                          {timerSeconds !== null ? formatDuration(timerSeconds) : formatDuration(currentStep.duration_seconds)}
                        </p>
                      </div>
                    </button>
                  )}
                </div>

                {currentStep?.description && (
                  <p className="text-slate-300 text-lg sm:text-xl leading-relaxed mb-8 max-w-4xl">
                    {currentStep.description}
                  </p>
                )}

                {/* Tip/Warning */}
                {currentStep?.tip && (
                  <div className="mb-8">
                    <AnimatePresence>
                      {showTip ? (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="glass-panel border-amber-500/30 bg-amber-500/10 rounded-2xl p-6 flex gap-4"
                        >
                          <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                            <Lightbulb className="w-6 h-6 text-amber-400" />
                          </div>
                          <div className="flex-1 pt-1">
                            <h4 className="font-bold text-amber-400 text-lg mb-1">Dica do Chef</h4>
                            <p className="text-amber-100 text-lg leading-relaxed">{currentStep.tip}</p>
                          </div>
                          <button onClick={() => setShowTip(false)} className="text-amber-400 hover:text-white p-2 h-fit">
                            <X className="w-6 h-6" />
                          </button>
                        </motion.div>
                      ) : (
                        <button
                          onClick={() => setShowTip(true)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-medium rounded-xl transition-colors border border-amber-500/20"
                        >
                          <Lightbulb className="w-5 h-5" />
                          Ver dica importante
                        </button>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Action Navigation */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            onClick={goToPrevStep}
            disabled={currentStepIndex === 0}
            className="w-full sm:w-auto btn-secondary"
          >
            <ChevronLeft className="w-5 h-5" />
            Passo Anterior
          </button>

          <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-4">
            {user && currentStep && (
               <button
                 onClick={handleCompleteStep}
                 className={cn(
                   "w-full sm:w-auto px-8 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-3 text-lg",
                   completedSteps.includes(currentStep.id)
                     ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30"
                     : "bg-white/10 hover:bg-white/20 text-white border border-white/10"
                 )}
               >
                 {completedSteps.includes(currentStep.id) ? (
                   <>
                     <CheckCircle className="w-6 h-6" />
                     Concluído
                   </>
                 ) : (
                   <>
                     <Check className="w-6 h-6" />
                     Marcar como Concluído
                   </>
                 )}
               </button>
            )}

            {currentStepIndex < totalSteps - 1 ? (
              <button onClick={goToNextStep} className="w-full sm:w-auto btn-primary px-8 py-4 text-lg">
                Próximo Passo
                <ChevronRight className="w-6 h-6" />
              </button>
            ) : (
              <button onClick={() => navigate('/')} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-8 py-4 rounded-xl flex items-center justify-center gap-3 text-lg shadow-lg shadow-emerald-600/20 transition-all">
                <CheckCircle className="w-6 h-6" />
                Finalizar Guia
              </button>
            )}
          </div>
        </div>
      </main>
      
      {/* Hidden Printable Container */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        <PrintableGuide ref={printRef} guide={guide} steps={steps} tenant={tenant} />
      </div>
    </div>
  );
}
