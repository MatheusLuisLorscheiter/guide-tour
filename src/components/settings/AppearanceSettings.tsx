import { useState, useEffect } from 'react';
import { supabase, Tenant } from '../../lib/supabase';
import { motion } from 'framer-motion';
import { Save, Loader2, Check, Image as ImageIcon, X } from 'lucide-react';

interface Props {
  tenant: Tenant;
  refreshTenant: () => Promise<void>;
}

export function AppearanceSettings({ tenant, refreshTenant }: Props) {
  const [name, setName] = useState(tenant.name || '');
  const [primaryColor, setPrimaryColor] = useState(tenant.primary_color || '#f97316');
  const [secondaryColor, setSecondaryColor] = useState(tenant.secondary_color || '#dc2626');
  const [logoUrl, setLogoUrl] = useState(tenant.logo_url || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [logoError, setLogoError] = useState(false);

  // Sync state if tenant changes
  useEffect(() => {
    setName(tenant.name || '');
    setPrimaryColor(tenant.primary_color || '#f97316');
    setSecondaryColor(tenant.secondary_color || '#dc2626');
    setLogoUrl(tenant.logo_url || '');
  }, [tenant]);

  // Live preview: update CSS vars while editing
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', primaryColor);
    root.style.setProperty('--color-secondary', secondaryColor);
  }, [primaryColor, secondaryColor]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const { error } = await supabase
        .from('tenants')
        .update({
          name,
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          logo_url: logoUrl || null,
        })
        .eq('id', tenant.id);

      if (error) throw error;
      await refreshTenant();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar configurações.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Aparência e Identidade</h2>
        <p className="text-sm text-slate-400">Personalize a identidade visual do seu ambiente de trabalho.</p>
      </div>

      {/* Company Name */}
      <div>
        <label className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-wider">
          Nome da Empresa
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-tenant-primary focus:ring-1 focus:ring-tenant-primary transition-all font-medium"
          placeholder="Ex: Pizzaria do Chef"
        />
      </div>

      {/* Logo URL */}
      <div>
        <label className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-wider">
          Logo (URL da imagem)
        </label>
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <input
              type="url"
              value={logoUrl}
              onChange={(e) => {
                setLogoUrl(e.target.value);
                setLogoError(false);
              }}
              placeholder="https://exemplo.com/logo.png"
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-tenant-primary focus:ring-1 focus:ring-tenant-primary transition-all font-mono text-sm"
            />
            <p className="text-xs text-slate-500 mt-1.5">Cole a URL de uma imagem para usar como logo. Formatos: PNG, JPG, SVG.</p>
          </div>
          <div className="w-16 h-16 rounded-2xl border border-white/10 bg-slate-900 flex items-center justify-center overflow-hidden flex-shrink-0">
            {logoUrl && !logoError ? (
              <img
                src={logoUrl}
                alt="Logo preview"
                className="w-full h-full object-contain p-1"
                onError={() => setLogoError(true)}
              />
            ) : (
              <ImageIcon className="w-6 h-6 text-slate-600" />
            )}
          </div>
        </div>
        {logoError && (
          <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
            <X className="w-3 h-3" />
            Não foi possível carregar a imagem. Verifique a URL.
          </p>
        )}
      </div>

      {/* Colors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-wider">
            Cor Primária
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="w-12 h-12 rounded-xl bg-slate-900 border border-white/10 cursor-pointer"
            />
            <input
              type="text"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none font-mono"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-wider">
            Cor Secundária
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={secondaryColor}
              onChange={(e) => setSecondaryColor(e.target.value)}
              className="w-12 h-12 rounded-xl bg-slate-900 border border-white/10 cursor-pointer"
            />
            <input
              type="text"
              value={secondaryColor}
              onChange={(e) => setSecondaryColor(e.target.value)}
              className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none font-mono"
            />
          </div>
        </div>
      </div>

      {/* Live Preview Card */}
      <div>
        <label className="block text-sm font-bold text-slate-300 mb-3 uppercase tracking-wider">
          Pré-visualização
        </label>
        <div className="bg-slate-900/80 rounded-2xl p-6 border border-white/5 space-y-4">
          {/* Mini header preview */}
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm overflow-hidden"
              style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
            >
              {logoUrl && !logoError ? (
                <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
              ) : (
                name.charAt(0).toUpperCase() || 'G'
              )}
            </div>
            <div>
              <p className="text-white font-bold text-sm">{name || 'Sua Empresa'}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Treinamento & Processos</p>
            </div>
          </div>
          {/* Mini buttons preview */}
          <div className="flex items-center gap-3">
            <div
              className="px-4 py-2 rounded-xl text-white text-xs font-bold"
              style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
            >
              Botão Primário
            </div>
            <div
              className="px-4 py-2 rounded-xl text-xs font-bold border"
              style={{ borderColor: primaryColor, color: primaryColor }}
            >
              Botão Secundário
            </div>
          </div>
          {/* Mini category pill preview */}
          <div className="flex gap-2">
            <div
              className="px-3 py-1.5 rounded-lg text-white text-xs font-medium"
              style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
            >
              Categoria ativa
            </div>
            <div className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-400 border border-white/5">
              Categoria inativa
            </div>
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="pt-6 border-t border-white/5">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary"
        >
          {saving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : saved ? (
            <Check className="w-5 h-5" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          {saved ? 'Salvo com sucesso!' : 'Salvar Aparência'}
        </button>
      </div>
    </motion.div>
  );
}
