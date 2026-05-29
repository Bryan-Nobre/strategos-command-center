import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolveSupporterGeoBadgeState } from "./supporter-geo.ts";

describe("resolveSupporterGeoBadgeState", () => {
  it("prioriza falha sobre pendente", () => {
    assert.equal(
      resolveSupporterGeoBadgeState({
        cep: "01310100",
        geo_pending: true,
        geo_enrichment_failed: true,
      }),
      "geo_enrichment_failed",
    );
  });

  it("pendente exige CEP", () => {
    assert.equal(
      resolveSupporterGeoBadgeState({ geo_pending: true, cep: null }),
      null,
    );
    assert.equal(
      resolveSupporterGeoBadgeState({ geo_pending: true, cep: "01310100" }),
      "geo_pending",
    );
  });

  it("enriquecido quando geo_enriched_at presente", () => {
    assert.equal(
      resolveSupporterGeoBadgeState({
        geo_enriched_at: "2026-01-01T00:00:00Z",
      }),
      "geo_enriched",
    );
  });
});
