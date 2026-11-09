import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import en from "../messages/en.json";
import { ChangePasswordForm } from "@/features/auth/components/change-password-form";

const push = vi.fn();
const refresh = vi.fn();
const apiFetch = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
}));

vi.mock("@/lib/api-client", () => ({
  apiFetch: (...args: unknown[]) => apiFetch(...args),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe("change password", () => {
  beforeEach(() => {
    push.mockReset();
    refresh.mockReset();
    apiFetch.mockReset();
  });

  it("returns to login after the server accepts the new password", async () => {
    apiFetch.mockResolvedValue(undefined);
    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <ChangePasswordForm />
      </NextIntlClientProvider>,
    );
    const input = screen.getByLabelText(en.auth.passwordLabel);
    fireEvent.input(input, { target: { value: "new-password-value" } });
    fireEvent.change(input, { target: { value: "new-password-value" } });
    const form = input.closest("form");
    if (!form) throw new Error("The password form is missing.");
    fireEvent.submit(form);
    await waitFor(() => expect(push).toHaveBeenCalledWith("/login"));
    expect(apiFetch).toHaveBeenCalledWith("/api/v1/auth/password", {
      method: "POST",
      body: { password: "new-password-value" },
    });
    expect(refresh).toHaveBeenCalled();
  });
});
