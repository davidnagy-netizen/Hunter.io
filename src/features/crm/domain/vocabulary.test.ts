import { describe, expect, it } from "vitest";
import { vocabLabel } from "./vocabulary";

const STAGES = [{ id: "won", label_hu: "Megnyert", label_en: "Won" }];

describe("vocabLabel", () => {
  it("returns the label in the requested language", () => {
    expect(vocabLabel(STAGES, "won", "en")).toBe("Won");
    expect(vocabLabel(STAGES, "won", "hu")).toBe("Megnyert");
  });

  it("shows an unknown id as it is, and a missing one as a dash", () => {
    expect(vocabLabel(STAGES, "gone", "en")).toBe("gone");
    expect(vocabLabel(STAGES, null, "en")).toBe("—");
    expect(vocabLabel(undefined, "won", "en")).toBe("won");
  });
});
