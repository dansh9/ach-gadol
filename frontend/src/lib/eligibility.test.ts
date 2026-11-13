import { describe, it, expect } from "vitest";
import {
  calculateEligibility,
  totalMonthly,
  type EligibilityAnswers,
  type EligibleRight,
} from "./eligibility";

const inService: EligibilityAnswers = {
  soldierType: "lone_classic",
  serviceStatus: "in_service",
  isCombat: true,
  isImmigrant: false,
  parentsAbroad: false,
};

/** The pre-fix behaviour: add up every monthly amount. */
function naiveSum(rights: EligibleRight[]): number {
  return rights.reduce((sum, r) => sum + (r.monthlyAmount ?? 0), 0);
}

describe("totalMonthly", () => {
  it("counts an exclusive group once, taking the higher amount", () => {
    const rights: EligibleRight[] = [
      { ...stub("a"), monthlyAmount: 1807, exclusiveGroup: "g" },
      { ...stub("b"), monthlyAmount: 362, exclusiveGroup: "g" },
      { ...stub("c"), monthlyAmount: 100 },
    ];
    expect(totalMonthly(rights)).toBe(1907);
  });

  it("matches a plain sum when nothing is exclusive", () => {
    const rights: EligibleRight[] = [
      { ...stub("a"), monthlyAmount: 620 },
      { ...stub("b"), monthlyAmount: 150 },
    ];
    expect(totalMonthly(rights)).toBe(naiveSum(rights));
  });

  it("ignores rights with no monthly amount", () => {
    expect(totalMonthly([stub("a"), stub("b")])).toBe(0);
  });

  it("handles an empty list", () => {
    expect(totalMonthly([])).toBe(0);
  });
});

describe("in-service eligibility total", () => {
  const rights = calculateEligibility(inService);

  it("still lists both housing option A and A2", () => {
    const ids = rights.map((r) => r.id);
    expect(ids).toContain("rent_subsidy");
    expect(ids).toContain("maintenance_allowance");
  });

  it("drops the smaller of the two from the total", () => {
    // A (1807) and A2 (362) are alternatives, so the total is 362 lower than
    // the old behaviour of summing every amount.
    expect(totalMonthly(rights)).toBe(naiveSum(rights) - 362);
  });
});

function stub(id: string): EligibleRight {
  return {
    id,
    titleHe: id,
    titleEn: id,
    noteHe: "",
    noteEn: "",
    category: "financial",
  };
}
