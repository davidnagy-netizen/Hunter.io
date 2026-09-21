import { httpClient } from "@/shared/api/httpClient";
import type { Taxpayer } from "../types/auth.types";

export const taxpayerApi = {
  /**
   * `POST /api/nav/taxpayer`: the official name and seat for a tax number, to
   * be confirmed read-only during registration. Public and on-demand — call
   * it only for the company of the person registering, never in bulk.
   */
  lookup: (taxNumber: string) =>
    httpClient.post<{ success: true; taxpayer: Taxpayer }>("/nav/taxpayer", { tax_number: taxNumber }).then((res) => res.data.taxpayer),
};
