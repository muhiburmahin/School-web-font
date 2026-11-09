import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import en from "../messages/en.json";
import { ApiError } from "@/lib/api-error";
import { InstitutionManager } from "@/features/platform/components/institution-manager";
import { toast } from "sonner";

const fetchInstitutions = vi.fn();
const createInstitution = vi.fn();

vi.mock("@/features/platform/api", () => ({
  fetchInstitutions: (...args: unknown[]) => fetchInstitutions(...args),
  createInstitution: (...args: unknown[]) => createInstitution(...args),
  updateInstitution: vi.fn(),
  suspendInstitution: vi.fn(),
  reactivateInstitution: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

function renderManager() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      <QueryClientProvider client={client}>
        <InstitutionManager />
      </QueryClientProvider>
    </NextIntlClientProvider>,
  );
}

function fill(label: string, value: string) {
  const input = screen.getByLabelText(label);
  fireEvent.input(input, { target: { value } });
  fireEvent.change(input, { target: { value } });
}

async function openCreateForm() {
  renderManager();
  fireEvent.click(await screen.findByRole("button", { name: en.platform.create }));
  expect(await screen.findByLabelText(en.platform.siteSlug)).toBeTruthy();
}

function fillCreateForm(siteSlug: string) {
  fill(en.platform.nameEn, "New");
  fill(en.platform.nameBn, "নতুন");
  fill(en.platform.siteSlug, siteSlug);
  fill(en.platform.email, "admin@school.test");
  fill(en.platform.displayName, "Admin");
}

function submitCreateForm() {
  const form = screen.getByRole("dialog").querySelector("form");
  if (!form) throw new Error("The onboarding form is not open.");
  fireEvent.submit(form);
}

describe("institution onboarding form", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    fetchInstitutions.mockReset();
    createInstitution.mockReset();
    vi.mocked(toast.error).mockReset();
    fetchInstitutions.mockResolvedValue({ items: [], nextCursor: null });
  });

  it("blocks an invalid slug before calling the API", async () => {
    await openCreateForm();
    fillCreateForm("admin");
    expect((screen.getByLabelText(en.platform.siteSlug) as HTMLInputElement).value).toBe("admin");
    expect(screen.getByRole("button", { name: en.platform.save })).toHaveAttribute("type", "submit");
    submitCreateForm();
    expect(await screen.findByText(en.platform.siteSlugInvalid)).toBeTruthy();
    expect(createInstitution).not.toHaveBeenCalled();
  });

  it("submits the exact slug and shows a safe conflict message", async () => {
    createInstitution.mockRejectedValue(new ApiError({ status: 409, kind: "conflict", messages: ["raw-server-text"] }));
    await openCreateForm();
    fillCreateForm("new-school");
    submitCreateForm();
    await waitFor(() => expect(createInstitution).toHaveBeenCalledTimes(1));
    const submitted = createInstitution.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(submitted).toMatchObject({
      nameBn: "নতুন",
      nameEn: "New",
      siteSlug: "new-school",
      adminEmail: "admin@school.test",
      adminDisplayName: "Admin",
    });
    expect(submitted).not.toHaveProperty("role");
    expect(toast.error).toHaveBeenCalledWith(en.platform.conflict);
    expect(screen.queryByText("raw-server-text")).toBeNull();
  });

  it("shows the temporary password once after the server accepts the institution", async () => {
    createInstitution.mockResolvedValue({
      id: "22222222-2222-4222-8222-222222222222",
      siteSlug: "new-school",
      status: "ACTIVE",
      createdAt: "2026-10-22T00:00:00.000Z",
      nameBn: "নতুন",
      nameEn: "New",
      level: null,
      domains: [],
      admins: [],
      admin: {
        id: "55555555-5555-4555-8555-555555555555",
        email: "admin@school.test",
        displayName: "Admin",
        temporaryPassword: "temporary-password",
      },
    });
    await openCreateForm();
    fillCreateForm("new-school");
    submitCreateForm();
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("temporary-password"));
  });
});
