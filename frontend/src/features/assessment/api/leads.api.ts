import { httpClient } from "@/shared/api/httpClient";
import type { CompanyProfile } from "@/shared/types/profile.types";
import type { AssessmentAnswers } from "../domain/questions";

export interface LeadPayload {
  email: string;
  company?: string;
  contactName?: string;
  /** The server refuses a lead without explicit consent. */
  consent: true;
  readiness: number;
  answers: AssessmentAnswers;
  profile: CompanyProfile;
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
