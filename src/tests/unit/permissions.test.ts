import { describe, expect, it } from "vitest";
import { getDefaultRoute, getPermissions } from "@/lib/permissions";

describe("permissions", () => {
  it("gives admin access to restricted areas", () => {
    const permissions = getPermissions("admin");
    expect(permissions.canManageUsers).toBe(true);
    expect(permissions.canViewLogs).toBe(true);
  });

  it("routes field users to equipamentos", () => {
    expect(getDefaultRoute("usuario")).toBe("/equipamentos");
  });
});

