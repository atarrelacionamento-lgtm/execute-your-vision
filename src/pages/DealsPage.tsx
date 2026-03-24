import { useState, useEffect } from "react";
import {
  Plus, Flame, Sun, Snowflake, DollarSign,
  Pencil, Trash2, X, Settings, Zap, ToggleLeft, ToggleRight, ArrowRight,
  Sparkles, Loader2, Phone, MessageCircle, StickyNote, Bell, ChevronDown, ChevronUp,
} from "lucide-react";
import { FunnelDB, CompanyDB, FunnelTransitionDB } from "@/lib/db";
import { StageFollowUpStore } from "@/lib/storage";
import type {
  Funnel, FunnelCard, FunnelStage, Company, FunnelTransition,
  CardNote, CardReminder, StageFollowUp, FupMessage,
} from "@/types";
import { toast } from "sonner";
import { openaiChat, IntegrationSettings } from "@/lib/integrations";

const TEMP_CONFIG = {
  hot:  { label: "Hot",  icon: Flame,     cls: "bg-red-500/15 text-red-500" },
  warm: { label: "Warm", icon: Sun,       cls: "bg-amber-500/15 text-amber-500" },
  cold: { label: "Cold", icon: Snowflake, cls: "bg-blue-500/15 text-blue-500" },
};

const SCORE_CFG = {
  A: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  B: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  C: "bg-slate-500/15 text-slate-400 border-slate-500/30",
};

const STAGE_COLORS: Record<string, string> = {
  blue: "bg-blue-500", amber: "bg-amber-500", purple: "bg-purple-500",
  emerald: "bg-emerald-500", red: "bg-red-500", slate: "bg-slate-500",
};

function uid() { return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`; }
function now() { return new Date().toISOString(); }

function waLink(phone: string) {
  const cleaned = phone.replace(/\D/g, "");
  const num = cleaned.startsWith("55") ? cleaned : `55${cleaned}`;
  return `https://wa.me/${num}`;
}

// ─── Card Form ────────────────────────────────────────────────
function CardForm({
  funnel, stageId, card, companies, onSave, onClose,
}: {
  funnel: Funnel; stageId: string; card: FunnelCard | null;
  companies: Company[];
  onSave: (data: Partial<FunnelCard>) => void; onClose: () => void;
}) {
  const [tab, setTab] = useState<"basic" | "contact" | "notes">("basic");
  const [companyId, setCompanyId]     = useState(card?.companyId ?? "");
  const [companyName, setCompanyName] = useState(card?.companyName ?? "");
  const [temperature, setTemperature] = useState<FunnelCard["temperature"]>(card?.temperature ?? "cold");
  const [revenue, setRevenue]         = useState(card?.revenue ?? "");
  const [selectedStageId, setSelectedStageId] = useState(stageId);
  const [leadScore, setLeadScore]     = useState<FunnelCard["leadScore"]>(card?.leadScore ?? undefined);
  const [contactName, setContactName] = useState(card?.contactName ?? "");
  const [contactRole, setContactRole] = useState(card?.contactRole ?? "");
  const [email, setEmail]             = useState(card?.email ?? "");
  const [phones, setPhones]           = useState<string[]>(card?.phones ?? [""]);
  const [instagram, setInstagram]     = useState(card?.instagram ?? "");
  const [linkedin, setLinkedin]       = useState(card?.linkedin ?? "");
  const [website, setWebsite]         = useState(card?.website ?? "");
  const [cnpj, setCnpj]               = useState(card?.cnpj ?? "");
  const [segment, setSegment]         = useState(card?.segment ?? "");
  const [observations, setObservations] = useState(card?.observations ?? "");
  const [notes, setNotes]             = useState<CardNote[]>(card?.notes ?? []);
  const [reminders, setReminders]     = useState<CardReminder[]>(card?.reminders ?? []);
  const [newNote, setNewNote]         = useState("");
  const [newRemText, setNewRemText]   = useState("");
  const [newRemDate, setNewRemDate]   = useState("");
  const [genLoading, setGenLoading]   = useState(false);

  function handleCompanyChange(id: string) {
    const c = companies.find((co) => co.id === id);
    setCompanyId(id);
    setCompanyName(c?.name ?? "");
    if (c) { setTemperature(c.temperature); setCnpj(c.cnpj ?? ""); setSegment(c.segment ?? ""); setWebsite(c.website ?? ""); }
  }

  function addPhone() {
    if (phones.length >= 10) { toast.error("Máximo de 10 números."); return; }
    setPhones((p) => [...p, ""]);
  }
  function setPhone(i: number, v: string) {
    setPhones((p) => p.map((ph, idx) => idx === i ? v : ph));
  }
  function removePhone(i: number) {
    setPhones((p) => p.filter((_, idx) => idx !== i));
  }

  function addNote() {
    if (!newNote.trim()) return;
    setNotes((n) => [...n, { id: uid(), content: newNote.trim(), createdAt: now() }]);
    setNewNote("");
  }

  function addReminder() {
    if (!newRemText.trim() || !newRemDate) { toast.error("Preencha texto e data."); return; }
    setReminders((r) => [...r, { id: uid(), text: newRemText.trim(), date: newRemDate, done: false }]);
    setNewRemText(""); setNewRemDate("");
  }

  async function generateObservations() {
    if (!companyName.trim()) { toast.error("Informe a empresa primeiro."); return; }
    if (!IntegrationSettings.isOpenAIReady()) { toast.error("Configure sua chave OpenAI."); return; }
    setGenLoading(true);
    const { content, error } = await openaiChat([
      { role: "system", content: "Você é um especialista em vendas B2B. Responda em português brasileiro." },
      { role: "user", content: `Faça observações estratégicas sobre o lead da empresa "${companyName}"${segment ? ` no segmento ${segment}` : ""}. Inclua pontos de atenção, abordagem sugerida e possíveis dores. Seja objetivo e direto, máximo 150 palavras.` },
    ], { temperature: 0.7, maxTokens: 300 });
    setGenLoading(false);
    if (error) { toast.error(error); return; }
    setObservations(content.trim());
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!companyName.trim()) { toast.error("Nome da empresa obrigatório."); return; }
    onSave({
      companyId, companyName, temperature, revenue, stageId: selectedStageId,
      leadScore, contactName, contactRole, email,
      phones: phones.filter((p) => p.trim()),
      instagram, linkedin, website, cnpj, segment, observations,
      notes, reminders,
    });
  }

  const TABS = [
    { id: "basic", label: "Lead" },
    { id: "contact", label: "Contato" },
    { id: "notes", label: `Notas${notes.length + reminders.length > 0 ? ` (${notes.length + reminders.length})` : ""}` },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-lg max-h-[92vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 className="font-semibold text-foreground">{card ? "Editar Card" : "Novo Card"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border shrink-0">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="overflow-y-auto flex-1">
          <div className="px-6 py-5 space-y-4">

            {/* ── TAB: Lead ── */}
            {tab === "basic" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Empresa</label>
                  {companies.length > 0 && (
                    <select
                      value={companyId}
                      onChange={(e) => handleCompanyChange(e.target.value)}
                      className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none mb-2"
                    >
                      <option value="">— Digitar manualmente —</option>
                      {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  )}
                  {!companyId && (
                    <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none"
                      placeholder="Nome da empresa"
                    />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Nome do contato</label>
                    <input value={contactName} onChange={(e) => setContactName(e.target.value)}
                      className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none"
                      placeholder="Ex: João Silva"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Cargo</label>
                    <input value={contactRole} onChange={(e) => setContactRole(e.target.value)}
                      className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none"
                      placeholder="Ex: CEO"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Temperatura</label>
                    <select value={temperature} onChange={(e) => setTemperature(e.target.value as FunnelCard["temperature"])}
                      className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none"
                    >
                      <option value="cold">Cold</option>
                      <option value="warm">Warm</option>
                      <option value="hot">Hot</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Lead Score</label>
                    <select value={leadScore ?? ""} onChange={(e) => setLeadScore((e.target.value as FunnelCard["leadScore"]) || undefined)}
                      className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none"
                    >
                      <option value="">—</option>
                      <option value="A">Tier A</option>
                      <option value="B">Tier B</option>
                      <option value="C">Tier C</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Valor (pipeline)</label>
                    <input type="text" value={revenue} onChange={(e) => setRevenue(e.target.value)}
                      className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none"
                      placeholder="R$ 0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">CNPJ</label>
                    <input value={cnpj} onChange={(e) => setCnpj(e.target.value)}
                      className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none"
                      placeholder="00.000.000/0001-00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Segmento</label>
                    <input value={segment} onChange={(e) => setSegment(e.target.value)}
                      className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none"
                      placeholder="Ex: SaaS B2B"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Etapa</label>
                  <select value={selectedStageId} onChange={(e) => setSelectedStageId(e.target.value)}
                    className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none"
                  >
                    {funnel.stages.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-medium text-foreground">Observações</label>
                    <button type="button" onClick={generateObservations} disabled={genLoading}
                      className="flex items-center gap-1 text-[11px] text-primary hover:underline disabled:opacity-50"
                    >
                      {genLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                      {genLoading ? "Gerando..." : "Gerar com IA"}
                    </button>
                  </div>
                  <textarea value={observations} onChange={(e) => setObservations(e.target.value)} rows={3}
                    className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none resize-none"
                    placeholder="Notas da IA ao enriquecer dados, insights sobre o lead..."
                  />
                </div>
              </>
            )}

            {/* ── TAB: Contato ── */}
            {tab === "contact" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">E-mail</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none"
                    placeholder="contato@empresa.com"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-medium text-foreground">
                      Telefones <span className="text-muted-foreground text-xs">({phones.filter(p => p.trim()).length}/10)</span>
                    </label>
                    {phones.length < 10 && (
                      <button type="button" onClick={addPhone}
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        <Plus className="h-3 w-3" /> Adicionar
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {phones.map((ph, i) => (
                      <div key={i} className="flex gap-2">
                        <div className="flex-1 relative">
                          <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                          <input value={ph} onChange={(e) => setPhone(i, e.target.value)}
                            className="w-full border border-input bg-background rounded-md pl-8 pr-3 py-2 text-sm focus:outline-none"
                            placeholder={`+55 11 9xxxx-xxxx`}
                          />
                        </div>
                        {phones.length > 1 && (
                          <button type="button" onClick={() => removePhone(i)}
                            className="text-muted-foreground hover:text-destructive p-2"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Instagram</label>
                    <input value={instagram} onChange={(e) => setInstagram(e.target.value)}
                      className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none"
                      placeholder="@empresa"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">LinkedIn</label>
                    <input value={linkedin} onChange={(e) => setLinkedin(e.target.value)}
                      className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none"
                      placeholder="linkedin.com/in/..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Site</label>
                  <input value={website} onChange={(e) => setWebsite(e.target.value)}
                    className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none"
                    placeholder="https://empresa.com"
                  />
                </div>
              </>
            )}

            {/* ── TAB: Notas & Lembretes ── */}
            {tab === "notes" && (
              <>
                {/* Notas */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-1">
                    <StickyNote className="h-3.5 w-3.5 text-primary" /> Notas
                  </label>
                  <div className="space-y-1.5 mb-2">
                    {notes.map((n) => (
                      <div key={n.id} className="flex gap-2 bg-muted/30 rounded-lg px-3 py-2">
                        <p className="flex-1 text-xs text-foreground whitespace-pre-wrap">{n.content}</p>
                        <button type="button" onClick={() => setNotes((ns) => ns.filter((x) => x.id !== n.id))}
                          className="text-muted-foreground hover:text-destructive shrink-0"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    {notes.length === 0 && <p className="text-xs text-muted-foreground">Nenhuma nota ainda.</p>}
                  </div>
                  <div className="flex gap-2">
                    <textarea value={newNote} onChange={(e) => setNewNote(e.target.value)} rows={2}
                      className="flex-1 border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none resize-none"
                      placeholder="Adicionar nota..."
                    />
                    <button type="button" onClick={addNote}
                      className="px-3 py-2 bg-primary/10 text-primary rounded-md text-sm hover:bg-primary/20 self-end"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Lembretes */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-1">
                    <Bell className="h-3.5 w-3.5 text-primary" /> Lembretes
                  </label>
                  <div className="space-y-1.5 mb-2">
                    {reminders.map((r) => {
                      const overdue = !r.done && new Date(r.date) < new Date();
                      return (
                        <div key={r.id} className={`flex items-center gap-2 rounded-lg px-3 py-2 ${r.done ? "bg-muted/20 opacity-60" : overdue ? "bg-destructive/10" : "bg-muted/30"}`}>
                          <input type="checkbox" checked={r.done}
                            onChange={() => setReminders((rs) => rs.map((x) => x.id === r.id ? { ...x, done: !x.done } : x))}
                            className="accent-primary w-3.5 h-3.5 shrink-0"
                          />
                          <span className={`flex-1 text-xs ${r.done ? "line-through text-muted-foreground" : overdue ? "text-destructive" : "text-foreground"}`}>{r.text}</span>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {new Date(r.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                          </span>
                          <button type="button" onClick={() => setReminders((rs) => rs.filter((x) => x.id !== r.id))}
                            className="text-muted-foreground hover:text-destructive shrink-0"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      );
                    })}
                    {reminders.length === 0 && <p className="text-xs text-muted-foreground">Nenhum lembrete.</p>}
                  </div>
                  <div className="flex gap-2">
                    <input value={newRemText} onChange={(e) => setNewRemText(e.target.value)}
                      className="flex-1 border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none"
                      placeholder="Texto do lembrete"
                    />
                    <input type="date" value={newRemDate} onChange={(e) => setNewRemDate(e.target.value)}
                      className="border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none w-36"
                    />
                    <button type="button" onClick={addReminder}
                      className="px-3 py-2 bg-primary/10 text-primary rounded-md hover:bg-primary/20"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end gap-3 px-6 pb-5">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-input rounded-md hover:bg-muted">Cancelar</button>
            <button type="submit" className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90">
              {card ? "Salvar" : "Adicionar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Funnel Form Modal ────────────────────────────────────────
function FunnelForm({
  funnel, onSave, onClose,
}: {
  funnel: Funnel | null;
  onSave: (name: string, stages: { title: string; color: string; description: string }[]) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(funnel?.name ?? "");
  const [stages, setStages] = useState<{ title: string; color: string; description: string }[]>(
    funnel?.stages.map((s) => ({ title: s.title, color: s.color, description: s.description ?? "" })) ?? [
      { title: "Prospecção",    color: "blue",    description: "" },
      { title: "Qualificação",  color: "amber",   description: "" },
      { title: "Proposta",      color: "purple",  description: "" },
      { title: "Fechado/Ganho", color: "emerald", description: "" },
    ]
  );
  const [generatingIdx, setGeneratingIdx] = useState<number | null>(null);
  const COLORS = ["blue", "amber", "purple", "emerald", "red", "slate"];

  async function generateDescription(idx: number) {
    const title = stages[idx].title.trim();
    if (!title) { toast.error("Dê um nome à etapa antes de gerar."); return; }
    if (!IntegrationSettings.isOpenAIReady()) { toast.error("Configure sua chave OpenAI primeiro."); return; }
    setGeneratingIdx(idx);
    const { content, error } = await openaiChat([
      { role: "system", content: "Você é um especialista em vendas B2B. Responda em português brasileiro." },
      { role: "user", content: `Escreva uma descrição objetiva de 1 a 2 frases para a etapa "${title}" em um funil de vendas B2B.` },
    ], { temperature: 0.6, maxTokens: 150 });
    setGeneratingIdx(null);
    if (error) { toast.error(error); return; }
    setStages((s) => s.map((st, i) => i === idx ? { ...st, description: content.trim() } : st));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { toast.error("Nome do funil obrigatório."); return; }
    if (stages.some((s) => !s.title.trim())) { toast.error("Todas as etapas precisam de nome."); return; }
    onSave(name, stages);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-card">
          <h2 className="font-semibold text-foreground">{funnel ? "Editar Funil" : "Novo Funil"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={submit} className="px-6 py-5 space-y-5">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Nome do funil</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none"
              placeholder="ex: Pré-vendas"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-foreground">Etapas</label>
              <button type="button" onClick={() => setStages((s) => [...s, { title: "", color: "blue", description: "" }])}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <Plus className="h-3 w-3" /> Adicionar etapa
              </button>
            </div>
            <div className="space-y-4">
              {stages.map((stage, idx) => (
                <div key={idx} className="border border-border rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <select value={stage.color}
                      onChange={(e) => setStages((s) => s.map((st, i) => i === idx ? { ...st, color: e.target.value } : st))}
                      className="border border-input bg-background rounded px-2 py-1.5 text-xs focus:outline-none"
                    >
                      {COLORS.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <input type="text" value={stage.title}
                      onChange={(e) => setStages((s) => s.map((st, i) => i === idx ? { ...st, title: e.target.value } : st))}
                      className="flex-1 border border-input bg-background rounded px-2 py-1.5 text-sm focus:outline-none"
                      placeholder={`Nome da etapa ${idx + 1}`}
                    />
                    {stages.length > 1 && (
                      <button type="button" onClick={() => setStages((s) => s.filter((_, i) => i !== idx))}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <textarea value={stage.description}
                      onChange={(e) => setStages((s) => s.map((st, i) => i === idx ? { ...st, description: e.target.value } : st))}
                      rows={2}
                      className="w-full border border-input bg-background rounded px-2.5 py-1.5 text-xs focus:outline-none resize-none pr-24"
                      placeholder="Descrição da etapa..."
                    />
                    <button type="button" onClick={() => generateDescription(idx)} disabled={generatingIdx === idx}
                      className="absolute right-2 top-2 flex items-center gap-1 text-[10px] px-2 py-1 bg-primary/10 text-primary rounded hover:bg-primary/20 disabled:opacity-60"
                    >
                      {generatingIdx === idx ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                      {generatingIdx === idx ? "Gerando..." : "Gerar com IA"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-input rounded-md hover:bg-muted">Cancelar</button>
            <button type="submit" className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90">
              {funnel ? "Salvar" : "Criar Funil"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Stage FUP Modal (automação por etapa) ────────────────────
function StageFupModal({
  funnelId, stage, existing, onSave, onClose,
}: {
  funnelId: string;
  stage: FunnelStage;
  existing: StageFollowUp | null;
  onSave: (data: Omit<StageFollowUp, "id" | "createdAt">) => void;
  onClose: () => void;
}) {
  const [active, setActive]   = useState(existing?.active ?? true);
  const [useAI, setUseAI]     = useState(existing?.useAI ?? false);
  const [aiPrompt, setAiPrompt] = useState(existing?.aiPrompt ?? "");
  const [messages, setMessages] = useState<FupMessage[]>(
    existing?.messages ?? [
      { delay: 24, delayUnit: "hours", type: "both", content: "" },
    ]
  );
  const [genLoading, setGenLoading] = useState(false);

  function addMsg() {
    setMessages((m) => [...m, { delay: 24, delayUnit: "hours", type: "both", content: "" }]);
  }

  function updateMsg(i: number, data: Partial<FupMessage>) {
    setMessages((m) => m.map((msg, idx) => idx === i ? { ...msg, ...data } : msg));
  }

  async function generateMessages() {
    if (!aiPrompt.trim()) { toast.error("Escreva o prompt da IA primeiro."); return; }
    if (!IntegrationSettings.isOpenAIReady()) { toast.error("Configure sua chave OpenAI."); return; }
    setGenLoading(true);
    const { content, error } = await openaiChat([
      { role: "system", content: "Você é especialista em vendas B2B e automação de follow-up. Responda em português brasileiro. Retorne SOMENTE um JSON válido." },
      { role: "user", content: `Com base nesta situação: "${aiPrompt}"\n\nCrie uma sequência de follow-up de no máximo 3 mensagens. Retorne um JSON com este formato:\n[\n  {"delay": 24, "delayUnit": "hours", "type": "whatsapp", "content": "Texto da mensagem 1"},\n  {"delay": 6, "delayUnit": "hours", "type": "email", "content": "Texto da mensagem 2"}\n]\nUse delayUnit "hours" ou "days". type pode ser "whatsapp", "email" ou "both".` },
    ], { temperature: 0.7, maxTokens: 600 });
    setGenLoading(false);
    if (error) { toast.error(error); return; }
    try {
      const parsed = JSON.parse(content.replace(/```json|```/g, "").trim());
      if (Array.isArray(parsed)) setMessages(parsed);
    } catch {
      toast.error("Erro ao interpretar resposta da IA. Tente novamente.");
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!useAI && messages.some((m) => !m.content.trim())) {
      toast.error("Preencha o conteúdo de todas as mensagens."); return;
    }
    onSave({ funnelId, stageId: stage.id, stageName: stage.title, active, useAI, aiPrompt, messages });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-card">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            Follow-up: {stage.title}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>

        <form onSubmit={submit} className="px-6 py-5 space-y-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Automação ativa</span>
            <button type="button" onClick={() => setActive(!active)} className={active ? "text-primary" : "text-muted-foreground"}>
              {active ? <ToggleRight className="h-6 w-6" /> : <ToggleLeft className="h-6 w-6" />}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-foreground">Modo:</span>
            <button type="button"
              onClick={() => setUseAI(false)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium border ${!useAI ? "bg-primary text-primary-foreground border-primary" : "border-input text-muted-foreground hover:bg-muted"}`}
            >
              Manual
            </button>
            <button type="button"
              onClick={() => setUseAI(true)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium border flex items-center gap-1 ${useAI ? "bg-primary text-primary-foreground border-primary" : "border-input text-muted-foreground hover:bg-muted"}`}
            >
              <Sparkles className="h-3 w-3" /> IA
            </button>
          </div>

          {useAI && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Prompt para a IA</label>
              <textarea value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} rows={3}
                className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none resize-none"
                placeholder="Ex: Reunião com lead amanhã 14h, fazer 3 FUPs: 24h antes, 6h antes e 1h antes, por WhatsApp e email com link de confirmação"
              />
              <button type="button" onClick={generateMessages} disabled={genLoading}
                className="mt-2 flex items-center gap-1.5 text-xs text-primary hover:underline disabled:opacity-50"
              >
                {genLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                {genLoading ? "Gerando mensagens..." : "Gerar sequência com IA"}
              </button>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-foreground">Mensagens de follow-up</label>
              <button type="button" onClick={addMsg}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <Plus className="h-3 w-3" /> Adicionar
              </button>
            </div>
            <div className="space-y-3">
              {messages.map((msg, i) => (
                <div key={i} className="border border-border rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground w-5">#{i + 1}</span>
                    <input type="number" value={msg.delay} min={1}
                      onChange={(e) => updateMsg(i, { delay: Number(e.target.value) })}
                      className="w-16 border border-input bg-background rounded px-2 py-1 text-sm focus:outline-none"
                    />
                    <select value={msg.delayUnit} onChange={(e) => updateMsg(i, { delayUnit: e.target.value as "hours" | "days" })}
                      className="border border-input bg-background rounded px-2 py-1 text-xs focus:outline-none"
                    >
                      <option value="hours">horas</option>
                      <option value="days">dias</option>
                    </select>
                    <span className="text-xs text-muted-foreground">via</span>
                    <select value={msg.type} onChange={(e) => updateMsg(i, { type: e.target.value as FupMessage["type"] })}
                      className="border border-input bg-background rounded px-2 py-1 text-xs focus:outline-none"
                    >
                      <option value="whatsapp">WhatsApp</option>
                      <option value="email">E-mail</option>
                      <option value="both">Ambos</option>
                    </select>
                    {messages.length > 1 && (
                      <button type="button" onClick={() => setMessages((m) => m.filter((_, idx) => idx !== i))}
                        className="ml-auto text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <textarea value={msg.content} onChange={(e) => updateMsg(i, { content: e.target.value })} rows={2}
                    className="w-full border border-input bg-background rounded px-2.5 py-1.5 text-xs focus:outline-none resize-none"
                    placeholder="Texto da mensagem..."
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-input rounded-md hover:bg-muted">Cancelar</button>
            <button type="submit" className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90">
              Salvar automação
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── FUP trigger modal (aparece ao mover card) ────────────────
function FupTriggerModal({
  fup, cardName, onClose,
}: {
  fup: StageFollowUp; cardName: string; onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-sm p-6">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-foreground">Automação de Follow-up</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          <strong className="text-foreground">{cardName}</strong> foi movido para <strong className="text-foreground">{fup.stageName}</strong>.
        </p>
        <div className="bg-muted/30 rounded-lg p-3 space-y-1.5 mb-4">
          {fup.messages.map((m, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <MessageCircle className="h-3 w-3 text-primary shrink-0" />
              <span className="text-foreground">Mensagem {i + 1}:</span>
              <span className="text-muted-foreground">
                {m.delay} {m.delayUnit === "hours" ? "h" : "d"} via {m.type === "both" ? "WA + E-mail" : m.type}
              </span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          {fup.useAI ? "A IA irá gerar e enviar as mensagens automaticamente." : "As mensagens configuradas serão enviadas nos horários definidos."}
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2 text-sm border border-input rounded-md hover:bg-muted">
            Ignorar
          </button>
          <button onClick={onClose} className="flex-1 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90 flex items-center justify-center gap-1.5">
            <Zap className="h-3.5 w-3.5" /> Ativar FUP
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Automations Modal (entre funis) ─────────────────────────
function AutomationsModal({
  funnels, transitions, onSave, onToggle, onDelete, onClose,
}: {
  funnels: Funnel[]; transitions: FunnelTransition[];
  onSave: (t: Omit<FunnelTransition, "id" | "createdAt">) => void;
  onToggle: (t: FunnelTransition) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [label, setLabel]                   = useState("");
  const [sourceFunnelId, setSourceFunnelId] = useState(funnels[0]?.id ?? "");
  const [sourceStageId, setSourceStageId]   = useState("");
  const [targetFunnelId, setTargetFunnelId] = useState("");
  const [targetStageId, setTargetStageId]   = useState("");

  const sourceFunnel = funnels.find((f) => f.id === sourceFunnelId);
  const targetFunnel = funnels.find((f) => f.id === targetFunnelId);

  useEffect(() => { setSourceStageId(sourceFunnel?.stages[0]?.id ?? ""); }, [sourceFunnelId]);
  useEffect(() => { setTargetStageId(targetFunnel?.stages[0]?.id ?? ""); }, [targetFunnelId]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!sourceFunnelId || !sourceStageId || !targetFunnelId || !targetStageId) { toast.error("Preencha todos os campos."); return; }
    if (sourceFunnelId === targetFunnelId && sourceStageId === targetStageId) { toast.error("Origem e destino não podem ser iguais."); return; }
    onSave({ label: label.trim() || undefined, sourceFunnelId, sourceStageId, targetFunnelId, targetStageId, active: true });
    setShowForm(false); setLabel(""); setSourceStageId(""); setTargetFunnelId(""); setTargetStageId("");
  }

  function stageName(funnelId: string, stageId: string) {
    return funnels.find((f) => f.id === funnelId)?.stages.find((s) => s.id === stageId)?.title ?? "—";
  }
  function funnelName(id: string) { return funnels.find((f) => f.id === id)?.name ?? "—"; }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-card">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" /> Automações entre Funis
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <p className="text-xs text-muted-foreground bg-muted/30 rounded-md p-3">
            Quando um card for movido para a etapa configurada, ele será <strong>automaticamente transferido</strong> para o funil e etapa de destino.
          </p>
          {transitions.length === 0 && !showForm && (
            <div className="text-center py-8 text-sm text-muted-foreground">Nenhuma automação configurada ainda.</div>
          )}
          {transitions.map((t) => (
            <div key={t.id} className={`flex items-center gap-3 border rounded-lg px-4 py-3 ${t.active ? "border-primary/30 bg-primary/5" : "border-border bg-muted/10"}`}>
              <div className="flex-1 min-w-0">
                {t.label && <div className="text-xs font-semibold text-foreground mb-1">{t.label}</div>}
                <div className="flex items-center gap-1.5 flex-wrap text-xs text-foreground">
                  <span className="font-medium">{funnelName(t.sourceFunnelId)}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="bg-muted px-1.5 py-0.5 rounded">{stageName(t.sourceFunnelId, t.sourceStageId)}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="font-medium">{funnelName(t.targetFunnelId)}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="bg-muted px-1.5 py-0.5 rounded">{stageName(t.targetFunnelId, t.targetStageId)}</span>
                </div>
              </div>
              <button onClick={() => onToggle(t)} className={`shrink-0 ${t.active ? "text-primary" : "text-muted-foreground"}`}>
                {t.active ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
              </button>
              <button onClick={() => onDelete(t.id)} className="shrink-0 text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {showForm && (
            <form onSubmit={submit} className="border border-dashed border-primary/40 rounded-lg p-4 space-y-4 bg-primary/5">
              <p className="text-xs font-semibold text-primary uppercase tracking-wider">Nova automação</p>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Nome da regra (opcional)</label>
                <input type="text" value={label} onChange={(e) => setLabel(e.target.value)}
                  className="w-full border border-input bg-background rounded px-3 py-1.5 text-sm focus:outline-none"
                  placeholder="ex: Agendou reunião → Pré-vendas"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Quando chegar em:</p>
                  <div>
                    <label className="block text-xs text-foreground mb-1">Funil de origem</label>
                    <select value={sourceFunnelId} onChange={(e) => setSourceFunnelId(e.target.value)}
                      className="w-full border border-input bg-background rounded px-2 py-1.5 text-sm focus:outline-none"
                    >
                      {funnels.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-foreground mb-1">Etapa</label>
                    <select value={sourceStageId} onChange={(e) => setSourceStageId(e.target.value)}
                      className="w-full border border-input bg-background rounded px-2 py-1.5 text-sm focus:outline-none"
                    >
                      <option value="">Selecionar etapa...</option>
                      {(sourceFunnel?.stages ?? []).map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Mover para:</p>
                  <div>
                    <label className="block text-xs text-foreground mb-1">Funil de destino</label>
                    <select value={targetFunnelId} onChange={(e) => setTargetFunnelId(e.target.value)}
                      className="w-full border border-input bg-background rounded px-2 py-1.5 text-sm focus:outline-none"
                    >
                      <option value="">Selecionar funil...</option>
                      {funnels.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-foreground mb-1">Etapa</label>
                    <select value={targetStageId} onChange={(e) => setTargetStageId(e.target.value)}
                      className="w-full border border-input bg-background rounded px-2 py-1.5 text-sm focus:outline-none"
                      disabled={!targetFunnelId}
                    >
                      <option value="">Selecionar etapa...</option>
                      {(targetFunnel?.stages ?? []).map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-3 py-1.5 text-sm border border-input rounded hover:bg-muted">Cancelar</button>
                <button type="submit" className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded hover:opacity-90">Salvar regra</button>
              </div>
            </form>
          )}
          {!showForm && (
            <button onClick={() => setShowForm(true)} disabled={funnels.length < 1}
              className="w-full flex items-center justify-center gap-2 border border-dashed border-border rounded-lg py-2.5 text-sm text-muted-foreground hover:text-foreground hover:border-border/70 disabled:opacity-40"
            >
              <Plus className="h-4 w-4" /> Nova regra de automação
            </button>
          )}
        </div>
        <div className="px-6 py-4 border-t border-border flex justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90">Fechar</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main DealsPage ───────────────────────────────────────────
export default function DealsPage() {
  const [funnels, setFunnels]         = useState<Funnel[]>([]);
  const [companies, setCompanies]     = useState<Company[]>([]);
  const [transitions, setTransitions] = useState<FunnelTransition[]>([]);
  const [stageFups, setStageFups]     = useState<StageFollowUp[]>([]);
  const [activeFunnelId, setActiveFunnelId] = useState<string | null>(null);
  const [showCardForm, setShowCardForm]     = useState<{ stageId: string; card: FunnelCard | null } | null>(null);
  const [showFunnelForm, setShowFunnelForm] = useState<Funnel | null | "new">(null);
  const [showAutomations, setShowAutomations] = useState(false);
  const [stageFupModal, setStageFupModal]     = useState<FunnelStage | null>(null);
  const [fupTrigger, setFupTrigger]           = useState<{ fup: StageFollowUp; card: FunnelCard } | null>(null);
  const [deleteCardId, setDeleteCardId]     = useState<string | null>(null);
  const [deleteFunnelId, setDeleteFunnelId] = useState<string | null>(null);
  const [expandedCards, setExpandedCards]   = useState<Set<string>>(new Set());

  async function reload() {
    const [all, c, tr] = await Promise.all([FunnelDB.getAll(), CompanyDB.getAll(), FunnelTransitionDB.getAll()]);
    setStageFups(StageFollowUpStore.getAll());
    setFunnels(all);
    setCompanies(c);
    setTransitions(tr);
    if (all.length > 0 && !activeFunnelId) setActiveFunnelId(all[0].id);
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { reload(); }, []);

  const activeFunnel = funnels.find((f) => f.id === activeFunnelId) ?? null;

  async function saveCard(data: Partial<FunnelCard>) {
    if (!activeFunnel) return;
    const editing = showCardForm?.card;
    const updatedCards = editing
      ? activeFunnel.cards.map((c) => c.id === editing.id ? { ...c, ...data } : c)
      : [
          ...activeFunnel.cards,
          {
            id: uid(), funnelId: activeFunnel.id,
            companyId: data.companyId ?? "",
            companyName: data.companyName ?? "",
            temperature: data.temperature ?? "cold",
            revenue: data.revenue ?? "",
            stageId: data.stageId ?? activeFunnel.stages[0]?.id ?? "",
            phones: data.phones ?? [],
            contactName: data.contactName ?? "",
            contactRole: data.contactRole ?? "",
            leadScore: data.leadScore,
            email: data.email ?? "",
            instagram: data.instagram ?? "",
            linkedin: data.linkedin ?? "",
            cnpj: data.cnpj ?? "",
            segment: data.segment ?? "",
            website: data.website ?? "",
            observations: data.observations ?? "",
            notes: data.notes ?? [],
            reminders: data.reminders ?? [],
            createdAt: now(),
          } as FunnelCard,
        ];
    try {
      await FunnelDB.update(activeFunnel.id, { cards: updatedCards });
      setShowCardForm(null);
      reload();
      toast.success(editing ? "Card atualizado." : "Card adicionado.");
    } catch { toast.error("Erro ao salvar card."); }
  }

  async function deleteCard() {
    if (!activeFunnel || !deleteCardId) return;
    try {
      await FunnelDB.update(activeFunnel.id, { cards: activeFunnel.cards.filter((c) => c.id !== deleteCardId) });
      setDeleteCardId(null); reload(); toast.success("Card removido.");
    } catch { toast.error("Erro ao remover card."); }
  }

  async function moveCard(cardId: string, toStageId: string) {
    if (!activeFunnel) return;
    try {
      const movedCards = activeFunnel.cards.map((c) => c.id === cardId ? { ...c, stageId: toStageId } : c);
      await FunnelDB.update(activeFunnel.id, { cards: movedCards });

      // Verifica automação entre funis
      const rule = transitions.find(
        (t) => t.active && t.sourceFunnelId === activeFunnel.id && t.sourceStageId === toStageId
      );
      if (rule) {
        const card = movedCards.find((c) => c.id === cardId);
        const targetFunnel = funnels.find((f) => f.id === rule.targetFunnelId);
        if (card && targetFunnel) {
          await FunnelDB.update(activeFunnel.id, { cards: movedCards.filter((c) => c.id !== cardId) });
          await FunnelDB.update(targetFunnel.id, { cards: [...targetFunnel.cards, { ...card, stageId: rule.targetStageId, funnelId: targetFunnel.id }] });
          toast.success(`Automação: card movido para "${targetFunnel.name}".`);
        }
      }

      // Verifica FUP da etapa
      const fup = StageFollowUpStore.getByStage(activeFunnel.id, toStageId);
      if (fup?.active) {
        const card = movedCards.find((c) => c.id === cardId);
        if (card) setFupTrigger({ fup, card });
      }

      reload();
    } catch { toast.error("Erro ao mover card."); }
  }

  async function saveFunnel(name: string, stagesInput: { title: string; color: string; description: string }[]) {
    const stages: FunnelStage[] = stagesInput.map((s, i) => ({ id: uid(), title: s.title, color: s.color, description: s.description, order: i }));
    try {
      if (showFunnelForm && showFunnelForm !== "new") {
        await FunnelDB.update(showFunnelForm.id, { name, stages });
        toast.success("Funil atualizado.");
      } else {
        const created = await FunnelDB.save({ name, stages, cards: [] });
        setActiveFunnelId(created.id);
        toast.success("Funil criado.");
      }
      setShowFunnelForm(null); reload();
    } catch { toast.error("Erro ao salvar funil."); }
  }

  async function deleteFunnel() {
    if (!deleteFunnelId) return;
    try {
      await FunnelDB.remove(deleteFunnelId);
      setDeleteFunnelId(null);
      const remaining = funnels.filter((f) => f.id !== deleteFunnelId);
      setActiveFunnelId(remaining[0]?.id ?? null);
      reload(); toast.success("Funil removido.");
    } catch { toast.error("Erro ao remover funil."); }
  }

  async function saveTransition(t: Omit<FunnelTransition, "id" | "createdAt">) {
    try { await FunnelTransitionDB.save(t); reload(); toast.success("Automação salva."); }
    catch { toast.error("Erro ao salvar automação."); }
  }
  async function toggleTransition(t: FunnelTransition) {
    try { await FunnelTransitionDB.update(t.id, { active: !t.active }); reload(); }
    catch { toast.error("Erro ao atualizar automação."); }
  }
  async function deleteTransition(id: string) {
    try { await FunnelTransitionDB.remove(id); reload(); toast.success("Automação removida."); }
    catch { toast.error("Erro ao remover automação."); }
  }

  function saveStageFup(data: Omit<StageFollowUp, "id" | "createdAt">) {
    StageFollowUpStore.save(data);
    setStageFupModal(null);
    reload();
    toast.success("Follow-up configurado.");
  }

  function toggleCard(id: string) {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const activeTransitionsCount = transitions.filter((t) => t.active).length;

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <DollarSign className="h-7 w-7 text-primary" />
            <h1 className="text-2xl font-semibold text-foreground">Deals</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowAutomations(true)}
              className="flex items-center gap-1.5 border border-input bg-background px-3 py-1.5 rounded-md text-sm text-foreground hover:bg-muted relative"
            >
              <Zap className="h-3.5 w-3.5 text-primary" /> Automações
              {activeTransitionsCount > 0 && (
                <span className="ml-1 text-[10px] font-bold bg-primary text-primary-foreground rounded-full px-1.5 py-0.5">
                  {activeTransitionsCount}
                </span>
              )}
            </button>
            <button onClick={() => setShowFunnelForm("new")}
              className="flex items-center gap-2 border border-input bg-background px-3 py-1.5 rounded-md text-sm text-foreground hover:bg-muted"
            >
              <Plus className="h-3.5 w-3.5" /> Novo Funil
            </button>
          </div>
        </div>
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {funnels.map((f) => (
            <div key={f.id} className="flex items-center gap-0.5">
              <button onClick={() => setActiveFunnelId(f.id)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                  activeFunnelId === f.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {f.name}
              </button>
              {activeFunnelId === f.id && (
                <>
                  <button onClick={() => setShowFunnelForm(f)} className="p-1 text-muted-foreground hover:text-foreground" title="Editar funil">
                    <Settings className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => setDeleteFunnelId(f.id)} className="p-1 text-muted-foreground hover:text-destructive" title="Remover funil">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </div>
          ))}
          {funnels.length === 0 && <span className="text-sm text-muted-foreground">Nenhum funil criado.</span>}
        </div>
      </div>

      {/* Kanban */}
      {activeFunnel ? (
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <div className="flex gap-4 p-6 h-full min-w-max">
            {activeFunnel.stages
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((stage) => {
                const stageCards = activeFunnel.cards.filter((c) => c.stageId === stage.id);
                const colorBar   = STAGE_COLORS[stage.color] ?? "bg-slate-500";
                const hasRule    = transitions.some((t) => t.active && t.sourceFunnelId === activeFunnel.id && t.sourceStageId === stage.id);
                const hasFup     = stageFups.some((f) => f.funnelId === activeFunnel.id && f.stageId === stage.id && f.active);
                return (
                  <div key={stage.id} className="flex flex-col w-68 shrink-0" style={{ minWidth: 272 }}>
                    {/* Stage header */}
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${colorBar}`} />
                      <span className="text-sm font-medium text-foreground flex-1">{stage.title}</span>
                      {hasRule && <Zap className="h-3 w-3 text-primary" title="Automação entre funis" />}
                      {hasFup && <Bell className="h-3 w-3 text-amber-400" title="Follow-up ativo" />}
                      <button
                        onClick={() => setStageFupModal(stage)}
                        className="p-0.5 text-muted-foreground hover:text-primary"
                        title="Configurar follow-up"
                      >
                        <Zap className="h-3 w-3" />
                      </button>
                      <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">{stageCards.length}</span>
                    </div>
                    {stage.description && (
                      <p className="text-[10px] text-muted-foreground mb-2 leading-relaxed line-clamp-2" title={stage.description}>
                        {stage.description}
                      </p>
                    )}

                    <div className="flex-1 space-y-2 overflow-y-auto pr-1">
                      {stageCards.map((card) => {
                        const temp = TEMP_CONFIG[card.temperature];
                        const TempIcon = temp.icon;
                        const visiblePhones = (card.phones ?? []).filter(p => p.trim()).slice(0, 5);
                        const isExpanded = expandedCards.has(card.id);
                        const hasOverdueReminder = (card.reminders ?? []).some(r => !r.done && new Date(r.date) < new Date());
                        const notesCount = (card.notes ?? []).length;
                        const remCount = (card.reminders ?? []).filter(r => !r.done).length;

                        return (
                          <div key={card.id} className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-sm transition-shadow">
                            {/* Card header */}
                            <div className="p-3">
                              <div className="flex items-start justify-between gap-1 mb-1.5">
                                <div className="flex-1 min-w-0">
                                  <span className="font-medium text-sm text-foreground leading-tight block truncate">{card.companyName}</span>
                                  {(card.contactName || card.contactRole) && (
                                    <span className="text-[11px] text-muted-foreground">
                                      {card.contactName}{card.contactRole ? ` · ${card.contactRole}` : ""}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-0.5 shrink-0">
                                  {hasOverdueReminder && <Bell className="h-3 w-3 text-destructive" title="Lembrete atrasado" />}
                                  <button onClick={() => toggleCard(card.id)} className="p-1 text-muted-foreground hover:text-foreground">
                                    {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                  </button>
                                  <button onClick={() => setShowCardForm({ stageId: stage.id, card })} className="p-1 text-muted-foreground hover:text-foreground">
                                    <Pencil className="h-3 w-3" />
                                  </button>
                                  <button onClick={() => setDeleteCardId(card.id)} className="p-1 text-muted-foreground hover:text-destructive">
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>

                              {/* Badges */}
                              <div className="flex items-center gap-1.5 flex-wrap mb-2">
                                <span className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full ${temp.cls}`}>
                                  <TempIcon className="h-2.5 w-2.5" />{temp.label}
                                </span>
                                {card.leadScore && (
                                  <span className={`inline-flex items-center text-[11px] font-semibold px-1.5 py-0.5 rounded border ${SCORE_CFG[card.leadScore]}`}>
                                    {card.leadScore}
                                  </span>
                                )}
                                {card.revenue && <span className="text-xs text-muted-foreground">{card.revenue}</span>}
                                {(notesCount > 0 || remCount > 0) && (
                                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                    {notesCount > 0 && <><StickyNote className="h-2.5 w-2.5" />{notesCount}</>}
                                    {remCount > 0 && <><Bell className="h-2.5 w-2.5 ml-1" />{remCount}</>}
                                  </span>
                                )}
                              </div>

                              {/* Telefones com WhatsApp (max 5, visíveis sem abrir card) */}
                              {visiblePhones.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-2">
                                  {visiblePhones.map((ph, i) => (
                                    <a
                                      key={i}
                                      href={waLink(ph)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors"
                                      title={`Abrir WhatsApp: ${ph}`}
                                    >
                                      <MessageCircle className="h-2.5 w-2.5" />
                                      {ph.length > 12 ? ph.slice(-8) : ph}
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Expandido: notas/lembretes */}
                            {isExpanded && (
                              <div className="border-t border-border px-3 py-2 space-y-2 bg-muted/10">
                                {card.observations && (
                                  <p className="text-[11px] text-muted-foreground italic leading-relaxed line-clamp-3">
                                    {card.observations}
                                  </p>
                                )}
                                {(card.notes ?? []).slice(0, 2).map((n) => (
                                  <div key={n.id} className="text-[11px] text-foreground bg-muted/30 rounded px-2 py-1 leading-snug">
                                    {n.content}
                                  </div>
                                ))}
                                {(card.reminders ?? []).filter(r => !r.done).slice(0, 2).map((r) => {
                                  const od = new Date(r.date) < new Date();
                                  return (
                                    <div key={r.id} className={`flex items-center gap-1.5 text-[11px] ${od ? "text-destructive" : "text-muted-foreground"}`}>
                                      <Bell className="h-2.5 w-2.5 shrink-0" />
                                      <span className="flex-1 truncate">{r.text}</span>
                                      <span className="shrink-0">{new Date(r.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Stage selector */}
                            {activeFunnel.stages.length > 1 && (
                              <div className="px-3 pb-3 pt-1 border-t border-border/50">
                                <select value={card.stageId} onChange={(e) => moveCard(card.id, e.target.value)}
                                  className="w-full text-xs border border-input bg-background rounded px-1.5 py-1 focus:outline-none"
                                >
                                  {activeFunnel.stages.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
                                </select>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <button onClick={() => setShowCardForm({ stageId: stage.id, card: null })}
                      className="mt-2 flex items-center justify-center gap-1.5 w-full py-2 border border-dashed border-border rounded-lg text-xs text-muted-foreground hover:text-foreground hover:border-border/80 transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" /> Adicionar
                    </button>
                  </div>
                );
              })}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <DollarSign className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-4">Nenhum funil criado ainda.</p>
            <button onClick={() => setShowFunnelForm("new")} className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm hover:opacity-90">
              Criar primeiro funil
            </button>
          </div>
        </div>
      )}

      {/* Modais */}
      {showCardForm && activeFunnel && (
        <CardForm funnel={activeFunnel} stageId={showCardForm.stageId} card={showCardForm.card} companies={companies} onSave={saveCard} onClose={() => setShowCardForm(null)} />
      )}
      {showFunnelForm && (
        <FunnelForm funnel={showFunnelForm === "new" ? null : showFunnelForm} onSave={saveFunnel} onClose={() => setShowFunnelForm(null)} />
      )}
      {showAutomations && (
        <AutomationsModal funnels={funnels} transitions={transitions} onSave={saveTransition} onToggle={toggleTransition} onDelete={deleteTransition} onClose={() => setShowAutomations(false)} />
      )}
      {stageFupModal && activeFunnel && (
        <StageFupModal
          funnelId={activeFunnel.id}
          stage={stageFupModal}
          existing={StageFollowUpStore.getByStage(activeFunnel.id, stageFupModal.id)}
          onSave={saveStageFup}
          onClose={() => setStageFupModal(null)}
        />
      )}
      {fupTrigger && (
        <FupTriggerModal fup={fupTrigger.fup} cardName={fupTrigger.card.companyName} onClose={() => setFupTrigger(null)} />
      )}
      {deleteCardId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="font-semibold text-foreground mb-2">Remover Card</h2>
            <p className="text-sm text-muted-foreground mb-5">Esta ação não pode ser desfeita.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteCardId(null)} className="px-4 py-2 text-sm border border-input rounded-md hover:bg-muted">Cancelar</button>
              <button onClick={deleteCard} className="px-4 py-2 text-sm bg-destructive text-white rounded-md hover:opacity-90">Remover</button>
            </div>
          </div>
        </div>
      )}
      {deleteFunnelId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="font-semibold text-foreground mb-2">Remover Funil</h2>
            <p className="text-sm text-muted-foreground mb-5">Todos os cards deste funil serão removidos.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteFunnelId(null)} className="px-4 py-2 text-sm border border-input rounded-md hover:bg-muted">Cancelar</button>
              <button onClick={deleteFunnel} className="px-4 py-2 text-sm bg-destructive text-white rounded-md hover:opacity-90">Remover</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
