import { forwardRef } from 'react';
import { Guide, Step, Tenant } from '../lib/supabase';

interface PrintableGuideProps {
  guide: Guide;
  steps: Step[];
  tenant: Tenant | null;
}

export const PrintableGuide = forwardRef<HTMLDivElement, PrintableGuideProps>(
  ({ guide, steps, tenant }, ref) => {
    return (
      <div
        ref={ref}
        className="bg-white text-slate-900 p-12 mx-auto"
        style={{ width: '800px', minHeight: '1131px', fontFamily: 'sans-serif' }}
      >
        {/* Header */}
        <div className="border-b-2 border-slate-200 pb-6 mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black text-slate-900 mb-2">{guide.title}</h1>
            {guide.description && <p className="text-lg text-slate-600">{guide.description}</p>}
          </div>
          <div className="text-right">
            {tenant && (
              <p className="font-bold text-slate-400 uppercase tracking-widest text-sm">
                {tenant.name}
              </p>
            )}
            <p className="text-slate-500 font-medium">
              {steps.length} passos {guide.estimated_time ? `• ${guide.estimated_time} min` : ''}
            </p>
          </div>
        </div>

        {/* Steps List */}
        <div className="space-y-12">
          {steps.map((step, index) => (
            <div key={step.id} className="flex gap-6 break-inside-avoid">
              <div className="flex-shrink-0">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center font-black text-xl text-white"
                  style={{ backgroundColor: tenant?.primary_color || '#f97316' }}
                >
                  {index + 1}
                </div>
              </div>
              
              <div className="flex-1 space-y-4 pt-1">
                <h3 className="text-2xl font-bold text-slate-900">{step.title}</h3>
                
                {step.description && (
                  <p className="text-slate-700 text-lg leading-relaxed">{step.description}</p>
                )}

                {step.tip && (
                  <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg">
                    <p className="text-sm font-bold text-amber-700 uppercase tracking-wider mb-1">Dica Importante</p>
                    <p className="text-amber-900">{step.tip}</p>
                  </div>
                )}

                {step.media && step.media.length > 0 && (
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    {step.media.map((m, mIdx: number) => (
                      m.type === 'image' && (
                        <div key={mIdx} className="rounded-xl overflow-hidden border border-slate-200 shadow-sm aspect-video bg-slate-100 flex items-center justify-center">
                          <img
                            src={m.url}
                            alt={step.title}
                            className="w-full h-full object-contain"
                            crossOrigin="anonymous" // IMPORTANT FOR HTML2CANVAS
                          />
                        </div>
                      )
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-slate-200 text-center text-slate-400 text-sm">
          Gerado pelo GuideTour {tenant ? `para ${tenant.name}` : ''} • {new Date().toLocaleDateString('pt-BR')}
        </div>
      </div>
    );
  }
);

PrintableGuide.displayName = 'PrintableGuide';
