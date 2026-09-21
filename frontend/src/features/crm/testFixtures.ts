import { PLANS } from "@/features/admin/testFixtures";
import type { ContactDetail, CrmBoardResponse, CrmContact, PortfolioMetrics, Vocabulary } from "./types/crm.types";

export const VOCABULARY: Vocabulary = {
  stages: [
    { id: "new", label_hu: "Új", label_en: "New" },
    { id: "contacted", label_hu: "Megkeresve", label_en: "Contacted" },
    { id: "won", label_hu: "Megnyert", label_en: "Won" },
    { id: "lost", label_hu: "Elveszett", label_en: "Lost" },
  ],
  lifecycles: [
    { id: "lead", label_hu: "Érdeklődő", label_en: "Lead" },
    { id: "registered", label_hu: "Regisztrált", label_en: "Registered" },
    { id: "trial", label_hu: "Próbaidő", label_en: "Trial" },
    { id: "subscriber", label_hu: "Előfizető", label_en: "Subscriber" },
    { id: "expired", label_hu: "Lejárt", label_en: "Lapsed" },
  ],
  sources: [
    { id: "assessment", label_hu: "Ingyenes felmérés", label_en: "Free assessment" },
    { id: "signup", label_hu: "Önálló regisztráció", label_en: "Self sign-up" },
  ],
  plans: [{ id: "monthly", label_hu: "Havi előfizetés", label_en: "Monthly subscription", days: 30, priceHUF: 5990, monthlyHUF: 5990 }],
};

export function makeContact(overrides: Partial<CrmContact> = {}): CrmContact {
  return {
    id: "u1",
    kind: "account",
    username: "kata",
    email: "kata@example.com",
    company: "Kata Kft.",
    role: "user",
    disabled: false,
    createdAt: "2026-09-01T08:00:00.000Z",
    lastLoginAt: null,
    lifecycle: "registered",
    stage: "new",
    stageSetBy: null,
    stageSetAt: null,
    daysInStage: 19,
    owner: null,
    tags: [],
    source: "signup",
    lostReason: null,
    subscription: { status: "none", plan: null, active: false, validUntil: null, daysLeft: null },
    monthlyValueHuf: 0,
    engagement: { score: 42, signals: [], lastActiveAt: null, daysSinceActive: null, window: 30, band: { key: "medium", label_hu: "Mérsékelt", label_en: "Moderate" } },
    profileVersions: 0,
    hasProfile: false,
    notes: 0,
    openTasks: 0,
    nextTask: null,
    overdueTasks: 0,
    ...overrides,
  };
}

export function makeLead(overrides: Partial<CrmContact> = {}): CrmContact {
  return makeContact({
    id: "l1",
    kind: "lead",
    username: null,
    email: "lead@example.com",
    company: "Lead Bt.",
    contactName: "Lili",
    lifecycle: "lead",
    source: "assessment",
    readiness: 88,
    ...overrides,
  });
}

const METRICS: PortfolioMetrics = {
  contacts: 3, accounts: 2, leads: 1, subscribers: 1, trials: 1, expired: 0, registered: 0,
  mrrHuf: 5990, arrHuf: 71880, arpaHuf: 5990, pipelineValueHuf: 11980, openDeals: 2,
  byStage: {}, byPlan: {}, bySource: {},
  trialStarted: 2, trialConverted: 1, trialConversionPct: 50,
  lapsed30d: 0, churnPct: null, engagedAccounts: 1, warmUnsubscribed: [],
};

export function makeBoard(overrides: Partial<CrmBoardResponse> = {}): CrmBoardResponse {
  return {
    vocabulary: VOCABULARY,
    metrics: METRICS,
    trend: [],
    board: { new: [makeContact()], contacted: [], won: [], lost: [] },
    tasks: [],
    engagementWindowDays: 30,
    generatedAt: "2026-09-20T10:00:00.000Z",
    ...overrides,
  };
}

export function makeDetail(overrides: Partial<ContactDetail> = {}): ContactDetail {
  return {
    contact: makeContact(),
    profile: null,
    notes: [],
    tasks: [],
    versions: [],
    subscriptions: [],
    timeline: [],
    savedCalls: [],
    plans: PLANS,
    vocabulary: VOCABULARY,
    ...overrides,
  };
}

export { METRICS };

import type { ContactsResponse, LeadsResponse } from "./types/crm.types";

export function makeContactsResponse(overrides: Partial<ContactsResponse> = {}): ContactsResponse {
  const contacts = overrides.contacts ?? [makeContact()];
  return { total: contacts.length, page: 1, pageSize: 25, contacts, vocabulary: VOCABULARY, ...overrides };
}

export function makeLeadsResponse(leads = [makeLead()]): LeadsResponse {
  return { leads, vocabulary: { stages: VOCABULARY.stages, sources: VOCABULARY.sources } };
}
