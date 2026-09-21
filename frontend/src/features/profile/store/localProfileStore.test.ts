import { afterEach, describe, expect, it } from "vitest";
import { useLocalProfileStore } from "./localProfileStore";
import { DEMO_PROFILE } from "../data/demoProfile";

afterEach(() => {
  useLocalProfileStore.getState().clear();
});

describe("useLocalProfileStore", () => {
  it("starts with no profile", () => {
    expect(useLocalProfileStore.getState().profile).toBeNull();
  });

  it("stores a profile set on it", () => {
    useLocalProfileStore.getState().setProfile(DEMO_PROFILE);
    expect(useLocalProfileStore.getState().profile).toEqual(DEMO_PROFILE);
  });

  it("clears back to null", () => {
    useLocalProfileStore.getState().setProfile(DEMO_PROFILE);
    useLocalProfileStore.getState().clear();
    expect(useLocalProfileStore.getState().profile).toBeNull();
  });
});
