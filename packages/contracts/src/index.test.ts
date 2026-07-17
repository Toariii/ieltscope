import { describe, expect, it } from "vitest";

import { contractsVersion } from "./index.js";

describe("contracts package", () => {
  it("exposes a stable version", () => {
    expect(contractsVersion).toBe("0.1.0");
  });
});
