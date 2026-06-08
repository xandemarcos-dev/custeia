import { describe, it, expect } from "vitest";
import { isEmailAllowed } from "./allowlist";

describe("isEmailAllowed", () => {
  const env = "alexandre.marcos60@gmail.com,daygruberdoces@gmail.com";

  it("aceita e-mail da lista", () => {
    expect(isEmailAllowed("daygruberdoces@gmail.com", env)).toBe(true);
  });

  it("é case-insensitive e ignora espaços", () => {
    expect(isEmailAllowed("  DAYGRUBERDOCES@GMAIL.COM ", env)).toBe(true);
  });

  it("rejeita e-mail fora da lista", () => {
    expect(isEmailAllowed("intruso@gmail.com", env)).toBe(false);
  });

  it("fail-safe: env vazio bloqueia todos", () => {
    expect(isEmailAllowed("daygruberdoces@gmail.com", "")).toBe(false);
    expect(isEmailAllowed("daygruberdoces@gmail.com", undefined)).toBe(false);
  });

  it("rejeita e-mail vazio/nulo", () => {
    expect(isEmailAllowed("", env)).toBe(false);
    expect(isEmailAllowed(undefined, env)).toBe(false);
  });
});
