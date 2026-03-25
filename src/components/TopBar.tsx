import { useState, useEffect, useRef } from "react";
import { Search, Bot, Bell, CheckSquare, Clock, AlertTriangle, Calendar } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { TaskStore } from "@/lib/storage";
import type { Task } from "@/types";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";

// ── Notificações de tarefas ────────────────────────
function TaskNotifications() {
  const [open, setOpen]   = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setTasks(TaskStore.getAll());
  }, [open]);

  // Fechar ao clicar fora
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);

  const active = tasks.filter((t) => t.status !== "done");

  const overdue = active.filter((t) => {
    if (!t.dueDate) return false;
    return new Date(t.dueDate) < today;
  });

  const dueToday = active.filter((t) => {
    if (!t.dueDate) return false;
    const d = new Date(t.dueDate);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  });

  const upcoming = active.filter((t) => {
    if (!t.dueDate) return false;
    const d = new Date(t.dueDate);
    d.setHours(0, 0, 0, 0);
    return d > today && d <= nextWeek;
  });

  const total = overdue.length + dueToday.length;

  function fmt(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  }

  const PRIORITY_COLORS: Record<string, string> = {
    critical: "text-red-500",
    high: "text-orange-400",
    normal: "text-yellow-400",
    low: "text-muted-foreground",
  };

  function Section({ label, icon: Icon, color, items }: {
    label: string; icon: React.ElementType; color: string; items: Task[];
  }) {
    if (items.length === 0) return null;
    return (
      <div>
        <div className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider ${color}`}>
          <Icon className="h-3 w-3" />{label} ({items.length})
        </div>
        {items.slice(0, 5).map((t) => (
          <button
            key={t.id}
            onClick={() => { navigate("/tasks"); setOpen(false); }}
            className="w-full text-left px-3 py-2 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs text-foreground leading-snug line-clamp-1">{t.title}</span>
              {t.dueDate && (
                <span className="text-[10px] text-muted-foreground shrink-0">{fmt(t.dueDate)}</span>
              )}
            </div>
            {(t.personName || t.companyName) && (
              <p className="text-[11px] text-muted-foreground mt-0.5">{t.personName ?? t.companyName}</p>
            )}
          </button>
        ))}
        {items.length > 5 && (
          <p className="px-3 py-1 text-[11px] text-muted-foreground">+{items.length - 5} mais</p>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex items-center justify-center w-8 h-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/[0.05] transition-colors"
        title="Notificações de tarefas"
      >
        <Bell className="h-4 w-4" />
        {total > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-destructive text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
            {total > 99 ? "99+" : total}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-72 bg-card border border-border rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] overflow-hidden">
          <div className="px-3 py-2.5 border-b border-border flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <CheckSquare className="h-4 w-4 text-primary" /> Tarefas
            </span>
            {active.length === 0 && (
              <span className="text-xs text-muted-foreground">Tudo em dia</span>
            )}
          </div>

          {active.length === 0 ? (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">
              Nenhuma tarefa pendente.
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto divide-y divide-border/40">
              <Section label="Atrasadas" icon={AlertTriangle} color="text-destructive" items={overdue} />
              <Section label="Hoje" icon={Clock} color="text-orange-400" items={dueToday} />
              <Section label="Próximos 7 dias" icon={Calendar} color="text-primary" items={upcoming} />
              {active.filter((t) => !t.dueDate).length > 0 && (
                <Section
                  label="Sem prazo"
                  icon={CheckSquare}
                  color="text-muted-foreground"
                  items={active.filter((t) => !t.dueDate)}
                />
              )}
            </div>
          )}

          <div className="border-t border-border px-3 py-2">
            <button
              onClick={() => { navigate("/tasks"); setOpen(false); }}
              className="w-full text-center text-xs text-primary hover:underline"
            >
              Ver todas as tarefas
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── TopBar ────────────────────────────────────────
export function TopBar() {
  return (
    <div className="h-14 flex items-center gap-3 px-4 border-b border-border bg-background/80 backdrop-blur-sm">
      <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors" />

      <div className="flex-1 flex items-center">
        <div className="relative w-full max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
          <input
            type="text"
            placeholder="Buscar no Althius CRM..."
            className="w-full pl-10 pr-20 py-2 bg-secondary/60 rounded-md text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring/30 transition-shadow border border-border/40 focus:border-border"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground/40 bg-background/60 px-1.5 py-0.5 rounded border border-border/40 tracking-wide">
            ⌘K
          </kbd>
        </div>
      </div>

      <ThemeToggle />
      <TaskNotifications />

      {/* AI button */}
      <button className="flex items-center gap-2 border border-border/70 text-foreground/70 hover:text-foreground hover:border-primary/40 px-4 py-2 rounded-md text-sm font-medium transition-all hover:bg-white/[0.03]">
        <Bot className="h-4 w-4" />
        <span className="text-xs tracking-wide">AI Assistant</span>
      </button>

      {/* Avatar */}
      <div className="h-8 w-8 rounded-full border border-border/60 bg-secondary/80 text-foreground/70 flex items-center justify-center text-xs font-semibold tracking-wide hover:border-primary/40 transition-colors cursor-pointer">
        CA
      </div>
    </div>
  );
}
