import { describe, expect, it } from "vitest";
import { buildDashboardMetrics } from "@/lib/dashboard";
import { mockCalibracoes, mockCrmCards, mockEquipamentos, mockReviewRequests } from "@/lib/mockData";

describe("dashboard metrics", () => {
  it("counts total registered equipment in KPI totals and tracks active vencidos", () => {
    const metrics = buildDashboardMetrics(mockEquipamentos, "todos", true, {
      calibracoes: mockCalibracoes,
      crmCards: mockCrmCards,
      reviewRequests: mockReviewRequests,
    });
    expect(metrics.equipamentosAtivos).toBe(mockEquipamentos.length);
    expect(metrics.equipamentosVencidos).toBe(0);
  });
});
