import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  parseLandingProposals,
  serializeLandingProposals,
  validateLandingProposals,
} from "./landing-proposals.ts";

describe("parseLandingProposals", () => {
  it("aceita text e legado description", () => {
    assert.deepEqual(
      parseLandingProposals([
        { title: "Saúde", text: "UBS ampliada" },
        { title: "Educação", description: "Merenda" },
      ]),
      [
        { title: "Saúde", text: "UBS ampliada" },
        { title: "Educação", text: "Merenda" },
      ],
    );
  });

  it("ignora entradas vazias", () => {
    assert.deepEqual(parseLandingProposals([{ title: "  ", text: "" }, null]), []);
  });
});

describe("serializeLandingProposals", () => {
  it("remove propostas sem título", () => {
    assert.deepEqual(
      serializeLandingProposals([
        { title: "  Ok  ", text: "  corpo " },
        { title: "", text: "sem título" },
      ]),
      [{ title: "Ok", text: "corpo" }],
    );
  });
});

describe("validateLandingProposals", () => {
  it("exige título quando há descrição", () => {
    assert.match(validateLandingProposals([{ title: "", text: "só texto" }]) ?? "", /título/i);
  });
});
