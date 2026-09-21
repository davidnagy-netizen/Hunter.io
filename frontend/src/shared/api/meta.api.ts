import { httpClient } from "./httpClient";
import type { MetaResponse } from "@/shared/types/reference.types";

export const metaApi = {
  get: () => httpClient.get<MetaResponse>("/meta").then((res) => res.data),
};
