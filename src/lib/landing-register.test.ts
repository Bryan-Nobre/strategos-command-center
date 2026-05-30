import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildLandingSuccessMessage, parseLandingRegisterResult } from "./landing-register.ts";

describe("parseLandingRegisterResult", () => {
  it("parses jsonb payload", () => {
    const result = parseLandingRegisterResult({
      supporter_id: "abc",
      merged: true,
      supporter_name: "Bryan",
      primary_leadership_name: "Paulo",
    });
    assert.equal(result.supporter_id, "abc");
    assert.equal(result.merged, true);
    assert.equal(result.primary_leadership_name, "Paulo");
  });

  it("accepts legacy uuid string", () => {
    const result = parseLandingRegisterResult("abc-123");
    assert.equal(result.supporter_id, "abc-123");
    assert.equal(result.merged, false);
  });
});

describe("buildLandingSuccessMessage", () => {
  it("describes merge with leadership", () => {
    const msg = buildLandingSuccessMessage({
      supporter_id: "x",
      merged: true,
      supporter_name: "Bryan",
      primary_leadership_name: "Paulo",
    });
    assert.match(msg, /atualizado em Bryan/);
    assert.match(msg, /Liderança primária: Paulo/);
  });

  it("describes new signup with leadership", () => {
    const msg = buildLandingSuccessMessage({
      supporter_id: "x",
      merged: false,
      supporter_name: "Maria",
      primary_leadership_name: "Paulo",
    });
    assert.match(msg, /Maria entrou na aba Eleitores/);
    assert.match(msg, /Vínculo com Paulo/);
  });
});
