import {
  Home, Bot, Search, Building2, Database,
  Send, MessageSquare, CheckSquare,
  DollarSign, ChevronDown, ChevronRight, Sun, Moon, Users, Zap, Target, Radio, ShieldCheck,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { PipaAIButton } from "@/components/PipaAIPanel";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

interface NavGroup {
  label: string;
  icon: React.ElementType;
  items: { title: string; url: string; icon: React.ElementType; badge?: string }[];
}

const navGroups: NavGroup[] = [
  {
    label: "",
    icon: Home,
    items: [
      { title: "Home", url: "/", icon: Home },
      { title: "AI Assistentes", url: "/ai-assistant", icon: Bot, badge: "New" },
      { title: "Deals", url: "/deals", icon: DollarSign },
      { title: "Metas", url: "/metas", icon: Target },
    ],
  },
  {
    label: "Prospecção e aquecimento",
    icon: Search,
    items: [
      { title: "Pessoas", url: "/people", icon: Users },
      { title: "Empresas", url: "/companies", icon: Building2 },
      { title: "Aquecimento de dados", url: "/data-enrichment", icon: Database },
      { title: "Sinais", url: "/signals", icon: Radio },
    ],
  },
  {
    label: "Engajamento",
    icon: Send,
    items: [
      { title: "Sequências", url: "/sequences", icon: Send },
      { title: "WhatsApp", url: "/whatsapp", icon: MessageSquare },
      { title: "Tarefas", url: "/tasks", icon: CheckSquare },
    ],
  },
  {
    label: "Growth",
    icon: Zap,
    items: [
      { title: "Growth Lab", url: "/growth-lab", icon: Zap, badge: "New" },
      { title: "Agentes de IA", url: "/agents", icon: Bot },
    ],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    "Prospecção e aquecimento": true,
    "Engajamento": true,
    "Growth": true,
  });
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarContent className="py-2">

        {/* Brand header */}
        <div className="px-4 py-3 flex items-center gap-3 mb-1">
          <img
            src="/althius.png"
            alt="Althius"
            className="h-8 w-8 shrink-0 object-contain"
          />
          {!collapsed && (
            <span
              className="text-[13px] font-bold tracking-[0.28em] uppercase"
              style={{
                background: "linear-gradient(90deg, hsl(240 5% 82%) 0%, hsl(240 5% 52%) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              ALTHIUS
            </span>
          )}
        </div>

        {/* GTM tagline — only when expanded */}
        {!collapsed && (
          <div className="px-4 pb-3">
            <span className="text-[10px] tracking-widest uppercase text-muted-foreground/60 font-medium">
              GTM Engineering B2B
            </span>
          </div>
        )}

        {/* Divider */}
        <div className="mx-4 mb-2 h-px bg-sidebar-border/60" />

        {navGroups.map((group) => (
          <SidebarGroup key={group.label || "main"}>
            {group.label && !collapsed && (
              <SidebarGroupLabel
                className="cursor-pointer select-none flex items-center gap-1 text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-[0.18em] px-4 py-1.5 hover:text-muted-foreground transition-colors"
                onClick={() => toggleGroup(group.label)}
              >
                <group.icon className="h-3 w-3 mr-1" />
                {group.label}
                {openGroups[group.label] ? (
                  <ChevronDown className="h-3 w-3 ml-auto" />
                ) : (
                  <ChevronRight className="h-3 w-3 ml-auto" />
                )}
              </SidebarGroupLabel>
            )}
            {(group.label === "" || openGroups[group.label] || collapsed) && (
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          end
                          className={`flex items-center gap-3 px-4 py-2 text-sm rounded-md transition-all ${
                            isActive(item.url)
                              ? "bg-white/[0.05] text-foreground font-medium border-l-2 border-primary/60 pl-[14px]"
                              : "text-sidebar-foreground hover:bg-white/[0.03] hover:text-foreground/80 border-l-2 border-transparent pl-[14px]"
                          }`}
                          activeClassName=""
                        >
                          <item.icon
                            className={`h-4 w-4 shrink-0 ${
                              isActive(item.url) ? "text-primary" : ""
                            }`}
                          />
                          {!collapsed && (
                            <span className="flex-1">{item.title}</span>
                          )}
                          {!collapsed && item.badge && (
                            <span className="text-[9px] font-semibold border border-primary/40 text-primary/80 px-1.5 py-0.5 rounded-full tracking-wide">
                              {item.badge}
                            </span>
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            )}
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-2 border-t border-sidebar-border space-y-0.5 relative overflow-hidden">

        {/* Hidden detail: Orion constellation — barely visible, ~6% opacity */}
        {!collapsed && (
          <svg
            className="absolute bottom-2 right-2 pointer-events-none select-none"
            width="64"
            height="48"
            viewBox="0 0 64 48"
            aria-hidden="true"
            style={{ opacity: 0.06 }}
          >
            {/* Belt */}
            <line x1="20" y1="24" x2="30" y2="22" stroke="white" strokeWidth="0.6" />
            <line x1="30" y1="22" x2="40" y2="20" stroke="white" strokeWidth="0.6" />
            {/* Shoulder to belt */}
            <line x1="10" y1="14" x2="20" y2="24" stroke="white" strokeWidth="0.5" />
            {/* Belt to foot */}
            <line x1="40" y1="20" x2="54" y2="36" stroke="white" strokeWidth="0.5" />
            {/* Nebula hint (below belt) */}
            <line x1="28" y1="26" x2="32" y2="34" stroke="white" strokeWidth="0.4" />
            {/* Stars */}
            <circle cx="10" cy="14" r="1.8" fill="white" />
            <circle cx="20" cy="24" r="1.5" fill="white" />
            <circle cx="30" cy="22" r="1.5" fill="white" />
            <circle cx="40" cy="20" r="1.5" fill="white" />
            <circle cx="54" cy="36" r="1.6" fill="white" />
            <circle cx="32" cy="34" r="1.0" fill="white" />
          </svg>
        )}

        {!collapsed && <PipaAIButton />}

        {isAdmin && (
          <NavLink
            to="/users"
            end
            className={`flex items-center gap-3 px-3 py-[6px] rounded-md text-sm transition-all ${
              isActive("/users")
                ? "bg-white/[0.05] text-foreground font-medium border-l-2 border-primary/60 pl-[10px]"
                : "text-sidebar-foreground hover:bg-white/[0.03] hover:text-foreground/70 border-l-2 border-transparent pl-[10px]"
            }`}
            activeClassName=""
          >
            <ShieldCheck className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="text-xs">Usuários</span>}
          </NavLink>
        )}

        <button
          onClick={() => setDarkMode(!darkMode)}
          className="flex items-center gap-3 w-full px-3 py-[6px] text-sm rounded-md text-sidebar-foreground hover:bg-white/[0.03] hover:text-foreground/70 transition-colors"
        >
          {darkMode
            ? <Sun className="h-4 w-4 shrink-0" />
            : <Moon className="h-4 w-4 shrink-0" />}
          {!collapsed && (
            <span className="text-xs">
              {darkMode ? "Modo claro" : "Modo escuro"}
            </span>
          )}
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
