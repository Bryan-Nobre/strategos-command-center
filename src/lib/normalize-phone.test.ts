import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatPhoneBrDisplay,
  isValidBrPhone,
  isValidBrPhoneOptional,
  maskPhoneBrInput,
  normalizeSupporterPhone,
  telHref,
} from "./normalize-phone.ts";

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

  it("formata 10 dígitos (fixo)", () => {
    assert.equal(formatPhoneBrDisplay("6133334444"), "(61) 3333-4444");
  });
});

describe("maskPhoneBrInput", () => {
  it("limita a 11 dígitos", () => {
    assert.equal(maskPhoneBrInput("619999999991234"), "(61) 99999-9999");
  });
});

describe("isValidBrPhone", () => {
  it("aceita celular 11 dígitos", () => {
    assert.equal(isValidBrPhone("61999999999"), true);
  });

  it("aceita fixo 10 dígitos", () => {
    assert.equal(isValidBrPhone("1133334444"), true);
  });

  it("rejeita DDD inválido", () => {
    assert.equal(isValidBrPhone("0999999999"), false);
  });

  it("rejeita incompleto", () => {
    assert.equal(isValidBrPhone("61999"), false);
  });
});

describe("isValidBrPhoneOptional", () => {
  it("vazio é válido", () => {
    assert.equal(isValidBrPhoneOptional(""), true);
    assert.equal(isValidBrPhoneOptional(undefined), true);
  });
});

describe("telHref", () => {
  it("gera link internacional BR", () => {
    assert.equal(telHref("61999999999"), "tel:+5561999999999");
  });
});
