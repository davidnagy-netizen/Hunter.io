import { beforeEach, describe, expect, it } from "vitest";
import { useDocChecksStore } from "./docChecksStore";

beforeEach(() => useDocChecksStore.setState({ checks: {} }));

describe("useDocChecksStore", () => {
  it("ticks and unticks a document", () => {
    const { toggle } = useDocChecksStore.getState();
    toggle("c1::Part A");
    expect(useDocChecksStore.getState().checks["c1::Part A"]).toBe(true);
    toggle("c1::Part A");
    expect(useDocChecksStore.getState().checks["c1::Part A"]).toBeUndefined();
  });

  it("stores only ticked documents, and keeps others independent", () => {
    const { toggle } = useDocChecksStore.getState();
    toggle("c1::A");
    toggle("c1::B");
    toggle("c1::A");
    expect(Object.keys(useDocChecksStore.getState().checks)).toEqual(["c1::B"]);
  });
});
