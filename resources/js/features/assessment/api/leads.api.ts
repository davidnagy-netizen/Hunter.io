import { httpClient } from "@/api/httpClient";
import type { CompanyProfile } from "@/features/profile/types/profile.types";
import type { AssessmentAnswers } from "../domain/questions";

export interface LeadPayload {
  email: string;
  company?: string;
  contactName?: string;
  phone?: string;
  note?: string;
  /** The server refuses a lead without explicit consent. */
  consent: true;
  /** Sent by the assessment; a plain contact request (`ConsultForm`) has none of these. */
  readiness?: number;
  answers?: AssessmentAnswers;
  profile?: CompanyProfile;
}

export const leadsApi = {
  /**
   * `POST /api/leads`. No `matchIds` are sent: the server derives the lead's
   * top matches from `profile` itself when none are supplied, and an anonymous
   * browser holds no catalog to compute them from anyway.
   */
  submit: (payload: LeadPayload) =>
    httpClient.post<{ success: true; id: string; updated: boolean }>("/leads", payload).then((res) => res.data),
};
