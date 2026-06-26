import { useState, useEffect, useCallback } from 'react';
import { supabase, Tenant } from '../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  UserPlus,
  Shield,
  ShieldCheck,
  Trash2,
  X,
  Check,
  Mail,
  Clock,
  Crown,
  User as UserIcon,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface Props {
  tenant: Tenant;
}

interface TeamMember {
  id: string;
  user_id: string;
  role: 'admin' | 'user';
  created_at: string;
  email?: string;
}

export function TeamSettings({ tenant }: Props) {
  const { user: currentUser } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Invite form
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'user' | 'admin'>('user');
  const [inviting, setInviting] = useState(false);
  const [inviteMessage, setInviteMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Action states
  const [changingRole, setChangingRole] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('tenant_users')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // We can't directly query auth.users from the client,
      // but we can get the current user's email. For other members,
      // we'll display their user_id unless we have a profiles table.
      // For now, let's display what we have.
      setMembers(data || []);
    } catch (err) {
      console.error('Error fetching members:', err);
    } finally {
      setLoading(false);
    }
  }, [tenant.id]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setInviting(true);
    setInviteMessage(null);

    try {
      const { data, error } = await supabase.rpc('invite_user_to_tenant', {
        user_email: inviteEmail.trim().toLowerCase(),
        user_role: inviteRole,
      });

      if (error) throw error;

      const result = data as { success: boolean; message: string };

      if (result.success) {
        setInviteMessage({ type: 'success', text: result.message });
        setInviteEmail('');
        setInviteRole('user');
        await fetchMembers();
      } else {
        setInviteMessage({ type: 'error', text: result.message });
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao convidar membro.';
      setInviteMessage({ type: 'error', text: errorMessage });
    } finally {
      setInviting(false);
    }
  };

  const handleChangeRole = async (userId: string, newRole: 'admin' | 'user') => {
    setChangingRole(userId);
    try {
      const { data, error } = await supabase.rpc('update_user_role', {
        target_user_id: userId,
        new_role: newRole,
      });

      if (error) throw error;

      const result = data as { success: boolean; message: string };
      if (result.success) {
        await fetchMembers();
      } else {
        alert(result.message);
      }
    } catch (err) {
      console.error('Error changing role:', err);
      alert('Erro ao alterar role.');
    } finally {
      setChangingRole(null);
    }
  };

  const handleRemove = async (userId: string) => {
    setRemoving(userId);
    try {
      const { data, error } = await supabase.rpc('remove_user_from_tenant', {
        target_user_id: userId,
      });

      if (error) throw error;

      const result = data as { success: boolean; message: string };
      if (result.success) {
        setDeleteConfirmId(null);
        await fetchMembers();
      } else {
        alert(result.message);
      }
    } catch (err) {
      console.error('Error removing member:', err);
      alert('Erro ao remover membro.');
    } finally {
      setRemoving(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-tenant-primary animate-spin" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Gerenciar Equipe</h2>
        <p className="text-sm text-slate-400">Adicione membros à sua equipe e defina permissões de acesso.</p>
      </div>

      {/* Invite Form */}
      <form onSubmit={handleInvite} className="bg-slate-900/80 rounded-2xl p-6 border border-white/5 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-tenant-primary" />
          Convidar Novo Membro
        </h3>
        <p className="text-xs text-slate-500">O usuário precisa já ter uma conta criada na plataforma para ser adicionado.</p>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="email@exemplo.com"
              required
              className="w-full bg-slate-800 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-tenant-primary focus:ring-1 focus:ring-tenant-primary transition-all"
            />
          </div>

          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as 'user' | 'admin')}
            className="bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-tenant-primary focus:ring-1 focus:ring-tenant-primary transition-all sm:w-40"
          >
            <option value="user">Usuário</option>
            <option value="admin">Gestor</option>
          </select>

          <button
            type="submit"
            disabled={inviting || !inviteEmail.trim()}
            className="btn-primary text-sm !py-3 sm:!px-6 whitespace-nowrap"
          >
            {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            Convidar
          </button>
        </div>

        {/* Invite feedback */}
        <AnimatePresence>
          {inviteMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
                inviteMessage.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                  : 'bg-red-500/10 border border-red-500/20 text-red-400'
              }`}
            >
              {inviteMessage.type === 'success' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              {inviteMessage.text}
              <button
                onClick={() => setInviteMessage(null)}
                className="ml-auto p-1 hover:bg-white/5 rounded-lg transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      {/* Role Legend */}
      <div className="flex gap-6 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <Crown className="w-3.5 h-3.5 text-amber-400" />
          <strong className="text-slate-400">Gestor</strong> — Acesso total: criar, editar e remover guias e membros
        </span>
        <span className="flex items-center gap-1.5">
          <UserIcon className="w-3.5 h-3.5 text-blue-400" />
          <strong className="text-slate-400">Usuário</strong> — Acesso para visualizar guias e acompanhar progresso
        </span>
      </div>

      {/* Members List */}
      <div className="space-y-2">
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3">
          Membros ({members.length})
        </h3>

        {members.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/50 rounded-2xl border border-white/5">
            <UserIcon className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">Nenhum membro na equipe.</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {members.map((member) => {
              const isCurrentUser = member.user_id === currentUser?.id;
              const isAdmin = member.role === 'admin';

              return (
                <motion.div
                  layout
                  key={member.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                    isCurrentUser
                      ? 'bg-tenant-primary/5 border-tenant-primary/20'
                      : 'bg-slate-900/50 border-white/5 hover:border-white/10'
                  }`}
                >
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-white ${
                    isAdmin ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                  }`}>
                    {isAdmin ? <Crown className="w-5 h-5" /> : <UserIcon className="w-5 h-5" />}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-white font-semibold truncate text-sm">
                        {isCurrentUser ? (currentUser?.email || 'Você') : `Membro ${member.user_id.slice(0, 8)}...`}
                      </p>
                      {isCurrentUser && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-tenant-primary/20 text-tenant-primary rounded-md">
                          Você
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className={`text-xs font-medium flex items-center gap-1 ${
                        isAdmin ? 'text-amber-400' : 'text-blue-400'
                      }`}>
                        {isAdmin ? <ShieldCheck className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                        {isAdmin ? 'Gestor' : 'Usuário'}
                      </span>
                      <span className="text-xs text-slate-600 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(member.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* Actions (not for current user) */}
                  {!isCurrentUser && (
                    <div className="flex items-center gap-1">
                      {/* Toggle Role */}
                      <button
                        onClick={() => handleChangeRole(member.user_id, isAdmin ? 'user' : 'admin')}
                        disabled={changingRole === member.user_id}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                          isAdmin
                            ? 'text-blue-400 hover:bg-blue-500/10 border border-blue-500/20'
                            : 'text-amber-400 hover:bg-amber-500/10 border border-amber-500/20'
                        }`}
                        title={isAdmin ? 'Rebaixar para Usuário' : 'Promover a Gestor'}
                      >
                        {changingRole === member.user_id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : isAdmin ? (
                          <Shield className="w-3.5 h-3.5" />
                        ) : (
                          <ShieldCheck className="w-3.5 h-3.5" />
                        )}
                        {isAdmin ? 'Tornar Usuário' : 'Tornar Gestor'}
                      </button>

                      {/* Remove */}
                      {deleteConfirmId === member.user_id ? (
                        <div className="flex items-center gap-1 ml-1">
                          <button
                            onClick={() => handleRemove(member.user_id)}
                            disabled={removing === member.user_id}
                            className="px-3 py-2 rounded-xl text-xs font-bold text-red-400 hover:bg-red-500/10 border border-red-500/20 flex items-center gap-1"
                          >
                            {removing === member.user_id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
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
                          onClick={() => setDeleteConfirmId(member.user_id)}
                          className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors ml-1"
                          title="Remover membro"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}
