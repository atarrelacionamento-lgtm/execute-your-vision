import { useState, useEffect, useRef } from "react";
import { X, Send, ExternalLink, MessageCircle } from "lucide-react";
import { WhatsAppDB } from "@/lib/db";
import type { WhatsAppConversation, WhatsAppMessage } from "@/types";
import { wasellerOpenChat } from "@/lib/integrations";
import { toast } from "sonner";

function uid() { return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`; }
function now() { return new Date().toISOString(); }

interface MiniChatPopupProps {
  contactName: string;
  contactPhone: string;
  onClose: () => void;
}

export function MiniChatPopup({ contactName, contactPhone, onClose }: MiniChatPopupProps) {
  const [conv, setConv] = useState<WhatsAppConversation | null>(null);
  const [msgText, setMsgText] = useState("");
  const [loading, setLoading] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);

  async function loadConv() {
    setLoading(true);
    const all = await WhatsAppDB.getAll();
    const found = all.find(c => c.contactPhone === contactPhone);
    setConv(found ?? null);
    setLoading(false);
  }

  useEffect(() => { loadConv(); }, [contactPhone]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [conv]);

  async function sendMessage() {
    if (!msgText.trim()) return;
    const message: WhatsAppMessage = {
      id: uid(),
      contactId: conv?.contactId ?? uid(),
      contactName,
      contactPhone,
      direction: "out",
      content: msgText.trim(),
      status: "sent",
      timestamp: now(),
    };

    try {
      if (conv) {
        await WhatsAppDB.update(conv.id, {
          messages: [...conv.messages, message],
          lastMessage: message.content,
          lastMessageAt: message.timestamp,
        });
      } else {
        await WhatsAppDB.save({
          contactId: message.contactId,
          contactName,
          contactPhone,
          lastMessage: message.content,
          lastMessageAt: message.timestamp,
          unread: 0,
          messages: [message],
        });
      }
      setMsgText("");
      loadConv();
    } catch {
      toast.error("Erro ao enviar mensagem.");
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-[60] w-80 bg-card border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden"
      style={{ maxHeight: "420px" }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-card shrink-0">
        <div className="w-7 h-7 rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-500 text-xs font-bold">
          {contactName[0]?.toUpperCase() ?? "?"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-foreground truncate">{contactName}</div>
          <div className="text-[11px] text-muted-foreground">{contactPhone}</div>
        </div>
        <button
          onClick={() => wasellerOpenChat(contactPhone)}
          className="p-1.5 text-emerald-500 hover:bg-emerald-500/10 rounded"
          title="Abrir WhatsApp Web"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </button>
        <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground rounded">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[120px]">
        {loading && <p className="text-xs text-muted-foreground text-center py-4">Carregando...</p>}
        {!loading && (!conv || conv.messages.length === 0) && (
          <div className="text-center py-6">
            <MessageCircle className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Nenhuma mensagem.</p>
          </div>
        )}
        {conv?.messages.map(msg => {
          const isOut = msg.direction === "out";
          return (
            <div key={msg.id} className={`flex ${isOut ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] px-2.5 py-1.5 rounded-lg text-xs ${
                isOut
                  ? "bg-primary text-primary-foreground rounded-br-none"
                  : "bg-muted text-foreground rounded-bl-none"
              }`}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
                <span className={`text-[10px] block mt-0.5 ${isOut ? "text-primary-foreground/50" : "text-muted-foreground"}`}>
                  {new Date(msg.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="px-3 py-2 border-t border-border flex gap-2 shrink-0">
        <input
          type="text"
          value={msgText}
          onChange={e => setMsgText(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); sendMessage(); } }}
          placeholder="Mensagem..."
          className="flex-1 border border-input bg-background rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30"
        />
        <button
          onClick={sendMessage}
          disabled={!msgText.trim()}
          className="p-1.5 bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-40"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
