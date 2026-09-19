import { isAxiosError } from "axios";

/**
 * The server always answers an error with `{ error: string, code?: string }`
 * — `error` is a Hungarian-language message meant as a fallback, `code` is a
 * stable identifier the UI can translate (see `shared/i18n/locales/*\/errors.json`,
 * keyed by these same codes — `t(\`errors:${code}\`)`). When `code` is absent
 * or unrecognized, callers fall back to `message`.
 */
export interface ApiError {
  status: number | null;
  code: string | null;
  message: string;
}

interface ServerErrorBody {
  error?: string;
  code?: string;
}

export function toApiError(error: unknown): ApiError {
  if (isAxiosError<ServerErrorBody>(error)) {
    const body = error.response?.data;
    return {
      status: error.response?.status ?? null,
      code: body?.code ?? null,
      message: body?.error ?? error.message,
    };
  }
  if (error instanceof Error) {
    return { status: null, code: null, message: error.message };
  }
  return { status: null, code: null, message: String(error) };
}
