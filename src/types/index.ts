// ────────────────────────────────────────────────
//  Tipos compartilhados – Althius CRM
// ────────────────────────────────────────────────

export interface UserPermissions {
  canViewDeals: boolean;
  canEditDeals: boolean;
  canViewPeople: boolean;
  canEditPeople: boolean;
  canViewCompanies: boolean;
  canEditCompanies: boolean;
  canViewTasks: boolean;
  canEditTasks: boolean;
  canViewSequences: boolean;
  canViewWhatsApp: boolean;
  canViewDataEnrichment: boolean;
  canViewGrowthLab: boolean;
  canViewAgents: boolean;
  canViewMetas: boolean;
}

export const DEFAULT_USER_PERMISSIONS: UserPermissions = {
  canViewDeals: true,
  canEditDeals: true,
  canViewPeople: true,
  canEditPeople: true,
  canViewCompanies: true,
  canEditCompanies: true,
  canViewTasks: true,
  canEditTasks: true,
  canViewSequences: false,
  canViewWhatsApp: true,
  canViewDataEnrichment: false,
  canViewGrowthLab: false,
  canViewAgents: false,
  canViewMetas: false,
};

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: "admin" | "user";
  permissions?: UserPermissions;
  createdAt: string;
}

export interface City {
  id: string;
  name: string;
  state: string;
  active: boolean;
  createdAt: string;
}

export interface Person {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  companyId?: string;
  companyName?: string;
  city?: string;
  state?: string;
  tags: string[];
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

export interface Company {
  id: string;
  name: string;
  cnpj?: string;
  segment?: string;
  website?: string;
  city?: string;
  state?: string;
  employees?: number;
  annualRevenue?: string;
  status: "active" | "inactive" | "prospect";
  temperature: "hot" | "warm" | "cold";
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: "pending" | "in_progress" | "done";
  priority: "low" | "normal" | "high" | "critical";
  dueDate?: string;
  personId?: string;
  personName?: string;
  companyId?: string;
  companyName?: string;
  funnelId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SequenceStep {
  id: string;
  order: number;
  type: "whatsapp" | "email" | "call" | "task";
  content: string;
  delayDays: number;
}

export interface Sequence {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  steps: SequenceStep[];
  contactIds: string[];
  companyIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface WhatsAppMessage {
  id: string;
  contactId: string;
  contactName: string;
  contactPhone: string;
  direction: "in" | "out";
  content: string;
  status: "sent" | "delivered" | "read" | "failed";
  timestamp: string;
}

export interface WhatsAppConversation {
  id: string;
  contactId: string;
  contactName: string;
  contactPhone: string;
  lastMessage: string;
  lastMessageAt: string;
  unread: number;
  messages: WhatsAppMessage[];
}

export interface FunnelStage {
  id: string;
  title: string;
  description?: string;
  color: string;
  order: number;
}

// ── Card: notas e lembretes ───────────────────────────────────
export interface CardNote {
  id: string;
  content: string;
  createdAt: string;
}

export interface CardReminder {
  id: string;
  text: string;
  date: string;
  done: boolean;
}

export interface FunnelCard {
  id: string;
  companyId?: string;
  companyName: string;
  temperature: "hot" | "warm" | "cold";
  revenue: string;
  stageId: string;
  funnelId: string;
  createdAt: string;
  // Dados estendidos do lead
  phones?: string[];          // até 10 números
  contactName?: string;
  contactRole?: string;
  leadScore?: "A" | "B" | "C";
  email?: string;
  instagram?: string;
  linkedin?: string;
  cnpj?: string;
  segment?: string;
  website?: string;
  observations?: string;      // notas da IA ao enriquecer
  notes?: CardNote[];
  reminders?: CardReminder[];
}

export interface Funnel {
  id: string;
  name: string;
  stages: FunnelStage[];
  cards: FunnelCard[];
  createdAt: string;
}

export interface FunnelTransition {
  id: string;
  label?: string;
  sourceFunnelId: string;
  sourceStageId: string;
  targetFunnelId: string;
  targetStageId: string;
  active: boolean;
  createdAt: string;
}

// ── Follow-up automático por etapa ───────────────────────────
export interface FupMessage {
  delay: number;
  delayUnit: "hours" | "days";
  type: "whatsapp" | "email" | "both";
  content: string;
}

export interface StageFollowUp {
  id: string;
  funnelId: string;
  stageId: string;
  stageName: string;
  active: boolean;
  useAI: boolean;
  aiPrompt?: string;
  messages: FupMessage[];
  createdAt: string;
}

// ── Agentes de IA ────────────────────────────────────────────
export interface Agent {
  id: string;
  name: string;
  role: string;
  systemPrompt: string;
  model: "openai" | "gemini";
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Growth Lab ────────────────────────────────────
export type GrowthCategory = "acquisition" | "activation" | "retention" | "revenue" | "referral";
export type GrowthStatus   = "backlog" | "running" | "done" | "killed";

export interface GrowthExperiment {
  id: string;
  weekId: string;
  hypothesis: string;
  category: GrowthCategory;
  status: GrowthStatus;
  impact: number;     // 1–10
  confidence: number; // 1–10
  ease: number;       // 1–10
  iceScore: number;   // (impact + confidence + ease) / 3
  result?: string;
  learnings?: string;
  owner?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GrowthWeek {
  id: string;
  week: string;      // "2026-W12"
  northStar: string; // objetivo qualitativo
  metric: string;    // nome da métrica
  target: number;
  current: number;
  createdAt: string;
}
