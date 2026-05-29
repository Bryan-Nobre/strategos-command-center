import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatPhoneBrDisplay, normalizeSupporterPhone } from "./normalize-phone.ts";

describe("normalizeSupporterPhone", () => {
  it("remove formatação BR", () => {
    assert.equal(normalizeSupporterPhone("(61) 99999-9999"), "61999999999");
    assert.equal(normalizeSupporterPhone("+55 61 99999-9999"), "61999999999");
  });

  it("retorna null para vazio", () => {
    assert.equal(normalizeSupporterPhone(""), null);
  });
});

describe("formatPhoneBrDisplay", () => {
  it("formata 11 dígitos para exibição", () => {
    assert.equal(formatPhoneBrDisplay("61999999999"), "(61) 99999-9999");
  });
});
