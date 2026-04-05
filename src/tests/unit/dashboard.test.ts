import { describe, expect, it } from "vitest";
import { buildDashboardMetrics } from "@/lib/dashboard";
import { mockCalibracoes, mockCrmCards, mockEquipamentos, mockReviewRequests } from "@/lib/mockData";

describe("dashboard metrics", () => {
  it("counts only active equipment in KPI totals and tracks active vencidos", () => {
    const metrics = buildDashboardMetrics(mockEquipamentos, "todos", true, {
      calibracoes: mockCalibracoes,
      crmCards: mockCrmCards,
      reviewRequests: mockReviewRequests,
    });
    expect(metrics.equipamentosAtivos).toBe(2);
    expect(metrics.equipamentosVencidos).toBe(0);
  });
});
