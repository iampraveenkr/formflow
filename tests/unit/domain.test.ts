import { describe, expect, it } from "vitest";
import { DEFAULT_WORKFLOW_STATUS } from "../../src/types/domain";

describe("domain defaults", () => {
  it("defaults workflow status to draft", () => {
    expect(DEFAULT_WORKFLOW_STATUS).toBe("draft");
  });
});
