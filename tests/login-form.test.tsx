import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import en from "../messages/en.json";
import { LoginForm } from "@/features/auth/components/login-form";
import { ApiError } from "@/lib/api-error";

const push = vi.fn();
const refresh = vi.fn();
const apiFetch = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/lib/api-client", () => ({
  apiFetch: (...args: unknown[]) => apiFetch(...args),
}));

function renderForm() {
  render(
    <NextIntlClientProvider locale="en" messages={en}>
      <LoginForm />
    </NextIntlClientProvider>,
  );
}

describe("login form", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    push.mockReset();
    refresh.mockReset();
    apiFetch.mockReset();
  });

  it("blocks an empty form before calling the API", async () => {
    renderForm();
    fireEvent.submit(screen.getByRole("button", { name: en.auth.signIn }).closest("form")!);
    await waitFor(() => expect(screen.getByText(en.auth.emailInvalid)).toBeInTheDocument());
    expect(apiFetch).not.toHaveBeenCalled();
  });

  it("signs in and opens the institution dashboard", async () => {
    apiFetch.mockResolvedValueOnce({ mfaRequired: false }).mockResolvedValueOnce({
      id: "user-1",
      email: "admin@school.test",
      displayName: "Admin",
      roles: ["SITE_ADMIN"],
      permissions: [],
      mustChangePassword: false,
    });
    renderForm();
    fireEvent.change(screen.getByLabelText(en.auth.emailLabel), { target: { value: "admin@school.test" } });
    fireEvent.change(screen.getByLabelText(en.auth.passwordLabel), { target: { value: "correct-password" } });
    fireEvent.click(screen.getByRole("button", { name: en.auth.signIn }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/admin"));
    expect(apiFetch).toHaveBeenNthCalledWith(1, "/api/v1/auth/login", {
      method: "POST",
      body: { email: "admin@school.test", password: "correct-password" },
    });
  });

  it("shows the generic rejection and keeps the password toggle available", async () => {
    apiFetch.mockRejectedValue(new ApiError({ status: 401, kind: "unauthorized", messages: ["Invalid email or password."] }));
    renderForm();
    fireEvent.change(screen.getByLabelText(en.auth.emailLabel), { target: { value: "missing@school.test" } });
    fireEvent.change(screen.getByLabelText(en.auth.passwordLabel), { target: { value: "wrong-password" } });
    fireEvent.click(screen.getByRole("button", { name: en.auth.showPassword }));
    expect(screen.getByLabelText(en.auth.passwordLabel)).toHaveAttribute("type", "text");
    fireEvent.click(screen.getByRole("button", { name: en.auth.signIn }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(en.auth.rejected));
    expect(screen.queryByText("Account not found")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: en.auth.registerLink })).toHaveAttribute("href", "/register");
  });

  it("reports MFA as unavailable instead of a failed password", async () => {
    apiFetch.mockResolvedValue({ mfaRequired: true });
    renderForm();
    fireEvent.change(screen.getByLabelText(en.auth.emailLabel), { target: { value: "admin@school.test" } });
    fireEvent.change(screen.getByLabelText(en.auth.passwordLabel), { target: { value: "correct-password" } });
    fireEvent.click(screen.getByRole("button", { name: en.auth.signIn }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(en.auth.mfaUnavailable));
    expect(push).not.toHaveBeenCalled();
  });
});
