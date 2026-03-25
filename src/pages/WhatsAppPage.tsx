import { useState, useEffect, useRef } from "react";
import {
  MessageSquare, Send, Plus, Search, X, Check, CheckCheck,
  AlertTriangle, Info, ExternalLink, QrCode, Wifi, WifiOff,
} from "lucide-react";
import { WhatsAppDB, PersonDB } from "@/lib/db";
import type { WhatsAppConversation, WhatsAppMessage, Person } from "@/types";
import { wasellerOpenChat } from "@/lib/integrations";
import { toast } from "sonner";

function uid() { return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`; }
function now() { return new Date().toISOString(); }

const STATUS_ICONS: Record<WhatsAppMessage["status"], React.ElementType> = {
  sent:      Check,
  delivered: CheckCheck,
  read:      CheckCheck,
  failed:    AlertTriangle,
};

// ─── QR Code Connection Panel ────────────────────────────────
function QRCodePanel({ onClose }: { onClose: () => void }) {
  const [status, setStatus] = useState<"waiting" | "scanning" | "connected" | "error">("waiting");

  // Simulated QR code flow
  useEffect(() => {
    const t1 = setTimeout(() => setStatus("scanning"), 3000);
    return () => clearTimeout(t1);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <QrCode className="h-5 w-5 text-emerald-500" />
            Conectar WhatsApp
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-8 flex flex-col items-center">
          {status === "waiting" && (
            <>
              <div className="w-48 h-48 bg-muted/30 border-2 border-dashed border-border rounded-xl flex items-center justify-center mb-4 relative overflow-hidden">
                {/* Simulated QR pattern */}
                <div className="grid grid-cols-8 gap-0.5 w-36 h-36">
                  {Array.from({ length: 64 }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-full aspect-square rounded-[1px] ${
                        Math.random() > 0.45 ? "bg-foreground" : "bg-transparent"
                      }`}
                    />
                  ))}
                </div>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent animate-pulse" />
              </div>
              <p className="text-sm text-foreground font-medium mb-1">Escaneie o QR Code</p>
              <p className="text-xs text-muted-foreground text-center max-w-xs">
                Abra o WhatsApp no seu celular → Menu → Aparelhos conectados → Conectar um aparelho
              </p>
            </>
          )}

          {status === "scanning" && (
            <>
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mb-4 animate-pulse">
                <Wifi className="h-8 w-8 text-emerald-500" />
              </div>
              <p className="text-sm text-foreground font-medium mb-1">Aguardando conexão...</p>
              <p className="text-xs text-muted-foreground text-center">
                Escaneie o QR Code com seu WhatsApp para conectar.
              </p>
              <button
                onClick={() => {
                  setStatus("connected");
                  toast.success("WhatsApp conectado com sucesso!");
                  localStorage.setItem("wa_connected", "true");
                }}
                className="mt-4 px-4 py-2 bg-emerald-500 text-white rounded-md text-sm hover:bg-emerald-600"
              >
                Simular conexão
              </button>
            </>
          )}

          {status === "connected" && (
            <>
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mb-4">
                <Check className="h-8 w-8 text-emerald-500" />
              </div>
              <p className="text-sm text-emerald-500 font-semibold mb-1">Conectado!</p>
              <p className="text-xs text-muted-foreground text-center">
                Seu WhatsApp está conectado à plataforma.
              </p>
              <button onClick={onClose} className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:opacity-90">
                Fechar
              </button>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-16 h-16 rounded-full bg-destructive/15 flex items-center justify-center mb-4">
                <WifiOff className="h-8 w-8 text-destructive" />
              </div>
              <p className="text-sm text-destructive font-medium mb-1">Erro na conexão</p>
              <p className="text-xs text-muted-foreground text-center">
                Não foi possível conectar. Tente novamente.
              </p>
              <button
                onClick={() => setStatus("waiting")}
                className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:opacity-90"
              >
                Tentar novamente
              </button>
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t border-border">
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <p>
              A conexão via QR Code permite enviar e receber mensagens diretamente pela plataforma.
              Também é possível usar a extensão{" "}
              <a
                href="https://chromewebstore.google.com/detail/waseller-perder-vendas-no/illemhbijpiebjfilfmgebahaakajkpe"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-primary"
              >
                WASELLER
              </a>{" "}
              para envio via WhatsApp Web.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────
export default function WhatsAppPage() {
  const [conversations, setConversations] = useState<WhatsAppConversation[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [msgText, setMsgText] = useState("");
  const [showNewConv, setShowNewConv] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [newPhone, setNewPhone] = useState("");
  const [newName, setNewName] = useState("");
  const [selectedPersonId, setSelectedPersonId] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isConnected = localStorage.getItem("wa_connected") === "true";

  async function reload() {
    const [c, p] = await Promise.all([WhatsAppDB.getAll(), PersonDB.getAll()]);
    setConversations(c);
    setPeople(p);
  }

  useEffect(() => { reload(); }, []);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeId, conversations]);

  const filtered = conversations.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return c.contactName.toLowerCase().includes(q) || c.contactPhone.includes(q);
  });

  const active = conversations.find((c) => c.id === activeId) ?? null;

  async function createConversation() {
    if (selectedPersonId) {
      const person = people.find((p) => p.id === selectedPersonId);
      if (!person) return;
      if (!person.phone) {
        toast.error("Esta pessoa não tem telefone cadastrado.");
        return;
      }
      const existing = conversations.find((c) => c.contactId === person.id);
      if (existing) {
        setActiveId(existing.id);
        setShowNewConv(false);
        return;
      }
      try {
        const conv = await WhatsAppDB.save({
          contactId: person.id,
          contactName: person.name,
          contactPhone: person.phone,
          lastMessage: "",
          lastMessageAt: now(),
          unread: 0,
          messages: [],
        });
        await reload();
        setActiveId(conv.id);
        setShowNewConv(false);
      } catch {
        toast.error("Erro ao criar conversa.");
      }
      return;
    }

    if (!newName.trim() || !newPhone.trim()) {
      toast.error("Nome e telefone são obrigatórios.");
      return;
    }
    try {
      const conv = await WhatsAppDB.save({
        contactId: uid(),
        contactName: newName.trim(),
        contactPhone: newPhone.trim(),
        lastMessage: "",
        lastMessageAt: now(),
        unread: 0,
        messages: [],
      });
      await reload();
      setActiveId(conv.id);
      setShowNewConv(false);
      setNewName("");
      setNewPhone("");
    } catch {
      toast.error("Erro ao criar conversa.");
    }
  }

  async function sendMessage() {
    if (!msgText.trim() || !active) return;

    const message: WhatsAppMessage = {
      id: uid(),
      contactId: active.contactId,
      contactName: active.contactName,
      contactPhone: active.contactPhone,
      direction: "out",
      content: msgText.trim(),
      status: "sent",
      timestamp: now(),
    };

    const updated = {
      ...active,
      messages: [...active.messages, message],
      lastMessage: message.content,
      lastMessageAt: message.timestamp,
    };

    try {
      await WhatsAppDB.update(active.id, updated);
      setMsgText("");
      reload();
    } catch {
      toast.error("Erro ao enviar mensagem.");
    }
  }

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* Connection status bar */}
      <div className={`flex items-center gap-2 border-b text-xs px-6 py-2 ${
        isConnected
          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
          : "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400"
      }`}>
        {isConnected ? (
          <>
            <Wifi className="h-3.5 w-3.5 shrink-0" />
            <span><strong>Conectado</strong> — Envie e receba mensagens pela plataforma.</span>
            <button
              onClick={() => { localStorage.removeItem("wa_connected"); window.location.reload(); }}
              className="ml-auto text-xs underline opacity-70 hover:opacity-100"
            >
              Desconectar
            </button>
          </>
        ) : (
          <>
            <WifiOff className="h-3.5 w-3.5 shrink-0" />
            <span><strong>Desconectado</strong> — Conecte seu WhatsApp via QR Code para enviar mensagens.</span>
            <button
              onClick={() => setShowQR(true)}
              className="ml-auto flex items-center gap-1.5 px-3 py-1 bg-emerald-500 text-white rounded-md text-xs font-medium hover:bg-emerald-600"
            >
              <QrCode className="h-3 w-3" /> Conectar
            </button>
          </>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar conversas */}
        <div className="w-72 border-r border-border flex flex-col shrink-0">
          <div className="p-3 border-b border-border space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar conversas..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-input bg-background rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <button
              onClick={() => { setShowNewConv(true); setSelectedPersonId(""); setNewName(""); setNewPhone(""); }}
              className="w-full flex items-center justify-center gap-1.5 bg-primary text-primary-foreground rounded-md py-1.5 text-xs font-medium hover:opacity-90"
            >
              <Plus className="h-3.5 w-3.5" />
              Nova conversa
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 && (
              <div className="text-center text-xs text-muted-foreground py-10">
                {search ? "Nenhuma conversa encontrada." : "Nenhuma conversa ainda."}
              </div>
            )}
            {filtered.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setActiveId(conv.id)}
                className={`w-full text-left px-4 py-3 border-b border-border hover:bg-muted/30 transition-colors ${activeId === conv.id ? "bg-primary/5 border-l-2 border-l-primary" : ""}`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-medium text-sm text-foreground truncate">{conv.contactName}</span>
                  {conv.unread > 0 && (
                    <span className="bg-emerald-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center shrink-0">
                      {conv.unread}
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground truncate">{conv.contactPhone}</div>
                {conv.lastMessage && (
                  <div className="text-xs text-muted-foreground/70 truncate mt-0.5">{conv.lastMessage}</div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Área de mensagens */}
        {active ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-5 py-3 border-b border-border bg-card flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-primary text-sm font-bold">
                {active.contactName[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm text-foreground">{active.contactName}</div>
                <div className="text-xs text-muted-foreground">{active.contactPhone}</div>
              </div>
              <button
                onClick={() => wasellerOpenChat(active.contactPhone)}
                className="flex items-center gap-1.5 text-xs border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 rounded-md px-3 py-1.5 hover:bg-emerald-500/10 transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                Abrir no WhatsApp
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/10">
              {active.messages.length === 0 && (
                <div className="text-center text-xs text-muted-foreground py-10">
                  Nenhuma mensagem. Inicie a conversa abaixo.
                </div>
              )}
              {active.messages.map((msg) => {
                const StatusIcon = STATUS_ICONS[msg.status];
                const isOut = msg.direction === "out";
                return (
                  <div key={msg.id} className={`flex ${isOut ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg text-sm ${
                        isOut
                          ? "bg-primary text-primary-foreground rounded-br-none"
                          : "bg-card border border-border text-foreground rounded-bl-none"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      <div className={`flex items-center gap-1 mt-1 text-xs ${isOut ? "text-primary-foreground/60 justify-end" : "text-muted-foreground"}`}>
                        <span>{new Date(msg.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                        {isOut && <StatusIcon className="h-3 w-3" />}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-border bg-card">
              <div className="flex items-end gap-2">
                <textarea
                  value={msgText}
                  onChange={(e) => setMsgText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Digite uma mensagem..."
                  rows={1}
                  className="flex-1 border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  style={{ maxHeight: "120px" }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!msgText.trim()}
                  className="p-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-40 transition-opacity"
                  title="Enviar mensagem"
                >
                  <Send className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    if (!msgText.trim()) return;
                    wasellerOpenChat(active.contactPhone, msgText.trim());
                    sendMessage();
                  }}
                  disabled={!msgText.trim()}
                  className="p-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 disabled:opacity-40 transition-colors"
                  title="Abrir no WhatsApp Web (WASELLER)"
                >
                  <ExternalLink className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-muted/10">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-3">Selecione uma conversa ou inicie uma nova.</p>
              {!isConnected && (
                <button
                  onClick={() => setShowQR(true)}
                  className="flex items-center gap-2 mx-auto px-4 py-2 bg-emerald-500 text-white rounded-md text-sm hover:bg-emerald-600"
                >
                  <QrCode className="h-4 w-4" /> Conectar WhatsApp
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal Nova Conversa */}
      {showNewConv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-semibold text-foreground">Nova Conversa</h2>
              <button onClick={() => setShowNewConv(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {people.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Pessoa cadastrada
                  </label>
                  <select
                    value={selectedPersonId}
                    onChange={(e) => {
                      setSelectedPersonId(e.target.value);
                      if (e.target.value) { setNewName(""); setNewPhone(""); }
                    }}
                    className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none"
                  >
                    <option value="">Selecionar pessoa...</option>
                    {people.filter((p) => p.phone).map((p) => (
                      <option key={p.id} value={p.id}>{p.name} — {p.phone}</option>
                    ))}
                  </select>
                </div>
              )}

              {!selectedPersonId && (
                <>
                  <div className="text-xs text-center text-muted-foreground">ou</div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Nome do contato</label>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none"
                      placeholder="Nome"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Telefone (WhatsApp)</label>
                    <input
                      type="tel"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none"
                      placeholder="5511999999999"
                    />
                  </div>
                </>
              )}
            </div>
            <div className="px-6 py-4 border-t border-border flex justify-end gap-3">
              <button onClick={() => setShowNewConv(false)} className="px-4 py-2 text-sm border border-input rounded-md hover:bg-muted">Cancelar</button>
              <button onClick={createConversation} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90">Iniciar</button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQR && <QRCodePanel onClose={() => setShowQR(false)} />}
    </div>
  );
}
