import { describe, expect, it } from "vitest";
import { getEquipamentoStatus } from "@/lib/statusUtils";

describe("statusUtils", () => {
  it("returns agendado when there is a future pending calibration", () => {
    const status = getEquipamentoStatus(new Date(Date.now() + 15 * 86400000).toISOString(), [
      {
        id: "1",
        equipamento_id: "eq",
        data_calibracao: new Date(Date.now() + 5 * 86400000).toISOString(),
        realizado: false,
        created_at: new Date().toISOString(),
      },
    ]);

    expect(status).toBe("agendado");
  });

  it("returns vencido when due date is in the past", () => {
    const status = getEquipamentoStatus(new Date(Date.now() - 2 * 86400000).toISOString(), []);
    expect(status).toBe("vencido");
  });
});

