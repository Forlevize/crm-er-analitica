import { describe, expect, it } from "vitest";
import { buildDashboardMetrics } from "@/lib/dashboard";
import { mockCalibracoes, mockCrmCards, mockEquipamentos, mockReviewRequests } from "@/lib/mockData";

describe("dashboard metrics", () => {
  it("counts only active equipment in KPI totals", () => {
    const metrics = buildDashboardMetrics(mockEquipamentos, "todos", true, {
      calibracoes: mockCalibracoes,
      crmCards: mockCrmCards,
      reviewRequests: mockReviewRequests,
    });
    expect(metrics.equipamentosAtivos).toBe(2);
    expect(metrics.equipamentosDescontinuados).toBe(1);
  });
});
