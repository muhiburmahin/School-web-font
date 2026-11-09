import { describe, expect, it, vi } from "vitest";
import { applyApiFieldErrors } from "@/components/form/apply-field-errors";
import { ApiError } from "@/lib/api-error";

describe("applyApiFieldErrors", () => {
  it("maps known fields to local messages and ignores other fields", () => {
    const setError = vi.fn();
    const error = new ApiError({
      status: 400,
      kind: "validation",
      messages: ["email: email must be an email", "token: secret-value"],
      fieldErrors: { email: ["email must be an email"], token: ["secret-value"] },
    });
    const applied = applyApiFieldErrors<{ email: string; password: string }>(error, setError, {
      email: "Enter a valid email address.",
      password: "Enter a password.",
    });
    expect(applied).toBe(true);
    expect(setError).toHaveBeenCalledWith("email", { message: "Enter a valid email address." });
    expect(setError).not.toHaveBeenCalledWith("token", expect.anything());
    expect(JSON.stringify(setError.mock.calls)).not.toContain("secret-value");
  });
});
