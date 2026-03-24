import { useState, useEffect } from "react";
import { Users, Plus, Pencil, Trash2, X, Shield, User as UserIcon, Key } from "lucide-react";
import { AuthStore } from "@/lib/storage";
import { useAuth } from "@/contexts/AuthContext";
import type { User, UserPermissions } from "@/types";
import { DEFAULT_USER_PERMISSIONS } from "@/types";
import { toast } from "sonner";

const PERM_LABELS: { key: keyof UserPermissions; label: string }[] = [
  { key: "canViewDeals",          label: "Ver Deals" },
  { key: "canEditDeals",          label: "Editar Deals" },
  { key: "canViewPeople",         label: "Ver Pessoas" },
  { key: "canEditPeople",         label: "Editar Pessoas" },
  { key: "canViewCompanies",      label: "Ver Empresas" },
  { key: "canEditCompanies",      label: "Editar Empresas" },
  { key: "canViewTasks",          label: "Ver Tarefas" },
  { key: "canEditTasks",          label: "Editar Tarefas" },
  { key: "canViewSequences",      label: "Ver Sequências" },
  { key: "canViewWhatsApp",       label: "Ver WhatsApp" },
  { key: "canViewDataEnrichment", label: "Ver Enriquecimento" },
  { key: "canViewGrowthLab",      label: "Ver Growth Lab" },
  { key: "canViewAgents",         label: "Ver Agentes de IA" },
  { key: "canViewMetas",          label: "Ver Metas" },
];

// ── Modal de usuário ───────────────────────────────
function UserModal({
  editing,
  onClose,
  onSaved,
}: {
  editing: User | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName]       = useState(editing?.name ?? "");
  const [email, setEmail]     = useState(editing?.email ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole]       = useState<"admin" | "user">(editing?.role ?? "user");
  const [perms, setPerms]     = useState<UserPermissions>(
    editing?.permissions ?? { ...DEFAULT_USER_PERMISSIONS }
  );
  const [loading, setLoading] = useState(false);

  function togglePerm(key: keyof UserPermissions) {
    setPerms((p) => ({ ...p, [key]: !p[key] }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) { toast.error("Nome e e-mail obrigatórios."); return; }
    if (!editing && password.length < 6) { toast.error("Senha mínima de 6 caracteres."); return; }

    setLoading(true);
    if (editing) {
      AuthStore.updateUser(editing.id, {
        name,
        role,
        permissions: role === "user" ? perms : undefined,
        ...(password.length >= 6 ? { passwordHash: btoa(password) } : {}),
      });
      toast.success("Usuário atualizado.");
    } else {
      const result = AuthStore.addUser(name, email, password, role, role === "user" ? perms : undefined);
      if (!result.ok) { toast.error(result.error); setLoading(false); return; }
      toast.success("Usuário criado.");
    }
    setLoading(false);
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-card">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <UserIcon className="h-4 w-4 text-primary" />
            {editing ? "Editar Usuário" : "Novo Usuário"}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Nome</label>
              <input
                value={name} onChange={(e) => setName(e.target.value)}
                className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none"
                placeholder="Nome completo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">E-mail</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                disabled={!!editing}
                className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none disabled:opacity-50"
                placeholder="email@empresa.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5 flex items-center gap-1">
                <Key className="h-3 w-3" />
                {editing ? "Nova senha (opcional)" : "Senha"}
              </label>
              <input
                type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none"
                placeholder="Mín. 6 caracteres"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Perfil</label>
              <select
                value={role} onChange={(e) => setRole(e.target.value as "admin" | "user")}
                className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none"
              >
                <option value="user">Usuário</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
          </div>

          {role === "user" && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-1">
                <Shield className="h-3.5 w-3.5 text-primary" /> Permissões
              </label>
              <div className="grid grid-cols-2 gap-2 border border-border rounded-lg p-3 bg-muted/20">
                {PERM_LABELS.map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={perms[key]}
                      onChange={() => togglePerm(key)}
                      className="accent-primary w-3.5 h-3.5"
                    />
                    <span className="text-xs text-foreground">{label}</span>
                  </label>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setPerms(Object.fromEntries(PERM_LABELS.map(({ key }) => [key, true])) as UserPermissions)}
                  className="text-xs text-primary hover:underline"
                >
                  Marcar tudo
                </button>
                <span className="text-muted-foreground text-xs">·</span>
                <button
                  type="button"
                  onClick={() => setPerms(Object.fromEntries(PERM_LABELS.map(({ key }) => [key, false])) as UserPermissions)}
                  className="text-xs text-muted-foreground hover:underline"
                >
                  Desmarcar tudo
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-input rounded-md hover:bg-muted">
              Cancelar
            </button>
            <button
              type="submit" disabled={loading}
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-60"
            >
              {editing ? "Salvar" : "Criar usuário"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────
export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers]     = useState<User[]>([]);
  const [modal, setModal]     = useState<User | null | "new">(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  function reload() {
    setUsers(AuthStore.getAll());
  }

  useEffect(() => { reload(); }, []);

  function handleDelete() {
    if (!deleteId) return;
    if (deleteId === currentUser?.id) { toast.error("Você não pode remover a si mesmo."); return; }
    AuthStore.removeUser(deleteId);
    setDeleteId(null);
    reload();
    toast.success("Usuário removido.");
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="px-6 pt-6 pb-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="h-7 w-7 text-primary" />
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Usuários</h1>
              <p className="text-sm text-muted-foreground">Gerencie quem acessa a plataforma</p>
            </div>
          </div>
          <button
            onClick={() => setModal("new")}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> Novo usuário
          </button>
        </div>
      </div>

      <div className="p-6">
        <div className="border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nome</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">E-mail</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Perfil</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Permissões</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-foreground">{u.name}</span>
                      {u.id === currentUser?.id && (
                        <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">você</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3">
                    {u.role === "admin" ? (
                      <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full">
                        <Shield className="h-3 w-3" /> Admin
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs bg-muted text-muted-foreground border border-border px-2 py-0.5 rounded-full">
                        <UserIcon className="h-3 w-3" /> Usuário
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {u.role === "admin"
                      ? "Acesso total"
                      : u.permissions
                        ? `${Object.values(u.permissions).filter(Boolean).length}/${PERM_LABELS.length} permissões`
                        : "—"
                    }
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => setModal(u)}
                        className="p-1.5 text-muted-foreground hover:text-foreground rounded"
                        title="Editar"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      {u.id !== currentUser?.id && (
                        <button
                          onClick={() => setDeleteId(u.id)}
                          className="p-1.5 text-muted-foreground hover:text-destructive rounded"
                          title="Remover"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground text-sm">
                    Nenhum usuário cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <UserModal
          editing={modal === "new" ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); reload(); }}
        />
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="font-semibold text-foreground mb-2">Remover Usuário</h2>
            <p className="text-sm text-muted-foreground mb-5">
              Esta ação não pode ser desfeita. O usuário perderá o acesso imediatamente.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm border border-input rounded-md hover:bg-muted">
                Cancelar
              </button>
              <button onClick={handleDelete} className="px-4 py-2 text-sm bg-destructive text-white rounded-md hover:opacity-90">
                Remover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
