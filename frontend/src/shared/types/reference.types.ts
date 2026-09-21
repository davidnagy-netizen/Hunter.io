/** Reference vocabularies served by `GET /api/meta` — see `src/data/referenceData.js` / `src/data/programmes.js`. */

export interface Region {
  code: string;
  name: string;
  counties: string[];
}

export interface Industry {
  id: string;
  label: string;
  teaor: string;
}

export interface Goal {
  id: string;
  label: string;
  label_en: string;
}

export interface OrgType {
  id: string;
  label_hu: string;
  label_en: string;
}

export interface OptionalProfileFieldOption {
  t_hu: string;
  t_en: string;
  v: boolean;
}

/** A field the engine can ask about inline when it's the only unknown blocking a verdict. */
export interface OptionalProfileField {
  field: string;
  weight: number;
  q_hu: string;
  q_en: string;
  opts: OptionalProfileFieldOption[];
}

export interface MetaResponse {
  /** Catalog build info; absent until a catalog has been built. */
  catalog: { counts?: { total: number }; eurHuf?: number } | null;
  reference: {
    regions: Region[];
    industries: Industry[];
    goals: Goal[];
    revBands: string[];
    orgTypes: OrgType[];
  };
  labels: {
    programmes: Record<string, string>;
    actions: Record<string, string>;
  };
  optionalProfileFields: OptionalProfileField[];
  today: string;
}
