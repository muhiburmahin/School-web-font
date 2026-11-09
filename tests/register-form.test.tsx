import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";
import en from "../messages/en.json";
import { RegisterForm } from "@/features/auth/components/register-form";

const apiFetch = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));
vi.mock("@/lib/api-client", () => ({
  apiFetch: (...args: unknown[]) => apiFetch(...args),
}));

describe("institution registration form", () => {
  afterEach(() => cleanup());

  it("rejects a mismatched password before calling the API", async () => {
    apiFetch.mockReset();
    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <RegisterForm />
      </NextIntlClientProvider>,
    );
    fireEvent.change(screen.getByLabelText(en.auth.nameEn), { target: { value: "North School" } });
    fireEvent.change(screen.getByLabelText(en.auth.nameBn), { target: { value: "উত্তর" } });
    fireEvent.change(screen.getByLabelText(en.auth.siteSlug), { target: { value: "north-school" } });
    fireEvent.change(screen.getByLabelText(en.auth.headName), { target: { value: "Head Teacher" } });
    fireEvent.change(screen.getByLabelText(en.auth.officialEmail), { target: { value: "admin@north.test" } });
    fireEvent.change(screen.getByLabelText(en.auth.officialPhone), { target: { value: "01712345678" } });
    fireEvent.change(screen.getByLabelText(en.auth.upazila), { target: { value: "Savar" } });
    fireEvent.change(screen.getByLabelText(en.auth.addressEn), { target: { value: "12 Main Road, Savar" } });
    fireEvent.change(screen.getByLabelText(en.auth.passwordLabel), { target: { value: "long-enough-password" } });
    fireEvent.change(screen.getByLabelText(en.auth.passwordConfirm), { target: { value: "different-password" } });
    fireEvent.click(screen.getByLabelText(en.auth.acceptTerms));
    fireEvent.click(screen.getByRole("button", { name: en.auth.registerAction }));
    await waitFor(() => expect(screen.getByText(en.auth.checkFields)).toBeInTheDocument());
    // The form refuses to submit: the only API calls are the reference-data loads, never a registration.
    expect(apiFetch.mock.calls.some(([path]) => path === "/api/v1/auth/register")).toBe(false);
  });
});
