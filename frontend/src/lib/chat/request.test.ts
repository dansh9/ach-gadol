import { describe, it, expect } from "vitest";
import { buildSendBody } from "./request";

describe("buildSendBody", () => {
  it("omits reset on a normal message", () => {
    const body = buildSendBody({ message: "שלום", locale: "he" });
    expect(body).toEqual({
      message: "שלום",
      language: "he",
      channel: "website",
    });
    expect("reset" in body).toBe(false);
  });

  it("sets reset only when asked", () => {
    expect(buildSendBody({ message: "hi", locale: "en", reset: true }).reset)
      .toBe(true);
    expect(buildSendBody({ message: "hi", locale: "en", reset: false }).reset)
      .toBeUndefined();
  });

  it("never sends a session id, which the server ignores anyway", () => {
    const body = buildSendBody({ message: "hi", locale: "en", reset: true });
    expect(Object.keys(body).sort()).toEqual([
      "channel",
      "language",
      "message",
      "reset",
    ]);
  });

  it("trims the message", () => {
    expect(buildSendBody({ message: "  hi  ", locale: "en" }).message)
      .toBe("hi");
  });
});
