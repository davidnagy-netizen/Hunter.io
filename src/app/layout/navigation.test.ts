import { describe, expect, it } from "vitest";
import { ADMIN_NAV, APP_NAV } from "./navigation";

describe("workspace navigation", () => {
  it("puts the CRM second in the admin console, between the overview and the account screens", () => {
    expect(ADMIN_NAV.map((item) => item.to)).toEqual(["/admin", "/admin/crm", "/admin/users", "/admin/system"]);
  });

  it("puts Fundor Plus last in the client workspace, with its access badge", () => {
    const last = APP_NAV.at(-1)!;
    expect(last.to).toBe("/app/plus");
    expect(last.badge).toBeDefined();
  });

  it("keeps the client workspace free of admin entries", () => {
    expect(APP_NAV.some((item) => item.to.startsWith("/admin"))).toBe(false);
  });
});
