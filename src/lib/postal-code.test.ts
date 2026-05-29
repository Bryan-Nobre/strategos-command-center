import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatCepMask, isCepCompleteForLookup, normalizeCep } from "./postal-code.ts";

describe("normalizeCep", () => {
  it("extrai 8 dígitos", () => {
    assert.equal(normalizeCep("72000-000"), "72000000");
    assert.equal(normalizeCep("72.000-000"), "72000000");
  });

  it("retorna null para inválido", () => {
    assert.equal(normalizeCep(""), null);
    assert.equal(normalizeCep("123"), null);
    assert.equal(normalizeCep(null), null);
  });
});

describe("formatCepMask", () => {
  it("aplica hífen após 5 dígitos", () => {
    assert.equal(formatCepMask("72000000"), "72000-000");
  });
});

describe("isCepCompleteForLookup", () => {
  it("exige 8 dígitos", () => {
    assert.equal(isCepCompleteForLookup("72000-000"), true);
    assert.equal(isCepCompleteForLookup("7200"), false);
  });
});
