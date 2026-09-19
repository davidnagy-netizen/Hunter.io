import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router";
import { parseContactsParams, toContactsParams, type ContactsState } from "../domain/contactsState";

/** The contacts list's filters, sort and page, kept in the URL: linkable, reload-proof, and the back button steps through them. */
export function useContactsState() {
  const [params, setParams] = useSearchParams();
  const state = useMemo(() => parseContactsParams(params), [params]);
  const update = useCallback((next: ContactsState) => setParams(toContactsParams(next)), [setParams]);
  return { state, update };
}
