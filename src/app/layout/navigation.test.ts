import { describe, expect, it } from "vitest";
import { ADMIN_NAV, APP_NAV } from "./navigation";

describe("workspace navigation", () => {
  it("puts the CRM second in the admin console, between the overview and the account screens", () => {
    expect(ADMIN_NAV.map((item) => item.to)).toEqual(["/admin", "/admin/crm", "/admin/users", "/admin/system"]);
  });

  it("keeps the client workspace free of admin entries", () => {
    expect(APP_NAV.some((item) => item.to.startsWith("/admin"))).toBe(false);
  });
});
