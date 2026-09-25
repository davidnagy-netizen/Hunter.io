import type { CompanyProfile } from "@/features/profile/types/profile.types";
import type { Plan } from "@/features/authentication/types/auth.types";
import type { ProfileVersionChange, ProfileVersionEntry, SubscriptionLogEntry } from "@/features/admin/types/admin.types";

/** Mirrors `server/crm.js`. */
export type Lifecycle = "lead" | "registered" | "trial" | "subscriber" | "expired";
export type ContactKind = "account" | "lead";
export type NoteKind = "note" | "call" | "email" | "meeting" | "decision";

export interface VocabEntry {
  id: string;
  label_hu: string;
  label_en: string;
  tone?: string;
}

export interface PriceEntry {
  id: string;
  label_hu: string;
  label_en: string;
  days: number;
  priceHUF: number | null;
  /** `null` when this paid plan's price isn't configured on the server (0 for the trial). */
  monthlyHUF: number | null;
}

export interface Vocabulary {
  stages: VocabEntry[];
  lifecycles: VocabEntry[];
  sources: VocabEntry[];
  plans: PriceEntry[];
}

export interface EngagementSignal {
  type: string;
  count: number;
  points: number;
  label_hu: string;
  label_en: string;
}

export interface EngagementBand {
  key: "high" | "medium" | "low" | "none";
  label_hu: string;
  label_en: string;
}

export interface Engagement {
  score: number;
  signals: EngagementSignal[];
  lastActiveAt: string | null;
  daysSinceActive: number | null;
  window: number;
  band: EngagementBand;
}

export interface CrmNote {
  id: string;
  at: string;
  by: string | null;
  kind: NoteKind;
  body: string;
}

export interface CrmTask {
  id: string;
  at: string;
  by: string | null;
  title: string;
  dueAt: string | null;
  doneAt: string | null;
  doneBy: string | null;
}

/** An open task on the board's to-do list, tagged with whose it is. */
export interface OpenTask extends CrmTask {
  subjectId: string;
  subjectKind: "account" | "lead" | "unknown";
  company: string | null;
  username: string | null;
}

export interface ContactSubscription {
  status: string;
  plan: string | null;
  active: boolean;
  validUntil: string | null;
  daysLeft: number | null;
  grantedBy?: string | null;
  grantedAt?: string | null;
  note?: string | null;
}

/** An account or a captured lead, in the one shape the board renders. */
export interface CrmContact {
  id: string;
  kind: ContactKind;
  username: string | null;
  email: string | null;
  company: string | null;
  contactName?: string | null;
  phone?: string | null;
  role: string;
  disabled: boolean;
  createdAt: string;
  lastLoginAt: string | null;

  lifecycle: Lifecycle;
  stage: string;
  stageSetBy: string | null;
  stageSetAt: string | null;
  daysInStage: number | null;

  owner: string | null;
  tags: string[];
  source: string;
  lostReason: string | null;

  subscription: ContactSubscription;
  /** `null` for an active paid subscription whose plan price isn't configured; a trial is 0. */
  monthlyValueHuf: number | null;

  engagement: Engagement;
  /** Leads only: the readiness score they arrived with. */
  readiness?: number | null;
  /** The profile summary that travels with the contact (an account's saved one, or what a lead's assessment produced). */
  profile?: Partial<CompanyProfile> | null;
  profileVersions: number;
  hasProfile: boolean;
  convertedUserId?: string | null;

  notes: number;
  openTasks: number;
  nextTask: CrmTask | null;
  overdueTasks: number;
}

export interface PortfolioMetrics {
  contacts: number;
  accounts: number;
  leads: number;
  subscribers: number;
  trials: number;
  expired: number;
  registered: number;
  /** Revenue figures are `null` — unknown, not zero — while plan prices aren't configured on the server. */
  mrrHuf: number | null;
  arrHuf: number | null;
  arpaHuf: number | null;
  pipelineValueHuf: number | null;
  openDeals: number;
  byStage: Record<string, number>;
  byPlan: Record<string, { count: number; monthlyHuf: number | null }>;
  bySource: Record<string, number>;
  trialStarted: number;
  trialConverted: number;
  trialConversionPct: number | null;
  lapsed30d: number;
  churnPct: number | null;
  engagedAccounts: number;
  warmUnsubscribed: {
    id: string;
    company: string | null;
    username: string | null;
    lifecycle: Lifecycle;
    score: number;
    daysSinceActive: number | null;
  }[];
}

export interface TrendBucket {
  key: string;
  year: number;
  month: number;
  signups: number;
  leads: number;
  won: number;
}

/** Response of `GET /api/admin/crm`. */
export interface CrmBoardResponse {
  vocabulary: Vocabulary;
  metrics: PortfolioMetrics;
  trend: TrendBucket[];
  board: Record<string, CrmContact[]>;
  tasks: OpenTask[];
  engagementWindowDays: number;
  generatedAt: string;
}

export interface TimelineEntry {
  at: string;
  kind: "activity" | "subscription" | "profile" | "note" | "task";
  type: string;
  detail: Record<string, unknown>;
}

export interface SavedCall {
  id: string;
  title: string | null;
  program: string | null;
  deadline: string | null;
}

/** Response of `GET /api/admin/crm/contact?id=`. */
export interface ContactDetail {
  contact: CrmContact;
  /** The account's full profile, or the summary a lead's assessment produced. */
  profile: Partial<CompanyProfile> | null;
  notes: CrmNote[];
  tasks: CrmTask[];
  versions: ProfileVersionEntry[];
  subscriptions: SubscriptionLogEntry[];
  timeline: TimelineEntry[];
  savedCalls: SavedCall[];
  plans: Plan[];
  vocabulary: Vocabulary;
}

export interface ContactPatch {
  id: string;
  stage?: string;
  lostReason?: string;
  owner?: string;
  tags?: string[];
}

export interface NotePayload {
  id: string;
  text: string;
  kind: NoteKind;
}

export interface TaskPayload {
  id: string;
  title: string;
  /** `YYYY-MM-DD` from a date input, or omitted for an undated task. */
  dueAt?: string;
}

export type { ProfileVersionChange };

/** Response of `GET /api/admin/crm/contacts`. */
export interface ContactsResponse {
  total: number;
  page: number;
  pageSize: number;
  contacts: CrmContact[];
  vocabulary: Vocabulary;
}

/** Response of `GET /api/admin/crm/leads`. */
export interface LeadsResponse {
  leads: CrmContact[];
  vocabulary: Pick<Vocabulary, "stages" | "sources">;
}
