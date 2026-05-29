import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { territoryFilterMatches } from "./territory-match.ts";

describe("territoryFilterMatches", () => {
  it("aceita match por label ou normalizado", () => {
    assert.equal(
      territoryFilterMatches("Centro", "Centro", "centro"),
      true,
    );
    assert.equal(
      territoryFilterMatches("centro", "Centro Histórico", "centro"),
      true,
    );
  });

  it("ignora filtro all ou vazio", () => {
    assert.equal(territoryFilterMatches("all", "X", null), true);
    assert.equal(territoryFilterMatches(null, "X", null), true);
  });
});
