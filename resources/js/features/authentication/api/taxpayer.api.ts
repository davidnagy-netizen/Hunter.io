import { httpClient } from "@/api/httpClient";
import type { Taxpayer } from "../types/auth.types";

/** NAV wire contract; absent headquarters and short names remain explicit. */
interface TaxpayerResponse {
  data: {
    tax_number: string;
    company_name: string;
    short_name: string | null;
    registered_seat_address: { postal_code: string | null; city: string | null; street: string | null; public_place_category: string | null; house_number: string | null } | null;
  };
  verification_receipt: string;
  expires_at: string;
}

export const taxpayerApi = {
  lookup: async (taxNumber: string): Promise<Taxpayer> => {
    const { data: response } = await httpClient.post<TaxpayerResponse>("/v1/taxpayer/lookup", { tax_number: taxNumber });
    const data = response.data;
    const address = data.registered_seat_address;
    const street = [address?.street, address?.public_place_category, address?.house_number].filter(Boolean).join(" ");
    return { taxNumber: data.tax_number, companyName: data.company_name, shortName: data.short_name ?? data.company_name,
      postalCode: address?.postal_code ?? null, city: address?.city ?? null, streetAddress: street || null,
      fullAddress: [address?.postal_code, address?.city, street].filter(Boolean).join(" "),
      status: "VALID", incorporationDate: null, verificationReceipt: response.verification_receipt, expiresAt: response.expires_at };
  },
};